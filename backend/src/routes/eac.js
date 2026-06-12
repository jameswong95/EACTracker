import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();

// GET /api/eac/:project_id  → { rows:[], values:[{row_id,year,month,amount_k,is_locked}] }
r.get('/:project_id', ah(async (req, res) => {
  const pid = req.params.project_id;
  const [rows, values] = await Promise.all([
    query(`SELECT * FROM eac_monthly_rows WHERE project_id = $1 ORDER BY sort_order, id`, [pid]),
    query(`SELECT * FROM eac_monthly_values WHERE project_id = $1 ORDER BY year, month`, [pid]),
  ]);
  res.json({ rows: rows.rows, values: values.rows });
}));

// POST /api/eac/rows  (add cost-category row to a project)
r.post('/rows', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'cost_category', 'label']);
  const ins = await query(
    `INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
     VALUES ($1,$2,$3,COALESCE($4,0)) RETURNING *`,
    [b.project_id, b.cost_category, b.label, b.sort_order]
  );
  res.status(201).json(ins.rows[0]);
}));

// DELETE /api/eac/rows/:id
r.delete('/rows/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM eac_monthly_rows WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'row not found' });
  res.status(204).end();
}));

// PUT /api/eac/values  (bulk upsert cell values)
// body: { project_id, cells: [{ row_id, year, month, amount_k, is_locked? }] }
r.put('/values', ah(async (req, res) => {
  const { project_id, cells } = req.body;
  if (!project_id || !Array.isArray(cells)) {
    return res.status(400).json({ error: 'project_id and cells[] required' });
  }
  await tx(async (c) => {
    for (const cell of cells) {
      await c.query(
        `INSERT INTO eac_monthly_values (row_id, project_id, year, month, amount_k, is_locked)
         VALUES ($1,$2,$3,$4,$5,COALESCE($6,FALSE))
         ON CONFLICT (row_id, year, month)
         DO UPDATE SET amount_k = EXCLUDED.amount_k, is_locked = EXCLUDED.is_locked`,
        [cell.row_id, project_id, cell.year, cell.month, cell.amount_k, cell.is_locked]
      );
    }
  });
  res.json({ ok: true, count: cells.length });
}));

export default r;
