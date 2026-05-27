import React, { useState } from 'react';
import { getProject, fmt, MONTHS } from '../data/mock.js';
import { LineChart } from '../components/Charts.jsx';

export default function RevRec({ projectId, navigate }) {
  const p = getProject(projectId);
  const rr = p.revrec;

  const [curve, setCurve] = useState([...rr.recognitionCurve]);
  const [saved, setSaved] = useState(false);

  function updateCurve(mi, val) {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setCurve(prev => {
      const next = [...prev];
      next[mi] = num;
      return next;
    });
    setSaved(false);
  }

  const recognisedPct    = (rr.recognisedToDate / rr.forecastFull * 100).toFixed(1);
  const remainingRevenue = rr.forecastFull - rr.recognisedToDate;

  const monthlyRevenue = MONTHS.map((_, mi) => {
    const thisMonth = curve[mi] / 100 * rr.forecastFull;
    const prevMonth = mi > 0 ? curve[mi - 1] / 100 * rr.forecastFull : 0;
    return thisMonth - prevMonth;
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const guardrails = [
    { ok: true,                       text: 'Monthly reconciliation active' },
    { ok: parseFloat(recognisedPct) <= 100, text: 'Recognition does not exceed contract' },
    { ok: curve.every((v, i) => i === 0 || v >= curve[i - 1]), text: 'Curve is monotonically increasing' },
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
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save RevRec'}
        </button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Contract value</div>
          <div className="kpi-value num">{fmt(rr.forecastFull)}</div>
          <div className="kpi-sub">total to recognise</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Recognised to date</div>
          <div className="kpi-value num" style={{ color: 'var(--ok)' }}>{fmt(rr.recognisedToDate)}</div>
          <div className="kpi-sub">{recognisedPct}% of contract</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Remaining revenue</div>
          <div className="kpi-value num">{fmt(remainingRevenue)}</div>
          <div className="kpi-sub">to be recognised</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Method</div>
          <div style={{ marginTop: 10 }}>
            <span className="badge badge-accent">% Complete</span>
          </div>
          <div className="kpi-sub">PM-entered monthly</div>
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
          </div>
        </div>

        {/* Right: chart + table */}
        <div className="flex-col gap-4 grow">
          <div className="card card-p">
            <div className="flex items-center justify-between mb-4">
              <h4>Cumulative recognition curve</h4>
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
              data={curve.map(v => v / 100 * rr.forecastFull / 1000)}
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
                Enter cumulative % complete for each month. Locked months show actuals from SAP.
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{ textAlign: 'right' }}>% Complete</th>
                    <th style={{ textAlign: 'right' }}>Cumulative value</th>
                    <th style={{ textAlign: 'right' }}>This month</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTHS.map((m, mi) => {
                    const isPast    = mi <= 4;
                    const isCurrent = mi === 4;
                    const cumVal    = curve[mi] / 100 * rr.forecastFull;
                    const thisMonth = monthlyRevenue[mi];
                    return (
                      <tr key={m} style={{ background: isCurrent ? 'var(--accent-light)' : 'transparent' }}>
                        <td style={{ fontWeight: isCurrent ? 700 : 400 }}>
                          {m} '26
                          {isCurrent && <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 8 }}>Current</span>}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 14px' }}>
                          {isPast ? (
                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-3)' }}>
                              {curve[mi]}%
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0" max="100" step="1"
                              className="eac-cell eac-editable"
                              value={curve[mi] || ''}
                              placeholder="0"
                              onChange={e => updateCurve(mi, e.target.value)}
                              style={{ width: 72, display: 'inline-block' }}
                            />
                          )}
                        </td>
                        <td className="num text-right">{fmt(cumVal)}</td>
                        <td className="num text-right" style={{ fontWeight: 600, color: thisMonth > 0 ? 'var(--ok)' : 'var(--text-3)' }}>
                          {thisMonth > 0 ? '+' + fmt(thisMonth) : '—'}
                        </td>
                        <td>
                          <span className={`badge badge-${isPast ? 'ok' : 'neutral'}`} style={{ fontSize: 10 }}>
                            {isPast ? 'Recognised' : 'Forecast'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
