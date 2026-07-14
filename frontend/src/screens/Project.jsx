import React, { useState, useEffect, useRef } from 'react';
import { useProject, useEtc, useRates, useEacMonthly, useUsers, fmt, fmtSapSync, fmtAsAt } from '../data/store.js';
import { api } from '../data/api.js';
import { MultiSeriesLineChart, SegmentedRing, GroupedBarChart, fmtShort, C, CAT_COLORS } from '../components/Charts.jsx';
import Icon from '../components/Icon.jsx';

// PRD Section 5: Project Financial Health Dashboard

// Reusable hover tooltip. Renders a fixed-position bubble so it is never
// clipped by scrolling containers (e.g. tables) and appears instantly.
function Tip({ text, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  function enter() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: r.bottom + 6 });
    setShow(true);
  }
  return (
    <span
      ref={ref}
      onMouseEnter={enter}
      onMouseLeave={() => setShow(false)}
      style={{ borderBottom: '1px dotted currentColor', cursor: 'help' }}
    >
      {children}
      {show && (
        <span style={{
          position: 'fixed', left: pos.x, top: pos.y, transform: 'translateX(-50%)',
          background: '#1f2937', color: '#fff', padding: '6px 10px', borderRadius: 6,
          fontSize: 11, fontWeight: 500, lineHeight: 1.4, width: 'max-content', maxWidth: 240,
          whiteSpace: 'normal', textAlign: 'left', letterSpacing: 0, textTransform: 'none',
          zIndex: 1000, pointerEvents: 'none', boxShadow: '0 4px 14px rgba(0,0,0,.2)',
        }}>{text}</span>
      )}
    </span>
  );
}

const CATEGORIES = ['PM', 'Material', 'Subcon', 'Spares', 'Other LOB/MISC'];

// Live health, same thresholds as Portfolio
function liveHealth(p) {
  if (!p.budget || p.budget <= 0) return 'ok';
  const v = (p.eac - p.budget) / p.budget;
  if (v > 0.25) return 'bad';
  if (v > 0.10) return 'warn';
  return 'ok';
}

// Map wbs_suffix to category (PRD §4.6)
function suffixToCategory(suffix) {
  if (!suffix) return null;
  const map = { '1-1': 'PM', '1-2': 'Material', '1-3': 'Subcon', '1-4': 'Spares', '1-5': 'Other LOB/MISC' };
  // Exact match first, then last two dash-separated segments (e.g. '002-1-2' → '1-2')
  const s = String(suffix);
  if (map[s]) return map[s];
  const parts = s.split('-');
  return map[parts.slice(-2).join('-')] || null;
}

function healthLabel(s) {
  return s === 'ok' ? 'On Track' : s === 'warn' ? 'At Risk' : s === 'bad' ? 'Off Track' : 'Not Assessed';
}
function healthColor(s) {
  return s === 'ok' ? C.fav : s === 'warn' ? C.attn : s === 'bad' ? C.adverse : C.neutral;
}

function HealthBadge({ status }) {
  const col = healthColor(status);
  return (
    <span className="project-health-badge" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      background: col + '18', color: col, border: `1px solid ${col}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, display: 'inline-block' }} />
      {healthLabel(status)}
    </span>
  );
}

function PmAssignmentControl({ project, users, session, onSaved }) {
  const pmUsers = users.filter(u => u.role === 'Project Manager' && u.is_active !== false);
  const initialIds = project.pmUserIds?.length
    ? project.pmUserIds
    : (project.pmUserId != null ? [Number(project.pmUserId)] : []);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(initialIds);
  const [lead, setLead] = useState(project.pmUserId != null ? Number(project.pmUserId) : (initialIds[0] || null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef();

  useEffect(() => {
    const ids = project.pmUserIds?.length
      ? project.pmUserIds
      : (project.pmUserId != null ? [Number(project.pmUserId)] : []);
    setSelected(ids);
    setLead(project.pmUserId != null ? Number(project.pmUserId) : (ids[0] || null));
    setError('');
    setSaved(false);
  }, [project.id, project.pmUserId, (project.pmUserIds || []).join(',')]);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  function toggleUser(id) {
    setSaved(false);
    setSelected(prev => {
      const has = prev.includes(id);
      const next = has ? prev.filter(v => v !== id) : [...prev, id];
      if (has && lead === id) setLead(next[0] || null);
      if (!has && lead == null) setLead(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await api.post(`/api/projects/${encodeURIComponent(project.id)}/pm-assignments`, {
        user_ids: selected,
        lead_user_id: selected.includes(lead) ? lead : (selected[0] || null),
        user_id: session?.id || null,
      });
      onSaved?.(updated);
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setError(e.message || 'Could not save PM assignments');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pm-assign">
      <button className="btn btn-ghost btn-sm pm-assign-trigger" onClick={() => setOpen(v => !v)}>
        Manage PMs
        <span className="pm-assign-count">{selected.length}</span>
        {saved && <span className="pm-assign-saved-dot" title="Saved" />}
      </button>
      {open && (
        <div className="pm-assign-popover">
          <div className="pm-assign-head">
            <div>
              <div className="pm-assign-title">Project Managers</div>
              <div className="pm-assign-sub">Tick all assigned PMs and choose the lead.</div>
            </div>
          </div>
          <div className="pm-assign-list">
            {pmUsers.map(u => {
              const id = Number(u.id);
              const checked = selected.includes(id);
              return (
                <label key={u.id} className={`pm-assign-row${checked ? ' checked' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleUser(id)} />
                  <span className="pm-assign-avatar">{u.initials}</span>
                  <span className="pm-assign-name">{u.full_name}</span>
                  <input
                    type="radio"
                    name={`lead-pm-${project.id}`}
                    checked={checked && lead === id}
                    disabled={!checked}
                    onChange={() => setLead(id)}
                    title="Lead PM"
                  />
                  <span className="pm-assign-lead">Lead</span>
                </label>
              );
            })}
            {pmUsers.length === 0 && (
              <div className="pm-assign-empty">No active Project Manager users found.</div>
            )}
          </div>
          {error && <div className="pm-assign-error">{error}</div>}
          {saved && !error && <div className="pm-assign-saved">PM assignments saved.</div>}
          <div className="pm-assign-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-secondary btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save PMs'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// PRD §5.4.2: Cost category table row
function CatRow({ cat, onSelect, selected }) {
  const variance = cat.budget - cat.eac;
  const varPct   = cat.budget > 0 ? (variance / cat.budget) * 100 : 0;
  const col      = variance >= 0 ? C.fav : varPct < -5 ? C.adverse : C.attn;
  return (
    <tr className={selected ? 'row-warn' : ''} onClick={() => onSelect(cat.name)}
      style={{ cursor: 'pointer' }}>
      <td>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
          {cat.name}
        </span>
      </td>
      <td className="num">{fmt(cat.budget)}</td>
      <td className="num" style={{ color: C.actual }}>{fmt(cat.actual)}</td>
      <td className="num" style={{ color: C.committed }}>{fmt(cat.committed)}</td>
      <td className="num" style={{ color: C.forecast }}>{fmt(cat.etc)}</td>
      <td className="num" style={{ fontWeight: 700 }}>{fmt(cat.eac)}</td>
      <td>
        <span style={{ color: col, fontWeight: 700, fontSize: 12 }}>
          {variance >= 0 ? '+' : ''}{fmtShort(variance)}
          <span style={{ fontWeight: 400, opacity: 0.75, fontSize: 11, marginLeft: 4 }}>
            ({varPct.toFixed(1)}%)
          </span>
        </span>
      </td>
    </tr>
  );
}

// Derive category breakdown from subjobs
function buildCategories(subjobs) {
  const totals = {};
  CATEGORIES.forEach(c => {
    totals[c] = { name: c, color: CAT_COLORS[c], budget: 0, actual: 0, committed: 0, etc: 0, eac: 0 };
  });

  let hadData = false;
  (subjobs || []).forEach(s => {
    const cat = suffixToCategory(s.suffix);
    if (!cat) return;
    hadData = true;
    totals[cat].budget    += s.budget || 0;
    totals[cat].actual    += s.actual || 0;
    totals[cat].committed += s.committed || 0;
    totals[cat].etc       += s.etc || 0;
    totals[cat].eac       += (s.actual || 0) + (s.committed || 0) + (s.etc || 0);
  });

  return CATEGORIES.map(c => totals[c]);
}

// Build Revenue & Cash chart series (PRD §5.2)
function buildRevSeries(p) {
  const n = 12;
  const budget  = p.budget || 1;
  const cv      = p.contractValue || budget * 1.2;
  const rev     = p.revRecognised || 0;
  const cash    = p.progressBilling || 0;

  const labels = Array.from({ length: n }, (_, i) =>
    new Date(2026, i, 1).toLocaleString('default', { month: 'short' }));

  const asAtIdx = 6; // Jul 2026 (matches As at date)

  // Budgeted revenue: linear ramp to contract value
  const budRevValues = labels.map((_, i) => Math.round(cv * (i / (n - 1))));

  // Revenue recognised actual (up to asAt) + forecast (after)
  const revActual   = labels.map((_, i) => i <= asAtIdx ? Math.round(rev * (i / asAtIdx)) : null);
  const revForecast = labels.map((_, i) => i >= asAtIdx ? Math.round(rev + (cv - rev) * ((i - asAtIdx) / (n - 1 - asAtIdx))) : null);
  revForecast[asAtIdx] = revActual[asAtIdx]; // connect at boundary

  // Cash received: linear ramp to current progress_billing value (single cumulative total from SAP PB column)
  const cashValues = labels.map((_, i) => i <= asAtIdx ? Math.round(cash * (i / asAtIdx)) : null);

  // Milestone payment markers (orange squares) on the cash line, up to as-at
  const milestones = [1, 3, 5]
    .filter(i => i <= asAtIdx && cashValues[i] != null)
    .map(i => ({ index: i, value: cashValues[i] }));

  return { labels, budRevValues, revActual, revForecast, cashValues, asAtIdx, milestones };
}

// GP chart data (PRD §5.3)
// All values computed from live DB fields — no placeholder fallbacks.
function buildGpSeries(p) {
  const cv        = p.contractValue || 0;
  const budgetGp  = cv > 0 ? ((cv - p.budget) / cv) * 100 : 0;
  const forecastGp = cv > 0 ? ((cv - p.eac)   / cv) * 100 : 0;
  // Recognition GP: margin earned on recognised revenue vs cost incurred to date
  const rev       = p.revRecognised || 0;
  const actual    = p.actual || 0;
  const recognitionGp = rev > 0 ? ((rev - actual) / rev) * 100 : budgetGp;

  return {
    budgetGp:      budgetGp.toFixed(1),
    recognitionGp: recognitionGp.toFixed(1),
    forecastGp:    forecastGp.toFixed(1),
    variance:      (forecastGp - budgetGp).toFixed(1),
    gpStatus:      forecastGp >= budgetGp * 0.95 ? 'ok' : forecastGp >= budgetGp * 0.85 ? 'warn' : 'bad',
  };
}

// GP % timeline for the Actual-GP-vs-Budget-GP chart (PRD §5.3) — ACTUAL | FORECAST
function buildGpTimeline(p, labels, asAtIdx) {
  const cv           = p.contractValue || 0;
  const budgetGp     = cv > 0 ? ((cv - p.budget) / cv) * 100 : 0;
  const forecastGp   = cv > 0 ? ((cv - p.eac)   / cv) * 100 : 0;
  const rev          = p.revRecognised || 0;
  const actual       = p.actual || 0;
  const recognitionGp = rev > 0 ? ((rev - actual) / rev) * 100 : budgetGp;
  const n = labels.length;

  const budgetLine = labels.map(() => +budgetGp.toFixed(1));
  const actualLine = labels.map((_, i) => {
    if (i > asAtIdx) return null;
    const t = asAtIdx > 0 ? i / asAtIdx : 1;
    const start = recognitionGp * 0.55;
    return +(start + (recognitionGp - start) * t).toFixed(1);
  });
  const forecastLine = labels.map((_, i) => {
    if (i < asAtIdx) return null;
    const t = (n - 1 - asAtIdx) > 0 ? (i - asAtIdx) / (n - 1 - asAtIdx) : 1;
    return +(recognitionGp + (forecastGp - recognitionGp) * t).toFixed(1);
  });
  forecastLine[asAtIdx] = actualLine[asAtIdx];

  return { budgetLine, actualLine, forecastLine, budgetGp, recognitionGp, forecastGp };
}

// ── Cross-module monthly rollup (Labour + Material + Sub-Con) ─────────────
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ROLLUP_BUCKETS = [
  { key: 'labour',   label: 'Labour',   color: CAT_COLORS['PM'], match: (c) => c === 'labour' },
  { key: 'material', label: 'Material', color: CAT_COLORS['Material'], match: (c) => ['material', 'materials', 'hardware', 'software', 'licence', 'license'].includes(c) },
  { key: 'subcon',   label: 'Sub-Con',  color: CAT_COLORS['Subcon'],  match: (c) => ['subcon', 'subcontract', 'sub-con'].includes(c) },
];

function bucketFor(costCategory) {
  const c = String(costCategory || '').toLowerCase();
  return ROLLUP_BUCKETS.find(b => b.match(c)) || null;
}

function monthAbs(year, month) {
  return Number(year) * 12 + Number(month) - 1;
}

function monthFromAbs(abs) {
  return { year: Math.floor(abs / 12), month: (abs % 12) + 1 };
}

function completeMonthlySeries(months) {
  if (!months.length) return [];
  const startAbs = Math.min(...months.map(m => monthAbs(m.year, m.month)));
  const endAbs = Math.max(...months.map(m => monthAbs(m.year, m.month)));
  const byMonth = new Map(months.map(m => [monthAbs(m.year, m.month), m]));
  const series = [];

  for (let abs = startAbs; abs <= endAbs; abs++) {
    const { year, month } = monthFromAbs(abs);
    const src = byMonth.get(abs);
    series.push({
      key: `${year}-${month}`,
      year,
      month,
      label: `${MONTH_ABBR[month - 1]} '${String(year).slice(2)}`,
      labour: src?.labour || 0,
      material: src?.material || 0,
      subcon: src?.subcon || 0,
      total: src?.total || 0,
    });
  }

  return series;
}

// Monthly stacked spend bars with a cumulative total-spend trajectory line overlay.
function PlannedSpendChart({ months, height = 220 }) {
  const padL = 44, padR = 8, padT = 12, padB = 36;
  const n = months.length;
  const colW = n <= 12 ? 72 : n <= 36 ? 58 : 48;
  const innerW = n * colW;
  const totalW = padL + innerW + padR;
  const H = height - padT - padB;

  const maxMonthly = Math.max(...months.map(m => m.total), 1);
  const grandTotal = months.reduce((a, m) => a + m.total, 0) || 1;

  const yOf = (v) => padT + H - (v / maxMonthly) * H;

  // cumulative line points (scaled to grand total, sharing the same axis top)
  let cum = 0;
  const cumPts = months.map((m, i) => {
    cum += m.total;
    const x = padL + i * colW + colW / 2;
    const y = padT + H - (cum / grandTotal) * H;
    return { x, y, cum };
  });
  const linePath = cumPts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');

  function fmtAxis(v) {
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return String(Math.round(v));
  }

  return (
    <div className="planned-spend-chart-scroll" style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${totalW} ${height}`} width={totalW} height={height}
        style={{ width: totalW, minWidth: totalW, height, display: 'block' }}>
        {/* gridlines + left axis */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = padT + H - f * H;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={totalW - padR} y2={y} stroke="var(--border)" strokeWidth="1" opacity="0.4" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-3)">{fmtAxis(maxMonthly * f)}</text>
            </g>
          );
        })}
        {/* stacked bars */}
        {months.map((m, i) => {
          const x = padL + i * colW + colW * 0.16;
          const bw = colW * 0.68;
          let yCursor = padT + H;
          return (
            <g key={i}>
              {ROLLUP_BUCKETS.map((b) => {
                const val = m[b.key];
                if (!val) return null;
                const h = (val / maxMonthly) * H;
                yCursor -= h;
                return <rect key={b.key} x={x} y={yCursor} width={bw} height={Math.max(h, 0.5)} fill={b.color} opacity={0.9} />;
              })}
              <text x={x + bw / 2} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--text-3)">
                {m.label}
              </text>
              <text x={x + bw / 2} y={height - 20} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-2)">
                {fmtAxis(m.total)}
              </text>
            </g>
          );
        })}
        {/* cumulative trajectory line */}
        <path d={linePath} fill="none" stroke={C.forecast} strokeWidth="2" />
        {cumPts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="2.5" fill={C.forecast} />)}
      </svg>
    </div>
  );
}

function PlannedSpendRollup({ projectId }) {
  const { data, loading } = useEacMonthly(projectId);

  const months = React.useMemo(() => {
    if (!data) return [];
    const rowCat = {};
    (data.rows || []).forEach(r => { rowCat[r.id] = r.cost_category; });
    const acc = {}; // 'year-month' → bucket sums
    (data.values || []).forEach(v => {
      const b = bucketFor(rowCat[v.row_id]);
      if (!b) return;
      const key = `${v.year}-${v.month}`;
      if (!acc[key]) acc[key] = { year: v.year, month: v.month, labour: 0, material: 0, subcon: 0 };
      acc[key][b.key] += (Number(v.amount_k) || 0) * 1000; // amount_k is thousands
    });
    const arr = Object.values(acc)
      .map(m => ({ ...m, total: m.labour + m.material + m.subcon }))
      .sort((a, b) => (a.year - b.year) || (a.month - b.month));
    return completeMonthlySeries(arr);
  }, [data]);

  const totals = React.useMemo(() => {
    const t = months.reduce((a, m) => ({
      labour: a.labour + m.labour, material: a.material + m.material,
      subcon: a.subcon + m.subcon, total: a.total + m.total,
    }), { labour: 0, material: 0, subcon: 0, total: 0 });
    const peak = months.reduce((best, m) => (m.total > (best?.total || 0) ? m : best), null);
    return { ...t, peak };
  }, [months]);

  if (loading) return null;

  return (
    <div className="card planned-spend-card" style={{ marginBottom: 24 }}>
      <div className="planned-spend-header" style={{ padding: '12px 20px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Planned Spend by Month</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            Cross-module rollup — Labour + Material + Sub-Con, showing the total planned spend trajectory.
          </div>
        </div>
        <div className="chart-legend" style={{ margin: 0 }}>
          {ROLLUP_BUCKETS.map(b => (
            <div key={b.key} className="legend-item">
              <div className="legend-swatch" style={{ background: b.color }} />
              <span>{b.label}</span>
            </div>
          ))}
          <div className="legend-item">
            <div className="legend-swatch" style={{ background: 'transparent', borderTop: `2px solid ${C.forecast}` }} />
            <span>Cumulative total</span>
          </div>
        </div>
      </div>

      {months.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          No monthly cost plan yet. Add Labour, Material or Sub-Con lines to the monthly EAC grid to see the spend trajectory.
        </div>
      ) : (
        <>
          <div className="planned-spend-kpis" style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Labour',       value: totals.labour,   color: CAT_COLORS['PM'] },
              { label: 'Material',     value: totals.material, color: CAT_COLORS['Material'] },
              { label: 'Sub-Con',      value: totals.subcon,   color: CAT_COLORS['Subcon'] },
              { label: 'Total planned', value: totals.total,   color: 'var(--text-1)', strong: true },
              { label: 'Peak month',   text: totals.peak ? `${MONTH_ABBR[totals.peak.month - 1]} ${totals.peak.year}` : '—',
                sub: totals.peak ? fmtShort(totals.peak.total) : '', color: 'var(--text-1)' },
            ].map((k, i, a) => (
              <div className="planned-spend-kpi" key={k.label} style={{ flex: 1, padding: '12px 20px', borderRight: i < a.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value" style={{ fontSize: k.strong ? 20 : 17, color: k.color }}>
                  {k.text != null ? k.text : fmtShort(k.value)}
                </div>
                {k.sub && <div className="kpi-sub">{k.sub}</div>}
              </div>
            ))}
          </div>
          <div className="planned-spend-chart-shell" style={{ padding: '14px 16px' }}>
            <PlannedSpendChart months={months} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────
function TabOverview({ p, navigate }) {
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    setAlertsLoading(true);
    api.get(`/api/alerts?project_id=${encodeURIComponent(p.id)}`)
      .then(data => setAlerts(data))
      .catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false));
  }, [p.id]);

  const etc = Math.max(0, p.eac - p.actual - p.committed);

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* KPI summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Budget',         value: fmtShort(p.budget),    color: C.budget,    tip: 'Approved Budget (PRD §7)' },
          { label: 'EAC',            value: fmtShort(p.eac),       color: C.forecast,  tip: 'Estimate at Completion = Actual + ETC' },
          { label: 'Actual Cost',    value: fmtShort(p.actual),    color: C.actual,    tip: 'Cumulative posted cost in SAP' },
          { label: 'Committed',      value: fmtShort(p.committed), color: C.committed, tip: 'Open contractual commitments' },
          { label: 'ETC',            value: fmtShort(etc),         color: C.forecast,  tip: 'Remaining forecast cost' },
          { label: 'EAC Variance',   value: fmtShort(p.budget - p.eac), color: p.budget >= p.eac ? C.fav : C.adverse, tip: 'Budget minus EAC' },
        ].map(k => (
          <div key={k.label} className="kpi-tile" title={k.tip}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 20, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Cross-module monthly rollup (Labour + Material + Sub-Con) */}
      <PlannedSpendRollup projectId={p.id} />

      {/* Alerts */}
      {alertsLoading ? (
        <div style={{ marginBottom: 24 }}>
          <div className="skel skel-text" style={{ width: 80, marginBottom: 8 }} />
          <div className="skel skel-row" style={{ marginBottom: 6 }} />
          <div className="skel skel-row" style={{ width: '80%' }} />
        </div>
      ) : alerts.length > 0 ? (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label">
            Alerts
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--text-3)' }}>
              {alerts.filter(a => a.kind === 'adv').length > 0 &&
                <span style={{ color: C.adverse, fontWeight: 700, marginRight: 8 }}>
                  {alerts.filter(a => a.kind === 'adv').length} adverse
                </span>}
              {alerts.filter(a => a.kind === 'attn').length > 0 &&
                <span style={{ color: C.attn, fontWeight: 700, marginRight: 8 }}>
                  {alerts.filter(a => a.kind === 'attn').length} attention
                </span>}
              {alerts.filter(a => a.kind === 'info').length > 0 &&
                <span style={{ color: C.neutral }}>
                  {alerts.filter(a => a.kind === 'info').length} info
                </span>}
            </span>
          </div>
          {alerts.map((a, i) => (
            <div key={i} className={`alert-item alert-${a.kind}`}>
              <div>
                <div className="alert-text">{a.text}</div>
                {a.sub && <div className="alert-sub">{a.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label">Alerts</div>
          <div style={{ color: C.fav, fontSize: 13, padding: '10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={16} /> No active alerts — project is on track.
          </div>
        </div>
      )}

    </div>
  );
}

// ── Tab: Revenue & Cash (PRD §5.2) ────────────────────────────────────────
function TabRevenueCash({ p }) {
  const { labels, budRevValues, revActual, revForecast, cashValues, asAtIdx, milestones } = buildRevSeries(p);
  const cv         = p.contractValue || 0;
  const rev        = p.revRecognised || 0;
  const cash       = p.progressBilling || 0;
  const cashRevVar = cash - rev;
  const gpT        = buildGpTimeline(p, labels, asAtIdx);

  return (
    <div className="revcash-page" style={{ padding: '24px 28px' }}>
      {/* Summary panel (PRD §5.2.2) */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Revenue Recognised', value: fmtShort(rev),
            sub: cv > 0 ? `${((rev / cv) * 100).toFixed(1)}% of contract` : '—' },
          { label: 'Cash Received',       value: fmtShort(cash),
            sub: cv > 0 ? `${((cash / cv) * 100).toFixed(1)}% of contract` : '—' },
          { label: 'Cash vs Rev Variance', value: fmtShort(Math.abs(cashRevVar)),
            sub: cashRevVar >= 0 ? 'Cash ahead' : 'Rev ahead',
            col: cashRevVar >= 0 ? C.fav : C.attn },
          { label: 'Outstanding Rec.',    value: fmtShort(Math.max(0, rev - cash)),
            sub: 'Invoiced not collected' },
          { label: 'Next Milestone',      value: '—', sub: 'No upcoming milestone' },
        ].map(k => (
          <div key={k.label} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 18, color: k.col }}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* GP Correlation panel — links recognition (this tab) to forecast (Forecast tab) */}
      {(() => {
        const cv  = p.contractValue || 0;
        const bgp = cv > 0 ? ((cv - p.budget) / cv) * 100 : null;
        const rgp = rev > 0 ? ((rev - (p.actual || 0)) / rev) * 100 : null;
        const fgp = cv > 0 ? ((cv - p.eac) / cv) * 100 : null;
        const tiles = [
          { label: 'Budget GP%',      value: bgp,  sub: 'Original plan margin' },
          { label: 'Recognition GP%', value: rgp,  sub: 'Earned on rev recognised vs actuals' },
          { label: 'Forecast GP%',    value: fgp,  sub: 'Full project — driven by ETC in Forecast tab' },
        ];
        const col = (v) => v == null || bgp == null ? C.neutral
          : v >= bgp * 0.95 ? C.fav
          : v >= bgp * 0.85 ? C.attn
          : C.adverse;
        return (
          <div className="card gp-correlation-card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '12px 20px 10px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Gross Profit Correlation</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                Recognition GP reflects revenue recognised vs cost incurred. Forecast GP updates live when ETC is changed in the Forecast tab.
              </div>
            </div>
            <div className="gp-correlation-grid" style={{ display: 'flex', gap: 0 }}>
              {tiles.map((t, i) => (
                <div key={i} className="gp-correlation-tile" style={{ flex: 1, padding: '14px 20px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div className="kpi-label">{t.label}</div>
                  <div className="kpi-value" style={{ fontSize: 22, color: col(t.value) }}>
                    {t.value != null ? t.value.toFixed(1) + '%' : '—'}
                  </div>
                  <div className="kpi-sub">{t.sub}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Timeline visualizations (PRD §5.2 + §5.3) — ACTUAL | FORECAST, side by side */}
      <div className="revcash-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* 1. Revenue Recognition vs Budget vs Cash Inflow */}
        <div className="card revcash-chart-card">
          <div className="revcash-card-header" style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Revenue Recognition vs Budget vs Cash Inflow</div>
            <div className="revcash-card-subtitle" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              With timeline — cumulative (S$M)
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.fav, display: 'inline-block' }} />
              <span>On track</span>
            </div>
          </div>
          <div className="revcash-chart-body" style={{ display: 'flex', gap: 12, padding: '12px 16px' }}>
            <div className="revcash-chart-main" style={{ flex: 1, minWidth: 0 }}>
              <div className="chart-legend" style={{ marginBottom: 8 }}>
                {[
                  { color: C.budget,    label: 'Budgeted Revenue (cumulative)', dashed: true },
                  { color: C.actual,    label: 'Revenue Recognised (actual)' },
                  { color: C.cash,      label: 'Customer Cash Received' },
                  { color: C.milestone, label: 'Milestone payment', square: true },
                ].map((l, i) => (
                  <div key={i} className="legend-item">
                    <div className="legend-swatch" style={{
                      background: l.dashed ? 'transparent' : l.color,
                      borderTop: l.dashed ? `2px dashed ${l.color}` : 'none',
                      borderRadius: l.square ? 1 : undefined }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
              <MultiSeriesLineChart
                zones
                series={[
                  { label: 'Budgeted Revenue',            values: budRevValues, color: C.budget, dashed: true, strokeWidth: 1.5 },
                  { label: 'Revenue Recognised Actual',   values: revActual,   color: C.actual, markers: true },
                  { label: 'Revenue Recognised Forecast', values: revForecast, color: C.actual, dashed: true, opacity: 0.6 },
                  { label: 'Customer Cash Received',      values: cashValues,  color: C.cash,   strokeWidth: 2, markers: true },
                ]}
                labels={labels}
                asAtIndex={asAtIdx}
                milestones={milestones}
                height={230}
              />
            </div>
            <div className="revcash-side-stats" style={{ width: 128, flexShrink: 0, borderLeft: '1px solid var(--border)', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="revcash-asat" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>As at <strong style={{ color: 'var(--text-2)' }}>{fmtAsAt()}</strong></div>
              <div className="revcash-stat">
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Revenue Recognised</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtShort(rev)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{cv > 0 ? `${((rev / cv) * 100).toFixed(1)}%` : '—'}</div>
              </div>
              <div className="revcash-stat">
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Cash Received</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtShort(cash)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{cv > 0 ? `${((cash / cv) * 100).toFixed(1)}%` : '—'}</div>
              </div>
              <div className="revcash-stat">
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Variance (Cash vs Rev)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: cashRevVar >= 0 ? C.fav : C.adverse }}>
                  {cashRevVar >= 0 ? '' : '('}{fmtShort(Math.abs(cashRevVar))}{cashRevVar >= 0 ? '' : ')'}
                </div>
                <div style={{ fontSize: 10, color: cashRevVar >= 0 ? C.fav : C.adverse }}>
                  {rev > 0 ? `${cashRevVar >= 0 ? '+' : '-'}${Math.abs((cashRevVar / rev) * 100).toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Actual GP vs Budget GP */}
        <div className="card revcash-chart-card">
          <div className="revcash-card-header" style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Actual GP vs Budget GP</div>
            <div className="revcash-card-subtitle" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              With timeline — GP %
              <span style={{ width: 7, height: 7, borderRadius: '50%',
                background: gpT.forecastGp >= gpT.budgetGp * 0.95 ? C.fav : gpT.forecastGp >= gpT.budgetGp * 0.85 ? C.attn : C.adverse,
                display: 'inline-block' }} />
              <span>{gpT.forecastGp >= gpT.budgetGp * 0.95 ? 'On track' : gpT.forecastGp >= gpT.budgetGp * 0.85 ? 'At risk' : 'Off track'}</span>
            </div>
          </div>
          <div className="revcash-chart-body" style={{ display: 'flex', gap: 12, padding: '12px 16px' }}>
            <div className="revcash-chart-main" style={{ flex: 1, minWidth: 0 }}>
              <div className="chart-legend" style={{ marginBottom: 8 }}>
                {[
                  { color: C.budget, label: 'GP % (Budget)', dashed: true },
                  { color: C.fav,    label: 'GP % (Actual)' },
                ].map((l, i) => (
                  <div key={i} className="legend-item">
                    <div className="legend-swatch" style={{
                      background: l.dashed ? 'transparent' : l.color,
                      borderTop: l.dashed ? `2px dashed ${l.color}` : 'none' }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
              <MultiSeriesLineChart
                zones
                unit="%"
                series={[
                  { label: 'GP % (Budget)',   values: gpT.budgetLine,   color: C.budget, dashed: true, strokeWidth: 1.5 },
                  { label: 'GP % (Actual)',   values: gpT.actualLine,   color: C.fav,    strokeWidth: 2, markers: true },
                  { label: 'GP % (Forecast)', values: gpT.forecastLine, color: C.fav,    dashed: true, opacity: 0.6 },
                ]}
                labels={labels}
                asAtIndex={asAtIdx}
                height={230}
              />
            </div>
            <div className="revcash-side-stats" style={{ width: 128, flexShrink: 0, borderLeft: '1px solid var(--border)', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="revcash-asat" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>As at <strong style={{ color: 'var(--text-2)' }}>{fmtAsAt()}</strong></div>
              <div className="revcash-stat">
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>GP % (Actual)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.fav }}>{gpT.recognitionGp.toFixed(1)}%</div>
              </div>
              <div className="revcash-stat">
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>GP % (Budget)</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{gpT.budgetGp.toFixed(1)}%</div>
              </div>
              <div className="revcash-stat">
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Variance</div>
                <div style={{ fontSize: 15, fontWeight: 700,
                  color: (gpT.forecastGp - gpT.budgetGp) >= 0 ? C.fav : C.adverse }}>
                  {(gpT.forecastGp - gpT.budgetGp) >= 0 ? '+' : ''}{(gpT.forecastGp - gpT.budgetGp).toFixed(1)}pp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Cost Performance (PRD §5.4) ──────────────────────────────────────
function TabCost({ p }) {
  const { etc: etcData } = useEtc(p.id);
  const rates = useRates();
  const [selCat, setSelCat] = useState(null);

  // Labour (PM) splits by the Resource Plan lock boundary, so the two
  // screens agree: Committed = locked (fully-elapsed quarters), ETC = unlocked
  // (current/future quarters). Rates × FTE per month, same as the Resource Plan.
  const startAbs = (p.startYear ?? 2026) * 12 + (p.startMonth ?? 0);
  const nowAbs   = new Date().getFullYear() * 12 + new Date().getMonth();
  const isLockedMonth = (i) => { const q = Math.floor((startAbs + i) / 3); return q * 3 + 2 < nowAbs; };
  const rateOf = (grade) => rates.find(x => x.grade === grade)?.monthly || 0;
  let labourCommitted = 0, labourEtc = 0;
  (p.resources || []).forEach(r => {
    const rate = rateOf(r.grade);
    (r.fte || []).forEach((v, i) => {
      const cost = (parseFloat(v) || 0) * rate;
      if (isLockedMonth(i)) labourCommitted += cost; else labourEtc += cost;
    });
  });

  // Material / Sub-Con committed & ETC come from their project-level registers:
  // a line item with a purchase date is Committed, otherwise it is ETC.
  const derived = etcData?.totals || {
    labour_etc: 0, material_etc: 0, subcon_etc: 0,
    material_committed: 0, subcon_committed: 0, etc_total: 0,
  };
  const committedByCategory = {
    'PM':       labourCommitted,
    'Material': Number(derived.material_committed) || 0,
    'Subcon':   Number(derived.subcon_committed)   || 0,
  };
  const etcByCategory = {
    'PM':       labourEtc,
    'Material': Number(derived.material_etc) || 0,
    'Subcon':   Number(derived.subcon_etc)   || 0,
    'Spares':   0,
    'Other LOB/MISC': 0,
  };
  const cats = buildCategories(p.subjobs).map(c => {
    const etc       = c.name in etcByCategory       ? etcByCategory[c.name]       : c.etc;
    const committed = c.name in committedByCategory ? committedByCategory[c.name] : c.committed;
    return { ...c, committed, etc, eac: c.actual + committed + etc };
  });

  const totalBudget    = cats.reduce((a, c) => a + c.budget,    0) || p.budget;
  const totalActual    = cats.reduce((a, c) => a + c.actual,    0) || p.actual;
  const totalCommitted = cats.reduce((a, c) => a + c.committed, 0);
  const totalEtc       = cats.reduce((a, c) => a + c.etc,       0);
  // Bottom-up sub-job/category EAC (shown in the table)
  const subJobEac   = cats.reduce((a, c) => a + c.eac, 0);
  const forecastEac = totalActual + totalCommitted + totalEtc;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Forecast summary KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <div className="kpi-tile">
          <div className="kpi-label"><Tip text="Total Estimate to Complete — the remaining cost you expect to spend across all categories to finish the project.">Total ETC (forecast)</Tip></div>
          <div className="kpi-value" style={{ fontSize: 20, color: C.forecast }}>{fmtShort(totalEtc)}</div>
          <div className="kpi-sub">Remaining cost to complete</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label"><Tip text="Estimate at Completion = Actual + Committed + ETC. The total projected final cost of the project.">Forecast EAC</Tip></div>
          <div className="kpi-value" style={{ fontSize: 20, color: forecastEac > p.budget ? C.adverse : C.fav }}>
            {fmtShort(forecastEac)}
          </div>
          <div className="kpi-sub">Actual + Committed + ETC</div>
        </div>
        <div className="kpi-tile">
          {(() => {
            const cv = p.contractValue || 0;
            const fgp = cv > 0 ? ((cv - forecastEac) / cv) * 100 : null;
            const bgp = cv > 0 ? ((cv - p.budget)    / cv) * 100 : null;
            const col = fgp == null ? C.neutral
              : fgp >= (bgp ?? 0) * 0.95 ? C.fav
              : fgp >= (bgp ?? 0) * 0.85 ? C.attn
              : C.adverse;
            return (
              <>
                <div className="kpi-label"><Tip text="Forecast Gross Profit % = (Contract Value − Forecast EAC) ÷ Contract Value. Projected margin at completion, compared to the budgeted margin.">Forecast GP%</Tip></div>
                <div className="kpi-value" style={{ fontSize: 20, color: col }}>
                  {fgp != null ? fgp.toFixed(1) + '%' : '—'}
                </div>
                <div className="kpi-sub">
                  {bgp != null ? `Budget: ${bgp.toFixed(1)}%` : 'No contract value'}
                </div>
              </>
            );
          })()}
        </div>
        <div className="kpi-tile">
          {(() => {
            const varAmt = p.budget - forecastEac;
            const varPct = p.budget > 0 ? (varAmt / p.budget) * 100 : 0;
            const col = varAmt >= 0 ? C.fav : Math.abs(varPct) > 5 ? C.adverse : C.attn;
            return (
              <>
                <div className="kpi-label"><Tip text="Budget − Forecast EAC. Positive (green) means the project is expected to finish under budget; negative (red) signals a projected overrun.">Budget Variance</Tip></div>
                <div className="kpi-value" style={{ fontSize: 20, color: col }}>
                  {varAmt >= 0 ? '+' : ''}{fmtShort(varAmt)}
                </div>
                <div className="kpi-sub">
                  {varAmt >= 0 ? 'Under budget' : 'Over budget'} · {varPct >= 0 ? '+' : ''}{varPct.toFixed(1)}%
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="proj-2col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Visualisation 1: Budget Utilisation per category */}
        <div className="card card-p">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Budget Utilisation by Category</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>
            Actual + Committed as % of budget. ETC shown as remaining forecast.
          </div>
          {cats.filter(c => c.budget > 0).map(c => {
            const spentPct  = Math.min(100, ((c.actual + c.committed) / c.budget) * 100);
            const etcPct    = Math.min(100 - spentPct, (c.etc / c.budget) * 100);
            const overrun   = (c.actual + c.committed) > c.budget;
            return (
              <div key={c.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block' }} />
                    {c.name}
                  </span>
                  <span style={{ fontSize: 11, color: overrun ? C.adverse : 'var(--text-3)' }}>
                    {spentPct.toFixed(0)}% spent · {fmtShort(c.budget - c.actual - c.committed - c.etc)} remaining
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${spentPct}%`, background: overrun ? C.adverse : c.color, borderRadius: '4px 0 0 4px', transition: 'width 0.4s' }} />
                  {etcPct > 0 && (
                    <div style={{ position: 'absolute', left: `${spentPct}%`, top: 0, height: '100%',
                      width: `${etcPct}%`, background: C.forecast, opacity: 0.45 }} />
                  )}
                </div>
              </div>
            );
          })}
          {cats.every(c => c.budget === 0) && (
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No category budget data available.</div>
          )}
        </div>

        {/* Visualisation 2: EAC vs Budget — horizontal variance bars */}
        <div className="card card-p">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>EAC vs Budget Variance</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>
            Positive = under budget &nbsp;·&nbsp; Negative = overrun
          </div>
          {(() => {
            const active = cats.filter(c => c.budget > 0);
            const maxAbs = Math.max(...active.map(c => Math.abs(c.budget - c.eac)), 1);
            return active.map(c => {
              const variance = c.budget - c.eac;
              const pct = Math.min(100, (Math.abs(variance) / maxAbs) * 100);
              const col = variance >= 0 ? C.fav : Math.abs(variance) / c.budget > 0.25 ? C.adverse : C.attn;
              return (
                <div key={c.name} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block' }} />
                      {c.name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: col }}>
                      {variance >= 0 ? '+' : ''}{fmtShort(variance)}
                    </span>
                  </div>
                  <div style={{ height: 10, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: col, borderRadius: 4, transition: 'width 0.4s',
                      marginLeft: variance >= 0 ? 0 : 'auto',
                    }} />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Cost Category Numerical Table (PRD §5.4.2) */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ color: C.budget }}>Budget</th>
                <th style={{ color: C.actual }}>Actual</th>
                <th style={{ color: C.committed }}>Committed</th>
                <th style={{ color: C.forecast }}>ETC (Forecast)</th>
                <th>EAC</th>
                <th>Variance (Budget−EAC)</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(c => (
                <CatRow key={c.name} cat={c}
                  onSelect={n => setSelCat(prev => prev === n ? null : n)}
                  selected={selCat === c.name} />
              ))}
              <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td>Total</td>
                <td className="num">{fmt(totalBudget)}</td>
                <td className="num" style={{ color: C.actual }}>{fmt(totalActual)}</td>
                <td className="num" style={{ color: C.committed }}>{fmt(totalCommitted)}</td>
                <td className="num" style={{ color: C.forecast }}>{fmt(totalEtc)}</td>
                <td className="num">{fmt(subJobEac)}</td>
                <td>
                  <span style={{ color: totalBudget >= subJobEac ? C.fav : C.adverse, fontWeight: 700 }}>
                    {totalBudget >= subJobEac ? '+' : ''}{fmtShort(totalBudget - subJobEac)}
                  </span>
                </td>
              </tr>
              {subJobEac > 0 && Math.abs(subJobEac - p.eac) > 1 && (
                <tr>
                  <td colSpan={7} style={{ paddingTop: 8, paddingBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.attn, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="alertTriangle" size={13} />
                      Sub-job bottom-up EAC ({fmtShort(subJobEac)}) differs from approved project EAC ({fmtShort(p.eac)}) by {fmtShort(Math.abs(subJobEac - p.eac))}. Update sub-job ETCs or re-baseline.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Reconciliation ───────────────────────────────────────────────────
function TabRecon({ p }) {
  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="card card-p">
        <div className="section-label" style={{ marginBottom: 12 }}>SAP Reconciliation</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="data-freshness">● SAP sync: {fmtSapSync(p.lastSapImport)}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>WBS: {p.wbs || '—'}</span>
        </div>
        <div style={{ marginTop: 16, color: 'var(--text-3)', fontSize: 13 }}>
          No exceptions found. All cost elements are mapped to standard categories.
        </div>
      </div>
    </div>
  );
}

// ── Main Project component ────────────────────────────────────────────────
export default function Project({ projectId, navigate, role, session }) {
  const { project: p, loading, error, updateProject } = useProject(projectId);
  const users = useUsers();
  const [tab, setTab] = useState('overview');

  if (loading) return (
    <div className="screen" style={{ padding: 0 }}>
      {/* skeleton header */}
      <div style={{ padding: '16px 28px 0', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ marginBottom: 14 }}>
          <div className="skel" style={{ width: 90, height: 26, borderRadius: 6, marginBottom: 12 }} />
          <div className="skel skel-title" style={{ width: 320, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skel skel-text" style={{ width: [80, 110, 100, 90][i] }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, paddingBottom: 12 }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skel skel-text" style={{ width: [140, 60, 130, 160][i] }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', paddingTop: 2 }}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="skel" style={{ width: 110, height: 36, borderRadius: 0, margin: '0 2px' }} />
          ))}
        </div>
      </div>
      {/* skeleton body */}
      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
          {Array(6).fill(0).map((_, i) => <div key={i} className="skel skel-kpi" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="skel skel-card" />
          <div className="skel skel-card" />
        </div>
      </div>
    </div>
  );
  if (error || !p) return (
    <div className="screen" style={{ padding: 32 }}>
      <div className="empty-state">
        <div className="empty-state-icon"><Icon name="alertTriangle" size={36} /></div>
        <div className="empty-state-title">Failed to load project</div>
        <div className="empty-state-sub">{error?.message || 'The project could not be found or an error occurred.'}</div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}
          onClick={() => navigate('portfolio')}><Icon name="arrowLeft" size={13} /> Back to Portfolio</button>
      </div>
    </div>
  );

  const cats = buildCategories(p.subjobs);
  const gp   = buildGpSeries(p);
  function applyPmUpdate(updated) {
    const ids = Array.isArray(updated?.pm_user_ids)
      ? updated.pm_user_ids.map(v => Number(v)).filter(Number.isInteger)
      : [];
    const names = String(updated?.pm_names || updated?.pm_name || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    updateProject({
      pm: updated?.pm_names || updated?.pm_name || '(Unassigned)',
      leadPm: updated?.pm_name || names[0] || '(Unassigned)',
      pmNames: names,
      pmUserIds: ids,
      pmUserId: updated?.pm_user_id ?? null,
    });
  }

  const tabs = [
    { id: 'overview',  label: 'Overview'       },
    { id: 'revcash',   label: 'Revenue & Cash'  },
    { id: 'cost',      label: 'Cost/Forecast'   },
  ];

  return (
    <div className="screen" style={{ padding: 0 }}>
      {/* Project Header (PRD §5.1) */}
      <div className="proj-header">
        <div className="proj-header-top">
          <div className="proj-identity">
            <div className="proj-back-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <button className="btn btn-ghost btn-sm"
                onClick={() => navigate('portfolio')}><Icon name="arrowLeft" size={13} /> Portfolio</button>
            </div>
            <div className="proj-title">{p.name}</div>
            <div className="proj-meta">
              <span className="proj-meta-item proj-meta-id"><Icon name="hash" size={13} /> <span className="proj-meta-text">{p.id}</span></span>
              {p.customer && <span className="proj-meta-item proj-meta-customer"><Icon name="building" size={13} /> <span className="proj-meta-text">{p.customer}</span></span>}
              <span className="proj-meta-item proj-meta-people"><Icon name="users" size={13} /> <span className="proj-meta-text">PMs: {p.pm}</span></span>
              <span className="proj-meta-item proj-meta-people"><Icon name="user" size={13} /> <span className="proj-meta-text">PD: {p.pd}</span></span>
              {p.department && <span className="proj-meta-item proj-meta-department"><Icon name="tag" size={13} /> <span className="proj-meta-text">{p.department}</span></span>}
            </div>
          </div>
          <div className="proj-badges">
            <HealthBadge status={liveHealth(p)} />
            <PmAssignmentControl project={p} users={users} session={session} onSaved={applyPmUpdate} />
          </div>
        </div>

        {/* Reporting context */}
        <div className="proj-context">
          <span className="proj-context-item"><Icon name="calendar" size={13} /> <span>As at: <strong>{fmtAsAt()}</strong></span></span>
          <span className="proj-context-item"><Icon name="currency" size={13} /> <span>SGD</span></span>
          <span className="proj-context-item data-freshness"><Icon name="dot" size={10} /> <span>SAP sync: {fmtSapSync(p.lastSapImport)}</span></span>
          <span className="proj-context-item proj-gp-context">
            GP: <strong style={{ color: gp.gpStatus === 'ok' ? C.fav : gp.gpStatus === 'warn' ? C.attn : C.adverse }}>
              {gp.forecastGp}%
            </strong>
            <span className="proj-gp-detail" style={{ color: 'var(--text-3)', marginLeft: 4 }}>
              (budget: {gp.budgetGp}%, var: {Number(gp.variance) >= 0 ? '+' : ''}{gp.variance}pp)
            </span>
          </span>
        </div>

        {/* Tab navigation (PRD §5.1) */}
        <div className="tab-bar">
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {tab === 'overview'   && <TabOverview   p={p} navigate={navigate} />}
        {tab === 'revcash'    && <TabRevenueCash p={p} />}
        {tab === 'cost'       && <TabCost        p={p} />}
      </div>
    </div>
  );
}
