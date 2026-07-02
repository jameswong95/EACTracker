import React, { useState } from 'react';
import { useProject, fmt, MONTHS } from '../data/store.js';
import { LineChart } from '../components/Charts.jsx';
import { api } from '../data/api.js';

const NOW_MONTH = new Date().getMonth(); // months 0..NOW_MONTH are locked

export default function RevRec({ projectId, navigate, role }) {
  const { project: p, loading, reload } = useProject(projectId);
  if (loading) return (
    <div className="screen" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div className="skel" style={{ width: 100, height: 28, borderRadius: 6 }} />
      </div>
      <div className="skel skel-title" style={{ width: 260, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {Array(4).fill(0).map((_, i) => <div key={i} className="skel skel-kpi" />)}
      </div>
      <div className="skel skel-card" style={{ marginBottom: 16 }} />
      <div className="skel" style={{ height: 320, borderRadius: 'var(--r)' }} />
    </div>
  );
  if (!p) return (
    <div className="screen" style={{ padding: 32 }}>
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Project not found</div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}
          onClick={() => navigate('portfolio')}>← Back to Portfolio</button>
      </div>
    </div>
  );
  return <RevRecBody p={p} navigate={navigate} role={role} reload={reload} />;
}

function RevRecBody({ p, navigate, role, reload }) {
  const canEdit = role !== 'PD';
  const rr = p.revrec;
  // Build a recognition curve if one isn't provided yet
  const curve = (rr.recognitionCurve && rr.recognitionCurve.length === 12)
    ? rr.recognitionCurve
    : [0, 8, 17, 26, 36, 45, 55, 64, 73, 79, 85, 100];

  // Derive initial monthly values from existing curve data
  const initMonthly = MONTHS.map((_, mi) => {
    const thisPct = curve[mi] / 100;
    const prevPct = mi > 0 ? curve[mi - 1] / 100 : 0;
    return Math.round((thisPct - prevPct) * (rr.forecastFull || 0));
  });

  const [monthly, setMonthly] = useState(initMonthly);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  function update(mi, val) {
    const num = Math.max(0, parseFloat(val) || 0);
    setMonthly(prev => prev.map((v, i) => i === mi ? num : v));
    setSaved(false);
  }

  // Derived
  const cumulative       = MONTHS.map((_, mi) => monthly.slice(0, mi + 1).reduce((s, v) => s + v, 0));
  const totalForecast    = monthly.reduce((s, v) => s + v, 0);
  const recognisedToDate = monthly.slice(0, NOW_MONTH + 1).reduce((s, v) => s + v, 0);
  const remaining        = rr.forecastFull - totalForecast;
  const recognisedPct    = (recognisedToDate / rr.forecastFull * 100).toFixed(1);

  async function handleSave() {
    setSaving(true); setSaveErr(null);
    const YEAR = 2026;
    try {
      const calls = [];
      for (let mi = NOW_MONTH + 1; mi < 12; mi++) {
        const amount  = monthly[mi];
        const existing = (rr.entries || []).find(
          e => Number(e.period_year) === YEAR && Number(e.period_month) === mi + 1
        );
        if (existing) {
          calls.push(api.patch(`/api/revrec/${existing.id}`, { amount }));
        } else if (amount > 0) {
          calls.push(api.post('/api/revrec', {
            project_id: p.id, period_year: YEAR, period_month: mi + 1, amount,
          }));
        }
      }
      await Promise.all(calls);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      reload();
    } catch (e) {
      setSaveErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const guardrails = [
    { ok: true,                             text: 'Monthly reconciliation active' },
    { ok: totalForecast <= rr.forecastFull, text: 'Total recognition does not exceed contract' },
    { ok: monthly.every(v => v >= 0),       text: 'No negative monthly values' },
  ];

  return (
    <div className="screen">
      <div className="flex items-center gap-2 mb-4">
        <span className="breadcrumb-link" onClick={() => navigate('portfolio')}>Portfolio</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-link" onClick={() => navigate('project', p.id)}>{p.name}</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Revenue Recognition</span>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('project', p.id)}>← Back</button>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saved ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 6l3 3 6-6"/>
                </svg>
                Saved
              </span>
            ) : saving ? 'Saving…' : 'Save RevRec'}
          </button>
        )}
        {saveErr && (
          <span style={{ fontSize: 12, color: 'var(--bad)', marginLeft: 8 }}>{saveErr}</span>
        )}
      </div>

      {/* KPI tiles */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Contract value</div>
          <div className="kpi-value num">{fmt(rr.forecastFull)}</div>
          <div className="kpi-sub">total to recognise</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Recognised to date</div>
          <div className="kpi-value num" style={{ color: 'var(--ok)' }}>{fmt(recognisedToDate)}</div>
          <div className="kpi-sub">{recognisedPct}% of contract</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Full-year forecast</div>
          <div className="kpi-value num" style={{ color: totalForecast > rr.forecastFull ? 'var(--bad)' : 'var(--text)' }}>
            {fmt(totalForecast)}
          </div>
          <div className="kpi-sub" style={{ color: remaining < 0 ? 'var(--bad)' : undefined }}>
            {remaining >= 0 ? `${fmt(remaining)} remaining` : `${fmt(Math.abs(remaining))} over contract`}
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Method</div>
          <div style={{ marginTop: 10 }}>
            <span className="badge badge-accent">Monthly value</span>
          </div>
          <div className="kpi-sub">PM-entered per month</div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Left: guardrails */}
        <div style={{ flex: '0 0 240px' }}>
          <div className="card card-p">
            <h4 style={{ marginBottom: 14 }}>Guardrails</h4>
            <div className="flex-col gap-3">
              {guardrails.map((g, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`dot dot-${g.ok ? 'ok' : 'bad'}`} style={{ marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{g.text}</span>
                </div>
              ))}
            </div>

            {/* Contract utilisation bar */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 10 }}>
                Contract utilisation
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, totalForecast / rr.forecastFull * 100).toFixed(1)}%`,
                  background: totalForecast > rr.forecastFull ? 'var(--bad)' : 'var(--ok)',
                  borderRadius: 4,
                  transition: 'width .2s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                <span>{(totalForecast / rr.forecastFull * 100).toFixed(1)}% used</span>
                <span>{fmt(rr.forecastFull)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: chart + table */}
        <div className="flex-col gap-4 grow">
          <div className="card card-p">
            <div className="flex items-center justify-between mb-4">
              <h4>Cumulative recognition</h4>
              <div className="flex gap-3" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 14, height: 2, background: 'var(--accent)', display: 'inline-block', borderRadius: 1 }} /> Recognised
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 14, height: 0, borderTop: '2px dashed var(--bad)', display: 'inline-block' }} /> Contract cap
                </span>
              </div>
            </div>
            <LineChart
              data={cumulative.map(v => v / 1000)}
              budget={rr.forecastFull / 1000}
              width={500} height={140}
            />
            <div className="flex justify-between mt-2" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {MONTHS.map(m => <span key={m}>{m}</span>)}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: '14px 20px 0', marginBottom: 4 }}>
              <h4>Monthly input</h4>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                Enter revenue recognised each month. Locked months are SAP actuals.
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{ textAlign: 'right' }}>Recognised ($)</th>
                    <th style={{ textAlign: 'right' }}>Cumulative</th>
                    <th style={{ textAlign: 'right' }}>% of contract</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTHS.map((m, mi) => {
                    const isLocked  = mi <= NOW_MONTH;
                    const isCurrent = mi === NOW_MONTH;
                    const cumVal    = cumulative[mi];
                    const cumPct    = (cumVal / rr.forecastFull * 100).toFixed(1);
                    const isOver    = cumVal > rr.forecastFull;
                    return (
                      <tr key={m} style={{ background: isCurrent ? 'var(--accent-light)' : 'transparent' }}>
                        <td style={{ fontWeight: isCurrent ? 700 : 400 }}>
                          {m} '26
                          {isCurrent && <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 8 }}>Current</span>}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 14px' }}>
                          {isLocked || !canEdit ? (
                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-3)' }}>
                              {monthly[mi] > 0 ? fmt(monthly[mi]) : '—'}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              className="eac-cell eac-editable"
                              value={monthly[mi] || ''}
                              placeholder="0"
                              onChange={e => update(mi, e.target.value)}
                              style={{ width: 100, display: 'inline-block', textAlign: 'right' }}
                            />
                          )}
                        </td>
                        <td className="num text-right" style={{ color: isOver ? 'var(--bad)' : undefined, fontWeight: 600 }}>
                          {fmt(cumVal)}
                        </td>
                        <td className="num text-right" style={{ color: 'var(--text-2)' }}>
                          {cumPct}%
                        </td>
                        <td>
                          <span className={`badge badge-${isLocked ? 'ok' : 'neutral'}`} style={{ fontSize: 10 }}>
                            {isLocked ? 'Recognised' : 'Forecast'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr style={{ background: 'var(--surface-3)', fontWeight: 700, borderTop: '2px solid var(--border-2)' }}>
                    <td style={{ paddingLeft: 20 }}>Total</td>
                    <td className="num text-right" style={{ color: totalForecast > rr.forecastFull ? 'var(--bad)' : 'var(--text)' }}>
                      {fmt(totalForecast)}
                    </td>
                    <td className="num text-right">—</td>
                    <td className="num text-right" style={{ color: totalForecast > rr.forecastFull ? 'var(--bad)' : 'var(--text)' }}>
                      {(totalForecast / rr.forecastFull * 100).toFixed(1)}%
                    </td>
                    <td>
                      {totalForecast > rr.forecastFull && (
                        <span className="badge badge-bad" style={{ fontSize: 10 }}>Over contract</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
