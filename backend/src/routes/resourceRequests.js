import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();

// Shared SELECT with creator / resolver names.
const SELECT_WITH_NAMES = `
  SELECT rq.*,
         cu.full_name AS created_by_name,
         ru.full_name AS resolved_by_name
  FROM resource_requests rq
  LEFT JOIN users cu ON cu.id = rq.created_by
  LEFT JOIN users ru ON ru.id = rq.resolved_by
`;

// GET /api/resource-requests?project_id=...
r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const result = await query(
    `${SELECT_WITH_NAMES} WHERE rq.project_id = $1
     ORDER BY (rq.status = 'open') DESC, rq.created_at DESC`,
    [project_id]
  );
  res.json(result.rows);
}));

// POST /api/resource-requests  (PM raises a placeholder headcount request)
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'function_title', 'remarks']);
  if (!String(b.remarks).trim()) {
    return res.status(400).json({ error: 'remarks (justification) is required' });
  }
  const mo = b.need_month != null && b.need_month !== '' ? parseInt(b.need_month, 10) : null;
  if (mo != null && (mo < 1 || mo > 12)) {
    return res.status(400).json({ error: 'need_month must be 1-12' });
  }
  const endMo = b.need_end_month != null && b.need_end_month !== '' ? parseInt(b.need_end_month, 10) : null;
  if (endMo != null && (endMo < 1 || endMo > 12)) {
    return res.status(400).json({ error: 'need_end_month must be 1-12' });
  }
  const needYear = b.need_year != null && b.need_year !== '' ? parseInt(b.need_year, 10) : null;
  const endYear = b.need_end_year != null && b.need_end_year !== '' ? parseInt(b.need_end_year, 10) : null;
  if (needYear && mo && endYear && endMo && (endYear * 12 + endMo) < (needYear * 12 + mo)) {
    return res.status(400).json({ error: 'end date must be after start date' });
  }
  const ins = await query(
    `INSERT INTO resource_requests
       (project_id, function_title, grade, headcount, need_year, need_month, need_end_year, need_end_month, remarks, created_by)
     VALUES ($1,$2,$3,COALESCE($4,1),$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [b.project_id, String(b.function_title).trim(), b.grade || null,
     b.headcount != null ? b.headcount : 1,
     needYear, mo, endYear, endMo, String(b.remarks).trim(), b.created_by || null]
  );
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/resource-requests/:id
// Edit request fields, or resolve/decline it. When status moves to
// resolved/declined we stamp resolved_by + resolved_at; moving back to
// open clears them.
r.patch('/:id', ah(async (req, res) => {
  const b = req.body;
  const editable = new Set([
    'function_title', 'grade', 'headcount', 'need_year', 'need_month',
    'need_end_year', 'need_end_month',
    'remarks', 'status', 'resolution_note',
  ]);
  const mo = b.need_month != null && b.need_month !== '' ? parseInt(b.need_month, 10) : null;
  const endMo = b.need_end_month != null && b.need_end_month !== '' ? parseInt(b.need_end_month, 10) : null;
  if (mo != null && (mo < 1 || mo > 12)) {
    return res.status(400).json({ error: 'need_month must be 1-12' });
  }
  if (endMo != null && (endMo < 1 || endMo > 12)) {
    return res.status(400).json({ error: 'need_end_month must be 1-12' });
  }
  const needYear = b.need_year != null && b.need_year !== '' ? parseInt(b.need_year, 10) : null;
  const endYear = b.need_end_year != null && b.need_end_year !== '' ? parseInt(b.need_end_year, 10) : null;
  if (needYear && mo && endYear && endMo && (endYear * 12 + endMo) < (needYear * 12 + mo)) {
    return res.status(400).json({ error: 'end date must be after start date' });
  }
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(b)) {
    if (!editable.has(k)) continue;
    sets.push(`${k} = $${i++}`);
    vals.push(v === '' ? null : v);
  }
  if ('status' in b) {
    if (!['open', 'resolved', 'declined'].includes(b.status)) {
      return res.status(400).json({ error: 'invalid status' });
    }
    if (b.status === 'open') {
      sets.push(`resolved_by = NULL`, `resolved_at = NULL`);
    } else {
      sets.push(`resolved_by = $${i++}`, `resolved_at = NOW()`);
      vals.push(b.resolved_by || null);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(
    `UPDATE resource_requests SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  if (!upd.rows[0]) return res.status(404).json({ error: 'request not found' });
  const withNames = await query(`${SELECT_WITH_NAMES} WHERE rq.id = $1`, [req.params.id]);
  res.json(withNames.rows[0]);
}));

// DELETE /api/resource-requests/:id
r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM resource_requests WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'request not found' });
  res.status(204).end();
}));

export default r;
