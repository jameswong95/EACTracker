-- =============================================================
-- PFMS - migration 011: UI/feature updates
--   * Global FAD (FX) rates table (org-wide, managed in Standards)
--   * Other LOB/MISC cost module (project-level forecast register)
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

DELETE FROM fx_rates a
USING fx_rates b
WHERE a.ctid < b.ctid
  AND a.currency = b.currency;

CREATE UNIQUE INDEX IF NOT EXISTS fx_rates_currency_unique
  ON fx_rates (currency);

INSERT INTO fx_rates (currency, rate_to_sgd, notes) VALUES
  ('SGD', 1.000000, 'Base currency'),
  ('USD', 1.350000, NULL),
  ('EUR', 1.460000, NULL),
  ('GBP', 1.710000, NULL),
  ('JPY', 0.009000, NULL)
ON CONFLICT (currency) DO NOTHING;

-- -- 2. Other LOB/MISC cost module (mirrors material/sub-con) ---------
CREATE TABLE IF NOT EXISTS others_items (
  id            SERIAL PRIMARY KEY,
  project_id    TEXT REFERENCES projects(id) ON DELETE CASCADE,
  sub_job_id    INT  REFERENCES sub_jobs(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
  estimated_received_date DATE,
  notes         TEXT,
  created_by    INT  REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE others_items
  ADD COLUMN IF NOT EXISTS estimated_received_date DATE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'others_items'
      AND column_name = 'purchase_date'
  ) THEN
    EXECUTE 'UPDATE others_items
                SET estimated_received_date = purchase_date
              WHERE estimated_received_date IS NULL
                AND purchase_date IS NOT NULL';
  END IF;
END $$;

DROP INDEX IF EXISTS others_items_purchase_idx;

ALTER TABLE others_items
  DROP COLUMN IF EXISTS po_number,
  DROP COLUMN IF EXISTS purchase_date;

CREATE INDEX IF NOT EXISTS others_items_project_idx  ON others_items (project_id);
CREATE INDEX IF NOT EXISTS others_items_est_received_idx ON others_items (estimated_received_date);

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

-- Existing local DBs may have this table from an older draft without the
-- unique key. Ensure route/seed ON CONFLICT targets have a matching index.
DELETE FROM cost_item_schedule a
USING cost_item_schedule b
WHERE a.ctid < b.ctid
  AND a.entity_type = b.entity_type
  AND a.entity_id = b.entity_id
  AND a.year = b.year
  AND a.month = b.month;

CREATE UNIQUE INDEX IF NOT EXISTS cost_item_schedule_unique
  ON cost_item_schedule (entity_type, entity_id, year, month);
