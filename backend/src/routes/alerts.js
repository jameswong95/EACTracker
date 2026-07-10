import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../util.js';

const r = Router();

const n = v => parseFloat(v) || 0;
const fmtK = v => `$${(Math.abs(v) / 1000).toFixed(0)}K`;
const daysSince = d => d ? (Date.now() - new Date(d).getTime()) / 86400000 : Infinity;

// GET /api/alerts?project_id=:id
// Returns computed alert array derived entirely from DB data.
r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });

  const [projRes, msRes, riskRes, subjobRes, updRes, reqRes] = await Promise.all([
    query(`SELECT * FROM projects WHERE id = $1`, [project_id]),
    query(`SELECT * FROM milestones WHERE project_id = $1`, [project_id]),
    query(`SELECT * FROM risks WHERE project_id = $1`, [project_id]),
    query(`SELECT * FROM sub_jobs WHERE project_id = $1`, [project_id]),
    query(
      `SELECT * FROM project_updates WHERE project_id = $1
       ORDER BY period_year DESC, period_month DESC LIMIT 1`,
      [project_id]
    ),
    query(
      `SELECT rq.*, cu.full_name AS created_by_name
       FROM resource_requests rq
       LEFT JOIN users cu ON cu.id = rq.created_by
       WHERE rq.project_id = $1 AND rq.status = 'open'
       ORDER BY rq.created_at ASC`,
      [project_id]
    ),
  ]);

  const p = projRes.rows[0];
  if (!p) return res.status(404).json({ error: 'project not found' });

  const milestones = msRes.rows;
  const risks      = riskRes.rows;
  const subjobs    = subjobRes.rows;
  const lastUpdate = updRes.rows[0];
  const openRequests = reqRes.rows;

  const budget   = n(p.budget);
  const eac      = n(p.eac);
  const actual   = n(p.actual);
  const committed = n(p.committed);
  const cv       = n(p.contract_value);
  const rev      = n(p.rev_recognised);
  const cash     = n(p.progress_billing);

  // Derived GP from available columns
  const initialGpPct = budget > 0 && cv > 0 ? ((cv - budget) / cv) * 100 : 0;
  const currentGpPct = eac   > 0 && cv > 0 ? ((cv - eac)    / cv) * 100 : 0;

  const alerts = [];

  // ── 1. EAC exceeds budget ─────────────────────────────────────────────
  if (budget > 0 && eac > budget) {
    const overrun = eac - budget;
    alerts.push({
      kind: 'adv', code: 'EAC_OVER_BUDGET',
      text: `EAC exceeds approved budget by ${fmtK(overrun)} (${((overrun / budget) * 100).toFixed(1)}%).`,
      sub:  'Review cost forecast and identify corrective actions.',
    });
  }

  // ── 2. EAC > Contract Value — project is loss-making ─────────────────
  if (cv > 0 && eac > cv) {
    alerts.push({
      kind: 'adv', code: 'EAC_OVER_CONTRACT',
      text: `EAC (${fmtK(eac)}) exceeds contract value (${fmtK(cv)}) — project is loss-making.`,
      sub:  'Escalate to Project Director and Finance immediately.',
    });
  }

  // ── 3. GP margin erosion > 15% vs initial ────────────────────────────
  if (initialGpPct > 0 && currentGpPct < initialGpPct * 0.85) {
    const erosion = (initialGpPct - currentGpPct).toFixed(1);
    alerts.push({
      kind: 'attn', code: 'GP_EROSION',
      text: `GP has eroded ${erosion}pp from baseline (${currentGpPct.toFixed(1)}% vs ${initialGpPct.toFixed(1)}% budget).`,
      sub:  'Verify revenue recognition schedule and cost forecast.',
    });
  }

  // ── 4. High budget utilisation (>90%) with work remaining ────────────
  const utilPct = budget > 0 ? (actual + committed) / budget : 0;
  if (utilPct > 0.90 && eac <= budget * 1.01) {
    alerts.push({
      kind: 'attn', code: 'HIGH_UTILISATION',
      text: `Budget utilisation is at ${(utilPct * 100).toFixed(0)}% — minimal contingency remaining.`,
      sub:  'Monitor closely and update ETC to reflect remaining scope.',
    });
  }

  // ── 5. Committed costs exceed remaining ETC ───────────────────────────
  const etc = Math.max(0, eac - actual);
  if (committed > 0 && committed > etc * 1.10) {
    alerts.push({
      kind: 'attn', code: 'COMMITTED_OVER_ETC',
      text: `Committed costs (${fmtK(committed)}) exceed ETC (${fmtK(etc)}) by more than 10%.`,
      sub:  'Review open purchase orders and update ETC accordingly.',
    });
  }

  // ── 6. Revenue recognition lagging behind cost spend ─────────────────
  if (budget > 0 && cv > 0 && actual > 0) {
    const costPct = actual / budget;
    const revPct  = rev / cv;
    if (costPct > 0.25 && revPct < costPct * 0.75) {
      alerts.push({
        kind: 'attn', code: 'REVENUE_LAGGING',
        text: `Revenue recognised (${(revPct * 100).toFixed(0)}% of contract) is lagging behind cost spend (${(costPct * 100).toFixed(0)}% of budget).`,
        sub:  'Review revenue recognition schedule and milestone billing triggers.',
      });
    }
  }

  // ── 8. Cash collection risk ───────────────────────────────────────────
  if (cv > 0 && rev > cash && (rev - cash) / cv > 0.20) {
    const outstanding = rev - cash;
    alerts.push({
      kind: 'attn', code: 'CASH_COLLECTION_RISK',
      text: `Outstanding receivables are ${fmtK(outstanding)} (${((outstanding / cv) * 100).toFixed(0)}% of contract value).`,
      sub:  'Follow up on unpaid invoices to protect project cash position.',
    });
  }

  // ── 11. High-impact open risks with no mitigation ───────────────────
  const unmitigated = risks.filter(rk => rk.impact === 'High' && rk.status === 'open' && (!rk.mitigation || !rk.mitigation.trim()));
  if (unmitigated.length > 0) {
    alerts.push({
      kind: 'adv', code: 'UNMITIGATED_RISKS',
      text: `${unmitigated.length} high-impact open risk${unmitigated.length > 1 ? 's have' : ' has'} no mitigation plan.`,
      sub:  'Document mitigation actions for all high-impact risks before the next reporting cycle.',
    });
  }

  // ── 12. SAP data stale (> 7 days) ────────────────────────────────────
  if (p.last_sap_import) {
    const staleDays = daysSince(p.last_sap_import);
    if (staleDays > 7) {
      alerts.push({
        kind: 'attn', code: 'SAP_STALE',
        text: `SAP actuals not refreshed for ${Math.round(staleDays)} days (last import: ${new Date(p.last_sap_import).toLocaleDateString()}).`,
        sub:  'Request a SAP data refresh from Finance to ensure cost actuals are current.',
      });
    }
  }

  // ── 13. Stale forecast (> 35 days since last PM update) ──────────────
  const lastActivity = lastUpdate?.created_at || p.last_update;
  const staleForecDays = daysSince(lastActivity);
  if (staleForecDays > 35) {
    alerts.push({
      kind: 'attn', code: 'STALE_FORECAST',
      text: `Forecast not updated for ${staleForecDays === Infinity ? 'this reporting period' : `${Math.round(staleForecDays)} days`}.`,
      sub:  'Submit an updated ETC and project status before the reporting deadline.',
    });
  }


  const overrunSubjobs = subjobs.filter(s => {
    const sBudget = n(s.plan_cos);
    const sActual = n(s.tot_cost);
    return sBudget > 0 && sActual > sBudget * 1.20;
  });
  if (overrunSubjobs.length > 0) {
    const worst = overrunSubjobs.reduce((a, b) => n(b.tot_cost) - n(b.plan_cos) > n(a.tot_cost) - n(a.plan_cos) ? b : a);
    const worstPct = (((n(worst.tot_cost) - n(worst.plan_cos)) / n(worst.plan_cos)) * 100).toFixed(0);
    alerts.push({
      kind: 'adv', code: 'SUBJOB_OVERRUN',
      text: `${overrunSubjobs.length} sub-job${overrunSubjobs.length > 1 ? 's are' : ' is'} over budget. Worst: "${worst.name}" (+${worstPct}%).`,
      sub:  'Review ETC for overrun cost elements and submit revised forecast.',
    });
  }

  // ── 14. Unresolved placeholder headcount requests (PM asked, no response) ──
  if (openRequests.length > 0) {
    const oldest = openRequests[0];
    const waitingDays = daysSince(oldest.created_at);
    const askedBy = oldest.created_by_name ? ` by ${oldest.created_by_name}` : '';
    const totalHc = openRequests.reduce((a, rq) => a + n(rq.headcount), 0);
    alerts.push({
      kind: waitingDays > 7 ? 'adv' : 'attn',
      code: 'UNRESOLVED_RESOURCE_REQUEST',
      text: `${openRequests.length} unresolved placeholder headcount request${openRequests.length > 1 ? 's' : ''} `
        + `(${totalHc % 1 === 0 ? totalHc : totalHc.toFixed(1)} FTE) awaiting PD response.`,
      sub: `Oldest raised${askedBy} ${waitingDays === Infinity ? '' : `${Math.round(waitingDays)} day${Math.round(waitingDays) === 1 ? '' : 's'} ago`}`
        + `${oldest.remarks ? ` — "${String(oldest.remarks).slice(0, 120)}"` : ''}. Resolve or decline on the Resource Plan.`,
    });
  }

  // Sort: adv first, then attn, then info
  const order = { adv: 0, attn: 1, info: 2 };
  alerts.sort((a, b) => (order[a.kind] ?? 3) - (order[b.kind] ?? 3));

  res.json(alerts);
}));

export default r;
