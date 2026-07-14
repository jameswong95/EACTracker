-- =============================================================
-- EAC Tracker - migration 009: placeholder headcount requests
-- Idempotent. Run after migrate-008-labour-months.sql.
--
-- A resource_request is a PM-raised placeholder / dummy headcount
-- ask (no real person attached) that represents a resourcing need.
-- It is distinct from confirmed headcount (project_resources, tied
-- to a real person and feeding actual cost). Unresolved (open)
-- requests are surfaced to the PD as a visible, timestamped record.
-- =============================================================

CREATE TABLE IF NOT EXISTS resource_requests (
  id              SERIAL PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  function_title  TEXT NOT NULL,                 -- role / skill requested
  grade           TEXT,                          -- optional target grade
  headcount       NUMERIC(6,2) NOT NULL DEFAULT 1, -- FTE / headcount asked for
  need_year       INT,
  need_month      INT CHECK (need_month BETWEEN 1 AND 12),
  remarks         TEXT NOT NULL DEFAULT '',      -- justification for the ask
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','resolved','declined')),
  created_by      INT REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_by     INT REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS resource_requests_project_idx
  ON resource_requests (project_id);
CREATE INDEX IF NOT EXISTS resource_requests_status_idx
  ON resource_requests (status);
