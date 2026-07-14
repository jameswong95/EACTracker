-- =============================================================
-- EAC Tracker - migration 002: SAP import tables & extra columns
-- Idempotent. Run after db/schema.sql.
-- =============================================================

-- 1. users.sap_employee_id (used to resolve SAP "Responsible Person")
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sap_employee_id INT;

CREATE UNIQUE INDEX IF NOT EXISTS users_sap_employee_id_uq
  ON users (sap_employee_id) WHERE sap_employee_id IS NOT NULL;

-- 2. projects.last_sap_import (timestamp of most recent SAP commit)
-- The view v_project_financials uses SELECT p.* so it must be dropped
-- before adding a column to projects, then recreated after.
DROP VIEW IF EXISTS v_project_financials;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS last_sap_import TIMESTAMPTZ;

CREATE OR REPLACE VIEW v_project_financials AS
SELECT
  p.*,
  u_pm.full_name  AS pm_name,
  u_pd.full_name  AS pd_name,
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
LEFT JOIN users u_pd ON u_pd.id = p.pd_user_id;

-- 3. audit_log extra columns (field-level diff support)
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS field_name TEXT,
  ADD COLUMN IF NOT EXISTS old_value  TEXT,
  ADD COLUMN IF NOT EXISTS new_value  TEXT;

-- 4. sap_imports (one row per uploaded workbook / commit)
CREATE TABLE IF NOT EXISTS sap_imports (
  id                SERIAL PRIMARY KEY,
  period_year       INT  NOT NULL,
  period_month      INT  NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  filename          TEXT NOT NULL,
  sheet_count       INT  NOT NULL DEFAULT 1,
  projects_created  INT  NOT NULL DEFAULT 0,
  projects_updated  INT  NOT NULL DEFAULT 0,
  exceptions        INT  NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'ok'
                      CHECK (status IN ('ok','warn','bad')),
  imported_by       INT  REFERENCES users(id),
  imported_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sap_imports_period_idx
  ON sap_imports (period_year DESC, period_month DESC);

-- 5. sap_import_rows (raw rows captured from each import for audit)
CREATE TABLE IF NOT EXISTS sap_import_rows (
  id                  BIGSERIAL PRIMARY KEY,
  import_id           INT  NOT NULL REFERENCES sap_imports(id) ON DELETE CASCADE,
  row_type            TEXT NOT NULL CHECK (row_type IN ('project','subjob')),
  wbs_code            TEXT NOT NULL,
  description         TEXT,

  -- cost columns
  lab                 NUMERIC(18,2) NOT NULL DEFAULT 0,
  foh                 NUMERIC(18,2) NOT NULL DEFAULT 0,
  mat                 NUMERIC(18,2) NOT NULL DEFAULT 0,
  doc                 NUMERIC(18,2) NOT NULL DEFAULT 0,
  sco                 NUMERIC(18,2) NOT NULL DEFAULT 0,
  tot_cost            NUMERIC(18,2) NOT NULL DEFAULT 0,
  com_cst             NUMERIC(18,2) NOT NULL DEFAULT 0,
  plan_cos            NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- revenue columns (project-row only)
  quot_pr             NUMERIC(18,2),
  rev                 NUMERIC(18,2),
  pb                  NUMERIC(18,2),
  os_pb               NUMERIC(18,2),
  gr_profit           NUMERIC(18,2),

  -- metadata (project-row only)
  sap_start_date      DATE,
  sap_end_date        DATE,
  responsible_person  TEXT,
  customer            TEXT
);

CREATE INDEX IF NOT EXISTS sap_import_rows_import_idx
  ON sap_import_rows (import_id);
