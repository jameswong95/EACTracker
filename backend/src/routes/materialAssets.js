import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, logAudit } from '../util.js';
import * as v from '../validation.js';

// Material Asset List - a live document per project.
// SAP import owns committed costs; asset rows are local planning/forecast only.
// Each asset can carry a vendor payment structure (advance/milestone/retention %)
// and a timeline dollar-planning schedule (planned cash per month).
const r = Router();

const GR_STATUS_VALUES = ['not_ordered', 'ordered', 'partial', 'received'];
const ASSET_FIELDS = new Set([
  'project_id', 'asset_tag', 'description', 'serial_no', 'location', 'vendor',
  'gr_status', 'amount', 'need_by', 'advance_pct', 'milestone_pct', 'retention_pct',
  'notes', 'created_by',
]);
const EDITABLE = new Set([
  'asset_tag', 'description', 'serial_no', 'location', 'vendor',
  'gr_status', 'amount', 'need_by', 'advance_pct', 'milestone_pct', 'retention_pct', 'notes',
]);

function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function cleanAsset(body, { partial = false } = {}) {
  v.ensureObject(body);
  v.validateNoUnknown(body, partial ? EDITABLE : ASSET_FIELDS);
  const out = {};
  if (!partial || has(body, 'project_id')) out.project_id = v.projectId(body.project_id);
  if (!partial || has(body, 'asset_tag')) out.asset_tag = v.text(body.asset_tag, 'asset_tag', { max: 80 });
  if (!partial || has(body, 'description')) out.description = v.text(body.description, 'description', { required: true, max: 300 });
  if (!partial || has(body, 'serial_no')) out.serial_no = v.text(body.serial_no, 'serial_no', { max: 120 });
  if (!partial || has(body, 'location')) out.location = v.text(body.location, 'location', { max: 160 });
  if (!partial || has(body, 'vendor')) out.vendor = v.text(body.vendor, 'vendor', { max: 160 });
  if (!partial || has(body, 'gr_status')) out.gr_status = v.oneOf(body.gr_status, 'gr_status', GR_STATUS_VALUES) || 'not_ordered';
  if (!partial || has(body, 'amount')) out.amount = v.number(body.amount, 'amount', { min: 0 }) ?? 0;
  if (!partial || has(body, 'need_by')) out.need_by = v.date(body.need_by, 'need_by');
  if (!partial || has(body, 'advance_pct')) out.advance_pct = v.number(body.advance_pct, 'advance_pct', { min: 0, max: 100 }) ?? 0;
  if (!partial || has(body, 'milestone_pct')) out.milestone_pct = v.number(body.milestone_pct, 'milestone_pct', { min: 0, max: 100 }) ?? 0;
  if (!partial || has(body, 'retention_pct')) out.retention_pct = v.number(body.retention_pct, 'retention_pct', { min: 0, max: 100 }) ?? 0;
  if (!partial || has(body, 'notes')) out.notes = v.text(body.notes, 'notes', { max: 1000 });
  if (!partial || has(body, 'created_by')) out.created_by = v.userId(body.created_by, 'created_by');
  return out;
}

// GET /api/material-assets?project_id=...  -> { assets, totals }
r.get('/', ah(async (req, res) => {
  const project_id = v.projectId(req.query.project_id);
  const [assets, totals, schedule] = await Promise.all([
    query(
      `SELECT a.*, to_char(a.need_by, 'YYYY-MM-DD') AS need_by,
              u.full_name AS created_by_name
         FROM material_assets a
         LEFT JOIN users u ON u.id = a.created_by
        WHERE a.project_id = $1
        ORDER BY a.id`, [project_id]),
    query(`SELECT * FROM v_material_asset_totals WHERE project_id = $1`, [project_id]),
    query(
      `SELECT s.* FROM material_asset_schedule s
         JOIN material_assets a ON a.id = s.asset_id
        WHERE a.project_id = $1
        ORDER BY s.year, s.month`, [project_id]),
  ]);
  res.json({
    assets: assets.rows,
    schedule: schedule.rows,
    totals: totals.rows[0] || { project_id, committed_amount: 0, forecast_amount: 0, asset_count: 0 },
  });
}));

// POST /api/material-assets
r.post('/', ah(async (req, res) => {
  const b = cleanAsset(req.body);
  const result = await tx(async (c) => {
    const ins = await c.query(
      `INSERT INTO material_assets
         (project_id, asset_tag, description, serial_no, location, vendor,
          gr_status, amount, need_by, advance_pct, milestone_pct, retention_pct, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'not_ordered'),COALESCE($8,0),$9,
               COALESCE($10,0),COALESCE($11,0),COALESCE($12,0),$13,$14)
       RETURNING *`,
      [b.project_id, b.asset_tag || null, b.description, b.serial_no || null, b.location || null,
       b.vendor || null, b.gr_status, b.amount, b.need_by,
       b.advance_pct, b.milestone_pct, b.retention_pct, b.notes, b.created_by]);
    await logAudit(c, { entity_type: 'material_asset', entity_id: ins.rows[0].id, action: 'create' });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/material-assets/:id
r.patch('/:id', ah(async (req, res) => {
  const id = v.positiveInt(req.params.id);
  const b = cleanAsset(req.body, { partial: true });
  const sets = []; const vals = []; let i = 1;
  for (const [k, value] of Object.entries(b)) {
    sets.push(`${k} = $${i++}`); vals.push(value);
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(id);
  const upd = await query(`UPDATE material_assets SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'asset not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/material-assets/:id
r.delete('/:id', ah(async (req, res) => {
  const id = v.positiveInt(req.params.id);
  const d = await query(`DELETE FROM material_assets WHERE id = $1`, [id]);
  if (!d.rowCount) return res.status(404).json({ error: 'asset not found' });
  res.status(204).end();
}));

// PUT /api/material-assets/:id/schedule  -> { year, month, amount }
// Upserts a single timeline cell (amount 0 deletes it).
r.put('/:id/schedule', ah(async (req, res) => {
  const id = v.positiveInt(req.params.id);
  const body = v.ensureObject(req.body);
  v.validateNoUnknown(body, new Set(['year', 'month', 'amount']));
  const year = v.year(body.year, 'year', { required: true });
  const month = v.month(body.month, 'month', { required: true });
  const amount = v.number(body.amount, 'amount', { min: 0 }) ?? 0;
  if (amount === 0) {
    await query(`DELETE FROM material_asset_schedule WHERE asset_id = $1 AND year = $2 AND month = $3`,
      [id, year, month]);
    return res.json({ asset_id: id, year, month, amount: 0 });
  }
  const up = await query(
    `INSERT INTO material_asset_schedule (asset_id, year, month, amount)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (asset_id, year, month) DO UPDATE SET amount = EXCLUDED.amount
     RETURNING *`,
    [id, year, month, amount]);
  res.json(up.rows[0]);
}));

export default r;
