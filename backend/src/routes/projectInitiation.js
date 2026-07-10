import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();

async function seedFromTenderIfEmpty(c, projectId) {
  const existing = await c.query(
    `SELECT 1 FROM project_initiation_items WHERE project_id = $1 LIMIT 1`,
    [projectId]
  );
  if (existing.rowCount) return;

  const tender = (await c.query(
    `SELECT id FROM tenders WHERE project_id = $1 AND status = 'awarded' ORDER BY initiated_at DESC NULLS LAST, id DESC LIMIT 1`,
    [projectId]
  )).rows[0];
  if (!tender) return;

  await c.query(
    `INSERT INTO project_initiation_items
       (project_id, source_tender_id, source_tender_item_id, kind, category,
        sub_job_label, description, qty, unit_cost, amount, notes)
     SELECT $1, tender_id, id, kind, category, sub_job_label, description,
            qty, unit_cost, amount, notes
       FROM tender_items
      WHERE tender_id = $2
     ON CONFLICT (project_id, source_tender_item_id) DO NOTHING`,
    [projectId, tender.id]
  );
}

function totals(rows) {
  const base = { total: 0, resource: 0, material: 0, subcon: 0, others: 0, count: rows.length };
  for (const row of rows) {
    const amount = Number(row.amount) || 0;
    base.total += amount;
    if (row.kind === 'resource') base.resource += amount;
    if (row.kind === 'material') base.material += amount;
    if (row.kind === 'subcon') base.subcon += amount;
    if (row.kind === 'others') base.others += amount;
  }
  return base;
}

// GET /api/project-initiation?project_id=...
r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const data = await tx(async (c) => {
    await seedFromTenderIfEmpty(c, project_id);
    const items = await c.query(
      `SELECT * FROM project_initiation_items
        WHERE project_id = $1
        ORDER BY kind, id`,
      [project_id]
    );
    const tender = await c.query(
      `SELECT id, opportunity_name, name, status, initiated_at
         FROM tenders
        WHERE project_id = $1
        ORDER BY initiated_at DESC NULLS LAST, id DESC
        LIMIT 1`,
      [project_id]
    );
    return { items: items.rows, tender: tender.rows[0] || null };
  });
  res.json({ ...data, totals: totals(data.items) });
}));

// POST /api/project-initiation
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'kind', 'description']);
  if (!['resource', 'material', 'subcon', 'others'].includes(b.kind)) {
    return res.status(400).json({ error: 'kind must be resource | material | subcon | others' });
  }
  const qty = b.qty != null ? Number(b.qty) : 1;
  const unitCost = b.unit_cost != null ? Number(b.unit_cost) : 0;
  const amount = b.amount != null ? Number(b.amount) : qty * unitCost;
  const ins = await query(
    `INSERT INTO project_initiation_items
       (project_id, kind, category, sub_job_label, description, qty, unit_cost, amount, notes)
     VALUES ($1,$2,COALESCE($3,'PM'),$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [b.project_id, b.kind, b.category || 'PM', b.sub_job_label || null,
     b.description, qty, unitCost, amount, b.notes || null]
  );
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/project-initiation/:id
r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['kind', 'category', 'sub_job_label', 'description', 'qty', 'unit_cost', 'amount', 'notes']);
  const body = { ...req.body };
  if (body.amount == null && (body.qty != null || body.unit_cost != null)) {
    const cur = (await query(`SELECT qty, unit_cost FROM project_initiation_items WHERE id = $1`, [req.params.id])).rows[0];
    if (cur) {
      const qty = body.qty != null ? Number(body.qty) : Number(cur.qty);
      const unitCost = body.unit_cost != null ? Number(body.unit_cost) : Number(cur.unit_cost);
      body.amount = qty * unitCost;
    }
  }
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v === '' ? null : v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);
  const upd = await query(
    `UPDATE project_initiation_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  if (!upd.rows[0]) return res.status(404).json({ error: 'project initiation item not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/project-initiation/:id
r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM project_initiation_items WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'project initiation item not found' });
  res.status(204).end();
}));

export default r;
