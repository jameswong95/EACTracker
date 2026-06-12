import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();

// GET /api/revrec/:project_id  → { project, entries, totals }
r.get('/:project_id', ah(async (req, res) => {
  const pid = req.params.project_id;
  const [p, entries, totals] = await Promise.all([
    query(`SELECT id, name, contract_value, revrec_method FROM projects WHERE id = $1`, [pid]),
    query(`
      SELECT re.*, m.name AS milestone_name, m.target_date AS milestone_date
      FROM revrec_entries re
      LEFT JOIN milestones m ON m.id = re.milestone_id
      WHERE re.project_id = $1
      ORDER BY re.period_year NULLS LAST, re.period_month NULLS LAST, re.id`, [pid]),
    query(`SELECT * FROM v_revrec_totals WHERE project_id = $1`, [pid]),
  ]);
  if (!p.rows[0]) return res.status(404).json({ error: 'project not found' });
  res.json({
    project:  p.rows[0],
    entries:  entries.rows,
    totals:   totals.rows[0] || { total_recognised: 0, recognised_to_date: 0,
                                   contract_value: p.rows[0].contract_value, remaining: p.rows[0].contract_value,
                                   revrec_method: p.rows[0].revrec_method },
  });
}));

// POST /api/revrec  (create a single recognition entry)
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'amount']);
  if (!b.milestone_id && (b.period_year == null || b.period_month == null)) {
    return res.status(400).json({ error: 'milestone_id OR period_year+period_month required' });
  }
  const ins = await query(`
    INSERT INTO revrec_entries
      (project_id, milestone_id, period_year, period_month, description, amount, is_locked, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,FALSE),$8)
    RETURNING *`,
    [b.project_id, b.milestone_id || null, b.period_year ?? null, b.period_month ?? null,
     b.description || null, b.amount, b.is_locked, b.created_by || null]
  );
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/revrec/:id
r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['description', 'amount', 'period_year', 'period_month', 'milestone_id', 'is_locked']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);
  const upd = await query(`UPDATE revrec_entries SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'entry not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/revrec/:id
r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM revrec_entries WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'entry not found' });
  res.status(204).end();
}));

// PUT /api/revrec/method  (switch project method between milestone / progress_claim)
r.put('/method', ah(async (req, res) => {
  const { project_id, method } = req.body;
  if (!project_id || !['milestone', 'progress_claim'].includes(method)) {
    return res.status(400).json({ error: 'project_id and valid method required' });
  }
  await query(`UPDATE projects SET revrec_method = $1, updated_at = NOW() WHERE id = $2`, [method, project_id]);
  res.json({ ok: true });
}));

export default r;
