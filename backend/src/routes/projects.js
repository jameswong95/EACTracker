import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, logAudit } from '../util.js';
import * as v from '../validation.js';

const r = Router();

const STATUS_VALUES = ['ok', 'warn', 'bad'];
const REVREC_METHODS = ['milestone', 'progress_claim'];
const PROJECT_FIELDS = new Set([
  'id', 'name', 'wbs_code', 'sap_project_no', 'customer', 'department',
  'pm_user_id', 'pd_user_id', 'status', 'start_date', 'end_date',
  'warranty_start', 'warranty_end', 'dpl_start', 'dpl_end',
  'contract_value', 'initial_budget', 'budget', 'eac', 'actual', 'committed',
  'rev_recognised', 'progress_billing', 'gr_profit_sap', 'revrec_method',
  'last_update', 'user_id',
]);
const PROJECT_PATCH_FIELDS = new Set([
  'name', 'customer', 'department', 'pm_user_id', 'pd_user_id', 'status',
  'end_date', 'warranty_start', 'warranty_end', 'dpl_start', 'dpl_end',
  'contract_value', 'initial_budget', 'budget', 'eac', 'revrec_method',
  'last_update', 'user_id',
]);

function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function money(body, key, out, { partial }) {
  if (!partial || has(body, key)) out[key] = v.number(body[key], key, { min: 0 }) ?? 0;
}

function cleanProject(body, { partial = false } = {}) {
  v.ensureObject(body);
  v.validateNoUnknown(body, partial ? PROJECT_PATCH_FIELDS : PROJECT_FIELDS);
  const out = {};
  if (!partial || has(body, 'id')) out.id = v.projectId(body.id, 'id');
  if (!partial || has(body, 'name')) out.name = v.text(body.name, 'name', { required: true, max: 200 });
  if (!partial || has(body, 'wbs_code')) out.wbs_code = v.text(body.wbs_code, 'wbs_code', { required: true, max: 80 });
  if (!partial || has(body, 'sap_project_no')) out.sap_project_no = v.text(body.sap_project_no, 'sap_project_no', { max: 80 });
  if (!partial || has(body, 'customer')) out.customer = v.text(body.customer, 'customer', { max: 200 });
  if (!partial || has(body, 'department')) out.department = v.text(body.department, 'department', { required: true, max: 160 });
  if (!partial || has(body, 'pm_user_id')) out.pm_user_id = v.userId(body.pm_user_id, 'pm_user_id');
  if (!partial || has(body, 'pd_user_id')) out.pd_user_id = v.userId(body.pd_user_id, 'pd_user_id');
  if (!partial || has(body, 'status')) out.status = v.oneOf(body.status, 'status', STATUS_VALUES, { required: partial }) || 'ok';
  if (!partial || has(body, 'start_date')) out.start_date = v.date(body.start_date, 'start_date', { required: !partial });
  if (!partial || has(body, 'end_date')) out.end_date = v.date(body.end_date, 'end_date', { required: !partial });
  if (!partial || has(body, 'warranty_start')) out.warranty_start = v.date(body.warranty_start, 'warranty_start');
  if (!partial || has(body, 'warranty_end')) out.warranty_end = v.date(body.warranty_end, 'warranty_end');
  if (!partial || has(body, 'dpl_start')) out.dpl_start = v.date(body.dpl_start, 'dpl_start');
  if (!partial || has(body, 'dpl_end')) out.dpl_end = v.date(body.dpl_end, 'dpl_end');
  money(body, 'contract_value', out, { partial });
  money(body, 'initial_budget', out, { partial });
  money(body, 'budget', out, { partial });
  money(body, 'eac', out, { partial });
  money(body, 'actual', out, { partial });
  money(body, 'committed', out, { partial });
  money(body, 'rev_recognised', out, { partial });
  money(body, 'progress_billing', out, { partial });
  money(body, 'gr_profit_sap', out, { partial });
  if (!partial || has(body, 'revrec_method')) out.revrec_method = v.oneOf(body.revrec_method, 'revrec_method', REVREC_METHODS, { required: partial }) || 'milestone';
  if (!partial || has(body, 'last_update')) out.last_update = v.date(body.last_update, 'last_update');
  if (!partial || has(body, 'user_id')) out.user_id = v.userId(body.user_id, 'user_id');
  return out;
}

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
  const id = v.projectId(req.params.id, 'id');
  const result = await query(`SELECT * FROM v_project_financials WHERE id = $1`, [id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'project not found' });
  res.json(result.rows[0]);
}));

// POST /api/projects  (create)
r.post('/', ah(async (req, res) => {
  const b = cleanProject(req.body);
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
    if (b.pm_user_id) {
      await c.query(
        `INSERT INTO project_pm_assignments (project_id, user_id, is_lead)
         VALUES ($1,$2,TRUE)
         ON CONFLICT (project_id, user_id) DO UPDATE SET is_lead = TRUE`,
        [b.id, b.pm_user_id]
      );
    }
    await logAudit(c, { entity_type: 'project', entity_id: b.id, action: 'create', user_id: b.user_id });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/projects/:id  (partial update)
r.patch('/:id', ah(async (req, res) => {
  const id = v.projectId(req.params.id, 'id');
  const b = cleanProject(req.body, { partial: true });
  const editable = new Set([
    'name','customer','department','pm_user_id','pd_user_id','status',
    'end_date','warranty_start','warranty_end','dpl_start','dpl_end',
    'contract_value','initial_budget','budget','eac','revrec_method','last_update'
  ]);
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [k, value] of Object.entries(b)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(value); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(id);
  const result = await tx(async (c) => {
    const upd = await c.query(
      `UPDATE projects SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    );
    if (!upd.rows[0]) { const e = new Error('project not found'); e.status = 404; throw e; }
    if (Object.prototype.hasOwnProperty.call(b, 'pm_user_id')) {
      if (b.pm_user_id == null) {
        await c.query(`DELETE FROM project_pm_assignments WHERE project_id = $1`, [id]);
      } else {
        await c.query(`UPDATE project_pm_assignments SET is_lead = FALSE WHERE project_id = $1`, [id]);
        await c.query(
          `INSERT INTO project_pm_assignments (project_id, user_id, is_lead)
           VALUES ($1,$2,TRUE)
           ON CONFLICT (project_id, user_id) DO UPDATE SET is_lead = TRUE`,
          [id, b.pm_user_id]
        );
      }
    }
    await logAudit(c, { entity_type: 'project', entity_id: id, action: 'update', user_id: b.user_id });
    return upd.rows[0];
  });
  res.json(result);
}));

async function savePmAssignments(req) {
  const projectId = v.projectId(req.params.id, 'id');
  const body = v.ensureObject(req.body);
  v.validateNoUnknown(body, new Set(['user_ids', 'pm_user_ids', 'lead_user_id', 'user_id']));
  const rawIds = Array.isArray(body.user_ids) ? body.user_ids
    : Array.isArray(body.pm_user_ids) ? body.pm_user_ids
    : [];
  const userIds = [...new Set(rawIds.map((raw, index) => v.userId(raw, `user_ids[${index}]`)))];
  const leadCandidate = body.lead_user_id != null ? v.userId(body.lead_user_id, 'lead_user_id') : null;
  const leadUserId = Number.isInteger(leadCandidate) && userIds.includes(leadCandidate)
    ? leadCandidate
    : (userIds[0] || null);
  const auditUserId = v.userId(body.user_id, 'user_id');

  return tx(async (c) => {
    const exists = (await c.query(`SELECT id FROM projects WHERE id = $1`, [projectId])).rows[0];
    if (!exists) { const e = new Error('project not found'); e.status = 404; throw e; }

    if (userIds.length) {
      const users = await c.query(
        `SELECT id FROM users
          WHERE id = ANY($1::int[])
            AND role = 'Project Manager'
            AND is_active = TRUE`,
        [userIds]
      );
      if (users.rowCount !== userIds.length) {
        const e = new Error('all assigned users must be active Project Managers');
        e.status = 400;
        throw e;
      }
    }

    await c.query(`DELETE FROM project_pm_assignments WHERE project_id = $1`, [projectId]);
    for (const uid of userIds) {
      await c.query(
        `INSERT INTO project_pm_assignments (project_id, user_id, is_lead)
         VALUES ($1,$2,$3)`,
        [projectId, uid, uid === leadUserId]
      );
    }
    await c.query(
      `UPDATE projects SET pm_user_id = $2, updated_at = NOW() WHERE id = $1`,
      [projectId, leadUserId]
    );
    await logAudit(c, {
      entity_type: 'project',
      entity_id: projectId,
      action: 'assign_pms',
      user_id: auditUserId,
    });
    return (await c.query(`SELECT * FROM v_project_financials WHERE id = $1`, [projectId])).rows[0];
  });
}

// PUT /api/projects/:id/pm-assignments
// Assigns one or more Project Managers. projects.pm_user_id remains the lead PM.
r.put('/:id/pm-assignments', ah(async (req, res) => {
  res.json(await savePmAssignments(req));
}));

// POST alias for clients/proxies that are stricter about PUT.
r.post('/:id/pm-assignments', ah(async (req, res) => {
  res.json(await savePmAssignments(req));
}));

// DELETE /api/projects/:id
r.delete('/:id', ah(async (req, res) => {
  const id = v.projectId(req.params.id, 'id');
  await tx(async (c) => {
    const d = await c.query(`DELETE FROM projects WHERE id = $1`, [id]);
    if (!d.rowCount) { const e = new Error('project not found'); e.status = 404; throw e; }
    await logAudit(c, { entity_type: 'project', entity_id: id, action: 'delete' });
  });
  res.status(204).end();
}));

// GET /api/projects/:id/full  (aggregated single-fetch for project screen)
r.get('/:id/full', ah(async (req, res) => {
  const pid = v.projectId(req.params.id, 'id');
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
