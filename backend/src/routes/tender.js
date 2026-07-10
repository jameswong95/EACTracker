import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields, logAudit } from '../util.js';

const r = Router();

// GET /api/tender  -> standalone pre-award tender list.
// Tenders are opportunities. They only point at a project after initiation.
r.get('/', ah(async (req, res) => {
  const { user_id, role } = req.query;
  const params = [];
  let where = '';
  if (user_id && (role === 'Project Manager' || role === 'Project Director')) {
    params.push(user_id);
    where = `WHERE t.pm_user_id = $1 OR t.pd_user_id = $1`;
  }
  const rows = (await query(`
    SELECT
      t.project_id                      AS project_id,
      p.name                            AS project_name,
      p.status                          AS project_status,
      COALESCE(t.pm_user_id, p.pm_user_id) AS pm_user_id,
      COALESCE(t.pd_user_id, p.pd_user_id) AS pd_user_id,
      u_pm.full_name                    AS pm_name,
      u_pd.full_name                    AS pd_name,
      t.id                              AS tender_id,
      COALESCE(t.opportunity_name, t.name, p.name, 'Untitled tender') AS tender_name,
      t.customer                        AS customer,
      t.department                      AS department,
      t.status                          AS tender_status,
      to_char(t.updated_at, 'YYYY-MM-DD') AS updated_at,
      COALESCE(vt.total_amount, 0)      AS total_amount,
      COALESCE(vt.resource_amount, 0)   AS resource_amount,
      COALESCE(vt.material_amount, 0)   AS material_amount,
      COALESCE(vt.subcon_amount, 0)     AS subcon_amount,
      COALESCE(vt.others_amount, 0)     AS others_amount,
      COALESCE(vt.item_count, 0)        AS item_count
    FROM tenders t
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u_pm ON u_pm.id = COALESCE(t.pm_user_id, p.pm_user_id)
    LEFT JOIN users u_pd ON u_pd.id = COALESCE(t.pd_user_id, p.pd_user_id)
    LEFT JOIN v_tender_totals vt ON vt.tender_id = t.id
    ${where}
    ORDER BY t.updated_at DESC, tender_name
  `, params)).rows;
  res.json(rows);
}));

// POST /api/tender  -> create a standalone pre-award tender.
r.post('/', ah(async (req, res) => {
  const b = req.body;
  const name = String(b.opportunity_name || b.name || '').trim();
  if (!name) return res.status(400).json({ error: 'opportunity_name required' });
  const result = await tx(async (c) => {
    const ins = await c.query(
      `INSERT INTO tenders
         (name, opportunity_name, customer, department, pm_user_id, pd_user_id,
          start_date, end_date, status, notes, created_by, gp_pct)
       VALUES ($1,$1,$2,COALESCE($3,'Unassigned'),$4,$5,$6,$7,COALESCE($8,'draft'),$9,$10,COALESCE($11,0))
       RETURNING *`,
      [name, b.customer || null, b.department || null, b.pm_user_id || null, b.pd_user_id || null,
       b.start_date || null, b.end_date || null, b.status || 'draft', b.notes || null,
       b.created_by || null, b.gp_pct != null ? Number(b.gp_pct) : 0]
    );
    await logAudit(c, { entity_type: 'tender', entity_id: ins.rows[0].id, action: 'create', user_id: b.created_by || null });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// GET /api/tender/:id  -> { tender, project, items, totals }
r.get('/:id', ah(async (req, res) => {
  const ident = req.params.id;
  const tender = (/^\d+$/.test(ident)
    ? (await query(`SELECT * FROM tenders WHERE id = $1`, [Number(ident)])).rows[0]
    : (await query(`SELECT * FROM tenders WHERE project_id = $1 ORDER BY id LIMIT 1`, [ident])).rows[0]
  );
  if (!tender) return res.status(404).json({ error: 'tender not found' });

  const [items, totals, vos, voTotals] = await Promise.all([
    query(`SELECT * FROM tender_items WHERE tender_id = $1 ORDER BY kind, id`, [tender.id]),
    query(`SELECT * FROM v_tender_totals WHERE tender_id = $1`, [tender.id]),
    query(
      `SELECT v.*, u.full_name AS created_by_name
         FROM tender_vos v LEFT JOIN users u ON u.id = v.created_by
        WHERE v.tender_id = $1 ORDER BY v.id`, [tender.id]),
    query(`SELECT * FROM v_tender_vo_totals WHERE tender_id = $1`, [tender.id]),
  ]);

  res.json({
    tender,
    items:  items.rows,
    vos:    vos.rows,
    totals: totals.rows[0] || {
      project_id: tender.project_id, tender_id: tender.id, total_amount: 0,
      resource_amount: 0, material_amount: 0, subcon_amount: 0, others_amount: 0, item_count: 0,
    },
    voTotals: voTotals.rows[0] || {
      tender_id: tender.id, confirmed_amount: 0, potential_amount: 0,
      confirmed_count: 0, potential_count: 0,
    },
  });
}));

// PATCH /api/tender/:id  (tender header)
r.patch('/:id', ah(async (req, res) => {
  const editable = new Set([
    'name', 'opportunity_name', 'customer', 'department', 'pm_user_id', 'pd_user_id',
    'start_date', 'end_date', 'status', 'notes', 'gp_pct',
  ]);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);
  const upd = await query(`UPDATE tenders SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'tender not found' });
  res.json(upd.rows[0]);
}));

// ---------- tender line items ----------

// POST /api/tender/:id/items
r.post('/:id/items', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['kind', 'description']);
  if (!['resource', 'material', 'subcon', 'others'].includes(b.kind)) {
    return res.status(400).json({ error: 'kind must be resource | material | subcon | others' });
  }
  const qty      = b.qty      != null ? Number(b.qty)       : 1;
  const unitCost = b.unit_cost != null ? Number(b.unit_cost) : 0;
  const amount   = b.amount   != null ? Number(b.amount)     : qty * unitCost;
  const result = await tx(async (c) => {
    const ins = await c.query(
      `INSERT INTO tender_items
         (tender_id, kind, category, sub_job_label, description, qty, unit_cost, amount, notes, gp_pct)
       VALUES ($1,$2,COALESCE($3,'PM'),$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [req.params.id, b.kind, b.category, b.sub_job_label || null, b.description,
       qty, unitCost, amount, b.notes || null, b.gp_pct != null ? Number(b.gp_pct) : null]
    );
    await logAudit(c, { entity_type: 'tender_item', entity_id: ins.rows[0].id, action: 'create' });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/tender/items/:itemId
r.patch('/items/:itemId', ah(async (req, res) => {
  const editable = new Set(['kind', 'category', 'sub_job_label', 'description', 'qty', 'unit_cost', 'amount', 'notes', 'gp_pct']);
  const body = { ...req.body };
  // Recompute amount from qty * unit_cost unless amount was sent explicitly
  if (body.amount == null && (body.qty != null || body.unit_cost != null)) {
    const cur = (await query(`SELECT qty, unit_cost FROM tender_items WHERE id = $1`, [req.params.itemId])).rows[0];
    if (cur) {
      const qty      = body.qty      != null ? Number(body.qty)       : Number(cur.qty);
      const unitCost = body.unit_cost != null ? Number(body.unit_cost) : Number(cur.unit_cost);
      body.amount = qty * unitCost;
    }
  }
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.itemId);
  const upd = await query(`UPDATE tender_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'tender item not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/tender/items/:itemId
r.delete('/items/:itemId', ah(async (req, res) => {
  const d = await query(`DELETE FROM tender_items WHERE id = $1`, [req.params.itemId]);
  if (!d.rowCount) return res.status(404).json({ error: 'tender item not found' });
  res.status(204).end();
}));

// ================================================================
// Variation Orders (VOs) - potential vs confirmed
//   Confirmed VOs surface in totals; NO automatic budget/EAC recalc.
// ================================================================

// POST /api/tender/:id/vos
r.post('/:id/vos', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['description']);
  const status = b.status === 'confirmed' ? 'confirmed' : 'potential';
  const result = await tx(async (c) => {
    const ins = await c.query(
      `INSERT INTO tender_vos (tender_id, ref, description, amount, gp_pct, status, notes, created_by)
       VALUES ($1,$2,$3,COALESCE($4,0),$5,$6,$7,$8)
       RETURNING *`,
      [req.params.id, b.ref || null, b.description, b.amount,
       b.gp_pct != null ? Number(b.gp_pct) : null, status, b.notes || null, b.created_by || null]);
    await logAudit(c, { entity_type: 'tender_vo', entity_id: ins.rows[0].id, action: 'create' });
    return ins.rows[0];
  });
  res.status(201).json(result);
}));

// PATCH /api/tender/vos/:voId
r.patch('/vos/:voId', ah(async (req, res) => {
  const editable = new Set(['ref', 'description', 'amount', 'gp_pct', 'status', 'notes']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) {
      if (k === 'status' && !['potential', 'confirmed'].includes(v)) continue;
      sets.push(`${k} = $${i++}`); vals.push(v);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.voId);
  const upd = await query(`UPDATE tender_vos SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'VO not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/tender/vos/:voId
r.delete('/vos/:voId', ah(async (req, res) => {
  const d = await query(`DELETE FROM tender_vos WHERE id = $1`, [req.params.voId]);
  if (!d.rowCount) return res.status(404).json({ error: 'VO not found' });
  res.status(204).end();
}));

// ================================================================
// FAD settlement (Finance-owned) + project initiation (on award)
// ================================================================

async function nextProjectId(c) {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const last = (await c.query(
    `SELECT id FROM projects WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  )).rows[0]?.id;
  const n = last ? (parseInt(String(last).slice(prefix.length), 10) || 0) + 1 : 1;
  return `${prefix}${String(n).padStart(3, '0')}`;
}

function revenueFromCost(cost, gpPct) {
  const g = Math.max(0, Math.min(99.999, Number(gpPct) || 0)) / 100;
  return g >= 1 ? cost : cost / (1 - g);
}

// POST /api/tender/:id/settle-fad   { user_id, settled }
// Settling stamps who/when; unsettling clears it. Access is gated in the UI
// (Finance/Admin only).
r.post('/:id/settle-fad', ah(async (req, res) => {
  const settled = req.body.settled !== false;
  const upd = await query(
    settled
      ? `UPDATE tenders SET fad_settled_at = NOW(), fad_settled_by = $2, updated_at = NOW()
           WHERE id = $1 RETURNING *`
      : `UPDATE tenders SET fad_settled_at = NULL, fad_settled_by = NULL, updated_at = NOW()
           WHERE id = $1 RETURNING *`,
    settled ? [req.params.id, req.body.user_id || null] : [req.params.id]);
  if (!upd.rows[0]) return res.status(404).json({ error: 'tender not found' });
  res.json(upd.rows[0]);
}));

// POST /api/tender/:id/initiate
// Awards a standalone tender and creates the live project once. Tender inputs are
// copied into kickoff modules as forecast/open planning rows.
r.post('/:id/initiate', ah(async (req, res) => {
  const t = (await query(`SELECT * FROM tenders WHERE id = $1`, [req.params.id])).rows[0];
  if (!t) return res.status(404).json({ error: 'tender not found' });
  const result = await tx(async (c) => {
    if (t.project_id) {
      const existing = (await c.query(`SELECT * FROM projects WHERE id = $1`, [t.project_id])).rows[0];
      if (existing) {
        await c.query(`UPDATE tenders SET status = 'awarded', initiated_at = COALESCE(initiated_at, NOW()), updated_at = NOW() WHERE id = $1`, [t.id]);
        return { project: existing, copied: false };
      }
    }

    const totals = await c.query(`SELECT * FROM v_tender_totals WHERE tender_id = $1`, [t.id]);
    const voTotals = await c.query(`SELECT * FROM v_tender_vo_totals WHERE tender_id = $1`, [t.id]);
    const items = await c.query(`SELECT * FROM tender_items WHERE tender_id = $1 ORDER BY id`, [t.id]);
    const gp = Number(t.gp_pct) || 0;
    const cost = Number(totals.rows[0]?.total_amount || 0) + Number(voTotals.rows[0]?.confirmed_amount || 0);
    const contractValue = revenueFromCost(cost, gp);
    const pid = req.body.project_id || await nextProjectId(c);
    const start = t.start_date || new Date().toISOString().slice(0, 10);
    const endDate = new Date(start);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const end = t.end_date || endDate.toISOString().slice(0, 10);

    const proj = await c.query(
      `INSERT INTO projects (
         id, name, wbs_code, customer, department, pm_user_id, pd_user_id, status,
         start_date, end_date, contract_value, initial_budget, budget, eac,
         budget_gp_pct, forecast_gp_pct, revrec_method, last_update
       ) VALUES (
         $1,$2,$1,$3,COALESCE($4,'Unassigned'),$5,$6,'ok',
         $7,$8,$9,$10,$10,$10,$11,$11,'milestone',NOW()
       )
       RETURNING *`,
      [pid, t.opportunity_name || t.name || `Project ${pid}`, t.customer || null,
       t.department || null, t.pm_user_id || null, t.pd_user_id || null,
       start, end, contractValue, cost, gp]
    );
    if (t.pm_user_id) {
      await c.query(
        `INSERT INTO project_pm_assignments (project_id, user_id, is_lead)
         VALUES ($1,$2,TRUE)
         ON CONFLICT (project_id, user_id) DO UPDATE SET is_lead = TRUE`,
        [pid, t.pm_user_id]
      );
    }

    for (const it of items.rows) {
      await c.query(
        `INSERT INTO project_initiation_items
           (project_id, source_tender_id, source_tender_item_id, kind, category,
            sub_job_label, description, qty, unit_cost, amount, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (project_id, source_tender_item_id) DO NOTHING`,
        [pid, t.id, it.id, it.kind, it.category || 'PM', it.sub_job_label || null,
         it.description, it.qty, it.unit_cost, it.amount, it.notes || null]
      );

      if (it.kind === 'resource') {
        await c.query(
          `INSERT INTO resource_requests
             (project_id, function_title, grade, headcount, remarks, created_by)
           VALUES ($1,$2,NULL,COALESCE($3,1),$4,$5)`,
          [pid, it.description, it.qty || 1, `Created from tender line #${it.id}`, req.body.user_id || t.created_by || null]
        );
      } else if (it.kind === 'material') {
        await c.query(
          `INSERT INTO material_items (project_id, description, amount, notes, created_by)
           VALUES ($1,$2,COALESCE($3,0),$4,$5)`,
          [pid, it.description, it.amount, it.notes || 'Created from tender', req.body.user_id || t.created_by || null]
        );
      } else if (it.kind === 'subcon') {
        await c.query(
          `INSERT INTO sub_con_items (project_id, description, amount, notes, created_by)
           VALUES ($1,$2,COALESCE($3,0),$4,$5)`,
          [pid, it.description, it.amount, it.notes || 'Created from tender', req.body.user_id || t.created_by || null]
        );
      } else if (it.kind === 'others') {
        await c.query(
          `INSERT INTO others_items (project_id, description, amount, notes, created_by)
           VALUES ($1,$2,COALESCE($3,0),$4,$5)`,
          [pid, it.description, it.amount, it.notes || 'Created from tender', req.body.user_id || t.created_by || null]
        );
      }
    }

    await c.query(
      `UPDATE tenders
          SET status = 'awarded', project_id = $2, initiated_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
      [t.id, pid]
    );
    await logAudit(c, { entity_type: 'tender', entity_id: t.id, action: 'initiate' });
    return { project: proj.rows[0], copied: true };
  });
  res.json({ ok: true, ...result, gp_pct: Number(t.gp_pct) || 0 });
}));

// ================================================================
// FAD / FX rates
// ================================================================

const DEFAULT_FX = [
  ['USD', 1.350000],
  ['GBP', 1.710000],
  ['EUR', 1.460000],
  ['AUD', 0.890000],
  ['CHF', 1.500000],
  ['THB', 0.037000],
];

// GET /api/tender/:tenderId/fx  → currency rate list (auto-seeds defaults)
r.get('/:tenderId/fx', ah(async (req, res) => {
  const tid = req.params.tenderId;
  let rows = (await query(`SELECT * FROM tender_fx_rates WHERE tender_id = $1 ORDER BY currency`, [tid])).rows;
  if (!rows.length) {
    await tx(async (c) => {
      for (const [cur, rate] of DEFAULT_FX) {
        await c.query(
          `INSERT INTO tender_fx_rates (tender_id, currency, rate_to_sgd)
           VALUES ($1,$2,$3) ON CONFLICT (tender_id, currency) DO NOTHING`,
          [tid, cur, rate]
        );
      }
    });
    rows = (await query(`SELECT * FROM tender_fx_rates WHERE tender_id = $1 ORDER BY currency`, [tid])).rows;
  }
  res.json(rows);
}));

// PATCH /api/tender/fx/:id  → { rate_to_sgd }
r.patch('/fx/:id', ah(async (req, res) => {
  const rate = Number(req.body.rate_to_sgd);
  if (!Number.isFinite(rate) || rate < 0) return res.status(400).json({ error: 'rate_to_sgd must be a non-negative number' });
  const upd = await query(
    `UPDATE tender_fx_rates SET rate_to_sgd = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [rate, req.params.id]
  );
  if (!upd.rows[0]) return res.status(404).json({ error: 'rate not found' });
  res.json(upd.rows[0]);
}));

// POST /api/tender/:tenderId/fx  → add a currency { currency, rate_to_sgd }
r.post('/:tenderId/fx', ah(async (req, res) => {
  const cur = String(req.body.currency || '').trim().toUpperCase();
  if (!cur) return res.status(400).json({ error: 'currency required' });
  const rate = Number(req.body.rate_to_sgd) || 0;
  const ins = await query(
    `INSERT INTO tender_fx_rates (tender_id, currency, rate_to_sgd)
     VALUES ($1,$2,$3)
     ON CONFLICT (tender_id, currency) DO UPDATE SET rate_to_sgd = EXCLUDED.rate_to_sgd, updated_at = NOW()
     RETURNING *`,
    [req.params.tenderId, cur, rate]
  );
  res.status(201).json(ins.rows[0]);
}));

// DELETE /api/tender/fx/:id
r.delete('/fx/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM tender_fx_rates WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'rate not found' });
  res.status(204).end();
}));

// POST /api/tender/:tenderId/fx/import  → bulk upsert { rates: { USD: 1.35, ... } }
r.post('/:tenderId/fx/import', ah(async (req, res) => {
  const rates = req.body.rates;
  if (!rates || typeof rates !== 'object') return res.status(400).json({ error: 'rates object required' });
  const tid = req.params.tenderId;
  await tx(async (c) => {
    for (const [cur, val] of Object.entries(rates)) {
      const rate = Number(val);
      if (!Number.isFinite(rate) || rate < 0) continue;
      await c.query(
        `INSERT INTO tender_fx_rates (tender_id, currency, rate_to_sgd)
         VALUES ($1,$2,$3)
         ON CONFLICT (tender_id, currency) DO UPDATE SET rate_to_sgd = EXCLUDED.rate_to_sgd, updated_at = NOW()`,
        [tid, String(cur).trim().toUpperCase(), rate]
      );
    }
  });
  const rows = (await query(`SELECT * FROM tender_fx_rates WHERE tender_id = $1 ORDER BY currency`, [tid])).rows;
  res.json(rows);
}));

// ================================================================
// ST Labour  (phases, functions, years, allocations)
// ================================================================

// GET /api/tender/:tenderId/labour  → { phases, functions, range, allocations }
r.get('/:tenderId/labour', ah(async (req, res) => {
  const tid = req.params.tenderId;
  // Seed a default 12-month timeline (current calendar year) on first access.
  let range = (await query(`SELECT start_year, start_month, end_year, end_month FROM tender_labour_range WHERE tender_id = $1`, [tid])).rows[0];
  if (!range) {
    const y0 = new Date().getFullYear();
    range = { start_year: y0, start_month: 1, end_year: y0, end_month: 12 };
    await query(
      `INSERT INTO tender_labour_range (tender_id, start_year, start_month, end_year, end_month)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (tender_id) DO NOTHING`,
      [tid, range.start_year, range.start_month, range.end_year, range.end_month]
    );
  }
  const [phases, functions, allocations] = await Promise.all([
    query(`SELECT * FROM tender_labour_phases WHERE tender_id = $1 ORDER BY sort_order, id`, [tid]),
    query(`SELECT * FROM tender_labour_functions WHERE tender_id = $1 ORDER BY sort_order, id`, [tid]),
    query(`SELECT * FROM tender_labour_allocations WHERE tender_id = $1`, [tid]),
  ]);
  res.json({ phases: phases.rows, functions: functions.rows, range, allocations: allocations.rows });
}));

// --- phases ---
r.post('/:tenderId/labour/phases', ah(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name required' });
  const nx = (await query(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM tender_labour_phases WHERE tender_id = $1`, [req.params.tenderId])).rows[0].n;
  const ins = await query(
    `INSERT INTO tender_labour_phases (tender_id, name, sort_order) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.tenderId, name, nx]
  );
  res.status(201).json(ins.rows[0]);
}));

r.patch('/labour/phases/:id', ah(async (req, res) => {
  const editable = new Set(['name', 'sort_order']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE tender_labour_phases SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'phase not found' });
  res.json(upd.rows[0]);
}));

r.delete('/labour/phases/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM tender_labour_phases WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'phase not found' });
  res.status(204).end();
}));

// --- functions ---
r.post('/:tenderId/labour/functions', ah(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name required' });
  const nx = (await query(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM tender_labour_functions WHERE tender_id = $1`, [req.params.tenderId])).rows[0].n;
  const ins = await query(
    `INSERT INTO tender_labour_functions (tender_id, name, rate, unit, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.tenderId, name, Number(req.body.rate) || 0, req.body.unit || 'md', nx]
  );
  res.status(201).json(ins.rows[0]);
}));

r.patch('/labour/functions/:id', ah(async (req, res) => {
  const editable = new Set(['name', 'rate', 'unit', 'sort_order']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE tender_labour_functions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'function not found' });
  res.json(upd.rows[0]);
}));

r.delete('/labour/functions/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM tender_labour_functions WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'function not found' });
  res.status(204).end();
}));

// --- timeline range (start .. end month, inclusive) ---
r.put('/:tenderId/labour/range', ah(async (req, res) => {
  const sy = parseInt(req.body.start_year, 10);
  const sm = parseInt(req.body.start_month, 10);
  const ey = parseInt(req.body.end_year, 10);
  const em = parseInt(req.body.end_month, 10);
  if (![sy, sm, ey, em].every(Number.isInteger) || sm < 1 || sm > 12 || em < 1 || em > 12) {
    return res.status(400).json({ error: 'valid start/end year and month (1-12) required' });
  }
  if (ey * 12 + em < sy * 12 + sm) {
    return res.status(400).json({ error: 'end must not be before start' });
  }
  const up = await query(
    `INSERT INTO tender_labour_range (tender_id, start_year, start_month, end_year, end_month)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (tender_id) DO UPDATE SET
       start_year = EXCLUDED.start_year, start_month = EXCLUDED.start_month,
       end_year = EXCLUDED.end_year, end_month = EXCLUDED.end_month
     RETURNING start_year, start_month, end_year, end_month`,
    [req.params.tenderId, sy, sm, ey, em]
  );
  // Prune allocations that fall outside the new window.
  await query(
    `DELETE FROM tender_labour_allocations
      WHERE tender_id = $1 AND (year * 12 + month < $2 OR year * 12 + month > $3)`,
    [req.params.tenderId, sy * 12 + sm, ey * 12 + em]
  );
  res.json(up.rows[0]);
}));

// --- allocation upsert (qty 0 removes the cell) ---
r.put('/:tenderId/labour/allocation', ah(async (req, res) => {
  const { phase_id, function_id, year, month } = req.body;
  const qty = Number(req.body.qty) || 0;
  const mo = parseInt(month, 10);
  if (!phase_id || !function_id || year == null || !Number.isInteger(mo)) {
    return res.status(400).json({ error: 'phase_id, function_id, year and month required' });
  }
  if (qty === 0) {
    await query(
      `DELETE FROM tender_labour_allocations WHERE phase_id = $1 AND function_id = $2 AND year = $3 AND month = $4`,
      [phase_id, function_id, year, mo]
    );
    return res.json({ phase_id, function_id, year, month: mo, qty: 0 });
  }
  const up = await query(
    `INSERT INTO tender_labour_allocations (tender_id, phase_id, function_id, year, month, qty)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (phase_id, function_id, year, month) DO UPDATE SET qty = EXCLUDED.qty
     RETURNING *`,
    [req.params.tenderId, phase_id, function_id, year, mo, qty]
  );
  res.json(up.rows[0]);
}));

// ================================================================
// Preliminaries
// ================================================================

r.get('/:tenderId/prelim', ah(async (req, res) => {
  const rows = (await query(
    `SELECT * FROM tender_prelim_items WHERE tender_id = $1 ORDER BY sort_order, id`, [req.params.tenderId]
  )).rows;
  res.json(rows);
}));

r.post('/:tenderId/prelim', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['description']);
  const nx = (await query(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM tender_prelim_items WHERE tender_id = $1`, [req.params.tenderId])).rows[0].n;
  const ins = await query(
    `INSERT INTO tender_prelim_items (tender_id, sn, description, currency, cost, esc_pct, qty, sort_order)
     VALUES ($1,$2,$3,COALESCE($4,'SGD'),$5,$6,$7,$8) RETURNING *`,
    [req.params.tenderId, b.sn || null, b.description, b.currency,
     Number(b.cost) || 0, Number(b.esc_pct) || 0, b.qty != null ? Number(b.qty) : 1, nx]
  );
  res.status(201).json(ins.rows[0]);
}));

r.patch('/prelim/:id', ah(async (req, res) => {
  const editable = new Set(['sn', 'description', 'currency', 'cost', 'esc_pct', 'qty', 'sort_order']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE tender_prelim_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'prelim item not found' });
  res.json(upd.rows[0]);
}));

r.delete('/prelim/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM tender_prelim_items WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'prelim item not found' });
  res.status(204).end();
}));

export default r;
