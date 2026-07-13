-- =============================================================
-- PFMS - migration 014: editable project initiation handover
--   * Stores a project-side copy of the awarded tender estimate.
--   * Editing these rows does not mutate the original tender/tender_items.
-- Idempotent. Run after migrate-013-standalone-tenders.sql.
-- =============================================================

CREATE TABLE IF NOT EXISTS project_initiation_items (
  id                    SERIAL PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_tender_id      INT REFERENCES tenders(id) ON DELETE SET NULL,
  source_tender_item_id INT REFERENCES tender_items(id) ON DELETE SET NULL,
  kind                  TEXT NOT NULL CHECK (kind IN ('resource','material','subcon','others')),
  category              TEXT NOT NULL DEFAULT 'PM' CHECK (category IN ('PM','MISC')),
  sub_job_label         TEXT,
  description           TEXT NOT NULL,
  qty                   NUMERIC(14,2) NOT NULL DEFAULT 1,
  unit_cost             NUMERIC(18,2) NOT NULL DEFAULT 0,
  amount                NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, source_tender_item_id)
);

CREATE INDEX IF NOT EXISTS project_initiation_items_project_idx
  ON project_initiation_items (project_id);
CREATE INDEX IF NOT EXISTS project_initiation_items_source_tender_idx
  ON project_initiation_items (source_tender_id);

-- Existing local DBs may have this table from an older draft without the
-- unique key. Ensure ON CONFLICT (project_id, source_tender_item_id) works.
DELETE FROM project_initiation_items a
USING project_initiation_items b
WHERE a.ctid < b.ctid
  AND a.project_id = b.project_id
  AND a.source_tender_item_id = b.source_tender_item_id
  AND a.source_tender_item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_initiation_items_project_source_unique
  ON project_initiation_items (project_id, source_tender_item_id);
