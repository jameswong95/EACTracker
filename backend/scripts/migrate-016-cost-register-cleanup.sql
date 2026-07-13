-- migrate-016-cost-register-cleanup.sql
-- Removes PO-number driven costing and replaces goods received planning dates
-- with estimated_received_date on project cost registers.

DROP TRIGGER IF EXISTS material_items_po_cross ON material_items;
DROP TRIGGER IF EXISTS sub_con_items_po_cross ON sub_con_items;
DROP FUNCTION IF EXISTS check_po_unique_cross();

DROP INDEX IF EXISTS material_items_po_unique;
DROP INDEX IF EXISTS sub_con_items_po_unique;

ALTER TABLE material_items
  ADD COLUMN IF NOT EXISTS estimated_received_date DATE;
ALTER TABLE sub_con_items
  ADD COLUMN IF NOT EXISTS estimated_received_date DATE;
ALTER TABLE others_items
  ADD COLUMN IF NOT EXISTS estimated_received_date DATE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'material_items' AND column_name = 'purchase_date'
  ) THEN
    EXECUTE 'UPDATE material_items
                SET estimated_received_date = purchase_date
              WHERE estimated_received_date IS NULL
                AND purchase_date IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sub_con_items' AND column_name = 'purchase_date'
  ) THEN
    EXECUTE 'UPDATE sub_con_items
                SET estimated_received_date = purchase_date
              WHERE estimated_received_date IS NULL
                AND purchase_date IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'others_items' AND column_name = 'purchase_date'
  ) THEN
    EXECUTE 'UPDATE others_items
                SET estimated_received_date = purchase_date
              WHERE estimated_received_date IS NULL
                AND purchase_date IS NOT NULL';
  END IF;
END $$;

DROP INDEX IF EXISTS material_items_purchase_idx;
DROP INDEX IF EXISTS sub_con_items_purchase_idx;
DROP INDEX IF EXISTS others_items_purchase_idx;

ALTER TABLE material_items
  DROP COLUMN IF EXISTS po_number,
  DROP COLUMN IF EXISTS purchase_date;
ALTER TABLE sub_con_items
  DROP COLUMN IF EXISTS po_number,
  DROP COLUMN IF EXISTS purchase_date;
ALTER TABLE others_items
  DROP COLUMN IF EXISTS po_number,
  DROP COLUMN IF EXISTS purchase_date;

CREATE INDEX IF NOT EXISTS material_items_est_received_idx
  ON material_items (estimated_received_date);
CREATE INDEX IF NOT EXISTS sub_con_items_est_received_idx
  ON sub_con_items (estimated_received_date);
CREATE INDEX IF NOT EXISTS others_items_est_received_idx
  ON others_items (estimated_received_date);

UPDATE material_items
   SET estimated_received_date = CURRENT_DATE
 WHERE estimated_received_date IS NULL;
UPDATE sub_con_items
   SET estimated_received_date = CURRENT_DATE
 WHERE estimated_received_date IS NULL;
UPDATE others_items
   SET estimated_received_date = CURRENT_DATE
 WHERE estimated_received_date IS NULL;

ALTER TABLE material_items
  ALTER COLUMN estimated_received_date SET NOT NULL;
ALTER TABLE sub_con_items
  ALTER COLUMN estimated_received_date SET NOT NULL;
ALTER TABLE others_items
  ALTER COLUMN estimated_received_date SET NOT NULL;

DROP VIEW IF EXISTS v_material_asset_totals;

ALTER TABLE material_assets
  DROP COLUMN IF EXISTS po_number;
ALTER TABLE material_misc
  DROP COLUMN IF EXISTS po_number;

CREATE OR REPLACE VIEW v_material_asset_totals AS
SELECT
  project_id,
  0::numeric AS committed_amount,
  COALESCE(SUM(amount), 0) AS forecast_amount,
  COUNT(*) AS asset_count
FROM material_assets
GROUP BY project_id;
