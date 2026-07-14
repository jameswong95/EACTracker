-- =============================================================
-- PFMS — migration 005: Material / Sub-Con as project-level PO registers
--   * drop sub-job + PM/MISC category requirement on cost items
--   * add project_id, po_number, purchase_date
--   * purchase_date present -> Committed; absent -> ETC (Forecast)
-- Idempotent. Run after migrate-004-modules.sql.
--   node scripts/run-sql.mjs db/migrations/migrate-005-cost-items-po.sql
-- =============================================================

-- -- Material items --------------------------------------------------
ALTER TABLE material_items
  ADD COLUMN IF NOT EXISTS project_id    TEXT REFERENCES projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS po_number     TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE material_items ALTER COLUMN sub_job_id DROP NOT NULL;

-- -- Sub-Con items ---------------------------------------------------
ALTER TABLE sub_con_items
  ADD COLUMN IF NOT EXISTS project_id    TEXT REFERENCES projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS po_number     TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE sub_con_items ALTER COLUMN sub_job_id DROP NOT NULL;

-- -- Backfill project_id from sub-job on any pre-existing rows -------
UPDATE material_items it SET project_id = sj.project_id
  FROM sub_jobs sj WHERE sj.id = it.sub_job_id AND it.project_id IS NULL;
UPDATE sub_con_items it SET project_id = sj.project_id
  FROM sub_jobs sj WHERE sj.id = it.sub_job_id AND it.project_id IS NULL;

CREATE INDEX IF NOT EXISTS material_items_project_idx     ON material_items (project_id);
CREATE INDEX IF NOT EXISTS material_items_purchase_idx    ON material_items (purchase_date);
CREATE INDEX IF NOT EXISTS sub_con_items_project_idx      ON sub_con_items (project_id);
CREATE INDEX IF NOT EXISTS sub_con_items_purchase_idx     ON sub_con_items (purchase_date);
