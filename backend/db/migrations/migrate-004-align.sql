-- =============================================================
-- EAC Tracker — migration 004: align DB schema with web frontend
-- Idempotent. Run after migrate-003-planning.sql.
-- =============================================================

-- 1. Add os_pb to projects
--    SAP import computes os_pb = rev - pb but was only writing it to
--    sap_import_rows. The Revenue & Cash tab needs it on projects.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS os_pb NUMERIC(18,2) NOT NULL DEFAULT 0;

-- 2. Rebuild v_project_financials
--    Fixes: etc formula was (budget - actual - committed) -> now (eac - actual - committed)
--    Adds:  budget_gp_pct, forecast_gp_pct computed from contract_value
DROP VIEW IF EXISTS v_project_financials;
CREATE VIEW v_project_financials AS
SELECT
  p.*,
  u_pm.full_name  AS pm_name,
  u_pd.full_name  AS pd_name,
  (p.eac - p.budget)                              AS variance,
  CASE WHEN p.budget > 0
       THEN ROUND(((p.eac - p.budget) / p.budget) * 100, 1)
       ELSE 0 END                                 AS variance_pct,
  -- ETC: remaining spend to reach EAC (not remaining budget)
  GREATEST(0, p.eac - p.actual - p.committed)     AS etc,
  CASE WHEN p.eac > 0
       THEN ROUND((p.actual / p.eac) * 100, 1)
       ELSE 0 END                                 AS percent_complete,
  (p.contract_value - p.rev_recognised)           AS rev_remaining,
  -- GP percentages derived from contract value (no phantom columns)
  CASE WHEN p.contract_value > 0
       THEN ROUND(((p.contract_value - p.budget) / p.contract_value) * 100, 2)
       ELSE 0 END                                 AS budget_gp_pct,
  CASE WHEN p.contract_value > 0
       THEN ROUND(((p.contract_value - p.eac) / p.contract_value) * 100, 2)
       ELSE 0 END                                 AS forecast_gp_pct
FROM projects p
LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
LEFT JOIN users u_pd ON u_pd.id = p.pd_user_id;
