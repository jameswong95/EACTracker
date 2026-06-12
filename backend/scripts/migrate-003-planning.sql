-- =============================================================
-- EAC Tracker - migration 003: WBS charging + planned items
-- Idempotent. Run after migrate-002-sap.sql.
-- =============================================================

-- 1. project_resources.sub_job_id (link a person assignment to a sub-job)
ALTER TABLE project_resources
  ADD COLUMN IF NOT EXISTS sub_job_id INT REFERENCES sub_jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS project_resources_sub_job_idx
  ON project_resources (sub_job_id);

-- 2. sub_job_planned_items (PM-entered forecast of what is being bought)
CREATE TABLE IF NOT EXISTS sub_job_planned_items (
  id            SERIAL PRIMARY KEY,
  sub_job_id    INT  NOT NULL REFERENCES sub_jobs(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN
                  ('hardware','software','licence','subcontract','other')),
  description   TEXT NOT NULL,
  vendor        TEXT,
  amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
  period_year   INT,
  period_month  INT CHECK (period_month BETWEEN 1 AND 12),
  status        TEXT NOT NULL DEFAULT 'planned'
                  CHECK (status IN ('planned','committed','received')),
  notes         TEXT,
  created_by    INT  REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sub_job_planned_items_sub_job_idx
  ON sub_job_planned_items (sub_job_id);
CREATE INDEX IF NOT EXISTS sub_job_planned_items_category_idx
  ON sub_job_planned_items (category);

-- 3. v_sub_job_planned_totals - sum planned amounts by sub-job & category
CREATE OR REPLACE VIEW v_sub_job_planned_totals AS
SELECT
  sub_job_id,
  COALESCE(SUM(CASE WHEN category IN ('hardware','software','licence')
                    THEN amount ELSE 0 END), 0) AS planned_mat,
  COALESCE(SUM(CASE WHEN category = 'subcontract'
                    THEN amount ELSE 0 END), 0) AS planned_sco,
  COALESCE(SUM(CASE WHEN category = 'other'
                    THEN amount ELSE 0 END), 0) AS planned_other,
  COALESCE(SUM(amount), 0)                      AS planned_total,
  COUNT(*)                                      AS planned_count
FROM sub_job_planned_items
GROUP BY sub_job_id;

-- 4. v_sub_job_resource_totals - sum FTE & headcount by sub-job
-- Sums all month entries inside fte_allocations JSONB
CREATE OR REPLACE VIEW v_sub_job_resource_totals AS
SELECT
  pr.sub_job_id,
  COUNT(*)                                                    AS people_count,
  COALESCE(SUM((
    SELECT SUM((m->>'fte')::numeric)
    FROM jsonb_array_elements(pr.fte_allocations) AS m
  )), 0)                                                      AS total_fte
FROM project_resources pr
WHERE pr.sub_job_id IS NOT NULL
GROUP BY pr.sub_job_id;

-- 5. Replace v_sub_job_summary to include planning totals & resource totals
CREATE OR REPLACE VIEW v_sub_job_summary AS
SELECT
  sj.*,
  (sj.etc_lab + sj.etc_foh + sj.etc_mat + sj.etc_doc + sj.etc_sco) AS etc_total,
  (sj.tot_cost + sj.etc_lab + sj.etc_foh + sj.etc_mat + sj.etc_doc + sj.etc_sco) AS eac_total,
  COALESCE(pt.planned_mat, 0)    AS planned_mat,
  COALESCE(pt.planned_sco, 0)    AS planned_sco,
  COALESCE(pt.planned_other, 0)  AS planned_other,
  COALESCE(pt.planned_total, 0)  AS planned_total,
  COALESCE(pt.planned_count, 0)  AS planned_count,
  COALESCE(rt.people_count, 0)   AS people_count,
  COALESCE(rt.total_fte, 0)      AS total_fte
FROM sub_jobs sj
LEFT JOIN v_sub_job_planned_totals  pt ON pt.sub_job_id = sj.id
LEFT JOIN v_sub_job_resource_totals rt ON rt.sub_job_id = sj.id;
