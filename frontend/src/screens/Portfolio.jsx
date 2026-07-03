import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProjects, fmt, fmtSapSync, fmtAsAt } from '../data/store.js';
import { Sparkline, MultiSeriesLineChart, HorizontalBarChart, SegmentedRing, fmtShort, C, CAT_COLORS } from '../components/Charts.jsx';

// PRD Section 4: Portfolio Financial Health Dashboard

// Compute health live from financials — same thresholds as SAP import deriveStatus().
// Ignores the stored `status` field which only updates on SAP import.
function liveHealth(p) {
  if (!p.budget || p.budget <= 0) return 'ok';
  const v = (p.eac - p.budget) / p.budget;
  if (v > 0.25) return 'bad';
  if (v > 0.10) return 'warn';
  return 'ok';
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
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      background: col + '18', color: col, border: `1px solid ${col}40`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: col, display: 'inline-block' }} />
      {healthLabel(status)}
    </span>
  );
}

// PRD §4.6: Standard sub-job categories
const CATEGORIES = ['PM/MISC', 'Material', 'Subcon', 'Spares', 'Others'];

function buildCategoryBreakdown(projects) {
  const weights = [0.12, 0.32, 0.28, 0.18, 0.10];
  const totalEac = projects.reduce((a, p) => a + p.eac, 0);
  return CATEGORIES.map((c, i) => ({
    name: c, color: CAT_COLORS[c],
    eac: totalEac * weights[i],
  }));
}

function buildPortfolioTrend(projects) {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const totalBudget = projects.reduce((a, p) => a + p.budget, 0);
  const totalEac    = projects.reduce((a, p) => a + p.eac, 0);
  const drift = totalEac - totalBudget;
  const eacTrend   = labels.map((_, i) => Math.round(totalBudget + drift * ((i / 11) ** 2)));
  const budgetLine = labels.map(() => Math.round(totalBudget));
  return { labels, eacTrend, budgetLine };
}

function KpiCard({ label, value, sub, subColor, delta, tooltip }) {
  return (
    <div className="kpi-tile" title={tooltip}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ fontSize: 22 }}>{value}</div>
      {sub && <div className="kpi-sub" style={{ color: subColor }}>{sub}</div>}
      {delta && <div className={`kpi-delta kpi-delta-${delta.kind}`}>{delta.label}</div>}
    </div>
  );
}

function useDebounce(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef();
  useEffect(() => {
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer.current);
  }, [value, delay]);
  return debounced;
}

// ── Portfolio skeleton ────────────────────────────────────────────────────
function PortfolioSkeleton() {
  return (
    <div className="screen" style={{ padding: '24px 28px' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skel skel-title" style={{ width: 280 }} />
          <div className="skel skel-text" style={{ width: 340 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skel" style={{ width: 100, height: 30, borderRadius: 6 }} />
          <div className="skel" style={{ width: 100, height: 30, borderRadius: 6 }} />
        </div>
      </div>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 24 }}>
        {Array(7).fill(0).map((_, i) => <div key={i} className="skel skel-kpi" />)}
      </div>
      {/* charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {Array(3).fill(0).map((_, i) => <div key={i} className="skel skel-card" />)}
      </div>
      {/* table area */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
        <div className="skel" style={{ height: 320, borderRadius: 'var(--r)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skel" style={{ height: 44, borderRadius: 'var(--r)' }} />
          {Array(6).fill(0).map((_, i) => <div key={i} className="skel skel-row" />)}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio({ navigate, role, session }) {
  const { projects, loading } = useProjects();
  const [search, setSearch]             = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [sort, setSort]                 = useState({ key: 'eacVariance', dir: 1 });
  const [varMode, setVarMode]           = useState('amount');

  const debouncedSearch = useDebounce(search);

  const myName   = session?.full_name;
  const baseList = (role === 'PM' && myName)
    ? projects.filter(p => p.pm === myName)
    : (role === 'PD' && myName)
    ? projects.filter(p => p.pd === myName)
    : projects;

  const filtered = useMemo(() => {
    let list = [...baseList];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.customer || '').toLowerCase().includes(q) ||
        (p.pm || '').toLowerCase().includes(q)
      );
    }
    if (healthFilter !== 'all') list = list.filter(p => liveHealth(p) === healthFilter);
    list.sort((a, b) => {
      if (sort.key === 'eacVariance') return ((a.budget - a.eac) - (b.budget - b.eac)) * sort.dir;
      let av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
    return list;
  }, [baseList, debouncedSearch, healthFilter, sort]);

  function toggleSort(key) {
    setSort(s => s.key === key ? { key, dir: s.dir * -1 } : { key, dir: 1 });
  }

  function Th({ col, label }) {
    const active = sort.key === col;
    return (
      <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          <span style={{ opacity: active ? 1 : 0.3, fontSize: 10 }}>{active && sort.dir === -1 ? '↓' : '↑'}</span>
        </span>
      </th>
    );
  }

  // Portfolio aggregates (PRD §4.2)
  const totalBudget    = baseList.reduce((a, p) => a + p.budget,    0);
  const totalEac       = baseList.reduce((a, p) => a + p.eac,       0);
  const totalActual    = baseList.reduce((a, p) => a + p.actual,    0);
  const totalCommitted = baseList.reduce((a, p) => a + p.committed, 0);
  const totalEtc       = baseList.reduce((a, p) => a + Math.max(0, p.eac - p.actual - p.committed), 0);
  const totalVariance  = totalBudget - totalEac;
  const totalRevRec    = baseList.reduce((a, p) => a + p.revRecognised,   0);
  const totalCash      = baseList.reduce((a, p) => a + p.progressBilling, 0);
  const totalCV        = baseList.reduce((a, p) => a + (p.contractValue || p.budget), 0);

  // Health distribution (PRD §4.5) — computed live, not from stored status
  const hCounts = {
    ok:   baseList.filter(p => liveHealth(p) === 'ok').length,
    warn: baseList.filter(p => liveHealth(p) === 'warn').length,
    bad:  baseList.filter(p => liveHealth(p) === 'bad').length,
    none: 0,
  };
  const healthSegs = [
    { label: 'On Track',     value: hCounts.ok,   color: C.fav     },
    { label: 'At Risk',      value: hCounts.warn, color: C.attn    },
    { label: 'Off Track',    value: hCounts.bad,  color: C.adverse },
    { label: 'Not Assessed', value: hCounts.none, color: C.neutral },
  ].filter(s => s.value > 0);

  // EAC Variance ranking (PRD §4.3) — top 10 adverse first
  const varBars = [...baseList]
    .sort((a, b) => (a.budget - a.eac) - (b.budget - b.eac))
    .slice(0, 10)
    .map(p => {
      const variance = p.budget - p.eac;
      const pct = p.budget > 0 ? (variance / p.budget) * 100 : 0;
      // Positive = under budget (green). Negative overrun uses same health thresholds as dot:
      // < 10% over → ok/green, 10-25% → warn/amber, > 25% → bad/red.
      const col = pct >= 0 ? C.fav : pct > -10 ? C.fav : pct > -25 ? C.attn : C.adverse;
      return {
        label: p.name.length > 22 ? p.name.slice(0, 21) + '…' : p.name,
        value: variance,
        pct,
        color: col,
      };
    });

  // Portfolio trend (PRD §4.4)
  const { labels: trendLabels, eacTrend, budgetLine } = buildPortfolioTrend(baseList);

  // Category breakdown (PRD §4.6)
  const categories  = buildCategoryBreakdown(baseList);
  const catEacTotal = categories.reduce((a, c) => a + c.eac, 0) || 1;

  const total = baseList.length || 1;
  const badPct  = hCounts.bad  / total;
  const warnPct = hCounts.warn / total;
  const eacOverBudget = totalEac > totalBudget;
  const portHealth = (badPct > 0.25 || (hCounts.bad > 0 && eacOverBudget))
    ? 'bad'
    : (warnPct > 0.25 || eacOverBudget)
    ? 'warn'
    : 'ok';

  if (loading) return <PortfolioSkeleton />;

  return (
    <div className="screen" style={{ padding: '24px 28px' }}>

      {/* Page header (PRD §4.1) */}
      <div className="page-header">
        <div>
          <div className="page-title">Portfolio Financial Health</div>
          <div className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span>As at <strong>{fmtAsAt()}</strong></span>
            <span style={{ color: 'var(--border-2)' }}>·</span>
            <span className="data-freshness">● SAP sync: {fmtSapSync(
              baseList.reduce((latest, p) => {
                if (!p.lastSapImport) return latest;
                return !latest || p.lastSapImport > latest ? p.lastSapImport : latest;
              }, null)
            )}</span>
            <HealthBadge status={portHealth} />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm">⤓ Export CSV</button>
          <button className="btn btn-ghost btn-sm">⤓ Export PDF</button>
        </div>
      </div>

      {/* KPI Cards (PRD §4.2) */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 24 }}>
        <KpiCard label="Portfolio Budget" value={fmtShort(totalBudget)}
          sub={`${baseList.length} projects`}
          tooltip="PORT-KPI-01: Sum of approved current budgets." />
        <KpiCard label="Total EAC" value={fmtShort(totalEac)}
          sub={`${totalBudget > 0 ? ((totalEac / totalBudget) * 100).toFixed(1) : '—'}% of budget`}
          subColor={totalEac > totalBudget ? C.adverse : 'var(--text-3)'}
          tooltip="PORT-KPI-02: Sum of current approved EAC values." />
        <KpiCard label="EAC Variance" value={fmtShort(Math.abs(totalVariance))}
          sub={totalVariance >= 0 ? 'Favourable' : 'Adverse'}
          subColor={totalVariance >= 0 ? C.fav : C.adverse}
          delta={{ kind: totalVariance >= 0 ? 'fav' : 'adv',
            label: `${totalVariance >= 0 ? '+' : ''}${totalBudget > 0 ? ((totalVariance / totalBudget) * 100).toFixed(1) : '0'}%` }}
          tooltip="PORT-KPI-03: Portfolio Budget minus Portfolio EAC." />
        <KpiCard label="Actual Cost" value={fmtShort(totalActual)}
          sub={`${totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : '—'}% of budget`}
          tooltip="PORT-KPI-04: Cumulative posted actual cost as at date." />
        <KpiCard label="Committed Cost" value={fmtShort(totalCommitted)}
          sub={`${totalBudget > 0 ? ((totalCommitted / totalBudget) * 100).toFixed(1) : '—'}% of budget`}
          tooltip="PORT-KPI-05: Open contractual commitments not yet actual." />
        <KpiCard label="ETC" value={fmtShort(totalEtc)}
          sub={`${totalEac > 0 ? ((totalEtc / totalEac) * 100).toFixed(1) : '—'}% of EAC`}
          tooltip="PORT-KPI-06: Sum of remaining forecast cost." />
        <KpiCard label="Portfolio Health"
          value={<HealthBadge status={portHealth} />}
          sub={`${hCounts.bad} off track · ${hCounts.warn} at risk`}
          subColor={hCounts.bad > 0 ? C.adverse : hCounts.warn > 0 ? C.attn : C.fav}
          tooltip="PORT-KPI-07: Overall portfolio health from project RAG statuses." />
      </div>

      {/* Charts: EAC Variance (left, full height) + 2×2 grid (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 2fr', gap: 16, marginBottom: 24 }}>

        {/* EAC Variance by Project (PRD §4.3) */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>EAC Variance by Project</div>
            <div className="flex gap-1">
              <button className={`btn btn-sm ${varMode === 'amount' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setVarMode('amount')}>S$</button>
              <button className={`btn btn-sm ${varMode === 'pct' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setVarMode('pct')}>%</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>
            Largest adverse first · Green = on track (&lt;10% over) · Amber = at risk · Red = off track
          </div>
          {varBars.length
            ? <HorizontalBarChart
                bars={varBars.map(b => ({ ...b, pct: varMode === 'pct' ? b.pct : null }))}
                maxAbs={Math.max(...varBars.map(b => Math.abs(b.value)), 1)} />
            : <div style={{ color: 'var(--text-3)', fontSize: 12 }}>No data</div>
          }
        </div>

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16 }}>

          {/* Portfolio Trend (PRD §4.4) */}
          <div className="card card-p">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Portfolio Trend</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Budget vs EAC by period</div>
            <MultiSeriesLineChart
              series={[
                { label: 'Budget', values: budgetLine, color: C.budget, dashed: true, strokeWidth: 1.5 },
                { label: 'EAC',    values: eacTrend,   color: C.forecast, area: true },
              ]}
              labels={trendLabels}
              asAtIndex={6}
              height={110}
            />
            <div className="chart-legend" style={{ marginTop: 6 }}>
              <div className="legend-item">
                <div className="legend-swatch" style={{ background: C.budget }} />
                <span>Budget (dashed)</span>
              </div>
              <div className="legend-item">
                <div className="legend-swatch" style={{ background: C.forecast }} />
                <span>EAC</span>
              </div>
            </div>
          </div>

          {/* Portfolio Health Distribution (PRD §4.5) */}
          <div className="card card-p">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Portfolio Health</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>By project count</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <SegmentedRing segments={healthSegs} size={90} stroke={14}
                centerLabel={String(baseList.length)} centerSub="projects" />
              <div className="ring-legend">
                {healthSegs.map(s => (
                  <div key={s.label} className="ring-legend-row" style={{ cursor: 'pointer' }}
                    onClick={() => setHealthFilter(
                      s.label === 'On Track' ? 'ok'
                        : s.label === 'At Risk' ? 'warn'
                        : s.label === 'Off Track' ? 'bad'
                        : 'all'
                    )}>
                    <div className="ring-legend-dot" style={{ background: s.color }} />
                    <div className="ring-legend-label">{s.label}</div>
                    <div className="ring-legend-val">{s.value}</div>
                    <div className="ring-legend-pct">({((s.value / (baseList.length || 1)) * 100).toFixed(0)}%)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Burn */}
          {(() => {
            const incurred   = totalActual + totalCommitted;
            const eacBase    = totalEac || 1;
            const actPct     = Math.min(100, (totalActual    / eacBase) * 100);
            const comPct     = Math.min(100 - actPct, (totalCommitted / eacBase) * 100);
            const etcPct     = Math.min(100 - actPct - comPct, (totalEtc / eacBase) * 100);
            const incurredPct = (incurred / eacBase) * 100;
            return (
              <div className="card card-p">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Cost Burn</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>
                  Actual + Committed + ETC vs approved EAC
                </div>
                {/* Stacked bar */}
                <div style={{ height: 12, borderRadius: 6, background: 'var(--border)', overflow: 'hidden',
                  display: 'flex', marginBottom: 14 }}>
                  <div style={{ width: `${actPct}%`, background: C.actual, transition: 'width 0.4s' }} />
                  <div style={{ width: `${comPct}%`, background: C.committed, transition: 'width 0.4s' }} />
                  <div style={{ width: `${etcPct}%`, background: C.forecast, opacity: 0.55, transition: 'width 0.4s' }} />
                </div>
                {/* Stat row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center' }}>
                  {[
                    { label: 'Actual',     value: actPct,      color: C.actual,    amt: totalActual    },
                    { label: 'Committed',  value: comPct,      color: C.committed, amt: totalCommitted },
                    { label: 'ETC (rem.)', value: etcPct,      color: C.forecast,  amt: totalEtc       },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '6px 4px', borderRadius: 6, background: 'var(--surface-2)' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value.toFixed(0)}%</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 1 }}>{fmtShort(s.amt)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
                  {incurredPct.toFixed(0)}% of EAC incurred &nbsp;·&nbsp; {fmtShort(totalEtc)} remaining
                </div>
              </div>
            );
          })()}

          {/* Revenue & Cash */}
          {(() => {
            const cvBase   = totalCV || 1;
            const revPct   = Math.min(100, (totalRevRec / cvBase) * 100);
            const cashPct  = Math.min(100, (totalCash   / cvBase) * 100);
            const gap      = totalCash - totalRevRec;
            const gapColor = gap >= 0 ? C.fav : C.attn;
            return (
              <div className="card card-p">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Revenue & Cash</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
                  % of total contract value ({fmtShort(totalCV)})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Revenue Recognised', pct: revPct,  amt: totalRevRec, color: C.actual },
                    { label: 'Cash Collected',      pct: cashPct, amt: totalCash,   color: C.cash   },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: row.color, fontWeight: 600 }}>{row.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtShort(row.amt)} <span style={{ color: 'var(--text-3)' }}>({row.pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${row.pct}%`, height: '100%', background: row.color,
                          borderRadius: 5, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 6, background: 'var(--surface-2)', marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Cash vs Rev gap</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: gapColor }}>
                      {gap >= 0 ? '+' : ''}{fmtShort(gap)} {gap >= 0 ? '▲ ahead' : '▼ behind'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>{/* end 2×2 */}
      </div>{/* end charts row */}

      {/* Cost Breakdown + Project Table (PRD §4.6–4.8) */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>

        {/* Left column: 3 stacked cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Cost by Category */}
          <div className="card card-p">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Cost by Category</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>EAC composition</div>
            <SegmentedRing
              segments={categories.map(c => ({ label: c.name, value: c.eac, color: c.color }))}
              size={110} stroke={16}
              centerLabel={fmtShort(catEacTotal)}
              centerSub="EAC"
            />
            <div className="ring-legend" style={{ marginTop: 16 }}>
              {categories.map(c => (
                <div key={c.name} className="ring-legend-row">
                  <div className="ring-legend-dot" style={{ background: c.color, borderRadius: 2 }} />
                  <div className="ring-legend-label">{c.name}</div>
                  <div className="ring-legend-val">{fmtShort(c.eac)}</div>
                  <div className="ring-legend-pct">({((c.eac / catEacTotal) * 100).toFixed(0)}%)</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Projects by EAC */}
          {(() => {
            const top = [...baseList]
              .sort((a, b) => b.eac - a.eac)
              .slice(0, 5);
            return (
              <div className="card card-p">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Top 5 by EAC</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>Largest · actual burn shown</div>
                {top.map(p => {
                  const actPct = p.eac > 0 ? Math.min(100, (p.actual / p.eac) * 100) : 0;
                  const comPct = p.eac > 0 ? Math.min(100 - actPct, (p.committed / p.eac) * 100) : 0;
                  const h = liveHealth(p);
                  const hCol = h === 'ok' ? C.fav : h === 'warn' ? C.attn : C.adverse;
                  return (
                    <div key={p.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 132,
                          color: 'var(--text)' }} title={p.name}>{p.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                          flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtShort(p.eac)}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)',
                        overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${actPct}%`, background: C.actual, transition: 'width 0.4s' }} />
                        <div style={{ width: `${comPct}%`, background: C.committed, opacity: 0.8 }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{actPct.toFixed(0)}% actual</span>
                        <span style={{ color: hCol }}>●</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Portfolio Margin */}
          {(() => {
            const portBudgetGp  = totalCV > 0 ? ((totalCV - totalBudget) / totalCV) * 100 : 0;
            const portForecastGp = totalCV > 0 ? ((totalCV - totalEac) / totalCV) * 100 : 0;
            const delta = portForecastGp - portBudgetGp;
            const deltaCol = delta >= 0 ? C.fav : delta > -5 ? C.attn : C.adverse;
            const maxGp = Math.max(portBudgetGp, portForecastGp, 1);
            return (
              <div className="card card-p">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Portfolio Margin</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>Budget GP% vs Forecast GP%</div>
                {[
                  { label: 'Budget GP%',   value: portBudgetGp,   color: C.budget   },
                  { label: 'Forecast GP%', value: portForecastGp, color: C.forecast },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: row.color, fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: row.color,
                        fontVariantNumeric: 'tabular-nums' }}>{row.value.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(0, (row.value / maxGp) * 100)}%`, height: '100%',
                        background: row.color, opacity: 0.85, borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: 6, background: 'var(--surface-2)', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>GP erosion</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: deltaCol }}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}pp
                  </span>
                </div>
              </div>
            );
          })()}

        </div>{/* end left column */}

        {/* Filters + Project Summary Table (PRD §4.7–4.8) */}
        <div>
          <div className="filter-bar"
            style={{ borderRadius: 'var(--r) var(--r) 0 0', border: '1px solid var(--border)', borderBottom: 'none' }}>
            <input className="input" placeholder="Search project, ID, customer or PM…"
              style={{ width: 260, flexShrink: 0 }} value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-1">
              {[['all','All'],['ok','On Track'],['warn','At Risk'],['bad','Off Track']].map(([k, l]) => (
                <button key={k} onClick={() => setHealthFilter(k)}
                  className={`btn btn-sm ${healthFilter === k ? 'btn-secondary' : 'btn-ghost'}`}>{l}</button>
              ))}
            </div>
            <div style={{ flexGrow: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{filtered.length} of {baseList.length}</span>
          </div>

          <div className="card" style={{ borderRadius: '0 0 var(--r) var(--r)' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <Th col="name"        label="Project" />
                    <th style={{ width: 52, padding: '10px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Health</th>
                    <Th col="budget"      label="Budget" />
                    <Th col="eac"         label="EAC" />
                    <Th col="eacVariance" label="EAC Variance" />
                    <Th col="actual"      label="Actual Cost" />
                    <Th col="committed"   label="Committed" />
                    <Th col="etc"         label="ETC" />
                    <th>EAC Trend</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const health    = liveHealth(p);
                    const eacVar    = p.budget - p.eac;
                    const eacVarPct = p.budget > 0 ? (eacVar / p.budget) * 100 : 0;
                    const etc       = Math.max(0, p.eac - p.actual - p.committed);
                    // Match health thresholds: green <10% over, amber 10-25%, red >25%
                    // Same health thresholds as the dot — consistent coloring everywhere
                    const varCol = health === 'ok' ? C.fav : health === 'warn' ? C.attn : C.adverse;
                    return (
                      <tr key={p.id} onClick={() => navigate('project', p.id)}
                        className={health === 'bad' ? 'row-bad' : health === 'warn' ? 'row-warn' : ''}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.id} · {p.pm}</div>
                        </td>
                        <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                          <span className={`dot dot-${health}`} title={healthLabel(health)} />
                        </td>
                        <td className="num">{fmt(p.budget)}</td>
                        <td className="num" style={{ fontWeight: 600 }}>{fmt(p.eac)}</td>
                        <td>
                          <span style={{ color: varCol, fontWeight: 700, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                            {eacVar >= 0 ? '+' : ''}{fmtShort(eacVar)}
                            <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 4, opacity: 0.8 }}>
                              ({eacVarPct.toFixed(1)}%)
                            </span>
                          </span>
                        </td>
                        <td className="num">{fmt(p.actual)}</td>
                        <td className="num">{fmt(p.committed)}</td>
                        <td className="num">{fmt(etc)}</td>
                        <td><Sparkline data={p.trend} width={72} height={24} /></td>
                        <td>
                          <button className="btn btn-ghost btn-sm"
                            onClick={e => { e.stopPropagation(); navigate('project', p.id); }}>
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10}>
                        <div className="empty-state">
                          <div className="empty-state-icon">🔍</div>
                          <div className="empty-state-title">
                            {baseList.length === 0 ? 'No projects found' : 'No projects match these filters'}
                          </div>
                          <div className="empty-state-sub">
                            {baseList.length === 0
                              ? 'There are no projects assigned to your account yet.'
                              : 'Try adjusting the search or health filter above.'}
                          </div>
                          {(search || healthFilter !== 'all') && (
                            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
                              onClick={() => { setSearch(''); setHealthFilter('all'); }}>
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
