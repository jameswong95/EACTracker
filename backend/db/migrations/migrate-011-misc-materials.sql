-- migrate-011-misc-materials.sql
-- Adds:
--   * app_settings   - global key/value config (Finance/Admin owned).
--                      Seeds material_asset_threshold = 10000.
--   * material_misc  - per-project sub-threshold material lines, optionally
--                      priced from the fixed_rates catalog (qty x unit_rate).
-- Idempotent. ASCII only.
--   node scripts/run-sql.mjs db/migrations/migrate-011-misc-materials.sql

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

DELETE FROM app_settings a
USING app_settings b
WHERE a.ctid < b.ctid
  AND a.key = b.key;

CREATE UNIQUE INDEX IF NOT EXISTS app_settings_key_unique
  ON app_settings (key);

INSERT INTO app_settings (key, value)
  VALUES ('material_asset_threshold', '10000')
  ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS material_misc (
  id          SERIAL PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rate_code   TEXT,
  description TEXT NOT NULL,
  unit        TEXT NOT NULL DEFAULT 'each',
  qty         NUMERIC(14,2) NOT NULL DEFAULT 1,
  unit_rate   NUMERIC(18,2) NOT NULL DEFAULT 0,
  amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS material_misc_project_idx ON material_misc (project_id);
