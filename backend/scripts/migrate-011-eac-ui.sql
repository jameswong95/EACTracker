-- =============================================================
-- PFMS - migration 011: UI/feature updates
--   * Global FAD (FX) rates table (org-wide, managed in Standards)
--   * Others LOB/MISC cost module (project-level PO register)
--   * Monthly cost timeline for material / sub-con / others line items
-- Idempotent. Run after migrate-010-eac-features.sql.
--   node scripts/run-sql.mjs scripts/migrate-011-eac-ui.sql
-- =============================================================

-- -- 1. Global FAD / FX rates ----------------------------------------
-- rate_to_sgd = value in S$ of 1 unit of the foreign currency.
CREATE TABLE IF NOT EXISTS fx_rates (
  id           SERIAL PRIMARY KEY,
  currency     TEXT NOT NULL UNIQUE,
  rate_to_sgd  NUMERIC(18,6) NOT NULL DEFAULT 0,
  notes        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO fx_rates (currency, rate_to_sgd, notes) VALUES
  ('SGD', 1.000000, 'Base currency'),
  ('USD', 1.350000, NULL),
  ('EUR', 1.460000, NULL),
  ('GBP', 1.710000, NULL),
  ('JPY', 0.009000, NULL)
ON CONFLICT (currency) DO NOTHING;

-- -- 2. Others LOB/MISC cost module (mirrors material/sub-con) --------
CREATE TABLE IF NOT EXISTS others_items (
  id            SERIAL PRIMARY KEY,
  project_id    TEXT REFERENCES projects(id) ON DELETE CASCADE,
  sub_job_id    INT  REFERENCES sub_jobs(id) ON DELETE CASCADE,
  po_number     TEXT,
  description   TEXT NOT NULL,
  amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
  purchase_date DATE,
  notes         TEXT,
  created_by    INT  REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS others_items_project_idx  ON others_items (project_id);
CREATE INDEX IF NOT EXISTS others_items_purchase_idx ON others_items (purchase_date);

-- -- 3. Monthly cost timeline for cost-item registers ----------------
-- Generic per-line-item month/dollar planning grid shared by material,
-- sub-con and others. entity_type identifies which register the row is in.
CREATE TABLE IF NOT EXISTS cost_item_schedule (
  id           SERIAL PRIMARY KEY,
  entity_type  TEXT NOT NULL,
  entity_id    INT  NOT NULL,
  year         INT  NOT NULL,
  month        INT  NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount       NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, year, month)
);
CREATE INDEX IF NOT EXISTS cost_item_schedule_entity_idx
  ON cost_item_schedule (entity_type, entity_id);
