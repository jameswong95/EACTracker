import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();

// GET /api/resources/pool  (all people)
r.get('/pool', ah(async (_req, res) => {
  const result = await query(`
    SELECT rp.*, rg.title AS grade_title, rg.daily_rate, rg.monthly_rate
    FROM resource_pool rp
    JOIN resource_grades rg ON rg.grade = rp.grade
    WHERE rp.is_active
    ORDER BY rp.name`);
  res.json(result.rows);
}));

// GET /api/resources/grades
r.get('/grades', ah(async (_req, res) => {
  const result = await query(`SELECT * FROM resource_grades ORDER BY grade`);
  res.json(result.rows);
}));

// GET /api/resources?project_id=... (assignments on a project)
r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const result = await query(`
    SELECT pr.*, rp.name AS resource_name
    FROM project_resources pr
    LEFT JOIN resource_pool rp ON rp.id = pr.resource_id
    WHERE pr.project_id = $1
    ORDER BY pr.id`, [project_id]);
  res.json(result.rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'role_name', 'function_title', 'grade']);
  const ins = await query(`
    INSERT INTO project_resources (project_id, resource_id, role_name, function_title, grade, fte_allocations)
    VALUES ($1,$2,$3,$4,$5,COALESCE($6,'[]'::jsonb))
    RETURNING *`,
    [b.project_id, b.resource_id || null, b.role_name, b.function_title, b.grade,
     b.fte_allocations ? JSON.stringify(b.fte_allocations) : null]);
  res.status(201).json(ins.rows[0]);
}));

r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['resource_id', 'role_name', 'function_title', 'grade', 'fte_allocations']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) {
      sets.push(`${k} = $${i++}`);
      vals.push(k === 'fte_allocations' ? JSON.stringify(v) : v);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE project_resources SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'assignment not found' });
  res.json(upd.rows[0]);
}));

r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM project_resources WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'assignment not found' });
  res.status(204).end();
}));

export default r;
