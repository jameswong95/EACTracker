import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields } from '../util.js';

// Global FAD / FX rates - organisation-wide foreign-exchange rates to SGD,
// managed by Finance under Standards. rate_to_sgd = value in S$ of 1 unit of
// the currency. SGD is the base (1.0). FAD is settled (locked) by Finance;
// settlement state lives in app_settings (fad_settled_at / fad_settled_by).
const r = Router();

async function settlement() {
  const rows = (await query(
    `SELECT key, value FROM app_settings WHERE key IN ('fad_settled_at','fad_settled_by')`
  )).rows;
  const map = {};
  for (const row of rows) map[row.key] = row.value;
  return { settled_at: map.fad_settled_at || null, settled_by: map.fad_settled_by || null };
}

// GET /api/fx-rates  -> { rows, settlement }
r.get('/', ah(async (_req, res) => {
  const rows = (await query(
    `SELECT id, currency, rate_to_sgd, notes, updated_at FROM fx_rates ORDER BY currency`
  )).rows;
  res.json({ rows, settlement: await settlement() });
}));

// POST /api/fx-rates  { currency, rate_to_sgd, notes }
r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['currency']);
  const currency = String(b.currency).trim().toUpperCase();
  if (!currency) return res.status(400).json({ error: 'currency required' });
  try {
    const ins = await query(
      `INSERT INTO fx_rates (currency, rate_to_sgd, notes)
       VALUES ($1,$2,$3) RETURNING *`,
      [currency, Number(b.rate_to_sgd) || 0, b.notes || null]
    );
    res.status(201).json(ins.rows[0]);
  } catch (e) {
    if (e && e.code === '23505') { e.status = 409; e.message = `Currency "${currency}" already exists`; }
    throw e;
  }
}));

// PATCH /api/fx-rates/:id  { rate_to_sgd, notes, currency }
r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['rate_to_sgd', 'notes', 'currency']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (!editable.has(k)) continue;
    const val = k === 'currency' ? String(v).trim().toUpperCase() : v;
    sets.push(`${k} = $${i++}`); vals.push(val);
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push('updated_at = NOW()');
  vals.push(req.params.id);
  const upd = await query(`UPDATE fx_rates SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'rate not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/fx-rates/:id
r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM fx_rates WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'rate not found' });
  res.status(204).end();
}));

// POST /api/fx-rates/settle  { settled: bool, user_id }
r.post('/settle', ah(async (req, res) => {
  const settled = !!req.body.settled;
  if (settled) {
    await query(
      `INSERT INTO app_settings (key, value, updated_by) VALUES ('fad_settled_at', $1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
      [new Date().toISOString(), req.body.user_id || null]
    );
    await query(
      `INSERT INTO app_settings (key, value, updated_by) VALUES ('fad_settled_by', $1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
      [String(req.body.user_id || ''), req.body.user_id || null]
    );
  } else {
    await query(`DELETE FROM app_settings WHERE key IN ('fad_settled_at','fad_settled_by')`);
  }
  res.json(await settlement());
}));

export default r;
