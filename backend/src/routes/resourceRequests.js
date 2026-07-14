import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../util.js';
import * as v from '../validation.js';

const r = Router();

const STATUS_VALUES = ['open', 'resolved', 'declined'];
const REQUEST_FIELDS = new Set([
  'project_id', 'function_title', 'grade', 'headcount', 'need_year', 'need_month',
  'need_end_year', 'need_end_month', 'remarks', 'created_by',
]);
const REQUEST_PATCH_FIELDS = new Set([
  'function_title', 'grade', 'headcount', 'need_year', 'need_month',
  'need_end_year', 'need_end_month', 'remarks', 'status', 'resolution_note', 'resolved_by',
]);

// Shared SELECT with creator / resolver names.
const SELECT_WITH_NAMES = `
  SELECT rq.*,
         cu.full_name AS created_by_name,
         ru.full_name AS resolved_by_name
  FROM resource_requests rq
  LEFT JOIN users cu ON cu.id = rq.created_by
  LEFT JOIN users ru ON ru.id = rq.resolved_by
`;

function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function cleanRequest(body, { partial = false } = {}) {
  v.ensureObject(body);
  v.validateNoUnknown(body, partial ? REQUEST_PATCH_FIELDS : REQUEST_FIELDS);
  const out = {};
  if (!partial || has(body, 'project_id')) out.project_id = v.projectId(body.project_id);
  if (!partial || has(body, 'function_title')) out.function_title = v.text(body.function_title, 'function_title', { required: true, max: 160 });
  if (!partial || has(body, 'grade')) out.grade = v.text(body.grade, 'grade', { max: 40 });
  if (!partial || has(body, 'headcount')) out.headcount = v.integer(body.headcount, 'headcount', { min: 1, max: 500 }) ?? 1;
  if (!partial || has(body, 'need_year')) out.need_year = v.year(body.need_year, 'need_year');
  if (!partial || has(body, 'need_month')) out.need_month = v.month(body.need_month, 'need_month');
  if (!partial || has(body, 'need_end_year')) out.need_end_year = v.year(body.need_end_year, 'need_end_year');
  if (!partial || has(body, 'need_end_month')) out.need_end_month = v.month(body.need_end_month, 'need_end_month');
  if (!partial || has(body, 'remarks')) out.remarks = v.text(body.remarks, 'remarks', { required: true, max: 1000 });
  if (!partial || has(body, 'status')) out.status = v.oneOf(body.status, 'status', STATUS_VALUES, { required: true });
  if (!partial || has(body, 'resolution_note')) out.resolution_note = v.text(body.resolution_note, 'resolution_note', { max: 1000 });
  if (!partial || has(body, 'created_by')) out.created_by = v.userId(body.created_by, 'created_by');
  if (!partial || has(body, 'resolved_by')) out.resolved_by = v.userId(body.resolved_by, 'resolved_by');
  v.validatePeriodRange(out.need_year, out.need_month, out.need_end_year, out.need_end_month);
  return out;
}

// GET /api/resource-requests?project_id=...
r.get('/', ah(async (req, res) => {
  const project_id = v.projectId(req.query.project_id);
  const result = await query(
    `${SELECT_WITH_NAMES} WHERE rq.project_id = $1
     ORDER BY (rq.status = 'open') DESC, rq.created_at DESC`,
    [project_id]
  );
  res.json(result.rows);
}));

// POST /api/resource-requests  (PM raises a placeholder headcount request)
r.post('/', ah(async (req, res) => {
  const b = cleanRequest(req.body);
  const ins = await query(
    `INSERT INTO resource_requests
       (project_id, function_title, grade, headcount, need_year, need_month, need_end_year, need_end_month, remarks, created_by)
     VALUES ($1,$2,$3,COALESCE($4,1),$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [b.project_id, b.function_title, b.grade, b.headcount,
     b.need_year, b.need_month, b.need_end_year, b.need_end_month, b.remarks, b.created_by]
  );
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/resource-requests/:id
// Edit request fields, or resolve/decline it. When status moves to
// resolved/declined we stamp resolved_by + resolved_at; moving back to
// open clears them.
r.patch('/:id', ah(async (req, res) => {
  const id = v.positiveInt(req.params.id);
  const b = cleanRequest(req.body, { partial: true });
  const editable = new Set([
    'function_title', 'grade', 'headcount', 'need_year', 'need_month',
    'need_end_year', 'need_end_month',
    'remarks', 'status', 'resolution_note',
  ]);
  const sets = []; const vals = []; let i = 1;
  for (const [k, value] of Object.entries(b)) {
    if (!editable.has(k)) continue;
    sets.push(`${k} = $${i++}`);
    vals.push(value);
  }
  if ('status' in b) {
    if (b.status === 'open') {
      sets.push(`resolved_by = NULL`, `resolved_at = NULL`);
    } else {
      sets.push(`resolved_by = $${i++}`, `resolved_at = NOW()`);
      vals.push(b.resolved_by);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(id);
  const upd = await query(
    `UPDATE resource_requests SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  if (!upd.rows[0]) return res.status(404).json({ error: 'request not found' });
  const withNames = await query(`${SELECT_WITH_NAMES} WHERE rq.id = $1`, [id]);
  res.json(withNames.rows[0]);
}));

// DELETE /api/resource-requests/:id
r.delete('/:id', ah(async (req, res) => {
  const id = v.positiveInt(req.params.id);
  const d = await query(`DELETE FROM resource_requests WHERE id = $1`, [id]);
  if (!d.rowCount) return res.status(404).json({ error: 'request not found' });
  res.status(204).end();
}));

export default r;
