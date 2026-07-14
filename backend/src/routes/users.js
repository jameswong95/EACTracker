import { Router } from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { ah } from '../util.js';
import * as v from '../validation.js';

const r = Router();

function requireUserDirectory(req, res, next) {
  if (req.user || config.demoAuthEnabled) return next();
  return res.status(403).json({
    error: 'user directory requires authentication',
  });
}

r.get('/', requireUserDirectory, ah(async (_req, res) => {
  const result = await query(`SELECT id, username, full_name, initials, role, is_active FROM users ORDER BY role, full_name`);
  res.json(result.rows);
}));

r.get('/:id', requireUserDirectory, ah(async (req, res) => {
  const id = v.positiveInt(req.params.id);
  const result = await query(`SELECT id, username, full_name, initials, role, is_active FROM users WHERE id = $1`, [id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'user not found' });
  res.json(result.rows[0]);
}));

export default r;
