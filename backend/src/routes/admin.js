import { Router } from 'express';
import { tx } from '../db.js';
import { ah } from '../util.js';

const r = Router();

const WIPE_CONFIRMATION = 'delete';

const WIPE_TABLES = [
  'cost_item_sub_items',
  'cost_item_schedule',
  'material_asset_schedule',
  'tender_labour_allocations',
  'tender_labour_range',
  'tender_labour_years',
  'tender_labour_functions',
  'tender_labour_phases',
  'tender_prelim_items',
  'tender_fx_rates',
  'tender_vos',
  'tender_items',
  'tenders',
  'sap_import_rows',
  'sap_imports',
  'project_initiation_items',
  'resource_requests',
  'material_misc',
  'material_assets',
  'material_items',
  'sub_con_items',
  'others_items',
  'fixed_rates',
  'fx_rates',
  'app_settings',
  'sub_job_planned_items',
  'period_locks',
  'pd_approvals',
  'revrec_entries',
  'eac_monthly_values',
  'eac_monthly_rows',
  'project_resources',
  'project_updates',
  'risks',
  'milestones',
  'sub_jobs',
  'project_pm_assignments',
  'projects',
  'audit_log',
];

function quoteIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

r.post('/wipe-data', ah(async (req, res) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'admin role required' });
  }

  if (String(req.body?.confirmation || '').trim() !== WIPE_CONFIRMATION) {
    return res.status(400).json({ error: 'confirmation must be delete' });
  }

  const result = await tx(async client => {
    const existing = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         AND table_name = ANY($1::text[])`,
      [WIPE_TABLES],
    );

    const tables = existing.rows.map(row => row.table_name);
    if (tables.length) {
      await client.query(`TRUNCATE TABLE ${tables.map(quoteIdent).join(', ')} RESTART IDENTITY CASCADE`);
    }

    await client.query(
      `INSERT INTO audit_log (entity_type, entity_id, action, user_id)
       VALUES ('system', 'wipe-data', 'Wipe all application data', $1)`,
      [req.user?.id || null],
    );

    return { tables };
  });

  res.json({
    ok: true,
    wipedTables: result.tables,
    wipedTableCount: result.tables.length,
  });
}));

export default r;
