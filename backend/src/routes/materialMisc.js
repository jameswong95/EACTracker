import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

// Misc materials - per-project sub-threshold material lines. Small items not
// worth tracking individually as assets are lumped here, optionally priced from
// the Finance-owned fixed_rates catalog (qty x unit_rate).
const r = Router();

const EDITABLE = new Set(['rate_code', 'description', 'unit', 'qty', 'unit_rate', 'amount', 'po_number', 'notes']);

// amount = qty * unit_rate unless amount was supplied explicitly.
function deriveAmount(body, prev = {}) {
  if (body.amount != null) return Number(body.amount) || 0;
  const qty = body.qty != null ? Number(body.qty) : Number(prev.qty ?? 1);
  const rate = body.unit_rate != null ? Number(body.unit_rate) : Number(prev.unit_rate ?? 0);
  return (qty || 0) * (rate || 0);
}

// GET /api/material-misc?project_id=...  -> { misc, total }
r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const rows = (await query(
    `SELECT m.*, u.full_name AS created_by_name
       FROM material_misc m
       LEFT JOIN users u ON u.id = m.created_by
      WHERE m.project_id = $1
      ORDER BY m.id`, [project_id])).rows;
  const total = rows.reduce((s, x) => s + Number(x.amount || 0), 0);
  res.json({ misc: rows, total });
}));

// POST /api/material-misc
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'description']);
  const amount = deriveAmount(b);
  const result = await tx(async (c) => {
    const ins = await c.query(
      `INSERT INTO material_misc
         (project_id, rate_code, description, unit, qty, unit_rate, amount, po_number, notes, created_by)
       VALUES ($1,$2,$3,COALESCE($4,'each'),COALESCE($5,1),COALESCE($6,0),$7,$8,$9,$10)
       RETURNING *`,
      [b.project_id, b.rate_code || null, b.description, b.unit,
       b.qty != null ? Number(b.qty) : null, b.unit_rate != null ? Number(b.unit_rate) : null,
       amount, b.po_number || null, b.notes || null, b.created_by || null]);
    await logAudit(c, { entity_type: 'material_misc', entity_id: ins.rows[0].id, action: 'create' });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/material-misc/:id
r.patch('/:id', ah(async (req, res) => {
  const body = { ...req.body };
  if (body.amount == null && (body.qty != null || body.unit_rate != null)) {
    const cur = (await query(`SELECT qty, unit_rate FROM material_misc WHERE id = $1`, [req.params.id])).rows[0];
    if (cur) body.amount = deriveAmount(body, cur);
  }
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(body)) {
    if (EDITABLE.has(k)) {
      const val = (k === 'po_number' && typeof v === 'string' && v.trim() === '') ? null : v;
      sets.push(`${k} = $${i++}`); vals.push(val);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);
  const upd = await query(`UPDATE material_misc SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'misc line not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/material-misc/:id
r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM material_misc WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'misc line not found' });
  res.status(204).end();
}));

export default r;
