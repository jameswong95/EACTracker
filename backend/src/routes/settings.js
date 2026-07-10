import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../util.js';

// Global app settings (key/value). Finance/Admin owned; access gated in the UI.
// Currently: material_asset_threshold - the dollar line above which a material
// item is tracked individually as an asset, and below which it belongs in the
// Misc materials list.
const r = Router();

// GET /api/settings            -> { key: value, ... }
// GET /api/settings/:key       -> { key, value }
r.get('/', ah(async (_req, res) => {
  const rows = (await query(`SELECT key, value FROM app_settings`)).rows;
  const out = {};
  for (const row of rows) out[row.key] = row.value;
  res.json(out);
}));

r.get('/:key', ah(async (req, res) => {
  const row = (await query(`SELECT key, value FROM app_settings WHERE key = $1`, [req.params.key])).rows[0];
  if (!row) return res.status(404).json({ error: 'setting not found' });
  res.json(row);
}));

// PUT /api/settings/:key  { value, user_id }  -> upserts
r.put('/:key', ah(async (req, res) => {
  const value = req.body.value;
  if (value == null || String(value).trim() === '') return res.status(400).json({ error: 'value required' });
  const up = await query(
    `INSERT INTO app_settings (key, value, updated_by)
     VALUES ($1,$2,$3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by
     RETURNING key, value`,
    [req.params.key, String(value), req.body.user_id || null]);
  res.json(up.rows[0]);
}));

export default r;
