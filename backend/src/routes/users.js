import { Router } from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { ah } from '../util.js';
import * as v from '../validation.js';

const r = Router();
const ROLES = ['Project Manager', 'Project Director', 'Finance', 'Admin', 'Leader'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialsFor(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'U';
}

function userPayload(body) {
  v.ensureObject(body);
  v.validateNoUnknown(body, new Set(['email', 'username', 'display_name', 'full_name', 'role', 'is_active']));
  const email = String(v.text(body.email || body.username, 'email', { required: true, max: 254 }) || '').toLowerCase();
  if (!EMAIL_RE.test(email)) {
    const err = new Error('email must be a valid email address');
    err.status = 400;
    throw err;
  }
  const fullName = v.text(body.display_name || body.full_name, 'display_name', { required: true, max: 160 });
  const role = v.oneOf(body.role, 'role', ROLES, { required: true });
  const isActive = body.is_active == null ? true : Boolean(body.is_active);
  return {
    username: email,
    full_name: fullName,
    initials: initialsFor(fullName),
    role,
    is_active: isActive,
  };
}

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

r.post('/', ah(async (req, res) => {
  const user = userPayload(req.body);
  const result = await query(
    `INSERT INTO users (username, full_name, initials, role, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username) DO UPDATE
     SET full_name = EXCLUDED.full_name,
         initials = EXCLUDED.initials,
         role = EXCLUDED.role,
         is_active = EXCLUDED.is_active
     RETURNING id, username, full_name, initials, role, is_active`,
    [user.username, user.full_name, user.initials, user.role, user.is_active],
  );
  res.status(201).json(result.rows[0]);
}));

r.put('/:id', ah(async (req, res) => {
  const id = v.positiveInt(req.params.id);
  const user = userPayload(req.body);
  const result = await query(
    `UPDATE users
     SET username = $2,
         full_name = $3,
         initials = $4,
         role = $5,
         is_active = $6
     WHERE id = $1
     RETURNING id, username, full_name, initials, role, is_active`,
    [id, user.username, user.full_name, user.initials, user.role, user.is_active],
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'user not found' });
  res.json(result.rows[0]);
}));

export default r;
