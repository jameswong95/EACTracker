import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../util.js';

const r = Router();

// GET /api/audit?entity_type=project&entity_id=PR-2025-014&limit=100
r.get('/', ah(async (req, res) => {
  const filters = []; const vals = []; let i = 1;
  if (req.query.entity_type) { filters.push(`a.entity_type = $${i++}`); vals.push(req.query.entity_type); }
  if (req.query.entity_id)   { filters.push(`a.entity_id = $${i++}`);   vals.push(req.query.entity_id); }
  if (req.query.action)      { filters.push(`a.action = $${i++}`);      vals.push(req.query.action); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const result = await query(`
    SELECT a.*, u.full_name AS user_name, u.role AS user_role
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.user_id
    ${where}
    ORDER BY a.occurred_at DESC
    LIMIT ${limit}`, vals);
  res.json(result.rows);
}));

export default r;
