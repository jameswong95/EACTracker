import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../util.js';

const r = Router();

// GET /api/etc/:project_id
// Read-only derived ETC for a project, aggregated by sub-job x Category (PM).
// Labour is derived from the Resource Plan (FTE x grade monthly rate);
// Material and Sub-Con forecast from their respective module line items.
r.get('/:project_id', ah(async (req, res) => {
  const pid = req.params.project_id;
  const proj = await query(`SELECT id FROM projects WHERE id = $1`, [pid]);
  if (!proj.rows[0]) return res.status(404).json({ error: 'project not found' });

  const [byCategory, bySubJob, labourAll, matAgg, subAgg] = await Promise.all([
    query(
      `SELECT e.*, sj.name AS sub_job_name, sj.wbs_code
         FROM v_sub_job_category_etc e
         JOIN sub_jobs sj ON sj.id = e.sub_job_id
        WHERE e.project_id = $1
        ORDER BY sj.sort_order, sj.id, e.category`,
      [pid]
    ),
    query(
      `SELECT e.*, sj.name AS sub_job_name, sj.wbs_code
         FROM v_sub_job_etc e
         JOIN sub_jobs sj ON sj.id = e.sub_job_id
        WHERE e.project_id = $1
        ORDER BY sj.sort_order, sj.id`,
      [pid]
    ),
    // Labour is parked under PM and is not tied to a WBS/sub-job, so sum
    // every resource on the project (regardless of sub_job_id). fte_allocations may
    // be a flat array of numbers ([1, 1.5, ...]) or legacy objects ([{fte: x}]).
    query(
      `SELECT COALESCE(SUM(fte_sum.fte * COALESCE(g.monthly_rate, 0)), 0) AS labour_etc
         FROM project_resources pr
         JOIN resource_grades g ON g.grade = pr.grade
         CROSS JOIN LATERAL (
           SELECT COALESCE(SUM(
             CASE jsonb_typeof(m)
               WHEN 'number' THEN (m#>>'{}')::numeric
               WHEN 'object' THEN COALESCE((m->>'fte')::numeric, 0)
               ELSE 0
             END), 0) AS fte
           FROM jsonb_array_elements(pr.fte_allocations) AS m
         ) fte_sum
        WHERE pr.project_id = $1`,
      [pid]
    ),
    // Material register (project-level): planning forecast only. SAP import is
    // the committed source of truth.
    query(
      `SELECT 0::numeric AS committed,
              COALESCE(SUM(amount), 0) AS etc
         FROM material_items WHERE project_id = $1`,
      [pid]
    ),
    // Sub-Con register (project-level): planning forecast only.
    query(
      `SELECT 0::numeric AS committed,
              COALESCE(SUM(amount), 0) AS etc
         FROM sub_con_items WHERE project_id = $1`,
      [pid]
    ),
  ]);

  const labourEtc = Number(labourAll.rows[0]?.labour_etc || 0);
  const totals = {
    labour_etc:         labourEtc,
    material_committed: Number(matAgg.rows[0]?.committed || 0),
    material_etc:       Number(matAgg.rows[0]?.etc || 0),
    subcon_committed:   Number(subAgg.rows[0]?.committed || 0),
    subcon_etc:         Number(subAgg.rows[0]?.etc || 0),
  };
  totals.etc_total = labourEtc + totals.material_etc + totals.subcon_etc;

  res.json({ project_id: pid, byCategory: byCategory.rows, bySubJob: bySubJob.rows, totals });
}));

export default r;
