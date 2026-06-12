import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../util.js';

const r = Router();

r.get('/', ah(async (_req, res) => {
  const result = await query(`SELECT id, username, full_name, initials, role, is_active FROM users ORDER BY role, full_name`);
  res.json(result.rows);
}));

r.get('/:id', ah(async (req, res) => {
  const result = await query(`SELECT id, username, full_name, initials, role, is_active FROM users WHERE id = $1`, [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'user not found' });
  res.json(result.rows[0]);
}));

export default r;
