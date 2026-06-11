import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();

r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const result = await query(`
    SELECT u.*, usr.full_name AS author_name
    FROM project_updates u
    LEFT JOIN users usr ON usr.id = u.created_by
    WHERE u.project_id = $1
    ORDER BY u.period_year DESC, u.period_month DESC
  `, [project_id]);
  res.json(result.rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'period_year', 'period_month', 'status', 'narrative']);
  const ins = await query(`
    INSERT INTO project_updates (project_id, period_year, period_month, status, narrative, created_by)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (project_id, period_year, period_month)
    DO UPDATE SET status = EXCLUDED.status, narrative = EXCLUDED.narrative, created_by = EXCLUDED.created_by
    RETURNING *`,
    [b.project_id, b.period_year, b.period_month, b.status, b.narrative, b.created_by || null]);
  res.status(201).json(ins.rows[0]);
}));

r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM project_updates WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'update not found' });
  res.status(204).end();
}));

export default r;
