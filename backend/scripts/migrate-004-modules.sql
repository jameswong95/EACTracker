-- =============================================================
-- PFMS — migration 004: module restructure
--   • Resource Plan / Material / Sub-Con as sibling modules
--   • sub-job -> Category (PM / MISC) shared join key
--   • read-only ETC derived from the three modules
--   • Tender module (standalone pre-kickoff estimate)
--   • Rev Rec: Forecast column + Planned (Tender) rollup
-- Idempotent. Run after migrate-003-planning.sql.
--   node scripts/run-sql.mjs scripts/migrate-004-modules.sql
-- =============================================================

-- -- 0. shared Category (PM / MISC) on labour assignments --------------
ALTER TABLE project_resources
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'PM'
    CHECK (category IN ('PM','MISC'));

CREATE INDEX IF NOT EXISTS project_resources_category_idx
  ON project_resources (category);

-- -- 1. Material module — line items by sub-job -> Category -----------
CREATE TABLE IF NOT EXISTS material_items (
  id           SERIAL PRIMARY KEY,
  sub_job_id   INT  NOT NULL REFERENCES sub_jobs(id) ON DELETE CASCADE,
  category     TEXT NOT NULL DEFAULT 'PM' CHECK (category IN ('PM','MISC')),
  description  TEXT NOT NULL,
  vendor       TEXT,
  amount       NUMERIC(18,2) NOT NULL DEFAULT 0,
  period_year  INT,
  period_month INT CHECK (period_month BETWEEN 1 AND 12),
  status       TEXT NOT NULL DEFAULT 'planned'
                 CHECK (status IN ('planned','committed','received')),
  notes        TEXT,
  created_by   INT  REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS material_items_sub_job_idx  ON material_items (sub_job_id);
CREATE INDEX IF NOT EXISTS material_items_category_idx ON material_items (category);

-- -- 2. Sub-Con module — line items by sub-job -> Category ------------
CREATE TABLE IF NOT EXISTS sub_con_items (
  id           SERIAL PRIMARY KEY,
  sub_job_id   INT  NOT NULL REFERENCES sub_jobs(id) ON DELETE CASCADE,
  category     TEXT NOT NULL DEFAULT 'PM' CHECK (category IN ('PM','MISC')),
  description  TEXT NOT NULL,
  vendor       TEXT,
  amount       NUMERIC(18,2) NOT NULL DEFAULT 0,
  period_year  INT,
  period_month INT CHECK (period_month BETWEEN 1 AND 12),
  status       TEXT NOT NULL DEFAULT 'planned'
                 CHECK (status IN ('planned','committed','received')),
  notes        TEXT,
  created_by   INT  REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sub_con_items_sub_job_idx  ON sub_con_items (sub_job_id);
CREATE INDEX IF NOT EXISTS sub_con_items_category_idx ON sub_con_items (category);

-- -- 3. ETC aggregation (read-only) by sub-job x Category ------------
--   Labour  = SUM(total FTE x grade monthly_rate)  from Resource Plan
--   Material= SUM(material_items.amount)
--   Sub-Con = SUM(sub_con_items.amount)
DROP VIEW IF EXISTS v_sub_job_etc;
DROP VIEW IF EXISTS v_sub_job_category_etc;

CREATE VIEW v_sub_job_category_etc AS
WITH cats(category) AS (VALUES ('PM'), ('MISC')),
labour AS (
  SELECT pr.sub_job_id,
         pr.category,
         SUM(fte_sum.fte * COALESCE(g.monthly_rate, 0)) AS labour_etc
  FROM project_resources pr
  JOIN resource_grades g ON g.grade = pr.grade
  CROSS JOIN LATERAL (
    SELECT COALESCE(SUM((m->>'fte')::numeric), 0) AS fte
    FROM jsonb_array_elements(pr.fte_allocations) AS m
  ) fte_sum
  WHERE pr.sub_job_id IS NOT NULL
  GROUP BY pr.sub_job_id, pr.category
),
mat AS (
  SELECT sub_job_id, category, SUM(amount) AS material_etc
  FROM material_items GROUP BY sub_job_id, category
),
sub AS (
  SELECT sub_job_id, category, SUM(amount) AS subcon_etc
  FROM sub_con_items GROUP BY sub_job_id, category
)
SELECT
  sj.id                                 AS sub_job_id,
  sj.project_id                         AS project_id,
  c.category                            AS category,
  COALESCE(l.labour_etc,   0)           AS labour_etc,
  COALESCE(m.material_etc, 0)           AS material_etc,
  COALESCE(s.subcon_etc,   0)           AS subcon_etc,
  COALESCE(l.labour_etc,   0)
    + COALESCE(m.material_etc, 0)
    + COALESCE(s.subcon_etc, 0)         AS etc_total
FROM sub_jobs sj
CROSS JOIN cats c
LEFT JOIN labour l ON l.sub_job_id = sj.id AND l.category = c.category
LEFT JOIN mat    m ON m.sub_job_id = sj.id AND m.category = c.category
LEFT JOIN sub    s ON s.sub_job_id = sj.id AND s.category = c.category;

CREATE VIEW v_sub_job_etc AS
SELECT
  sub_job_id,
  project_id,
  SUM(labour_etc)   AS labour_etc,
  SUM(material_etc) AS material_etc,
  SUM(subcon_etc)   AS subcon_etc,
  SUM(etc_total)    AS etc_total
FROM v_sub_job_category_etc
GROUP BY sub_job_id, project_id;

-- -- 4. Tender module (standalone pre-kickoff estimate) --------------
CREATE TABLE IF NOT EXISTS tenders (
  id          SERIAL PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Tender Estimate',
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','submitted','awarded','lost')),
  notes       TEXT,
  created_by  INT  REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tenders_project_idx ON tenders (project_id);

CREATE TABLE IF NOT EXISTS tender_items (
  id            SERIAL PRIMARY KEY,
  tender_id     INT  NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('resource','material','subcon')),
  category      TEXT NOT NULL DEFAULT 'PM' CHECK (category IN ('PM','MISC')),
  sub_job_label TEXT,                         -- free text (no live sub-jobs pre-kickoff)
  description   TEXT NOT NULL,
  qty           NUMERIC(14,2) NOT NULL DEFAULT 1,
  unit_cost     NUMERIC(18,2) NOT NULL DEFAULT 0,
  amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tender_items_tender_idx ON tender_items (tender_id);

-- Tender totals — rolls up into Rev Rec as "Planned (Tender)"
CREATE OR REPLACE VIEW v_tender_totals AS
SELECT
  t.project_id,
  t.id                                          AS tender_id,
  COALESCE(SUM(ti.amount), 0)                   AS total_amount,
  COALESCE(SUM(ti.amount) FILTER (WHERE ti.kind = 'resource'), 0) AS resource_amount,
  COALESCE(SUM(ti.amount) FILTER (WHERE ti.kind = 'material'), 0) AS material_amount,
  COALESCE(SUM(ti.amount) FILTER (WHERE ti.kind = 'subcon'),   0) AS subcon_amount,
  COUNT(ti.id)                                  AS item_count
FROM tenders t
LEFT JOIN tender_items ti ON ti.tender_id = t.id
GROUP BY t.project_id, t.id;

-- -- 5. Rev Rec — Forecast column (PM-editable, timestamped) ---------
ALTER TABLE revrec_entries
  ADD COLUMN IF NOT EXISTS forecast_amount     NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS forecast_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS forecast_updated_by INT REFERENCES users(id);
