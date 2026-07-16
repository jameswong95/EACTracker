-- migrate-006-po-unique.sql
-- Historical compatibility migration.
--
-- Older PFMS builds briefly enforced PO numbers as globally unique across
-- material/sub-con registers. The current procurement model allows multiple
-- line items under the same PO number, so this migration must not create a
-- unique PO index. Keep it as a cleanup/no-op so existing migration sequences
-- can run safely on databases that already contain repeated PO lines.

DROP TRIGGER IF EXISTS material_items_po_cross ON material_items;
DROP TRIGGER IF EXISTS sub_con_items_po_cross ON sub_con_items;
DROP FUNCTION IF EXISTS check_po_unique_cross();

DROP INDEX IF EXISTS material_items_po_unique;
DROP INDEX IF EXISTS sub_con_items_po_unique;
