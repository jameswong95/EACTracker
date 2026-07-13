import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

// Factory: builds a CRUD router for a project-level cost-item register
// (material_items, sub_con_items or others_items). These registers are planning
// inputs only; SAP import owns committed actuals/commitments.
export function makeLineItemRouter(table, entityType) {
  const r = Router();

  // GET /?project_id=...  → all items for a project
  r.get('/', ah(async (req, res) => {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id required' });
    }
    const result = await query(
      `SELECT it.id, it.project_id, it.sub_job_id, it.description,
              it.amount,
              to_char(it.estimated_received_date, 'YYYY-MM-DD') AS estimated_received_date,
              it.notes, it.created_by, it.created_at, it.updated_at,
              u.full_name AS created_by_name
         FROM ${table} it
         LEFT JOIN users u ON u.id = it.created_by
        WHERE it.project_id = $1
        ORDER BY it.estimated_received_date DESC NULLS LAST, it.id DESC`,
      [project_id]
    );
    res.json(result.rows);
  }));

  // POST /  (create a line item)
  r.post('/', ah(async (req, res) => {
    const b = req.body;
    requireFields(b, ['project_id', 'description', 'estimated_received_date']);
    const result = await tx(async (c) => {
      const ins = await c.query(
        `INSERT INTO ${table}
           (project_id, description, amount, estimated_received_date, notes, created_by)
         VALUES ($1,$2,COALESCE($3,0),$4,$5,$6)
         RETURNING *`,
        [b.project_id, b.description, b.amount,
         b.estimated_received_date || null, b.notes || null, b.created_by || null]
      );
      await logAudit(c, { entity_type: entityType, entity_id: ins.rows[0].id, action: 'create' });
      return ins.rows[0];
    });
    res.status(201).json(result);
  }));

  // PATCH /:id
  r.patch('/:id', ah(async (req, res) => {
    const editable = new Set([
      'description', 'amount', 'estimated_received_date', 'notes',
    ]);
    const sets = []; const vals = []; let i = 1;
    for (const [k, v] of Object.entries(req.body)) {
      if (editable.has(k)) {
        if (k === 'estimated_received_date' && !v) {
          return res.status(400).json({ error: 'estimated_received_date is required' });
        }
        sets.push(`${k} = $${i++}`); vals.push(v);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
    sets.push(`updated_at = NOW()`);
    vals.push(req.params.id);
    const upd = await query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (!upd.rows[0]) return res.status(404).json({ error: 'item not found' });
    res.json(upd.rows[0]);
  }));

  // DELETE /:id
  r.delete('/:id', ah(async (req, res) => {
    const d = await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
    if (!d.rowCount) return res.status(404).json({ error: 'item not found' });
    res.status(204).end();
  }));

  // GET /schedule?project_id=...  → monthly timeline rows for every line item
  // in this register for the project. Rows: { entity_id, year, month, amount }.
  r.get('/schedule', ah(async (req, res) => {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });
    const result = await query(
      `SELECT s.entity_id, s.year, s.month, s.amount
         FROM cost_item_schedule s
         JOIN ${table} it ON it.id = s.entity_id
        WHERE s.entity_type = $1 AND it.project_id = $2
        ORDER BY s.entity_id, s.year, s.month`,
      [entityType, project_id]
    );
    res.json(result.rows);
  }));

  // PUT /:id/schedule  { year, month, amount }  → upsert a single month cell.
  // amount 0 (or missing) deletes the cell.
  r.put('/:id/schedule', ah(async (req, res) => {
    const entityId = Number(req.params.id);
    const year = Number(req.body.year);
    const month = Number(req.body.month);
    const amount = Number(req.body.amount) || 0;
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'valid year and month (1-12) required' });
    }
    const exists = await query(`SELECT 1 FROM ${table} WHERE id = $1`, [entityId]);
    if (!exists.rowCount) return res.status(404).json({ error: 'item not found' });
    if (amount === 0) {
      await query(
        `DELETE FROM cost_item_schedule
          WHERE entity_type = $1 AND entity_id = $2 AND year = $3 AND month = $4`,
        [entityType, entityId, year, month]
      );
      return res.json({ entity_id: entityId, year, month, amount: 0 });
    }
    const upd = await query(
      `INSERT INTO cost_item_schedule (entity_type, entity_id, year, month, amount)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (entity_type, entity_id, year, month)
       DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
       RETURNING entity_id, year, month, amount`,
      [entityType, entityId, year, month, amount]
    );
    res.json(upd.rows[0]);
  }));

  return r;
}

export const materialsRouter = makeLineItemRouter('material_items', 'material_item');
export const subConRouter    = makeLineItemRouter('sub_con_items', 'sub_con_item');
export const othersRouter    = makeLineItemRouter('others_items', 'others_item');
