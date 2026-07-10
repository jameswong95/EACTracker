-- =============================================================
-- EAC Tracker - migration 012: resource request "from -> to" range
-- Idempotent. Run after migrate-009-resource-requests.sql.
--
-- A resource_request previously carried a single "need by" month
-- (need_year / need_month). To indicate the window a resource is
-- needed for, we add an end bound. The existing need_year/need_month
-- now act as the START ("from"); need_end_year/need_end_month are
-- the END ("to"). Headcount is retained in the schema (defaults 1)
-- but is no longer captured from the UI.
-- =============================================================

ALTER TABLE resource_requests
  ADD COLUMN IF NOT EXISTS need_end_year  INT,
  ADD COLUMN IF NOT EXISTS need_end_month INT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'resource_requests_need_end_month_chk'
  ) THEN
    ALTER TABLE resource_requests
      ADD CONSTRAINT resource_requests_need_end_month_chk
      CHECK (need_end_month IS NULL OR need_end_month BETWEEN 1 AND 12);
  END IF;
END $$;
