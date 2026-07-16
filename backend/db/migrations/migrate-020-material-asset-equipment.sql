-- migrate-020-material-asset-equipment.sql
-- Equipment-tracking fields for Material Asset List.

ALTER TABLE material_assets
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS mac_address TEXT,
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS equipment_description TEXT,
  ADD COLUMN IF NOT EXISTS equipment_status TEXT,
  ADD COLUMN IF NOT EXISTS remarks TEXT;
