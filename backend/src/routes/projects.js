import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

const r = Router();

// GET /api/projects  (list with computed fields)
r.get('/', ah(async (_req, res) => {
  const result = await query(`
    SELECT * FROM v_project_financials
    ORDER BY id
  `);
  res.json(result.rows);
}));

// GET /api/projects/:id
r.get('/:id', ah(async (req, res) => {
  const result = await query(`SELECT * FROM v_project_financials WHERE id = $1`, [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'project not found' });
  res.json(result.rows[0]);
}));

// POST /api/projects  (create)
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['id', 'name', 'wbs_code', 'department', 'start_date', 'end_date']);
  const result = await tx(async (c) => {
    const ins = await c.query(`
      INSERT INTO projects (
        id, name, wbs_code, sap_project_no, customer, department,
        pm_user_id, pd_user_id, status,
        start_date, end_date, warranty_start, warranty_end, dpl_start, dpl_end,
        contract_value, initial_budget, budget, eac, actual, committed,
        rev_recognised, progress_billing, gr_profit_sap, revrec_method, last_update
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,'ok'),
        $10,$11,$12,$13,$14,$15,
        COALESCE($16,0),COALESCE($17,0),COALESCE($18,0),COALESCE($19,0),COALESCE($20,0),COALESCE($21,0),
        COALESCE($22,0),COALESCE($23,0),COALESCE($24,0),COALESCE($25,'milestone'),$26
      )
      RETURNING *`,
      [b.id, b.name, b.wbs_code, b.sap_project_no, b.customer, b.department,
       b.pm_user_id, b.pd_user_id, b.status,
       b.start_date, b.end_date, b.warranty_start, b.warranty_end, b.dpl_start, b.dpl_end,
       b.contract_value, b.initial_budget, b.budget, b.eac, b.actual, b.committed,
       b.rev_recognised, b.progress_billing, b.gr_profit_sap, b.revrec_method, b.last_update]
    );
    await logAudit(c, { entity_type: 'project', entity_id: b.id, action: 'create', user_id: req.body.user_id });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/projects/:id  (partial update)
r.patch('/:id', ah(async (req, res) => {
  const editable = new Set([
    'name','customer','department','pm_user_id','pd_user_id','status',
    'end_date','warranty_start','warranty_end','dpl_start','dpl_end',
    'contract_value','initial_budget','budget','eac','revrec_method','last_update'
  ]);
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);
  const result = await tx(async (c) => {
    const upd = await c.query(
      `UPDATE projects SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    );
    if (!upd.rows[0]) { const e = new Error('project not found'); e.status = 404; throw e; }
    await logAudit(c, { entity_type: 'project', entity_id: req.params.id, action: 'update', user_id: req.body.user_id });
    return upd.rows[0];
  });
  res.json(result);
}));

// DELETE /api/projects/:id
r.delete('/:id', ah(async (req, res) => {
  await tx(async (c) => {
    const d = await c.query(`DELETE FROM projects WHERE id = $1`, [req.params.id]);
    if (!d.rowCount) { const e = new Error('project not found'); e.status = 404; throw e; }
    await logAudit(c, { entity_type: 'project', entity_id: req.params.id, action: 'delete' });
  });
  res.status(204).end();
}));

// GET /api/projects/:id/full  (aggregated single-fetch for project screen)
r.get('/:id/full', ah(async (req, res) => {
  const pid = req.params.id;
  const [p, subjobs, milestones, risks, updates, resources, revrec] = await Promise.all([
    query(`SELECT * FROM v_project_financials WHERE id = $1`, [pid]),
    query(`SELECT * FROM v_sub_job_summary WHERE project_id = $1 ORDER BY sort_order, id`, [pid]),
    query(`SELECT * FROM milestones WHERE project_id = $1 ORDER BY sort_order, target_date`, [pid]),
    query(`SELECT * FROM risks WHERE project_id = $1 ORDER BY id`, [pid]),
    query(`SELECT * FROM project_updates WHERE project_id = $1 ORDER BY period_year DESC, period_month DESC`, [pid]),
    query(`SELECT * FROM project_resources WHERE project_id = $1 ORDER BY id`, [pid]),
    query(`SELECT * FROM revrec_entries WHERE project_id = $1 ORDER BY period_year, period_month, id`, [pid]),
  ]);
  if (!p.rows[0]) return res.status(404).json({ error: 'project not found' });
  res.json({
    project:    p.rows[0],
    subjobs:    subjobs.rows,
    milestones: milestones.rows,
    risks:      risks.rows,
    updates:    updates.rows,
    resources:  resources.rows,
    revrec:     revrec.rows,
  });
}));

export default r;
