-- =============================================================
-- EAC Tracker — full schema migration (idempotent)
-- Run with: npm run db:deploy
-- =============================================================

-- -- Extensions --
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -- 1. users --
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  initials    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('Project Manager','Project Director','Finance','Admin','Leader')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -- 2. resource_grades --
CREATE TABLE IF NOT EXISTS resource_grades (
  grade        TEXT PRIMARY KEY,           -- E1 … E5
  title        TEXT NOT NULL,
  daily_rate   NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_rate NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- -- 3. resource_pool --
CREATE TABLE IF NOT EXISTS resource_pool (
  id          TEXT PRIMARY KEY,            -- r01 … r15
  name        TEXT NOT NULL,
  grade       TEXT NOT NULL REFERENCES resource_grades(grade),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- -- 4. projects --
CREATE TABLE IF NOT EXISTS projects (
  id                TEXT PRIMARY KEY,      -- PR-YYYY-NNN
  name              TEXT NOT NULL,
  wbs_code          TEXT NOT NULL,
  sap_project_no    TEXT,
  customer          TEXT,
  department        TEXT NOT NULL,
  pm_user_id        INT  REFERENCES users(id),
  pd_user_id        INT  REFERENCES users(id),
  status            TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','warn','bad')),

  -- dates
  start_date        DATE,
  end_date          DATE,
  warranty_start    DATE,
  warranty_end      DATE,
  dpl_start         DATE,
  dpl_end           DATE,

  -- financials (all in home currency, no unit suffix)
  contract_value    NUMERIC(18,2) NOT NULL DEFAULT 0,
  initial_budget    NUMERIC(18,2) NOT NULL DEFAULT 0,
  budget            NUMERIC(18,2) NOT NULL DEFAULT 0,
  eac               NUMERIC(18,2) NOT NULL DEFAULT 0,
  actual            NUMERIC(18,2) NOT NULL DEFAULT 0,
  committed         NUMERIC(18,2) NOT NULL DEFAULT 0,
  rev_recognised    NUMERIC(18,2) NOT NULL DEFAULT 0,
  progress_billing  NUMERIC(18,2) NOT NULL DEFAULT 0,
  gr_profit_sap     NUMERIC(18,2) NOT NULL DEFAULT 0,

  revrec_method     TEXT NOT NULL DEFAULT 'milestone'
                      CHECK (revrec_method IN ('milestone','progress_claim')),
  last_update       DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_pm_assignments (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_lead    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS project_pm_assignments_user_idx
  ON project_pm_assignments (user_id);

-- -- 5. sub_jobs --
CREATE TABLE IF NOT EXISTS sub_jobs (
  id          SERIAL PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  wbs_code    TEXT NOT NULL UNIQUE,
  wbs_suffix  TEXT NOT NULL,
  name        TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0,
  is_warranty BOOLEAN NOT NULL DEFAULT FALSE,

  -- SAP cost columns (all numeric, currency units)
  lab         NUMERIC(18,2) NOT NULL DEFAULT 0,
  foh         NUMERIC(18,2) NOT NULL DEFAULT 0,
  mat         NUMERIC(18,2) NOT NULL DEFAULT 0,
  doc         NUMERIC(18,2) NOT NULL DEFAULT 0,
  sco         NUMERIC(18,2) NOT NULL DEFAULT 0,
  tot_cost    NUMERIC(18,2) NOT NULL DEFAULT 0,
  com_cst     NUMERIC(18,2) NOT NULL DEFAULT 0,
  plan_cos    NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- ETC columns
  etc_lab     NUMERIC(18,2) NOT NULL DEFAULT 0,
  etc_foh     NUMERIC(18,2) NOT NULL DEFAULT 0,
  etc_mat     NUMERIC(18,2) NOT NULL DEFAULT 0,
  etc_doc     NUMERIC(18,2) NOT NULL DEFAULT 0,
  etc_sco     NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- -- 6. milestones --
CREATE TABLE IF NOT EXISTS milestones (
  id          SERIAL PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  target_date DATE,
  is_done     BOOLEAN NOT NULL DEFAULT FALSE,
  is_warning  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INT  NOT NULL DEFAULT 0
);

-- -- 7. risks --
CREATE TABLE IF NOT EXISTS risks (
  id          SERIAL PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ref         TEXT NOT NULL,
  title       TEXT NOT NULL,
  impact      TEXT NOT NULL CHECK (impact IN ('Low','Medium','High')),
  probability TEXT NOT NULL CHECK (probability IN ('Low','Medium','High')),
  mitigation  TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','monitor'))
);

-- Older local schemas only allowed open/closed. Seed data uses monitor.
ALTER TABLE risks DROP CONSTRAINT IF EXISTS risks_status_check;
ALTER TABLE risks
  ADD CONSTRAINT risks_status_check
  CHECK (status IN ('open','closed','monitor'));

-- -- 8. project_updates (monthly status narrative) --
CREATE TABLE IF NOT EXISTS project_updates (
  id           SERIAL PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  period_year  INT  NOT NULL,
  period_month INT  NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  status       TEXT NOT NULL CHECK (status IN ('ok','warn','bad')),
  narrative    TEXT NOT NULL,
  created_by   INT  REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, period_year, period_month)
);

-- -- 9. project_resources --
CREATE TABLE IF NOT EXISTS project_resources (
  id              SERIAL PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  resource_id     TEXT REFERENCES resource_pool(id),
  role_name       TEXT NOT NULL,
  function_title  TEXT NOT NULL,
  grade           TEXT NOT NULL REFERENCES resource_grades(grade),
  fte_allocations JSONB NOT NULL DEFAULT '[]'   -- [{year,month,fte}]
);

-- Older local schemas used integer resource ids. Current seed/app data uses
-- stable text ids (r01, r02, ...), so normalize the columns before seeding.
DO $$
DECLARE
  rp_type TEXT;
  pr_type TEXT;
  fk RECORD;
BEGIN
  SELECT data_type INTO rp_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'resource_pool'
    AND column_name = 'id';

  SELECT data_type INTO pr_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'project_resources'
    AND column_name = 'resource_id';

  IF rp_type IS DISTINCT FROM 'text' OR pr_type IS DISTINCT FROM 'text' THEN
    FOR fk IN
      SELECT conrelid::regclass AS table_name, conname
      FROM pg_constraint
      WHERE contype = 'f'
        AND conrelid = 'project_resources'::regclass
        AND confrelid = 'resource_pool'::regclass
    LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', fk.table_name, fk.conname);
    END LOOP;

    IF pr_type IS DISTINCT FROM 'text' THEN
      ALTER TABLE project_resources
        ALTER COLUMN resource_id TYPE TEXT
        USING CASE
          WHEN resource_id IS NULL THEN NULL
          ELSE 'r' || lpad(resource_id::text, 2, '0')
        END;
    END IF;

    IF rp_type IS DISTINCT FROM 'text' THEN
      ALTER TABLE resource_pool ALTER COLUMN id DROP DEFAULT;
      ALTER TABLE resource_pool
        ALTER COLUMN id TYPE TEXT
        USING 'r' || lpad(id::text, 2, '0');
    END IF;
  END IF;

  DELETE FROM resource_pool a
  USING resource_pool b
  WHERE a.ctid < b.ctid
    AND a.id = b.id;

  CREATE UNIQUE INDEX IF NOT EXISTS resource_pool_id_unique
    ON resource_pool (id);

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'project_resources'::regclass
      AND conname = 'project_resources_resource_id_fkey'
  ) THEN
    ALTER TABLE project_resources
      ADD CONSTRAINT project_resources_resource_id_fkey
      FOREIGN KEY (resource_id) REFERENCES resource_pool(id)
      NOT VALID;
  END IF;
END $$;

-- -- 10. eac_monthly_rows (cost-category rows per project) --
CREATE TABLE IF NOT EXISTS eac_monthly_rows (
  id            SERIAL PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_category TEXT NOT NULL,
  label         TEXT NOT NULL,
  sort_order    INT  NOT NULL DEFAULT 0
);

-- Older local schemas restricted cost_category to a short enum. The EAC grid
-- now uses free-text categories (labour, reserve, services, software, etc.).
ALTER TABLE eac_monthly_rows
  DROP CONSTRAINT IF EXISTS eac_monthly_rows_cost_category_check;

-- -- 11. eac_monthly_values (cell values) --
CREATE TABLE IF NOT EXISTS eac_monthly_values (
  id         SERIAL PRIMARY KEY,
  row_id     INT  NOT NULL REFERENCES eac_monthly_rows(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  year       INT  NOT NULL,
  month      INT  NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount_k   NUMERIC(14,3) NOT NULL DEFAULT 0,
  is_locked  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (row_id, year, month)
);

-- -- 12. revrec_entries --
CREATE TABLE IF NOT EXISTS revrec_entries (
  id           SERIAL PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id INT  REFERENCES milestones(id) ON DELETE SET NULL,
  period_year  INT,
  period_month INT  CHECK (period_month BETWEEN 1 AND 12),
  description  TEXT,
  amount       NUMERIC(18,2) NOT NULL DEFAULT 0,
  is_locked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   INT  REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -- 13. pd_approvals --
CREATE TABLE IF NOT EXISTS pd_approvals (
  id           SERIAL PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  period_year  INT  NOT NULL,
  period_month INT  NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  eac_amount   NUMERIC(18,2) NOT NULL,
  variance     NUMERIC(18,2),
  notes        TEXT,
  submitted_by INT  REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','delegated')),
  reviewed_by  INT  REFERENCES users(id),
  reviewed_at  TIMESTAMPTZ,
  UNIQUE (project_id, period_year, period_month)
);

-- -- 14. period_locks --
CREATE TABLE IF NOT EXISTS period_locks (
  id           SERIAL PRIMARY KEY,
  period_year  INT  NOT NULL,
  period_month INT  NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  is_locked    BOOLEAN NOT NULL DEFAULT FALSE,
  locked_by    INT  REFERENCES users(id),
  locked_at    TIMESTAMPTZ,
  UNIQUE (period_year, period_month)
);

-- -- 15. audit_log --
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,
  user_id     INT  REFERENCES users(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_entity_idx
  ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_occurred_idx
  ON audit_log (occurred_at DESC);

-- -- Upsert compatibility indexes --
-- Existing local DBs may have been created by older draft migrations where
-- these unique constraints were missing. The app and seed use these columns as
-- ON CONFLICT targets, so ensure matching unique indexes exist.
DELETE FROM resource_grades a
USING resource_grades b
WHERE a.ctid < b.ctid
  AND a.grade = b.grade;
CREATE UNIQUE INDEX IF NOT EXISTS resource_grades_grade_unique
  ON resource_grades (grade);

DELETE FROM users a
USING users b
WHERE a.ctid < b.ctid
  AND a.username = b.username;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
  ON users (username);

DELETE FROM resource_pool a
USING resource_pool b
WHERE a.ctid < b.ctid
  AND a.id = b.id;
CREATE UNIQUE INDEX IF NOT EXISTS resource_pool_id_unique
  ON resource_pool (id);

DELETE FROM projects a
USING projects b
WHERE a.ctid < b.ctid
  AND a.id = b.id;
CREATE UNIQUE INDEX IF NOT EXISTS projects_id_unique
  ON projects (id);

DELETE FROM sub_jobs a
USING sub_jobs b
WHERE a.ctid < b.ctid
  AND a.wbs_code = b.wbs_code;
CREATE UNIQUE INDEX IF NOT EXISTS sub_jobs_wbs_code_unique
  ON sub_jobs (wbs_code);

DELETE FROM project_pm_assignments a
USING project_pm_assignments b
WHERE a.ctid < b.ctid
  AND a.project_id = b.project_id
  AND a.user_id = b.user_id;
CREATE UNIQUE INDEX IF NOT EXISTS project_pm_assignments_unique
  ON project_pm_assignments (project_id, user_id);

DELETE FROM project_updates a
USING project_updates b
WHERE a.ctid < b.ctid
  AND a.project_id = b.project_id
  AND a.period_year = b.period_year
  AND a.period_month = b.period_month;
CREATE UNIQUE INDEX IF NOT EXISTS project_updates_period_unique
  ON project_updates (project_id, period_year, period_month);

DELETE FROM eac_monthly_values a
USING eac_monthly_values b
WHERE a.ctid < b.ctid
  AND a.row_id = b.row_id
  AND a.year = b.year
  AND a.month = b.month;
CREATE UNIQUE INDEX IF NOT EXISTS eac_monthly_values_row_period_unique
  ON eac_monthly_values (row_id, year, month);

DELETE FROM pd_approvals a
USING pd_approvals b
WHERE a.ctid < b.ctid
  AND a.project_id = b.project_id
  AND a.period_year = b.period_year
  AND a.period_month = b.period_month;
CREATE UNIQUE INDEX IF NOT EXISTS pd_approvals_period_unique
  ON pd_approvals (project_id, period_year, period_month);

DELETE FROM period_locks a
USING period_locks b
WHERE a.ctid < b.ctid
  AND a.period_year = b.period_year
  AND a.period_month = b.period_month;
CREATE UNIQUE INDEX IF NOT EXISTS period_locks_period_unique
  ON period_locks (period_year, period_month);

-- --
-- VIEWS
-- --

-- -- v_project_financials --
-- Drop first because we use SELECT p.* — adding columns to `projects`
-- in later migrations changes column order, which CREATE OR REPLACE
-- VIEW rejects.
DROP VIEW IF EXISTS v_project_financials;
CREATE VIEW v_project_financials AS
SELECT
  p.*,
  COALESCE(lead_pm.full_name, u_pm.full_name) AS pm_name,
  u_pd.full_name  AS pd_name,
  COALESCE(pm_rollup.pm_user_ids, '[]'::jsonb) AS pm_user_ids,
  COALESCE(pm_rollup.pm_names, lead_pm.full_name, u_pm.full_name, '') AS pm_names,
  COALESCE(pm_rollup.pm_count, 0) AS pm_count,
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
) pm_rollup ON TRUE;

-- -- v_sub_job_summary --
-- Drop first because later migrations add columns to this view, and
-- CREATE OR REPLACE VIEW cannot remove columns on a rerun.
DROP VIEW IF EXISTS v_sub_job_summary;
CREATE VIEW v_sub_job_summary AS
SELECT
  sj.*,
  (sj.etc_lab + sj.etc_foh + sj.etc_mat + sj.etc_doc + sj.etc_sco) AS etc_total,
  (sj.tot_cost + sj.etc_lab + sj.etc_foh + sj.etc_mat + sj.etc_doc + sj.etc_sco) AS eac_total
FROM sub_jobs sj;

-- -- v_revrec_totals --
-- Drop first because older versions did not include revrec_method before
-- remaining, and CREATE OR REPLACE VIEW cannot rename/reorder columns.
DROP VIEW IF EXISTS v_revrec_totals;
CREATE VIEW v_revrec_totals AS
SELECT
  re.project_id,
  SUM(re.amount)                            AS total_recognised,
  SUM(CASE WHEN re.period_year < EXTRACT(YEAR FROM NOW())
             OR (re.period_year = EXTRACT(YEAR FROM NOW())
                 AND re.period_month <= EXTRACT(MONTH FROM NOW()))
           THEN re.amount ELSE 0 END)       AS recognised_to_date,
  p.contract_value,
  p.revrec_method,
  (p.contract_value - SUM(re.amount))       AS remaining
FROM revrec_entries re
JOIN projects p ON p.id = re.project_id
GROUP BY re.project_id, p.contract_value, p.revrec_method;

