// Backend-backed data hooks + adapters that shape API responses
// into the format the existing screens expect (formerly from mock.js).
import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const n = (v) => (v == null ? 0 : Number(v) || 0);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toISOString().slice(0, 10);
}

function monthsBetween(from, to) {
  if (!from || !to) return 0;
  const a = new Date(from), b = new Date(to);
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.44)));
}

// Build a synthetic 12-month cumulative trend ending at current actual.
function makeTrend(actual) {
  const final = n(actual) / 1000;
  if (final <= 0) return Array(12).fill(0);
  // S-curve-ish: 0,8%,17%,26%,36%,45%,55%,64%,73%,79%,85%,100% of final
  const curve = [0, 8, 17, 26, 36, 45, 55, 64, 73, 79, 85, 100];
  return curve.map(p => Math.round(final * p / 100));
}

// ── Adapter: project list row → screen shape ─────────────────────────────
export function adaptProject(p) {
  if (!p) return p;
  const budget = n(p.budget);
  const eac    = n(p.eac);
  const actual = n(p.actual);
  const committed = n(p.committed);
  const pct = budget > 0 ? Math.min(100, Math.round((actual + committed) / Math.max(eac, budget) * 100)) : 0;
  return {
    // identity
    id: p.id,
    name: p.name,
    pm: p.pm_name || '(Unassigned)',
    pd: p.pd_name || '(Unassigned)',
    pmUserId: p.pm_user_id ?? null,
    pdUserId: p.pd_user_id ?? null,
    department: p.department || '—',
    status: p.status || 'ok',
    wbs: p.wbs_code,
    customer: p.customer,
    // financial
    contractValue: n(p.contract_value),
    budget,
    eac,
    actual,
    committed,
    revRecognised: n(p.rev_recognised),
    progressBilling: n(p.progress_billing),
    osPb: n(p.os_pb),
    budgetGpPct:   n(p.budget_gp_pct),
    forecastGpPct: n(p.forecast_gp_pct),
    variance: n(p.variance),
    // derived placeholders (until module-level data lands)
    labourEtc: Math.max(0, eac - actual - committed) * 0.6,
    otherEtc:  Math.max(0, eac - actual - committed) * 0.4,
    percentComplete: pct,
    monthsLeft: monthsBetween(new Date(), p.end_date),
    lastUpdate: fmtDate(p.last_update || p.last_sap_import),
    lastSapImport: p.last_sap_import || null,
    trend: makeTrend(actual + committed),
    startDate: p.start_date,
    endDate: p.end_date,
    revrecMethod: p.revrec_method || 'milestone',
  };
}

function adaptSubjob(s) {
  const budget = n(s.plan_cos);
  const actual = n(s.tot_cost);
  const committed = n(s.com_cst);
  // Use PM-entered ETC from DB (etc_lab+etc_foh+etc_mat+etc_doc+etc_sco via v_sub_job_summary).
  // Fall back to budget-based formula only if no ETC has been entered yet.
  const etcDb = n(s.etc_total);
  const etc = etcDb > 0 ? etcDb : Math.max(0, budget - actual - committed);
  return {
    id: s.id,
    wbs: s.wbs_code,
    name: s.name,
    budget, actual, committed, etc,
    isWarranty: !!s.is_warranty,
    suffix: s.wbs_suffix,
    plannedTotal: n(s.planned_total),
    plannedCount: Number(s.planned_count) || 0,
    peopleCount:  Number(s.people_count)  || 0,
    totalFte:     n(s.total_fte),
  };
}

function adaptMilestone(m) {
  return {
    id: m.id,
    name: m.name,
    date: fmtDate(m.target_date),
    done: !!m.is_done,
    warn: m.status === 'warn' || m.status === 'at_risk',
  };
}

function adaptRisk(r) {
  return {
    id: r.id != null ? `R${r.id}` : '',
    title: r.title,
    impact: r.impact,
    prob: r.probability,
    mitigation: r.mitigation,
  };
}

function adaptUpdate(u) {
  return {
    month: `${MONTHS[(u.period_month || 1) - 1] || ''} ${u.period_year || ''}`.trim(),
    status: u.status || 'ok',
    text: u.narrative || '',
  };
}

function adaptResource(r) {
  return {
    id: r.id,
    role: r.resource_name || r.role_name,
    fn: r.function_title,
    grade: r.grade,
    fte: (Array.isArray(r.fte_allocations) ? r.fte_allocations : (r.fte_allocations || [])).map(v => parseFloat(v) || 0),
    subJobId: r.sub_job_id ?? null,
  };
}

// ── Hook: project list ───────────────────────────────────────────────────
export function useProjects() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const reload = useCallback(() => {
    setError(null);
    api.get('/api/projects')
      .then(rows => setData(rows.map(adaptProject)))
      .catch(e => { setError(e); setData([]); });
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { projects: data || [], loading: data === null, error, reload };
}

// ── Hook: single project (full bundle) ──────────────────────────────────
export function useProject(projectId) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const reload = useCallback(() => {
    if (!projectId) return;
    setError(null); setData(null);
    api.get(`/api/projects/${encodeURIComponent(projectId)}/full`)
      .then(d => {
        const p = adaptProject(d.project);
        const subjobs = (d.subjobs || []).map(adaptSubjob);
        // Compute labour ETC from sub-jobs where possible
        const labourActual = (d.subjobs || []).reduce((a, s) => a + n(s.labour), 0);
        const remaining = Math.max(0, p.eac - p.actual - p.committed);
        const labourRatio = p.actual > 0 ? Math.min(1, labourActual / p.actual) : 0.5;
        p.labourEtc = Math.round(remaining * labourRatio);
        p.otherEtc  = Math.round(remaining * (1 - labourRatio));
        setData({
          ...p,
          subjobs,
          milestones: (d.milestones || []).map(adaptMilestone),
          risks:      (d.risks || []).map(adaptRisk),
          updates:    (d.updates || []).map(adaptUpdate),
          resources:  (d.resources || []).map(adaptResource),
          eacMonthly: { lockedMonths: [], rows: [] },
          revrec: {
            method: p.revrecMethod,
            recognitionCurve: [],
            recognisedToDate: p.revRecognised,
            forecastFull: p.contractValue || p.eac,
            entries: d.revrec || [],
          },
        });
      })
      .catch(e => setError(e));
  }, [projectId]);
  useEffect(() => { reload(); }, [reload]);
  return { project: data, loading: data === null && !error, error, reload };
}

// ── Hook: users ──────────────────────────────────────────────────────────
export function useUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.get('/api/users').then(setUsers).catch(() => setUsers([])); }, []);
  return users;
}

// ── Hook: resource pool ──────────────────────────────────────────────────
export function useResourcePool() {
  const [pool, setPool] = useState([]);
  useEffect(() => {
    api.get('/api/resources/pool')
      .then(rows => setPool(rows.map(r => ({
        id: r.id,
        name: r.name,
        grade: r.grade,
        roles: r.roles || [],
        dailyRate: n(r.daily_rate),
        monthlyRate: n(r.monthly_rate),
      }))))
      .catch(() => setPool([]));
  }, []);
  return pool;
}

// ── Hook: resource grades / RATES ────────────────────────────────────────
export function useRates() {
  const [rates, setRates] = useState([]);
  useEffect(() => {
    api.get('/api/resources/grades')
      .then(rows => setRates(rows.map(r => ({
        grade: r.grade,
        title: r.title,
        daily: n(r.daily_rate),
        monthly: n(r.monthly_rate),
      }))))
      .catch(() => setRates([]));
  }, []);
  return rates;
}

// ── Hook: audit log ──────────────────────────────────────────────────────
export function useAudit(filter = {}) {
  const [entries, setEntries] = useState([]);
  const reload = useCallback(() => {
    const qs = new URLSearchParams(filter).toString();
    api.get(`/api/audit${qs ? '?' + qs : ''}`)
      .then(rows => setEntries(rows.map(e => {
        const detail = [e.field_name, e.old_value, e.new_value, e.note].filter(Boolean).join(' · ');
        return {
          id: e.id,
          ts: e.occurred_at ? new Date(e.occurred_at).toLocaleString('en-SG', { dateStyle: 'short', timeStyle: 'short', hour12: false }) : '',
          when: e.occurred_at,
          who: e.user_name || '(system)',
          user: e.user_name || '(system)',
          role: '—',
          action: `${e.action} ${e.entity_type}`,
          detail: detail || (e.entity_id || ''),
          entityType: e.entity_type,
          entityId: e.entity_id,
          field: e.field_name,
          oldValue: e.old_value,
          newValue: e.new_value,
          note: e.note,
        };
      })))
      .catch(() => setEntries([]));
  }, [JSON.stringify(filter)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [reload]);
  return { entries, reload };
}

// ── Hook: SAP import history ─────────────────────────────────────────────
export function useSapImports() {
  const [history, setHistory] = useState([]);
  const reload = useCallback(() => {
    api.get('/api/sap/imports')
      .then(rows => setHistory(rows.map(r => ({
        id: r.id,
        date: fmtDate(r.imported_at),
        period: `${MONTHS[(r.period_month || 1) - 1]} '${String(r.period_year || '').slice(-2)}`,
        by: r.imported_by_name || '(unknown)',
        created: r.projects_created || 0,
        updated: r.projects_updated || 0,
        locked: (r.projects_created || 0) + (r.projects_updated || 0),
        exceptions: r.exceptions || 0,
        status: r.status || 'ok',
        filename: r.filename,
      }))))
      .catch(() => setHistory([]));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { history, reload };
}

// Re-export formatting helpers that screens still pull from mock.js
export { MONTHS };

export function fmtSapSync(ts) {
  if (!ts) return 'not synced';
  const d = new Date(ts);
  if (isNaN(d)) return 'not synced';
  const now = new Date();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `today ${time}`;
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `yesterday ${time}`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + time;
}

export function fmtAsAt() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmt(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000)     return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
}

export function fmtPct(n, budget) {
  if (!budget) return '0.0%';
  const pct = ((n - budget) / budget) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export function statusLabel(s) {
  return { ok: 'On Track', warn: 'At Risk', bad: 'Delayed', info: 'Info' }[s] || s;
}
