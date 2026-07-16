-- migrate-019-material-procurement.sql
-- Material procurement model:
--   * material_items = one row per PO line item
--   * cost_item_sub_items = GR batches under material PO lines
--   * material_assets = per-unit tracking linked to PO number

ALTER TABLE material_items
  ADD COLUMN IF NOT EXISTS vendor TEXT,
  ADD COLUMN IF NOT EXISTS po_number TEXT,
  ADD COLUMN IF NOT EXISTS quantity_ordered NUMERIC(18,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(18,2) NOT NULL DEFAULT 0;

UPDATE material_items
   SET quantity_ordered = 1
 WHERE quantity_ordered = 0
   AND amount > 0;

UPDATE material_items
   SET unit_cost = amount / NULLIF(quantity_ordered, 0)
 WHERE unit_cost = 0
   AND amount > 0
   AND quantity_ordered > 0;

CREATE INDEX IF NOT EXISTS material_items_project_po_idx
  ON material_items (project_id, po_number);

CREATE INDEX IF NOT EXISTS material_items_po_idx
  ON material_items (po_number);

ALTER TABLE cost_item_sub_items
  ADD COLUMN IF NOT EXISTS batch_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gr_status TEXT NOT NULL DEFAULT 'pending';

UPDATE cost_item_sub_items
   SET gr_status = 'pending'
 WHERE gr_status = 'partial';

ALTER TABLE cost_item_sub_items
  DROP CONSTRAINT IF EXISTS cost_item_sub_items_gr_status_check;

ALTER TABLE cost_item_sub_items
  ADD CONSTRAINT cost_item_sub_items_gr_status_check
  CHECK (gr_status IN ('pending','received'));

CREATE INDEX IF NOT EXISTS cost_item_sub_items_material_batch_idx
  ON cost_item_sub_items (parent_entity_type, parent_id, gr_status);

ALTER TABLE material_assets
  ADD COLUMN IF NOT EXISTS po_number TEXT,
  ADD COLUMN IF NOT EXISTS asset_type TEXT,
  ADD COLUMN IF NOT EXISTS expected_ship_date DATE,
  ADD COLUMN IF NOT EXISTS actual_received_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS material_assets_serial_unique
  ON material_assets (LOWER(serial_no))
  WHERE serial_no IS NOT NULL AND serial_no <> '';

CREATE INDEX IF NOT EXISTS material_assets_project_po_idx
  ON material_assets (project_id, po_number);

DROP VIEW IF EXISTS v_material_asset_totals;
CREATE OR REPLACE VIEW v_material_asset_totals AS
SELECT
  project_id,
  0::numeric AS committed_amount,
  0::numeric AS forecast_amount,
  COUNT(*) AS asset_count
FROM material_assets
GROUP BY project_id;
