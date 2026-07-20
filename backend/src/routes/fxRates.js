import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, logAudit, requireFields } from '../util.js';
import { cleanText, parseSpreadsheetRows, spreadsheetNumber, spreadsheetUpload } from '../spreadsheetImport.js';

// Global FAD / FX rates - organisation-wide foreign-exchange rates to SGD,
// managed by Finance under Standards. rate_to_sgd = value in S$ of 1 unit of
// the currency. SGD is the base (1.0). FAD is settled (locked) by Finance;
// settlement state lives in app_settings (fad_settled_at / fad_settled_by).
const r = Router();

const FX_RATE_ALIASES = {
  currency: ['currency', 'curr', 'ccy', 'currency code'],
  rate_to_sgd: ['rate to sgd', 'rate to s$', 'rate_to_sgd', 'fad rate', 'fx rate', 'rate', 'sgd rate', 's$ rate'],
  notes: ['notes', 'note', 'remarks', 'remark'],
};

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

r.post('/import', spreadsheetUpload.single('file'), ah(async (req, res) => {
  const state = await settlement();
  if (state.settled_at) {
    return res.status(409).json({ error: 'FAD is settled - unsettle FAD before importing rates' });
  }

  const parsed = parseSpreadsheetRows(req.file, { aliases: FX_RATE_ALIASES });
  const rows = [];
  const errors = [];

  for (const row of parsed.rows) {
    const currency = String(cleanText(row.currency) || '').trim().toUpperCase();
    const rate = spreadsheetNumber(row.rate_to_sgd);
    const notes = cleanText(row.notes);
    if (!/^[A-Z]{2,4}$/.test(currency)) errors.push(`row ${row._rowNumber}: currency must be a 2-4 letter code`);
    if (rate == null || rate < 0) errors.push(`row ${row._rowNumber}: rate to SGD must be a non-negative number`);
    if (/^[A-Z]{2,4}$/.test(currency) && rate != null && rate >= 0) rows.push({ currency, rate, notes });
  }

  if (errors.length) {
    return res.status(400).json({
      error: errors.slice(0, 8).join('; '),
      errors: errors.slice(0, 25),
    });
  }
  if (!rows.length) return res.status(400).json({ error: 'no valid FAD rate rows found' });

  const summary = await tx(async (client) => {
    let created = 0;
    let updated = 0;
    const samples = [];

    for (const row of rows) {
      const before = await client.query(`SELECT * FROM fx_rates WHERE currency = $1`, [row.currency]);
      const result = await client.query(
        `INSERT INTO fx_rates (currency, rate_to_sgd, notes)
         VALUES ($1,$2,$3)
         ON CONFLICT (currency) DO UPDATE
           SET rate_to_sgd = EXCLUDED.rate_to_sgd,
               notes = EXCLUDED.notes,
               updated_at = NOW()
         RETURNING id, currency, rate_to_sgd, notes, updated_at`,
        [row.currency, row.rate, row.notes],
      );
      before.rows[0] ? updated++ : created++;
      samples.push(result.rows[0]);
    }

    await logAudit(client, {
      entity_type: 'fx_rates',
      entity_id: parsed.filename,
      action: 'import',
      new_value: JSON.stringify({ created, updated, total: rows.length }),
      user_id: req.user?.id,
    });

    return { filename: parsed.filename, total: rows.length, created, updated, samples: samples.slice(0, 5) };
  });

  res.status(201).json(summary);
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
