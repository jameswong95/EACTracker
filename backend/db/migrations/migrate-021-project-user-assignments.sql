-- PFMS - migration 021: project team assignments for SSO-linked users

CREATE TABLE IF NOT EXISTS project_user_assignments (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name  TEXT NOT NULL DEFAULT 'Project Team',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_user_assignments_user_idx
  ON project_user_assignments (user_id);

DELETE FROM project_user_assignments a
USING project_user_assignments b
WHERE a.ctid < b.ctid
  AND a.project_id = b.project_id
  AND a.user_id = b.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS project_user_assignments_unique
  ON project_user_assignments (project_id, user_id);

DROP VIEW IF EXISTS v_project_financials;
CREATE VIEW v_project_financials AS
SELECT
  p.*,
  COALESCE(lead_pm.full_name, u_pm.full_name) AS pm_name,
  u_pd.full_name  AS pd_name,
  COALESCE(pm_rollup.pm_user_ids, '[]'::jsonb) AS pm_user_ids,
  COALESCE(pm_rollup.pm_names, lead_pm.full_name, u_pm.full_name, '') AS pm_names,
  COALESCE(pm_rollup.pm_count, 0) AS pm_count,
  COALESCE(team_rollup.assigned_user_ids, '[]'::jsonb) AS assigned_user_ids,
  COALESCE(team_rollup.assigned_names, '') AS assigned_names,
  COALESCE(team_rollup.assigned_roles, '') AS assigned_roles,
  COALESCE(team_rollup.assigned_count, 0) AS assigned_count,
  (p.eac - p.budget)                          AS variance,
  CASE WHEN p.budget > 0
       THEN ROUND(((p.eac - p.budget) / p.budget) * 100, 1)
       ELSE 0 END                              AS variance_pct,
  (p.budget - p.actual - p.committed)         AS etc,
  CASE WHEN p.eac > 0
       THEN ROUND((p.actual / p.eac) * 100, 1)
       ELSE 0 END                              AS percent_complete,
  (p.contract_value - p.rev_recognised)       AS rev_remaining
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
) pm_rollup ON TRUE
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(u.id ORDER BY u.full_name, u.id) AS assigned_user_ids,
    string_agg(u.full_name, ', ' ORDER BY u.full_name, u.id) AS assigned_names,
    string_agg(a.role_name, ', ' ORDER BY u.full_name, u.id) AS assigned_roles,
    COUNT(*)::INT AS assigned_count
  FROM project_user_assignments a
  JOIN users u ON u.id = a.user_id
  WHERE a.project_id = p.id
) team_rollup ON TRUE;
