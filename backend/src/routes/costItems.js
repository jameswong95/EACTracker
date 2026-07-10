import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

// A PO number must be unique across the whole application (both material_items
// and sub_con_items). Comparison is case-insensitive and trims whitespace;
// blank/NULL PO numbers are allowed. The database also enforces this via unique
// indexes + a cross-table trigger (migrate-006); these helpers surface a clean
// 409 message instead of a raw DB error.
const PO_TABLES = ['material_items', 'sub_con_items'];

async function assertPoAvailable(poNumber, currentTable, currentId) {
  const po = (poNumber ?? '').toString().trim();
  if (!po) return;
  for (const t of PO_TABLES) {
    const excl = (t === currentTable && currentId != null) ? ' AND id <> $2' : '';
    const params = excl ? [po, currentId] : [po];
    const found = await query(
      `SELECT 1 FROM ${t} WHERE lower(btrim(po_number)) = lower(btrim($1))${excl} LIMIT 1`,
      params
    );
    if (found.rowCount) {
      const e = new Error(`PO number "${po}" is already in use`);
      e.status = 409;
      throw e;
    }
  }
}

// Translate a DB unique-violation (race condition safety net) into a 409.
function translatePoError(e, poNumber) {
  if (e && e.status) return e;
  if (e && (e.code === '23505' || /already exists/i.test(e.message || ''))) {
    const po = (poNumber ?? '').toString().trim();
    const err = new Error(po ? `PO number "${po}" is already in use` : 'PO number is already in use');
    err.status = 409;
    return err;
  }
  return e;
}

// Factory: builds a CRUD router for a project-level cost-item register
// (material_items or sub_con_items). Both share an identical shape: a PO number,
// a description, an amount and an optional purchase_date. A purchase_date makes
// the item Committed; without one it is treated as ETC (Forecast).
export function makeLineItemRouter(table, entityType) {
  const r = Router();

  // GET /?project_id=...  → all items for a project
  r.get('/', ah(async (req, res) => {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id required' });
    }
    const result = await query(
      `SELECT it.id, it.project_id, it.sub_job_id, it.po_number, it.description,
              it.amount, to_char(it.purchase_date, 'YYYY-MM-DD') AS purchase_date,
              it.notes, it.created_by, it.created_at, it.updated_at,
              u.full_name AS created_by_name
         FROM ${table} it
         LEFT JOIN users u ON u.id = it.created_by
        WHERE it.project_id = $1
        ORDER BY it.purchase_date DESC NULLS LAST, it.id DESC`,
      [project_id]
    );
    res.json(result.rows);
  }));

  // POST /  (create a line item)
  r.post('/', ah(async (req, res) => {
    const b = req.body;
    requireFields(b, ['project_id', 'description']);
    await assertPoAvailable(b.po_number, table, null);
    try {
      const result = await tx(async (c) => {
        const ins = await c.query(
          `INSERT INTO ${table}
             (project_id, po_number, description, amount, purchase_date, notes, created_by)
           VALUES ($1,$2,$3,COALESCE($4,0),$5,$6,$7)
           RETURNING *`,
          [b.project_id, b.po_number || null, b.description, b.amount,
           b.purchase_date || null, b.notes || null, b.created_by || null]
        );
        await logAudit(c, { entity_type: entityType, entity_id: ins.rows[0].id, action: 'create' });
        return ins.rows[0];
      });
      res.status(201).json(result);
    } catch (e) {
      throw translatePoError(e, b.po_number);
    }
  }));

  // PATCH /:id
  r.patch('/:id', ah(async (req, res) => {
    const editable = new Set([
      'po_number', 'description', 'amount', 'purchase_date', 'notes',
    ]);
    if (Object.prototype.hasOwnProperty.call(req.body, 'po_number')) {
      await assertPoAvailable(req.body.po_number, table, req.params.id);
    }
    const sets = []; const vals = []; let i = 1;
    for (const [k, v] of Object.entries(req.body)) {
      if (editable.has(k)) {
        const val = (k === 'po_number' && typeof v === 'string' && v.trim() === '') ? null : v;
        sets.push(`${k} = $${i++}`); vals.push(val);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
    sets.push(`updated_at = NOW()`);
    vals.push(req.params.id);
    let upd;
    try {
      upd = await query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    } catch (e) {
      throw translatePoError(e, req.body.po_number);
    }
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
