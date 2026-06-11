import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();

r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const result = await query(`SELECT * FROM risks WHERE project_id = $1 ORDER BY id`, [project_id]);
  res.json(result.rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'ref', 'title', 'impact', 'probability']);
  const ins = await query(`
    INSERT INTO risks (project_id, ref, title, impact, probability, mitigation, status)
    VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'open'))
    RETURNING *`,
    [b.project_id, b.ref, b.title, b.impact, b.probability, b.mitigation || null, b.status]);
  res.status(201).json(ins.rows[0]);
}));

r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['ref', 'title', 'impact', 'probability', 'mitigation', 'status']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE risks SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'risk not found' });
  res.json(upd.rows[0]);
}));

r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM risks WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'risk not found' });
  res.status(204).end();
}));

export default r;
