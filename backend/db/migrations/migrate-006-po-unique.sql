-- migrate-006-po-unique.sql
-- Enforce that a PO number is unique across the whole application:
--   * unique within material_items
--   * unique within sub_con_items
--   * unique across the two tables (a PO used for a material cannot be reused
--     for a sub-con line and vice versa)
-- Comparison is case-insensitive and ignores surrounding whitespace.
-- NULL or blank PO numbers are allowed and not subject to the constraint.

-- 1. Within-table uniqueness (functional partial unique indexes)
CREATE UNIQUE INDEX IF NOT EXISTS material_items_po_unique
  ON material_items (lower(btrim(po_number)))
  WHERE po_number IS NOT NULL AND btrim(po_number) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS sub_con_items_po_unique
  ON sub_con_items (lower(btrim(po_number)))
  WHERE po_number IS NOT NULL AND btrim(po_number) <> '';

-- 2. Cross-table uniqueness (trigger checks the sibling table)
CREATE OR REPLACE FUNCTION check_po_unique_cross() RETURNS trigger AS $$
DECLARE
  other_table text;
  conflict    int;
BEGIN
  IF NEW.po_number IS NULL OR btrim(NEW.po_number) = '' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'material_items' THEN
    other_table := 'sub_con_items';
  ELSE
    other_table := 'material_items';
  END IF;

  EXECUTE format(
    'SELECT 1 FROM %I WHERE lower(btrim(po_number)) = lower(btrim($1)) LIMIT 1',
    other_table
  ) INTO conflict USING NEW.po_number;

  IF conflict IS NOT NULL THEN
    RAISE EXCEPTION 'PO number % already exists', NEW.po_number
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS material_items_po_cross ON material_items;
CREATE TRIGGER material_items_po_cross
  BEFORE INSERT OR UPDATE OF po_number ON material_items
  FOR EACH ROW EXECUTE FUNCTION check_po_unique_cross();

DROP TRIGGER IF EXISTS sub_con_items_po_cross ON sub_con_items;
CREATE TRIGGER sub_con_items_po_cross
  BEFORE INSERT OR UPDATE OF po_number ON sub_con_items
  FOR EACH ROW EXECUTE FUNCTION check_po_unique_cross();
