import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

// Factory: builds a CRUD router for a project-level cost-item register
// (material_items, sub_con_items or others_items). These registers are planning
// inputs only; SAP import owns committed actuals/commitments.
export function makeLineItemRouter(table, entityType) {
  const r = Router();
  const supportsSubItems = entityType === 'material_item' || entityType === 'sub_con_item';

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
              u.full_name AS created_by_name,
              COALESCE(sub.sub_items, '[]'::jsonb) AS sub_items
         FROM ${table} it
         LEFT JOIN users u ON u.id = it.created_by
         LEFT JOIN LATERAL (
           SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', si.id,
                      'parent_entity_type', si.parent_entity_type,
                      'parent_id', si.parent_id,
                      'description', si.description,
                      'amount', si.amount,
                      'estimated_received_date', to_char(si.estimated_received_date, 'YYYY-MM-DD'),
                      'notes', si.notes,
                      'created_by', si.created_by,
                      'created_at', si.created_at,
                      'updated_at', si.updated_at
                    )
                    ORDER BY si.estimated_received_date NULLS LAST, si.id
                  ) AS sub_items
             FROM cost_item_sub_items si
            WHERE si.parent_entity_type = $2
              AND si.parent_id = it.id
         ) sub ON TRUE
        WHERE it.project_id = $1
        ORDER BY it.estimated_received_date DESC NULLS LAST, it.id DESC`,
      [project_id, entityType]
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
    const rowCount = await tx(async (c) => {
      await c.query(
        `DELETE FROM cost_item_sub_items WHERE parent_entity_type = $1 AND parent_id = $2`,
        [entityType, req.params.id]
      );
      const d = await c.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
      return d.rowCount;
    });
    if (!rowCount) return res.status(404).json({ error: 'item not found' });
    res.status(204).end();
  }));

  // POST /:id/sub-items  (create a related/sub-item under a register line)
  r.use('/:id/sub-items', (req, res, next) => {
    if (!supportsSubItems) return res.status(404).json({ error: 'sub-items are only available for Material and Sub-Con items' });
    next();
  });

  r.post('/:id/sub-items', ah(async (req, res) => {
    const b = req.body;
    requireFields(b, ['description']);
    const exists = await query(`SELECT 1 FROM ${table} WHERE id = $1`, [req.params.id]);
    if (!exists.rowCount) return res.status(404).json({ error: 'item not found' });
    const ins = await query(
      `INSERT INTO cost_item_sub_items
         (parent_entity_type, parent_id, description, amount, estimated_received_date, notes, created_by)
       VALUES ($1,$2,$3,COALESCE($4,0),$5,$6,$7)
       RETURNING id, parent_entity_type, parent_id, description, amount,
                 to_char(estimated_received_date, 'YYYY-MM-DD') AS estimated_received_date,
                 notes, created_by, created_at, updated_at`,
      [entityType, req.params.id, b.description, b.amount,
       b.estimated_received_date || null, b.notes || null, b.created_by || null]
    );
    res.status(201).json(ins.rows[0]);
  }));

  // PATCH /:id/sub-items/:subId
  r.patch('/:id/sub-items/:subId', ah(async (req, res) => {
    const editable = new Set(['description', 'amount', 'estimated_received_date', 'notes']);
    const sets = []; const vals = []; let i = 1;
    for (const [k, v] of Object.entries(req.body)) {
      if (editable.has(k)) {
        sets.push(`${k} = $${i++}`);
        vals.push(v === '' ? null : v);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
    sets.push(`updated_at = NOW()`);
    vals.push(entityType, req.params.id, req.params.subId);
    const upd = await query(
      `UPDATE cost_item_sub_items
          SET ${sets.join(', ')}
        WHERE parent_entity_type = $${i++}
          AND parent_id = $${i++}
          AND id = $${i}
        RETURNING id, parent_entity_type, parent_id, description, amount,
                  to_char(estimated_received_date, 'YYYY-MM-DD') AS estimated_received_date,
                  notes, created_by, created_at, updated_at`,
      vals
    );
    if (!upd.rows[0]) return res.status(404).json({ error: 'sub item not found' });
    res.json(upd.rows[0]);
  }));

  // DELETE /:id/sub-items/:subId
  r.delete('/:id/sub-items/:subId', ah(async (req, res) => {
    const d = await query(
      `DELETE FROM cost_item_sub_items
        WHERE parent_entity_type = $1
          AND parent_id = $2
          AND id = $3`,
      [entityType, req.params.id, req.params.subId]
    );
    if (!d.rowCount) return res.status(404).json({ error: 'sub item not found' });
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
