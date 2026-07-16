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
  'po_number', 'asset_type', 'expected_ship_date', 'actual_received_date',
  'ip_address', 'mac_address', 'version', 'equipment_description', 'equipment_status', 'remarks',
  'gr_status', 'amount', 'need_by', 'advance_pct', 'milestone_pct', 'retention_pct',
  'notes', 'created_by',
]);
const EDITABLE = new Set([
  'asset_tag', 'description', 'serial_no', 'location', 'vendor',
  'po_number', 'asset_type', 'expected_ship_date', 'actual_received_date',
  'ip_address', 'mac_address', 'version', 'equipment_description', 'equipment_status', 'remarks',
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
  if (!partial || has(body, 'po_number')) out.po_number = v.text(body.po_number, 'po_number', { max: 80 });
  if (!partial || has(body, 'asset_type')) out.asset_type = v.text(body.asset_type, 'asset_type', { max: 120 });
  if (!partial || has(body, 'expected_ship_date')) out.expected_ship_date = v.date(body.expected_ship_date, 'expected_ship_date');
  if (!partial || has(body, 'actual_received_date')) out.actual_received_date = v.date(body.actual_received_date, 'actual_received_date');
  if (!partial || has(body, 'ip_address')) out.ip_address = v.text(body.ip_address, 'ip_address', { max: 80 });
  if (!partial || has(body, 'mac_address')) out.mac_address = v.text(body.mac_address, 'mac_address', { max: 80 });
  if (!partial || has(body, 'version')) out.version = v.text(body.version, 'version', { max: 80 });
  if (!partial || has(body, 'equipment_description')) out.equipment_description = v.text(body.equipment_description, 'equipment_description', { max: 500 });
  if (!partial || has(body, 'equipment_status')) out.equipment_status = v.text(body.equipment_status, 'equipment_status', { max: 120 });
  if (!partial || has(body, 'remarks')) out.remarks = v.text(body.remarks, 'remarks', { max: 1000 });
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

function handleAssetDbError(err) {
  if (err?.code === '23505' && String(err.constraint || '').includes('material_assets_serial_unique')) {
    err.status = 409;
    err.message = 'serial number must be unique';
  }
  if (err?.code === '42703' && /(ip_address|mac_address|version|equipment_description|equipment_status|remarks)/i.test(err.message || '')) {
    err.status = 503;
    err.message = 'database migration migrate-020-material-asset-equipment.sql has not been applied';
  }
  throw err;
}

// GET /api/material-assets?project_id=...  -> { assets, totals }
r.get('/', ah(async (req, res) => {
  const project_id = v.projectId(req.query.project_id);
  const [assets, totals, schedule] = await Promise.all([
    query(
      `SELECT a.*, to_char(a.need_by, 'YYYY-MM-DD') AS need_by,
              to_char(a.expected_ship_date, 'YYYY-MM-DD') AS expected_ship_date,
              to_char(a.actual_received_date, 'YYYY-MM-DD') AS actual_received_date,
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
          po_number, asset_type, expected_ship_date, actual_received_date,
          ip_address, mac_address, version, equipment_description, equipment_status, remarks,
          gr_status, amount, need_by, advance_pct, milestone_pct, retention_pct, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,COALESCE($17,'not_ordered'),COALESCE($18,0),$19,
               COALESCE($20,0),COALESCE($21,0),COALESCE($22,0),$23,$24)
       RETURNING *`,
      [b.project_id, b.asset_tag || null, b.description, b.serial_no || null, b.location || null,
       b.vendor || null, b.po_number || null, b.asset_type || null, b.expected_ship_date, b.actual_received_date,
       b.ip_address || null, b.mac_address || null, b.version || null, b.equipment_description || null, b.equipment_status || null, b.remarks || null,
       b.gr_status, b.amount, b.need_by,
       b.advance_pct, b.milestone_pct, b.retention_pct, b.notes, b.created_by]);
    await logAudit(c, { entity_type: 'material_asset', entity_id: ins.rows[0].id, action: 'create' });
    return ins.rows[0];
  }).catch(handleAssetDbError);
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
  const upd = await query(`UPDATE material_assets SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals)
    .catch(handleAssetDbError);
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
