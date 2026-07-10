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

// ---- Rate card / grade ownership (Finance/Admin edit; access gated in UI) ----

// POST /api/resources/grades  (add a grade / band to the rate card)
r.post('/grades', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['grade', 'title']);
  const ins = await query(
    `INSERT INTO resource_grades (grade, title, daily_rate, monthly_rate)
     VALUES ($1,$2,COALESCE($3,0),COALESCE($4,0))
     ON CONFLICT (grade) DO UPDATE
       SET title = EXCLUDED.title, daily_rate = EXCLUDED.daily_rate, monthly_rate = EXCLUDED.monthly_rate
     RETURNING *`,
    [String(b.grade).trim().toUpperCase(), b.title, b.daily_rate, b.monthly_rate]);
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/resources/grades/:grade  (edit rate card entry)
r.patch('/grades/:grade', ah(async (req, res) => {
  const editable = new Set(['title', 'daily_rate', 'monthly_rate']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(String(req.params.grade).toUpperCase());
  const upd = await query(`UPDATE resource_grades SET ${sets.join(', ')} WHERE grade = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'grade not found' });
  res.json(upd.rows[0]);
}));

// ---- Resource pool ownership (Finance/Admin edit; access gated in UI) ----

// POST /api/resources/pool  (add a person to the pool)
r.post('/pool', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['id', 'name', 'grade']);
  const ins = await query(
    `INSERT INTO resource_pool (id, name, grade, is_active)
     VALUES ($1,$2,$3,COALESCE($4,TRUE)) RETURNING *`,
    [String(b.id).trim(), b.name, String(b.grade).trim().toUpperCase(), b.is_active]);
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/resources/pool/:id
r.patch('/pool/:id', ah(async (req, res) => {
  const editable = new Set(['name', 'grade', 'is_active']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(k === 'grade' ? String(v).toUpperCase() : v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE resource_pool SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'resource not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/resources/pool/:id  (soft delete -> is_active = FALSE)
r.delete('/pool/:id', ah(async (req, res) => {
  const upd = await query(`UPDATE resource_pool SET is_active = FALSE WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!upd.rows[0]) return res.status(404).json({ error: 'resource not found' });
  res.status(204).end();
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
    INSERT INTO project_resources (project_id, resource_id, role_name, function_title, grade, fte_allocations, sub_job_id)
    VALUES ($1,$2,$3,$4,$5,COALESCE($6,'[]'::jsonb),$7)
    RETURNING *`,
    [b.project_id, b.resource_id || null, b.role_name, b.function_title, b.grade,
     b.fte_allocations ? JSON.stringify(b.fte_allocations) : null,
     b.sub_job_id || null]);
  res.status(201).json(ins.rows[0]);
}));

r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['resource_id', 'role_name', 'function_title', 'grade', 'fte_allocations', 'sub_job_id']);
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
