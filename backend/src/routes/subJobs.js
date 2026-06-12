import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

const r = Router();

// GET /api/sub-jobs?project_id=...
r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const result = await query(
    `SELECT * FROM v_sub_job_summary WHERE project_id = $1 ORDER BY sort_order, id`,
    [project_id]
  );
  res.json(result.rows);
}));

// POST /api/sub-jobs
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'wbs_code', 'wbs_suffix', 'name']);
  const result = await tx(async (c) => {
    const ins = await c.query(`
      INSERT INTO sub_jobs (
        project_id, wbs_code, wbs_suffix, name, sort_order, is_warranty,
        lab, foh, mat, doc, sco, tot_cost, com_cst, plan_cos,
        etc_lab, etc_foh, etc_mat, etc_doc, etc_sco
      ) VALUES (
        $1,$2,$3,$4,COALESCE($5,0),COALESCE($6,FALSE),
        COALESCE($7,0),COALESCE($8,0),COALESCE($9,0),COALESCE($10,0),COALESCE($11,0),
        COALESCE($12,0),COALESCE($13,0),COALESCE($14,0),
        COALESCE($15,0),COALESCE($16,0),COALESCE($17,0),COALESCE($18,0),COALESCE($19,0)
      ) RETURNING *`,
      [b.project_id, b.wbs_code, b.wbs_suffix, b.name, b.sort_order, b.is_warranty,
       b.lab, b.foh, b.mat, b.doc, b.sco, b.tot_cost, b.com_cst, b.plan_cos,
       b.etc_lab, b.etc_foh, b.etc_mat, b.etc_doc, b.etc_sco]
    );
    await logAudit(c, { entity_type: 'sub_job', entity_id: ins.rows[0].id, action: 'create' });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/sub-jobs/:id
r.patch('/:id', ah(async (req, res) => {
  const editable = new Set([
    'name','sort_order','is_warranty',
    'lab','foh','mat','doc','sco','tot_cost','com_cst','plan_cos',
    'etc_lab','etc_foh','etc_mat','etc_doc','etc_sco'
  ]);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE sub_jobs SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'sub job not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/sub-jobs/:id
r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM sub_jobs WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'sub job not found' });
  res.status(204).end();
}));

// ---------- planned items (per sub-job) ----------

// GET /api/sub-jobs/:id/planned-items
r.get('/:id/planned-items', ah(async (req, res) => {
  const result = await query(
    `SELECT pi.*, u.full_name AS created_by_name
     FROM sub_job_planned_items pi
     LEFT JOIN users u ON u.id = pi.created_by
     WHERE pi.sub_job_id = $1
     ORDER BY pi.created_at DESC, pi.id DESC`,
    [req.params.id]
  );
  res.json(result.rows);
}));

// POST /api/sub-jobs/:id/planned-items
r.post('/:id/planned-items', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['category', 'description']);
  const ins = await query(
    `INSERT INTO sub_job_planned_items
       (sub_job_id, category, description, vendor, amount,
        period_year, period_month, status, notes, created_by)
     VALUES ($1,$2,$3,$4,COALESCE($5,0),$6,$7,COALESCE($8,'planned'),$9,$10)
     RETURNING *`,
    [req.params.id, b.category, b.description, b.vendor || null, b.amount,
     b.period_year || null, b.period_month || null, b.status, b.notes || null,
     b.created_by || null]
  );
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/sub-jobs/planned-items/:itemId
r.patch('/planned-items/:itemId', ah(async (req, res) => {
  const editable = new Set([
    'category','description','vendor','amount',
    'period_year','period_month','status','notes'
  ]);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.itemId);
  const upd = await query(
    `UPDATE sub_job_planned_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  if (!upd.rows[0]) return res.status(404).json({ error: 'planned item not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/sub-jobs/planned-items/:itemId
r.delete('/planned-items/:itemId', ah(async (req, res) => {
  const d = await query(
    `DELETE FROM sub_job_planned_items WHERE id = $1`,
    [req.params.itemId]
  );
  if (!d.rowCount) return res.status(404).json({ error: 'planned item not found' });
  res.status(204).end();
}));

// GET /api/sub-jobs/planned-items/all  (Finance cross-project view)
r.get('/planned-items/all', ah(async (_req, res) => {
  const result = await query(
    `SELECT pi.*,
            sj.wbs_code, sj.name AS sub_job_name,
            sj.project_id,
            p.name AS project_name,
            u.full_name AS created_by_name
     FROM sub_job_planned_items pi
     JOIN sub_jobs sj ON sj.id = pi.sub_job_id
     JOIN projects p  ON p.id  = sj.project_id
     LEFT JOIN users u ON u.id = pi.created_by
     ORDER BY pi.created_at DESC, pi.id DESC`
  );
  res.json(result.rows);
}));

export default r;
