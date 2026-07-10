-- ------------------------------------------------------------------
-- migrate-007-tender-planning.sql
-- Tender planning sub-modules: FAD (FX) rates, ST Labour, Preliminaries
-- All tables scoped to a tender (per project). ASCII only.
-- ------------------------------------------------------------------

-- -- 1. FAD / FX rates -------------------------------------------------
-- One row per currency per tender. rate_to_sgd = value in S$ of 1 unit
-- of the foreign currency (SGD itself is implicit = 1).
CREATE TABLE IF NOT EXISTS tender_fx_rates (
  id          SERIAL PRIMARY KEY,
  tender_id   INT  NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  currency    TEXT NOT NULL,
  rate_to_sgd NUMERIC(18,6) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tender_id, currency)
);
CREATE INDEX IF NOT EXISTS tender_fx_rates_tender_idx ON tender_fx_rates (tender_id);

-- -- 2. ST Labour ------------------------------------------------------
-- Phases of work (ordered, user managed).
CREATE TABLE IF NOT EXISTS tender_labour_phases (
  id          SERIAL PRIMARY KEY,
  tender_id   INT  NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tender_labour_phases_tender_idx ON tender_labour_phases (tender_id);

-- Functions / roles (System Engineer, PM, etc.) with a cost rate per unit.
CREATE TABLE IF NOT EXISTS tender_labour_functions (
  id          SERIAL PRIMARY KEY,
  tender_id   INT  NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  rate        NUMERIC(18,2) NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT 'md',
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tender_labour_functions_tender_idx ON tender_labour_functions (tender_id);

-- Persisted list of timeline years (columns) for a tender.
CREATE TABLE IF NOT EXISTS tender_labour_years (
  tender_id   INT  NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  year        INT  NOT NULL,
  PRIMARY KEY (tender_id, year)
);

-- Allocation of a function to a phase in a given year (qty of units).
CREATE TABLE IF NOT EXISTS tender_labour_allocations (
  id          SERIAL PRIMARY KEY,
  tender_id   INT  NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  phase_id    INT  NOT NULL REFERENCES tender_labour_phases(id) ON DELETE CASCADE,
  function_id INT  NOT NULL REFERENCES tender_labour_functions(id) ON DELETE CASCADE,
  year        INT  NOT NULL,
  qty         NUMERIC(14,2) NOT NULL DEFAULT 0,
  UNIQUE (phase_id, function_id, year)
);
CREATE INDEX IF NOT EXISTS tender_labour_alloc_tender_idx ON tender_labour_allocations (tender_id);

-- -- 3. Preliminaries --------------------------------------------------
CREATE TABLE IF NOT EXISTS tender_prelim_items (
  id          SERIAL PRIMARY KEY,
  tender_id   INT  NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  sn          TEXT,
  description TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'SGD',
  cost        NUMERIC(18,2) NOT NULL DEFAULT 0,
  esc_pct     NUMERIC(6,2)  NOT NULL DEFAULT 0,
  qty         NUMERIC(14,2) NOT NULL DEFAULT 1,
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tender_prelim_tender_idx ON tender_prelim_items (tender_id);
