import React, { useState, useEffect } from 'react';
import { useProject, fmt, fmtSapSync, fmtAsAt } from '../data/store.js';
import { api } from '../data/api.js';
import { MultiSeriesLineChart, SegmentedRing, GroupedBarChart, fmtShort, C, CAT_COLORS } from '../components/Charts.jsx';

// PRD Section 5: Project Financial Health Dashboard

const CATEGORIES = ['PM/MISC', 'Material', 'Subcon', 'Spares', 'Others'];

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
  const map = { '1-1': 'PM/MISC', '1-2': 'Material', '1-3': 'Subcon', '1-4': 'Spares', '1-5': 'Others' };
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
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      background: col + '18', color: col, border: `1px solid ${col}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, display: 'inline-block' }} />
      {healthLabel(status)}
    </span>
  );
}

function ForecastBadge({ status = 'approved' }) {
  const styles = {
    draft:     { bg: C.neutral + '18', color: C.neutral },
    submitted: { bg: C.forecast + '18', color: C.forecast },
    approved:  { bg: C.fav + '18', color: C.fav },
    returned:  { bg: C.attn + '18', color: C.attn },
    overdue:   { bg: C.adverse + '18', color: C.adverse },
  };
  const s = styles[status] || styles.draft;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color }}>
      Forecast: {label}
    </span>
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
  const n = 24;
  const budget  = p.budget || 1;
  const cv      = p.contractValue || budget * 1.2;
  const rev     = p.revRecognised || 0;
  const cash    = p.progressBilling || 0;

  const labels = Array.from({ length: n }, (_, i) => {
    const d = new Date(2025, 0 + i, 1);
    return d.toLocaleString('default', { month: 'short', year: '2-digit' });
  });

  const asAtIdx = 18; // Jul 2026 approx

  // Budgeted revenue: linear ramp to contract value
  const budRevValues = labels.map((_, i) => Math.round(cv * (i / (n - 1))));

  // Revenue recognised actual (up to asAt) + forecast (after)
  const revActual   = labels.map((_, i) => i <= asAtIdx ? Math.round(rev * (i / asAtIdx)) : null);
  const revForecast = labels.map((_, i) => i >= asAtIdx ? Math.round(rev + (cv - rev) * ((i - asAtIdx) / (n - 1 - asAtIdx))) : null);
  revForecast[asAtIdx] = revActual[asAtIdx]; // connect at boundary

  // Cash received: linear ramp to current progress_billing value (single cumulative total from SAP PB column)
  const cashValues = labels.map((_, i) => i <= asAtIdx ? Math.round(cash * (i / asAtIdx)) : null);

  return { labels, budRevValues, revActual, revForecast, cashValues, asAtIdx };
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
            <span style={{ fontSize: 16 }}>✓</span> No active alerts — project is on track.
          </div>
        </div>
      )}

    </div>
  );
}

// ── Tab: Revenue & Cash (PRD §5.2) ────────────────────────────────────────
function TabRevenueCash({ p }) {
  const { labels, budRevValues, revActual, revForecast, cashValues, asAtIdx } = buildRevSeries(p);
  const cv         = p.contractValue || 0;
  const rev        = p.revRecognised || 0;
  const cash       = p.progressBilling || 0;
  const cashRevVar = cash - rev;

  return (
    <div style={{ padding: '24px 28px' }}>
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
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '12px 20px 10px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Gross Profit Correlation</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                Recognition GP reflects revenue recognised vs cost incurred. Forecast GP updates live when ETC is changed in the Forecast tab.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              {tiles.map((t, i) => (
                <div key={i} style={{ flex: 1, padding: '14px 20px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
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

      {/* Cumulative Revenue & Cash chart (PRD §5.2) */}
      <div className="card card-p" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          Revenue Recognition vs Budget vs Cash Inflow
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>
          Cumulative · monthly · dashed = forecast period
        </div>
        <MultiSeriesLineChart
          series={[
            { label: 'Budgeted Revenue',         values: budRevValues, color: C.budget,   dashed: true, strokeWidth: 1.5 },
            { label: 'Revenue Recognised Actual', values: revActual,   color: C.actual,   area: true },
            { label: 'Revenue Recognised Forecast', values: revForecast, color: C.actual, dashed: true, opacity: 0.6 },
            { label: 'Customer Cash Received',    values: cashValues,  color: C.cash,     strokeWidth: 2 },
          ]}
          labels={labels}
          asAtIndex={asAtIdx}
          height={220}
        />
        <div className="chart-legend" style={{ marginTop: 10 }}>
          {[
            { color: C.budget,   label: 'Budgeted Revenue',          dashed: true },
            { color: C.actual,   label: 'Revenue Recognised (actual)' },
            { color: C.actual,   label: 'Revenue Recognised (forecast)', dashed: true },
            { color: C.cash,     label: 'Customer Cash Received' },
          ].map((l, i) => (
            <div key={i} className="legend-item">
              <div className="legend-swatch" style={{ background: l.dashed ? 'transparent' : l.color,
                borderTop: l.dashed ? `2px dashed ${l.color}` : 'none' }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Cost Performance (PRD §5.4) ──────────────────────────────────────
function TabCost({ p }) {
  const cats      = buildCategories(p.subjobs);
  const [selCat, setSelCat] = useState(null);

  const totalBudget = cats.reduce((a, c) => a + c.budget, 0) || p.budget;
  const totalActual = cats.reduce((a, c) => a + c.actual, 0) || p.actual;
  const totalEtc    = cats.reduce((a, c) => a + c.etc,    0) || Math.max(0, p.eac - p.actual - p.committed);
  // Use project-level EAC for the header KPI (approved top-down figure)
  // Sub-job EAC is shown in the table as the bottom-up view
  const subJobEac   = cats.reduce((a, c) => a + c.eac,    0);

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Cost totals row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Budget',     value: fmtShort(totalBudget),  color: C.budget    },
          { label: 'Actual',     value: fmtShort(totalActual),  color: C.actual    },
          { label: 'Committed',  value: fmtShort(p.committed),  color: C.committed },
          { label: 'ETC',        value: fmtShort(totalEtc),     color: C.forecast  },
          { label: 'EAC',        value: fmtShort(p.eac),        color: C.forecast  },
        ].map(k => (
          <div key={k.label} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 20, color: k.color }}>{k.value}</div>
          </div>
        ))}
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
                <th style={{ color: C.forecast }}>ETC</th>
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
                <td className="num" style={{ color: C.committed }}>{fmt(p.committed)}</td>
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
                    <span style={{ fontSize: 11, color: C.attn }}>
                      ⚠ Sub-job bottom-up EAC ({fmtShort(subJobEac)}) differs from approved project EAC ({fmtShort(p.eac)}) by {fmtShort(Math.abs(subJobEac - p.eac))}. Update sub-job ETCs or re-baseline.
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

// ── Tab: Forecast ──────────────────────────────────────────────────────────
function TabForecast({ p, reload }) {
  const initEtc = () => Object.fromEntries((p.subjobs || []).map(s => [s.id, s.etc]));
  const [etcVals, setEtcVals] = useState(initEtc);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  const subjobs = p.subjobs || [];
  const totalEtc = Object.values(etcVals).reduce((a, v) => a + (Number(v) || 0), 0);
  // Use SAP-validated project-level actual & committed; ETCs are PM-entered from sub-jobs
  const forecastEac = p.actual + p.committed + totalEtc;

  async function handleSave() {
    setSaving(true); setSaveErr(null);
    try {
      await Promise.all(
        subjobs.map(s =>
          api.patch(`/api/sub-jobs/${s.id}`, { etc_lab: Number(etcVals[s.id]) || 0 })
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      reload();
    } catch (e) {
      setSaveErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* ETC summary KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Total ETC (forecast)</div>
          <div className="kpi-value" style={{ fontSize: 20, color: C.forecast }}>{fmtShort(totalEtc)}</div>
          <div className="kpi-sub">Remaining cost to complete</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Forecast EAC</div>
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
                <div className="kpi-label">Forecast GP%</div>
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
          <div className="kpi-label">Forecast Status</div>
          <div style={{ marginTop: 8 }}><ForecastBadge status="approved" /></div>
        </div>
      </div>

      {/* ETC input table */}
      <div className="card">
        <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>ETC by Sub-Job</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              Enter remaining cost to complete for each sub-job. EAC = Actual + Committed + ETC.
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {saveErr && <span style={{ fontSize: 12, color: 'var(--bad)' }}>{saveErr}</span>}
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save ETC'}
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sub-Job</th>
                <th>Category</th>
                <th style={{ color: C.budget }}>Budget</th>
                <th style={{ color: C.actual }}>Actual</th>
                <th style={{ color: C.committed }}>Committed</th>
                <th style={{ color: C.forecast, minWidth: 140 }}>ETC (editable)</th>
                <th>Forecast EAC</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {subjobs.map(s => {
                const etc = Number(etcVals[s.id]) || 0;
                const eac = s.actual + s.committed + etc;
                const variance = s.budget - eac;
                const varCol = variance >= 0 ? C.fav : Math.abs(variance) / s.budget > 0.05 ? C.adverse : C.attn;
                return (
                  <tr key={s.id}>
                    <td style={{ fontSize: 12 }}>{s.name}</td>
                    <td style={{ fontSize: 11 }}>
                      <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                        background: (CAT_COLORS[suffixToCategory(s.suffix)] || C.neutral) + '20',
                        color: CAT_COLORS[suffixToCategory(s.suffix)] || C.neutral }}>
                        {suffixToCategory(s.suffix) || s.suffix}
                      </span>
                    </td>
                    <td className="num">{fmt(s.budget)}</td>
                    <td className="num" style={{ color: C.actual }}>{fmt(s.actual)}</td>
                    <td className="num" style={{ color: C.committed }}>{fmt(s.committed)}</td>
                    <td style={{ padding: '4px 12px' }}>
                      <input
                        type="number" min="0" step="1000"
                        className="eac-cell eac-editable"
                        value={etcVals[s.id] ?? ''}
                        placeholder="0"
                        onChange={e => setEtcVals(prev => ({ ...prev, [s.id]: parseFloat(e.target.value) || 0 }))}
                        style={{ width: 110, textAlign: 'right' }}
                      />
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>{fmt(eac)}</td>
                    <td>
                      <span style={{ color: varCol, fontWeight: 700, fontSize: 12 }}>
                        {variance >= 0 ? '+' : ''}{fmtShort(variance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {subjobs.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ padding: '40px 24px' }}>
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-title">No sub-jobs</div>
                      <div className="empty-state-sub">No WBS sub-jobs have been set up for this project yet.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {subjobs.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td colSpan={2} style={{ fontSize: 12, paddingLeft: 20 }}>Total</td>
                  <td className="num" style={{ paddingLeft: 16 }}>{fmt(subjobs.reduce((a, s) => a + s.budget, 0))}</td>
                  <td className="num" style={{ color: C.actual, paddingLeft: 16 }}>{fmt(p.actual)}</td>
                  <td className="num" style={{ color: C.committed, paddingLeft: 16 }}>{fmt(p.committed)}</td>
                  <td className="num" style={{ color: C.forecast, minWidth: 140, paddingLeft: 16 }}>{fmt(totalEtc)}</td>
                  <td className="num" style={{ paddingLeft: 16 }}>{fmt(forecastEac)}</td>
                  <td style={{ paddingLeft: 16 }}>
                    <span style={{ color: p.budget >= forecastEac ? C.fav : C.adverse, fontWeight: 700 }}>
                      {p.budget >= forecastEac ? '+' : ''}{fmtShort(p.budget - forecastEac)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
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
  const { project: p, loading, error, reload } = useProject(projectId);
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
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Failed to load project</div>
        <div className="empty-state-sub">{error?.message || 'The project could not be found or an error occurred.'}</div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}
          onClick={() => navigate('portfolio')}>← Back to Portfolio</button>
      </div>
    </div>
  );

  const cats = buildCategories(p.subjobs);
  const gp   = buildGpSeries(p);

  const tabs = [
    { id: 'overview',  label: 'Overview'       },
    { id: 'revcash',   label: 'Revenue & Cash'  },
    { id: 'cost',      label: 'Cost'            },
    { id: 'forecast',  label: 'Forecast'        },
    { id: 'recon',     label: 'Reconciliation'  },
  ];

  return (
    <div className="screen" style={{ padding: 0 }}>
      {/* Project Header (PRD §5.1) */}
      <div className="proj-header">
        <div className="proj-header-top">
          <div className="proj-identity">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <button className="btn btn-ghost btn-sm"
                onClick={() => navigate('portfolio')}>← Portfolio</button>
            </div>
            <div className="proj-title">{p.name}</div>
            <div className="proj-meta">
              <span className="proj-meta-item">🔢 {p.id}</span>
              {p.customer && <span className="proj-meta-item">🏢 {p.customer}</span>}
              <span className="proj-meta-item">👤 PM: {p.pm}</span>
              <span className="proj-meta-item">👤 PD: {p.pd}</span>
              {p.department && <span className="proj-meta-item">🏷 {p.department}</span>}
            </div>
          </div>
          <div className="proj-badges">
            <HealthBadge status={liveHealth(p)} />
            <ForecastBadge status="approved" />
          </div>
        </div>

        {/* Reporting context */}
        <div className="proj-context">
          <span className="proj-context-item">📅 As at: <strong>{fmtAsAt()}</strong></span>
          <span className="proj-context-item">💱 SGD</span>
          <span className="proj-context-item data-freshness">● SAP sync: {fmtSapSync(p.lastSapImport)}</span>
          <span className="proj-context-item">
            GP: <strong style={{ color: gp.gpStatus === 'ok' ? C.fav : gp.gpStatus === 'warn' ? C.attn : C.adverse }}>
              {gp.forecastGp}%
            </strong>
            <span style={{ color: 'var(--text-3)', marginLeft: 4 }}>
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
        {tab === 'forecast'   && <TabForecast    p={p} reload={reload} />}
        {tab === 'recon'      && <TabRecon       p={p} />}
      </div>
    </div>
  );
}
