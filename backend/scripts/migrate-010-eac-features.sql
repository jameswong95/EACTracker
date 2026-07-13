-- =============================================================
-- PFMS - migration 010: EAC feature build (three areas)
--   A. Finance role ownership: pool + rate card CRUD, FAD settle
--   B. Material redesign: asset list + timeline schedule + fixed rates
--   C. Tender: GP% / blended margin, VOs (potential vs confirmed)
-- Idempotent. ASCII only.
--   node scripts/run-sql.mjs scripts/migrate-010-eac-features.sql
-- =============================================================

-- ---------------------------------------------------------------
-- A. Tender GP% + FAD settlement + item-level margin override
-- ---------------------------------------------------------------
ALTER TABLE tenders
  ADD COLUMN IF NOT EXISTS gp_pct        NUMERIC(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fad_settled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fad_settled_by INT REFERENCES users(id);

ALTER TABLE tender_items
  ADD COLUMN IF NOT EXISTS gp_pct NUMERIC(6,3);   -- NULL = inherit tender GP%

-- ---------------------------------------------------------------
-- C. Variation Orders (VOs) - potential vs confirmed
--   Confirmed VOs surface in tender totals; NO auto budget recalc.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tender_vos (
  id          SERIAL PRIMARY KEY,
  tender_id   INT  NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  ref         TEXT,
  description TEXT NOT NULL,
  amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
  gp_pct      NUMERIC(6,3),                 -- NULL = inherit tender GP%
  status      TEXT NOT NULL DEFAULT 'potential'
                CHECK (status IN ('potential','confirmed')),
  notes       TEXT,
  created_by  INT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tender_vos_tender_idx ON tender_vos (tender_id);

-- VO rollup - split by status so the UI can show potential vs confirmed.
CREATE OR REPLACE VIEW v_tender_vo_totals AS
SELECT
  tender_id,
  COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0) AS confirmed_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'potential'), 0) AS potential_amount,
  COUNT(*) FILTER (WHERE status = 'confirmed')                 AS confirmed_count,
  COUNT(*) FILTER (WHERE status = 'potential')                 AS potential_count
FROM tender_vos
GROUP BY tender_id;

-- ---------------------------------------------------------------
-- B. Material asset list (live document)
--   SAP import owns committed costs; asset rows are local forecast planning.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS material_assets (
  id            SERIAL PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_tag     TEXT,
  description   TEXT NOT NULL,
  serial_no     TEXT,
  location      TEXT,
  vendor        TEXT,
  gr_status     TEXT NOT NULL DEFAULT 'not_ordered'
                  CHECK (gr_status IN ('not_ordered','ordered','partial','received')),
  amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
  need_by       DATE,
  advance_pct   NUMERIC(6,2) NOT NULL DEFAULT 0,
  milestone_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  retention_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_by    INT REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS material_assets_project_idx ON material_assets (project_id);

-- Timeline dollar-planning: planned cash per asset per month.
CREATE TABLE IF NOT EXISTS material_asset_schedule (
  id        SERIAL PRIMARY KEY,
  asset_id  INT NOT NULL REFERENCES material_assets(id) ON DELETE CASCADE,
  year      INT NOT NULL,
  month     INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
  UNIQUE (asset_id, year, month)
);
CREATE INDEX IF NOT EXISTS material_asset_schedule_asset_idx ON material_asset_schedule (asset_id);

-- Existing local DBs may have this table from an older draft without the
-- unique key. Ensure route ON CONFLICT targets have a matching index.
DELETE FROM material_asset_schedule a
USING material_asset_schedule b
WHERE a.ctid < b.ctid
  AND a.asset_id = b.asset_id
  AND a.year = b.year
  AND a.month = b.month;

CREATE UNIQUE INDEX IF NOT EXISTS material_asset_schedule_unique
  ON material_asset_schedule (asset_id, year, month);

-- Asset rollup by bucket. Committed is SAP-only, so local asset rows roll up
-- as forecast planning.
CREATE OR REPLACE VIEW v_material_asset_totals AS
SELECT
  project_id,
  0::numeric AS committed_amount,
  COALESCE(SUM(amount), 0) AS forecast_amount,
  COUNT(*) AS asset_count
FROM material_assets
GROUP BY project_id;

-- ---------------------------------------------------------------
-- B. Fixed-rate admin table (Finance/Admin owned reference)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fixed_rates (
  id         SERIAL PRIMARY KEY,
  code       TEXT,
  label      TEXT NOT NULL,
  unit       TEXT NOT NULL DEFAULT 'each',
  rate       NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO fixed_rates (code, label, unit, rate, notes)
SELECT * FROM (VALUES
  ('MOB',  'Site mobilisation',        'lot',   3500.00, 'Standard mobilisation charge'),
  ('DEMOB','Site demobilisation',      'lot',   2800.00, 'Standard demobilisation charge'),
  ('CRANE','Crane hire (per day)',     'day',   1200.00, 'Excludes operator'),
  ('FRT',  'Freight - local delivery', 'trip',   450.00, 'Within region'),
  ('TEST', 'FAT / commissioning test', 'each',   900.00, 'Per unit tested')
) AS v(code, label, unit, rate, notes)
WHERE NOT EXISTS (SELECT 1 FROM fixed_rates);
