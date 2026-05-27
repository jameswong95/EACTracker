import React, { useState } from 'react';
import { getProject, fmt, MONTHS } from '../data/mock.js';

function OverTooltip({ x, y, month, colTotal, budgetMonthly, rows, absIdx, viewYear }) {
  const over = colTotal - budgetMonthly;
  const pct = ((over / budgetMonthly) * 100).toFixed(1);
  const mi = MONTHS.indexOf(month);
  const sorted = [...rows]
    .map(r => ({ label: r.label, value: r.values[absIdx(viewYear, mi)] || 0 }))
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{
      position: 'fixed', left: x + 14, top: y, transform: 'translateY(-100%)',
      zIndex: 9999,
      background: 'var(--surface)', border: '1.5px solid var(--bad)', borderRadius: 4,
      padding: '10px 14px', minWidth: 220,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)', pointerEvents: 'none', whiteSpace: 'nowrap',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--bad)', marginBottom: 8 }}>
        Over budget · {month}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-3)' }}>Monthly total</span>
        <span style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, color: 'var(--bad)' }}>${colTotal.toFixed(0)}K</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 12, marginBottom: 8 }}>
        <span style={{ color: 'var(--text-3)' }}>Monthly budget</span>
        <span style={{ fontFamily: 'Courier New, monospace', color: 'var(--text-2)' }}>${budgetMonthly.toFixed(0)}K</span>
      </div>
      <div style={{ borderTop: '1px solid var(--surface-2)', paddingTop: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 6 }}>Cost breakdown</div>
        {sorted.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: 'var(--text-2)' }}>{r.label}</span>
            <span style={{ fontFamily: 'Courier New, monospace', color: 'var(--text)' }}>${r.value.toFixed(0)}K</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--surface-2)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-3)' }}>Overspend</span>
        <span style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, color: 'var(--bad)' }}>+${over.toFixed(0)}K ({pct}%)</span>
      </div>
    </div>
  );
}

export default function EacEditor({ projectId, navigate }) {
  const p = getProject(projectId);

  // Same span logic as Resource Plan — values arrays are flat, indexed from (startYear, startMonth)
  const startYear  = p.startYear  ?? 2026;
  const startMonth = p.startMonth ?? 0;
  const totalMonths = Math.max(12, ...p.eacMonthly.rows.map(r => (r.values || []).length));
  const endYear  = startYear + Math.floor((startMonth + totalMonths - 1) / 12);
  const endMonth = (startMonth + totalMonths - 1) % 12;
  const projectYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  const nowYear  = new Date().getFullYear();
  const nowMonth = new Date().getMonth(); // 0-indexed

  function absIdx(year, mi) { return (year - startYear) * 12 + mi - startMonth; }
  function inRange(year, mi) { const i = absIdx(year, mi); return i >= 0 && i < totalMonths; }
  function isLocked(year, mi) { return year < nowYear || (year === nowYear && mi < nowMonth); }

  const [viewYear, setViewYear] = useState(() =>
    Math.max(startYear, Math.min(endYear, nowYear))
  );
  const [rows, setRows] = useState(() =>
    p.eacMonthly.rows.map(r => {
      const values = Array(totalMonths).fill(0);
      (r.values || []).forEach((v, i) => { if (i < totalMonths) values[i] = v; });
      return { ...r, values };
    })
  );
  const [saved, setSaved] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { mi, x, y }

  function updateCell(rowIdx, year, mi, val) {
    if (isLocked(year, mi) || !inRange(year, mi)) return;
    const idx = absIdx(year, mi);
    const num = parseFloat(val) || 0;
    setRows(prev => prev.map((r, ri) =>
      ri !== rowIdx ? r : { ...r, values: r.values.map((v, i) => i !== idx ? v : num) }
    ));
    setSaved(false);
  }

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 3000); }

  // View-year aggregates (for the table)
  const viewColTotals = MONTHS.map((_, mi) =>
    inRange(viewYear, mi) ? rows.reduce((s, r) => s + (r.values[absIdx(viewYear, mi)] || 0), 0) : null
  );
  const viewRowTotals = rows.map(r =>
    MONTHS.reduce((s, _, mi) => inRange(viewYear, mi) ? s + (r.values[absIdx(viewYear, mi)] || 0) : s, 0)
  );
  const viewGrandTotal = viewColTotals.reduce((s, v) => v != null ? s + v : s, 0);

  // All-years aggregates (for the EAC info bar)
  const allYearsTotal = rows.reduce((s, r) => s + r.values.reduce((a, v) => a + (v || 0), 0), 0);
  const budgetK = p.budget / 1000;

  const rangeLabel = totalMonths <= 12
    ? `Jan–Dec ${startYear}`
    : `${MONTHS[startMonth]} ${startYear} – ${MONTHS[endMonth]} ${endYear}`;

  return (
    <div className="screen">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="breadcrumb-link" onClick={() => navigate('portfolio')}>Portfolio</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-link" onClick={() => navigate('project', p.id)}>{p.name}</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">EAC Editor</span>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('project', p.id)}>← Back to project</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          {saved ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 6l3 3 6-6"/>
              </svg>
              Saved
            </span>
          ) : 'Save EAC'}
        </button>
      </div>

      {/* Info bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="card card-p" style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Budget</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{fmt(p.budget)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{rangeLabel}</div>
        </div>
        <div className="card card-p" style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>EAC (all years)</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: allYearsTotal > budgetK ? 'var(--warn)' : 'var(--ok)' }}>
            {fmt(allYearsTotal * 1000)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            {projectYears.length > 1 ? `${projectYears.length} years` : 'full year'}
          </div>
        </div>
        <div className="card card-p" style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Variance</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: allYearsTotal > budgetK ? 'var(--warn)' : 'var(--ok)' }}>
            {allYearsTotal > budgetK ? '+' : ''}{((allYearsTotal - budgetK) / budgetK * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>vs {fmt(p.budget)}</div>
        </div>
        <div className="card card-p" style={{ flex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Legend</div>
          <div className="flex gap-3" style={{ fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-2)' }}>Locked (SAP)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--border)', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-2)' }}>Editable</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--warn-bg)', border: '1px solid var(--warn)', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-2)' }}>Over budget</span>
            </span>
            {projectYears.length > 1 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--surface-3)', border: '1px dashed var(--border-2)', display: 'inline-block' }} />
                <span style={{ color: 'var(--text-2)' }}>Out of range</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Card header with year nav */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Monthly cost breakdown · $K</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {rangeLabel}
              {projectYears.length > 1 && (
                <span style={{ color: 'var(--accent)', fontWeight: 600, marginLeft: 6 }}>
                  · Year {viewYear - startYear + 1} of {projectYears.length}
                </span>
              )}
            </div>
          </div>

          {projectYears.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--surface-2)', borderRadius: 8, padding: '3px 4px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewYear(y => y - 1)}
                disabled={viewYear <= startYear}
                className="btn btn-icon"
                style={{ padding: '5px 8px', opacity: viewYear <= startYear ? 0.3 : 1, borderRadius: 5 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 10L4 6l4-4"/>
                </svg>
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 44, textAlign: 'center', color: 'var(--text)', letterSpacing: '0.01em' }}>
                {viewYear}
              </span>
              <button
                onClick={() => setViewYear(y => y + 1)}
                disabled={viewYear >= endYear}
                className="btn btn-icon"
                style={{ padding: '5px 8px', opacity: viewYear >= endYear ? 0.3 : 1, borderRadius: 5 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10l4-4-4-4"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 200 }} />
              {MONTHS.map((_, i) => <col key={i} style={{ width: 76 }} />)}
              <col style={{ width: 90 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  Cost category
                </th>
                {MONTHS.map((m, mi) => {
                  const inRng = inRange(viewYear, mi);
                  const locked = inRng && isLocked(viewYear, mi);
                  return (
                    <th key={m} style={{
                      padding: '12px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: !inRng ? 'var(--border-2)' : locked ? 'var(--text-3)' : 'var(--accent)',
                      background: !inRng ? 'var(--surface-3)' : locked ? 'var(--surface-2)' : 'var(--surface)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      {m}
                    </th>
                  );
                })}
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', background: 'var(--surface-3)', borderBottom: '1px solid var(--border)' }}>
                  {viewYear}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500 }}>{row.label}</td>
                  {MONTHS.map((_, mi) => {
                    const inRng = inRange(viewYear, mi);
                    const locked = inRng && isLocked(viewYear, mi);
                    const idx = inRng ? absIdx(viewYear, mi) : -1;
                    const v = inRng ? (row.values[idx] || 0) : null;
                    const isOver = inRng && !locked && (viewColTotals[mi] || 0) > budgetK / 10;
                    return (
                      <td key={mi} style={{ padding: '4px 3px', background: !inRng ? 'var(--surface-3)' : locked ? 'var(--surface-2)' : 'transparent' }}>
                        {!inRng ? (
                          <div style={{ padding: '7px 4px', textAlign: 'center', fontSize: 11, color: 'var(--border-2)' }}>—</div>
                        ) : (
                          <input
                            className={`eac-cell ${locked ? 'eac-locked' : isOver ? 'eac-over' : 'eac-editable'}`}
                            type="number"
                            value={v || ''}
                            disabled={locked}
                            placeholder="0"
                            onChange={e => updateCell(ri, viewYear, mi, e.target.value)}
                            style={{ display: 'block', width: '100%' }}
                            onMouseEnter={e => isOver && setTooltip({ mi, x: e.clientX, y: e.clientY })}
                            onMouseMove={e => isOver && setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : t)}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td style={{ padding: '4px 8px', background: 'var(--surface-3)', textAlign: 'right', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    {viewRowTotals[ri] > 0 ? viewRowTotals[ri].toFixed(0) : '—'}
                  </td>
                </tr>
              ))}

              {/* Column totals */}
              <tr style={{ background: 'var(--surface-3)', borderTop: '2px solid var(--border-2)' }}>
                <td style={{ padding: '10px 20px', fontWeight: 700, fontSize: 13 }}>Monthly total ($K)</td>
                {viewColTotals.map((t, mi) => {
                  const inRng = inRange(viewYear, mi);
                  const locked = inRng && isLocked(viewYear, mi);
                  return (
                    <td key={mi}
                      onMouseEnter={e => t > budgetK / 10 && !locked && inRng && setTooltip({ mi, x: e.clientX, y: e.clientY })}
                      onMouseMove={e => t > budgetK / 10 && !locked && inRng && setTooltip(s => s ? { ...s, x: e.clientX, y: e.clientY } : s)}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        padding: '10px 4px', textAlign: 'right', fontWeight: 700, fontSize: 13,
                        fontVariantNumeric: 'tabular-nums',
                        color: !inRng ? 'var(--border-2)' : locked ? 'var(--text-3)' : t > budgetK / 10 ? 'var(--bad)' : 'var(--text)',
                        background: !inRng ? 'var(--surface-3)' : locked ? 'var(--surface-2)' : 'var(--surface-3)',
                      }}>
                      {t == null ? '—' : t > 0 ? t.toFixed(0) : '—'}
                    </td>
                  );
                })}
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums', color: viewGrandTotal > budgetK ? 'var(--warn-text)' : 'var(--text)' }}>
                  {viewGrandTotal.toFixed(0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      {tooltip && viewColTotals[tooltip.mi] > budgetK / 10 && (
        <OverTooltip
          x={tooltip.x} y={tooltip.y}
          month={MONTHS[tooltip.mi]}
          colTotal={viewColTotals[tooltip.mi]}
          budgetMonthly={budgetK / 10}
          rows={rows} absIdx={absIdx} viewYear={viewYear}
        />
      )}

        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 24 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Values in $K · Budget = {fmt(p.budget)} ({budgetK.toFixed(0)} $K) ·
            <svg width="9" height="10" viewBox="0 0 8 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="6" height="5" rx="1"/><path d="M2.5 4V2.5a1.5 1.5 0 0 1 3 0V4"/>
            </svg>
            SAP-locked · contact Finance to amend
          </span>
          {projectYears.length > 1 && (
            <span>All-years EAC = {fmt(allYearsTotal * 1000)} · Showing {viewYear} only</span>
          )}
        </div>
      </div>
    </div>
  );
}
