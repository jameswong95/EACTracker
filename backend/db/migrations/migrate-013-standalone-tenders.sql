-- =============================================================
-- PFMS - migration 013: standalone pre-award tenders
--   * Tender records can exist before a project is awarded/created.
--   * project_id is now the awarded project link and remains NULL pre-award.
--   * Tender header carries opportunity metadata used to create the project.
--   * Tender estimate kinds include Others LOB/MISC.
-- Idempotent. Run after migrate-012-resource-request-range.sql.
-- =============================================================

ALTER TABLE tenders
  ADD COLUMN IF NOT EXISTS opportunity_name TEXT,
  ADD COLUMN IF NOT EXISTS customer         TEXT,
  ADD COLUMN IF NOT EXISTS department       TEXT,
  ADD COLUMN IF NOT EXISTS pm_user_id       INT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS pd_user_id       INT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS start_date       DATE,
  ADD COLUMN IF NOT EXISTS end_date         DATE,
  ADD COLUMN IF NOT EXISTS initiated_at     TIMESTAMPTZ;

ALTER TABLE tenders ALTER COLUMN project_id DROP NOT NULL;

UPDATE tenders t
   SET opportunity_name = COALESCE(t.opportunity_name, p.name),
       customer         = COALESCE(t.customer, p.customer),
       department       = COALESCE(t.department, p.department),
       pm_user_id       = COALESCE(t.pm_user_id, p.pm_user_id),
       pd_user_id       = COALESCE(t.pd_user_id, p.pd_user_id),
       start_date       = COALESCE(t.start_date, p.start_date),
       end_date         = COALESCE(t.end_date, p.end_date)
  FROM projects p
 WHERE p.id = t.project_id;

UPDATE tenders
   SET opportunity_name = COALESCE(opportunity_name, NULLIF(name, ''), 'New tender'),
       department       = COALESCE(department, 'Unassigned');

ALTER TABLE tender_items DROP CONSTRAINT IF EXISTS tender_items_kind_check;
ALTER TABLE tender_items
  ADD CONSTRAINT tender_items_kind_check
  CHECK (kind IN ('resource','material','subcon','others'));

CREATE OR REPLACE VIEW v_tender_totals AS
SELECT
  t.project_id,
  t.id                                          AS tender_id,
  COALESCE(SUM(ti.amount), 0)                   AS total_amount,
  COALESCE(SUM(ti.amount) FILTER (WHERE ti.kind = 'resource'), 0) AS resource_amount,
  COALESCE(SUM(ti.amount) FILTER (WHERE ti.kind = 'material'), 0) AS material_amount,
  COALESCE(SUM(ti.amount) FILTER (WHERE ti.kind = 'subcon'),   0) AS subcon_amount,
  COUNT(ti.id)                                  AS item_count,
  COALESCE(SUM(ti.amount) FILTER (WHERE ti.kind = 'others'),   0) AS others_amount
FROM tenders t
LEFT JOIN tender_items ti ON ti.tender_id = t.id
GROUP BY t.id, t.project_id;

CREATE INDEX IF NOT EXISTS tenders_status_idx ON tenders (status);
CREATE INDEX IF NOT EXISTS tenders_pm_idx     ON tenders (pm_user_id);
CREATE INDEX IF NOT EXISTS tenders_pd_idx     ON tenders (pd_user_id);
