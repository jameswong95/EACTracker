import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields } from '../util.js';

// Fixed-rate admin table - Finance/Admin owned reference rates
// (mobilisation, freight, testing, etc.). Access is gated in the UI.
const r = Router();

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
