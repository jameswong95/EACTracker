import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

const r = Router();

// GET /api/approvals?status=pending&period_year=2026&period_month=5
r.get('/', ah(async (req, res) => {
  const filters = []; const vals = []; let i = 1;
  if (req.query.status)        { filters.push(`a.status = $${i++}`);        vals.push(req.query.status); }
  if (req.query.period_year)   { filters.push(`a.period_year = $${i++}`);   vals.push(req.query.period_year); }
  if (req.query.period_month)  { filters.push(`a.period_month = $${i++}`);  vals.push(req.query.period_month); }
  if (req.query.project_id)    { filters.push(`a.project_id = $${i++}`);    vals.push(req.query.project_id); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const result = await query(`
    SELECT a.*, p.name AS project_name, p.wbs_code,
           sb.full_name AS submitter_name, rv.full_name AS reviewer_name
    FROM pd_approvals a
    JOIN projects p ON p.id = a.project_id
    LEFT JOIN users sb ON sb.id = a.submitted_by
    LEFT JOIN users rv ON rv.id = a.reviewed_by
    ${where}
    ORDER BY a.submitted_at DESC NULLS LAST, a.id DESC`, vals);
  res.json(result.rows);
}));

// POST /api/approvals  (PM submit)
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'period_year', 'period_month', 'eac_amount']);
  const result = await tx(async (c) => {
    const ins = await c.query(`
      INSERT INTO pd_approvals
        (project_id, period_year, period_month, eac_amount, variance, notes, submitted_by, submitted_at, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),'pending')
      ON CONFLICT (project_id, period_year, period_month)
      DO UPDATE SET eac_amount = EXCLUDED.eac_amount, variance = EXCLUDED.variance,
                    notes = EXCLUDED.notes, submitted_by = EXCLUDED.submitted_by,
                    submitted_at = NOW(), status = 'pending'
      RETURNING *`,
      [b.project_id, b.period_year, b.period_month, b.eac_amount, b.variance, b.notes, b.submitted_by]);
    await logAudit(c, { entity_type: 'approval', entity_id: ins.rows[0].id, action: 'submit', user_id: b.submitted_by });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/approvals/:id  (PD approve / reject / delegate)
r.patch('/:id', ah(async (req, res) => {
  const { status, reviewed_by, notes } = req.body;
  if (!['approved', 'rejected', 'delegated', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  const result = await tx(async (c) => {
    const upd = await c.query(`
      UPDATE pd_approvals
      SET status = $1, reviewed_by = $2, reviewed_at = NOW(),
          notes = COALESCE($3, notes)
      WHERE id = $4
      RETURNING *`,
      [status, reviewed_by || null, notes, req.params.id]);
    if (!upd.rows[0]) { const e = new Error('approval not found'); e.status = 404; throw e; }
    await logAudit(c, { entity_type: 'approval', entity_id: req.params.id, action: status, user_id: reviewed_by });
    return upd.rows[0];
  });
  res.json(result);
}));

export default r;
