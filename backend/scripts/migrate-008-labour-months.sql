-- ------------------------------------------------------------------
-- migrate-008-labour-months.sql
-- Move ST Labour allocation to monthly granularity and store a
-- contiguous month timeline range per tender. ASCII only.
-- ------------------------------------------------------------------

-- 1. Add month to allocations (1-12) and re-key the uniqueness.
ALTER TABLE tender_labour_allocations
  ADD COLUMN IF NOT EXISTS month INT NOT NULL DEFAULT 1;

ALTER TABLE tender_labour_allocations
  DROP CONSTRAINT IF EXISTS tender_labour_allocations_phase_id_function_id_year_key;

ALTER TABLE tender_labour_allocations
  DROP CONSTRAINT IF EXISTS tender_labour_allocations_phase_function_year_month_key;

ALTER TABLE tender_labour_allocations
  ADD CONSTRAINT tender_labour_allocations_phase_function_year_month_key
  UNIQUE (phase_id, function_id, year, month);

-- 2. Contiguous timeline range for the labour grid (start .. end inclusive).
CREATE TABLE IF NOT EXISTS tender_labour_range (
  tender_id   INT PRIMARY KEY REFERENCES tenders(id) ON DELETE CASCADE,
  start_year  INT NOT NULL,
  start_month INT NOT NULL,
  end_year    INT NOT NULL,
  end_month   INT NOT NULL
);

-- 3. The old discrete-year timeline table is no longer used.
DROP TABLE IF EXISTS tender_labour_years;
