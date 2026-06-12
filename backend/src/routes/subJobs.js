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

export default r;
