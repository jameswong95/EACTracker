import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

// Material Asset List - a live document per project.
// SAP import owns committed costs; asset rows are local planning/forecast only.
// Each asset can carry a vendor payment structure (advance/milestone/retention %)
// and a timeline dollar-planning schedule (planned cash per month).
const r = Router();

const EDITABLE = new Set([
  'asset_tag', 'description', 'serial_no', 'location', 'vendor',
  'gr_status', 'amount', 'need_by', 'advance_pct', 'milestone_pct', 'retention_pct', 'notes',
]);

// GET /api/material-assets?project_id=...  -> { assets, totals }
r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const [assets, totals, schedule] = await Promise.all([
    query(
      `SELECT a.*, to_char(a.need_by, 'YYYY-MM-DD') AS need_by,
              u.full_name AS created_by_name
         FROM material_assets a
         LEFT JOIN users u ON u.id = a.created_by
        WHERE a.project_id = $1
        ORDER BY a.id`, [project_id]),
    query(`SELECT * FROM v_material_asset_totals WHERE project_id = $1`, [project_id]),
    query(
      `SELECT s.* FROM material_asset_schedule s
         JOIN material_assets a ON a.id = s.asset_id
        WHERE a.project_id = $1
        ORDER BY s.year, s.month`, [project_id]),
  ]);
  res.json({
    assets: assets.rows,
    schedule: schedule.rows,
    totals: totals.rows[0] || { project_id, committed_amount: 0, forecast_amount: 0, asset_count: 0 },
  });
}));

// POST /api/material-assets
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'description']);
  const result = await tx(async (c) => {
    const ins = await c.query(
      `INSERT INTO material_assets
         (project_id, asset_tag, description, serial_no, location, vendor,
          gr_status, amount, need_by, advance_pct, milestone_pct, retention_pct, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'not_ordered'),COALESCE($8,0),$9,
               COALESCE($10,0),COALESCE($11,0),COALESCE($12,0),$13,$14)
       RETURNING *`,
      [b.project_id, b.asset_tag || null, b.description, b.serial_no || null, b.location || null,
       b.vendor || null, b.gr_status, b.amount, b.need_by || null,
       b.advance_pct, b.milestone_pct, b.retention_pct, b.notes || null, b.created_by || null]);
    await logAudit(c, { entity_type: 'material_asset', entity_id: ins.rows[0].id, action: 'create' });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/material-assets/:id
r.patch('/:id', ah(async (req, res) => {
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (EDITABLE.has(k)) {
      sets.push(`${k} = $${i++}`); vals.push(v);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);
  const upd = await query(`UPDATE material_assets SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'asset not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/material-assets/:id
r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM material_assets WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'asset not found' });
  res.status(204).end();
}));

// PUT /api/material-assets/:id/schedule  -> { year, month, amount }
// Upserts a single timeline cell (amount 0 deletes it).
r.put('/:id/schedule', ah(async (req, res) => {
  const { year, month } = req.body;
  const amount = Number(req.body.amount) || 0;
  if (!year || !month) return res.status(400).json({ error: 'year and month required' });
  if (amount === 0) {
    await query(`DELETE FROM material_asset_schedule WHERE asset_id = $1 AND year = $2 AND month = $3`,
      [req.params.id, year, month]);
    return res.json({ asset_id: Number(req.params.id), year, month, amount: 0 });
  }
  const up = await query(
    `INSERT INTO material_asset_schedule (asset_id, year, month, amount)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (asset_id, year, month) DO UPDATE SET amount = EXCLUDED.amount
     RETURNING *`,
    [req.params.id, year, month, amount]);
  res.json(up.rows[0]);
}));

export default r;
