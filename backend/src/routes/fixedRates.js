import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, logAudit, requireFields } from '../util.js';
import { cleanText, parseSpreadsheetRows, spreadsheetNumber, spreadsheetUpload } from '../spreadsheetImport.js';

// Fixed-rate admin table - Finance/Admin owned reference rates
// (mobilisation, freight, testing, etc.). Access is gated in the UI.
const r = Router();

const FIXED_RATE_ALIASES = {
  code: ['code', 'asset code', 'item code', 'rate code'],
  label: ['label', 'description', 'asset', 'asset rate', 'item description', 'name'],
  unit: ['unit', 'uom', 'unit of measure'],
  rate: ['rate', 'rate sgd', 'rate (sgd)', 'rate s$', 'rate (s$)', 'unit rate', 'unit rate sgd', 'unit rate s$', 'sgd'],
  notes: ['notes', 'note', 'remarks', 'remark'],
};

function validateImportRows(parsed) {
  const rows = [];
  const errors = [];
  for (const row of parsed.rows) {
    const label = cleanText(row.label);
    const rate = spreadsheetNumber(row.rate);
    const code = cleanText(row.code);
    const unit = cleanText(row.unit) || 'each';
    const notes = cleanText(row.notes);

    if (!label) errors.push(`row ${row._rowNumber}: description is required`);
    if (rate == null || rate < 0) errors.push(`row ${row._rowNumber}: rate must be a non-negative number`);
    if (label && rate != null && rate >= 0) rows.push({ rowNumber: row._rowNumber, code, label, unit, rate, notes });
  }
  return { rows, errors };
}

r.get('/', ah(async (_req, res) => {
  const result = await query(`SELECT * FROM fixed_rates ORDER BY label`);
  res.json(result.rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['label']);
  const ins = await query(
    `INSERT INTO fixed_rates (code, label, unit, rate, notes)
     VALUES ($1,$2,COALESCE($3,'each'),COALESCE($4,0),$5) RETURNING *`,
    [b.code || null, b.label, b.unit, b.rate, b.notes || null]);
  res.status(201).json(ins.rows[0]);
}));

r.post('/import', spreadsheetUpload.single('file'), ah(async (req, res) => {
  const parsed = parseSpreadsheetRows(req.file, { aliases: FIXED_RATE_ALIASES });
  const { rows, errors } = validateImportRows(parsed);
  if (errors.length) {
    return res.status(400).json({
      error: errors.slice(0, 8).join('; '),
      errors: errors.slice(0, 25),
    });
  }
  if (!rows.length) return res.status(400).json({ error: 'no valid asset rate rows found' });

  const summary = await tx(async (client) => {
    let created = 0;
    let updated = 0;
    const samples = [];

    for (const row of rows) {
      const existing = row.code
        ? await client.query(`SELECT * FROM fixed_rates WHERE LOWER(code) = LOWER($1) LIMIT 1`, [row.code])
        : await client.query(`SELECT * FROM fixed_rates WHERE LOWER(label) = LOWER($1) LIMIT 1`, [row.label]);

      if (existing.rows[0]) {
        const before = existing.rows[0];
        const result = await client.query(
          `UPDATE fixed_rates
           SET code = $1, label = $2, unit = $3, rate = $4, notes = $5, updated_at = NOW()
           WHERE id = $6
           RETURNING *`,
          [row.code, row.label, row.unit, row.rate, row.notes, before.id],
        );
        updated++;
        samples.push(result.rows[0]);
      } else {
        const result = await client.query(
          `INSERT INTO fixed_rates (code, label, unit, rate, notes)
           VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [row.code, row.label, row.unit, row.rate, row.notes],
        );
        created++;
        samples.push(result.rows[0]);
      }
    }

    await logAudit(client, {
      entity_type: 'fixed_rates',
      entity_id: parsed.filename,
      action: 'import',
      new_value: JSON.stringify({ created, updated, total: rows.length }),
      user_id: req.user?.id,
    });

    return { filename: parsed.filename, total: rows.length, created, updated, samples: samples.slice(0, 5) };
  });

  res.status(201).json(summary);
}));

r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['code', 'label', 'unit', 'rate', 'notes']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);
  const upd = await query(`UPDATE fixed_rates SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'rate not found' });
  res.json(upd.rows[0]);
}));

r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM fixed_rates WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'rate not found' });
  res.status(204).end();
}));

export default r;
