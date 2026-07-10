-- =============================================================
-- PFMS - migration 015: multiple project managers per project
--   * Keeps projects.pm_user_id as the lead PM for compatibility.
--   * Adds project_pm_assignments for all PMs assigned to a project.
--   * Extends v_project_financials with pm_user_ids and pm_names.
-- Idempotent. Run after migrate-014-project-initiation-items.sql.
-- =============================================================

CREATE TABLE IF NOT EXISTS project_pm_assignments (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_lead    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_pm_assignments_user_idx
  ON project_pm_assignments (user_id);

INSERT INTO project_pm_assignments (project_id, user_id, is_lead)
SELECT id, pm_user_id, TRUE
FROM projects
WHERE pm_user_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO UPDATE
  SET is_lead = project_pm_assignments.is_lead OR EXCLUDED.is_lead;

WITH ranked AS (
  SELECT
    project_id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY is_lead DESC, created_at, user_id) AS rn
  FROM project_pm_assignments
)
UPDATE project_pm_assignments a
SET is_lead = ranked.rn = 1
FROM ranked
WHERE a.project_id = ranked.project_id
  AND a.user_id = ranked.user_id;

DROP VIEW IF EXISTS v_project_financials;
CREATE VIEW v_project_financials AS
SELECT
  p.*,
  COALESCE(lead_pm.full_name, u_pm.full_name) AS pm_name,
  u_pd.full_name AS pd_name,
  COALESCE(pm_rollup.pm_user_ids, '[]'::jsonb) AS pm_user_ids,
  COALESCE(pm_rollup.pm_names, lead_pm.full_name, u_pm.full_name, '') AS pm_names,
  COALESCE(pm_rollup.pm_count, 0) AS pm_count,
  (p.eac - p.budget) AS variance,
  CASE WHEN p.budget > 0
       THEN ROUND(((p.eac - p.budget) / p.budget) * 100, 1)
       ELSE 0 END AS variance_pct,
  (p.budget - p.actual - p.committed) AS etc,
  CASE WHEN p.eac > 0
       THEN ROUND((p.actual / p.eac) * 100, 1)
       ELSE 0 END AS percent_complete,
  (p.contract_value - p.rev_recognised) AS rev_remaining
FROM projects p
LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
LEFT JOIN users u_pd ON u_pd.id = p.pd_user_id
LEFT JOIN project_pm_assignments lead_a
  ON lead_a.project_id = p.id AND lead_a.is_lead
LEFT JOIN users lead_pm ON lead_pm.id = lead_a.user_id
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(u.id ORDER BY a.is_lead DESC, u.full_name, u.id) AS pm_user_ids,
    string_agg(u.full_name, ', ' ORDER BY a.is_lead DESC, u.full_name, u.id) AS pm_names,
    COUNT(*)::INT AS pm_count
  FROM project_pm_assignments a
  JOIN users u ON u.id = a.user_id
  WHERE a.project_id = p.id
) pm_rollup ON TRUE;
