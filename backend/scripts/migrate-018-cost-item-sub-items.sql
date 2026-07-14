-- migrate-018-cost-item-sub-items.sql
-- Adds related/sub-items under Material and Sub-Con register line items.

CREATE TABLE IF NOT EXISTS cost_item_sub_items (
  id                      SERIAL PRIMARY KEY,
  parent_entity_type      TEXT NOT NULL CHECK (parent_entity_type IN ('material_item', 'sub_con_item')),
  parent_id               INT NOT NULL,
  description             TEXT NOT NULL,
  amount                  NUMERIC(18,2) NOT NULL DEFAULT 0,
  estimated_received_date DATE,
  notes                   TEXT,
  created_by              INT REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cost_item_sub_items_parent_idx
  ON cost_item_sub_items (parent_entity_type, parent_id);
