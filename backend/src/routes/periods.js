import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

const r = Router();

// GET /api/periods  (all locks, ordered)
r.get('/', ah(async (_req, res) => {
  const result = await query(`
    SELECT pl.*, u.full_name AS locked_by_name
    FROM period_locks pl
    LEFT JOIN users u ON u.id = pl.locked_by
    ORDER BY pl.period_year DESC, pl.period_month DESC`);
  res.json(result.rows);
}));

// PUT /api/periods/lock  body: { period_year, period_month, is_locked, locked_by }
r.put('/lock', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['period_year', 'period_month']);
  const isLocked = Boolean(b.is_locked);
  const result = await tx(async (c) => {
    const upd = await c.query(`
      INSERT INTO period_locks (period_year, period_month, is_locked, locked_by, locked_at)
      VALUES ($1,$2,$3,$4, CASE WHEN $3 THEN NOW() ELSE NULL END)
      ON CONFLICT (period_year, period_month)
      DO UPDATE SET is_locked = EXCLUDED.is_locked,
                    locked_by = EXCLUDED.locked_by,
                    locked_at = CASE WHEN EXCLUDED.is_locked THEN NOW() ELSE NULL END
      RETURNING *`,
      [b.period_year, b.period_month, isLocked, b.locked_by || null]);
    await logAudit(c, {
      entity_type: 'period', entity_id: `${b.period_year}-${b.period_month}`,
      action: isLocked ? 'lock' : 'unlock', user_id: b.locked_by
    });
    return upd.rows[0];
  });
  res.json(result);
}));

export default r;
