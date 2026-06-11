import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();

r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const result = await query(
    `SELECT * FROM milestones WHERE project_id = $1 ORDER BY sort_order, target_date`,
    [project_id]
  );
  res.json(result.rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'name']);
  const ins = await query(`
    INSERT INTO milestones (project_id, name, target_date, is_done, is_warning, sort_order)
    VALUES ($1,$2,$3,COALESCE($4,FALSE),COALESCE($5,FALSE),COALESCE($6,0))
    RETURNING *`,
    [b.project_id, b.name, b.target_date || null, b.is_done, b.is_warning, b.sort_order]);
  res.status(201).json(ins.rows[0]);
}));

r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['name', 'target_date', 'is_done', 'is_warning', 'sort_order']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE milestones SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'milestone not found' });
  res.json(upd.rows[0]);
}));

r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM milestones WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'milestone not found' });
  res.status(204).end();
}));

export default r;
