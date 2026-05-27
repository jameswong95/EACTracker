import React, { useState, useRef, useEffect } from 'react';
import { getProject, fmt, MONTHS, RATES, RESOURCE_POOL } from '../data/mock.js';

let nextId = 100;

/* ── Searchable person picker ── */
function PersonSelect({ available, onSelect, onCancel }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(true);
  const ref = useRef();
  const debounceTimer = useRef();

  function handleQueryChange(val) {
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(val), 150);
  }

  const filtered = available
    .filter(p => p.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
    .slice(0, 10);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onCancel();
    }
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      clearTimeout(debounceTimer.current);
    };
  }, [onCancel]);

  function select(person) { onSelect(person); setQuery(''); }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 240 }}>
      <div style={{ position: 'relative' }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
          stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l3 3"/>
        </svg>
        <input className="input" style={{ paddingLeft: 30 }} placeholder="Search by name…"
          value={query} autoFocus
          onChange={e => { handleQueryChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' && filtered.length > 0) select(filtered[0]);
            if (e.key === 'Escape') onCancel();
          }}
        />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border-2)',
          borderRadius: 8, boxShadow: 'var(--shadow-md)', maxHeight: 240, overflowY: 'auto',
        }}>
          {filtered.length === 0
            ? <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)' }}>No match found</div>
            : filtered.map(p => (
              <div key={p.id} onMouseDown={() => select(p)}
                style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-light)', border: '1px solid rgba(232,150,31,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: 'var(--accent)',
                }}>{p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                <span className="badge badge-accent" style={{ fontSize: 10 }}>{p.grade}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

/* ── Custom role picker (avoids native <select> OS styling) ── */
function RoleSelect({ roles, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text)',
          fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: open ? '0 0 0 3px rgba(232,150,31,.12)' : 'none',
          transition: 'border-color .12s, box-shadow .12s',
        }}
      >
        <span>{value}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ flexShrink: 0, marginLeft: 8, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M0 0l5 6 5-6z" fill="var(--accent)" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border-2)',
          borderRadius: 8, boxShadow: 'var(--shadow-md)', overflow: 'hidden',
        }}>
          {roles.map(r => (
            <div key={r}
              onMouseDown={() => { onChange(r); setOpen(false); }}
              style={{
                padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                fontWeight: r === value ? 600 : 400,
                color: r === value ? 'var(--accent)' : 'var(--text)',
                background: r === value ? 'var(--accent-light)' : '',
              }}
              onMouseEnter={e => { if (r !== value) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = r === value ? 'var(--accent-light)' : ''; }}
            >
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Resource({ projectId, navigate }) {
  const p = getProject(projectId);

  // Derive project span from resource data. fte arrays are indexed from (startYear, startMonth).
  const startYear  = p.startYear  ?? 2026;
  const startMonth = p.startMonth ?? 0;    // 0 = January
  const totalMonths = Math.max(12, ...p.resources.map(r => (r.fte || []).length));
  const endYear  = startYear + Math.floor((startMonth + totalMonths - 1) / 12);
  const endMonth = (startMonth + totalMonths - 1) % 12;
  const projectYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  const nowYear  = new Date().getFullYear();
  const nowMonth = new Date().getMonth(); // 0-indexed

  // Month helpers
  function absIdx(year, mi) { return (year - startYear) * 12 + mi - startMonth; }
  function inRange(year, mi) { const i = absIdx(year, mi); return i >= 0 && i < totalMonths; }
  function isLocked(year, mi) { return year < nowYear || (year === nowYear && mi < nowMonth); }

  const [viewYear, setViewYear] = useState(() =>
    Math.max(startYear, Math.min(endYear, nowYear))
  );
  const [rows, setRows] = useState(() =>
    p.resources.map(r => {
      const fte = Array(totalMonths).fill(0);
      (r.fte || []).forEach((v, i) => { if (i < totalMonths) fte[i] = v; });
      return { ...r, id: nextId++, fte, fn: r.fn || '' };
    })
  );
  const [adding, setAdding]           = useState(false);
  const [pendingPerson, setPendingPerson] = useState(null);
  const [pendingFn, setPendingFn]     = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [saveStatus, setSaveStatus]   = useState(null);
  const saveTimer   = useRef();
  const firstRender = useRef(true);

  const assignedNames = new Set(rows.map(r => r.role));
  const available = RESOURCE_POOL.filter(p => !assignedNames.has(p.name));

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setSaveStatus('saved');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus(null), 2000);
    return () => clearTimeout(saveTimer.current);
  }, [rows]);

  function handlePersonSelected(person) {
    setPendingPerson(person);
    setPendingFn(person.roles?.[0] || '');
  }

  function confirmAdd() {
    if (!pendingPerson) return;
    setRows(prev => [...prev, {
      id: nextId++, role: pendingPerson.name, grade: pendingPerson.grade,
      fn: pendingFn.trim(), fte: Array(totalMonths).fill(0),
    }]);
    setPendingPerson(null); setPendingFn(''); setAdding(false);
  }

  function cancelAdd() { setAdding(false); setPendingPerson(null); setPendingFn(''); }

  function updateFte(rowId, year, mi, val) {
    if (isLocked(year, mi) || !inRange(year, mi)) return;
    const idx = absIdx(year, mi);
    const num = Math.max(0, parseFloat(val) || 0);
    setRows(prev => prev.map(r =>
      r.id !== rowId ? r : { ...r, fte: r.fte.map((v, i) => i !== idx ? v : num) }
    ));
  }

  function removeRow(rowId) { setRows(prev => prev.filter(r => r.id !== rowId)); setConfirmingId(null); }

  // View-year monthly aggregates
  const viewMonthlyFte = MONTHS.map((_, mi) =>
    inRange(viewYear, mi) ? rows.reduce((s, r) => s + (r.fte[absIdx(viewYear, mi)] || 0), 0) : null
  );
  const viewMonthlyCost = MONTHS.map((_, mi) => {
    if (!inRange(viewYear, mi)) return null;
    return rows.reduce((s, r) => {
      const rate = RATES.find(rt => rt.grade === r.grade);
      return s + (r.fte[absIdx(viewYear, mi)] || 0) * (rate ? rate.monthly : 0) / 1000;
    }, 0);
  });
  const viewYearTotalFte  = viewMonthlyFte.reduce((s, v)  => v != null ? s + v  : s, 0);
  const viewYearTotalCost = viewMonthlyCost.reduce((s, v) => v != null ? s + v : s, 0);

  // All-project KPI totals
  const totalFteAllYears = rows.reduce((s, r) => s + r.fte.reduce((a, v) => a + v, 0), 0);
  const totalCostAllYears = rows.reduce((s, r) => {
    const rate = RATES.find(rt => rt.grade === r.grade);
    return s + r.fte.reduce((a, v) => a + v * (rate ? rate.monthly : 0) / 1000, 0);
  }, 0);
  const allMonthlyTotals = Array.from({ length: totalMonths }, (_, i) =>
    rows.reduce((s, r) => s + (r.fte[i] || 0), 0)
  );
  const peakFte = Math.max(0, ...allMonthlyTotals);

  // Year range label for subtitle
  const rangeLabel = totalMonths <= 12
    ? `Jan–Dec ${startYear}`
    : `${MONTHS[startMonth]} ${startYear} – ${MONTHS[endMonth]} ${endYear}`;

  return (
    <div className="screen">
      <div className="flex items-center gap-2 mb-4">
        <span className="breadcrumb-link" onClick={() => navigate('portfolio')}>Portfolio</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-link" onClick={() => navigate('project', p.id)}>{p.name}</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Resource Plan</span>
        <div className="grow" />
        {saveStatus === 'saved' && (
          <span style={{ fontSize: 12, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 5, animation: 'fadeIn .2s ease' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 6l3 3 6-6"/>
            </svg>
            Saved
          </span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('project', p.id)}>← Back</button>
      </div>

      {/* KPI tiles — all-project totals so they stay stable as you navigate years */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Total labour cost</div>
          <div className="kpi-value num">{fmt(totalCostAllYears * 1000)}</div>
          <div className="kpi-sub">{projectYears.length > 1 ? `across ${projectYears.length} years` : 'full year estimate'}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">People on project</div>
          <div className="kpi-value num">{rows.length}</div>
          <div className="kpi-sub">resource lines</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Peak FTE month</div>
          <div className="kpi-value num">{peakFte.toFixed(1)}</div>
          <div className="kpi-sub">{projectYears.length > 1 ? 'across full project' : 'this year'}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Total FTE·months</div>
          <div className="kpi-value num">{totalFteAllYears.toFixed(1)}</div>
          <div className="kpi-sub">full project span</div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Card header */}
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h4>FTE plan by person</h4>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
              {rangeLabel}
              {projectYears.length > 1 && (
                <span style={{ color: 'var(--accent)', fontWeight: 600, marginLeft: 6 }}>
                  · Year {viewYear - startYear + 1} of {projectYears.length}
                </span>
              )}
              <span style={{ marginLeft: 6 }}>· Past months locked · actuals from SAP</span>
            </div>
          </div>

          {/* Year navigator — only shown for multi-year projects */}
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

          {!adding && (
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              Add person
            </button>
          )}
        </div>

        {/* Add person panel */}
        {adding && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {!pendingPerson ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PersonSelect available={available} onSelect={handlePersonSelected} onCancel={cancelAdd} />
                <button className="btn btn-ghost btn-sm" onClick={cancelAdd}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => { setPendingPerson(null); setPendingFn(''); }}
                  title="Change person"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 6, background: 'var(--surface-3)', border: '1px solid var(--border-2)', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-light)', border: '1px solid rgba(232,150,31,.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: 'var(--accent)',
                  }}>{pendingPerson.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{pendingPerson.name}</span>
                  <span className="badge badge-accent" style={{ fontSize: 10 }}>{pendingPerson.grade}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
                    <path d="M1.5 5h7M6 2.5L8.5 5 6 7.5"/>
                  </svg>
                </button>
                <div style={{ flex: 1 }}>
                  {pendingPerson.roles?.length > 1 ? (
                    <RoleSelect roles={pendingPerson.roles} value={pendingFn} onChange={setPendingFn} />
                  ) : (
                    <div style={{ padding: '7px 12px', fontSize: 13, color: 'var(--text-2)', background: 'var(--surface-3)', borderRadius: 6, border: '1px solid var(--border-2)' }}>
                      {pendingFn}
                    </div>
                  )}
                </div>
                <button className="btn btn-primary btn-sm" onClick={confirmAdd}>Add</button>
                <button className="btn btn-ghost btn-sm" onClick={cancelAdd}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 210 }} />
              {MONTHS.map((_, i) => <col key={i} style={{ width: 58 }} />)}
              <col style={{ width: 68 }} />
              <col style={{ width: 44 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '10px 20px', textAlign: 'left' }}>Name</th>
                {MONTHS.map((m, mi) => {
                  const inRng = inRange(viewYear, mi);
                  const locked = isLocked(viewYear, mi);
                  return (
                    <th key={m} style={{
                      padding: '10px 4px', textAlign: 'center', fontSize: 11,
                      color: !inRng ? 'var(--border-2)' : locked ? 'var(--text-3)' : 'var(--accent)',
                    }}>{m}</th>
                  );
                })}
                <th style={{ padding: '10px 8px', textAlign: 'right', background: 'var(--surface-3)' }}>
                  {viewYear}
                </th>
                <th style={{ padding: '10px 8px' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const initials = row.role.split(' ').map(n => n[0]).join('').slice(0, 2);
                const isConfirming = confirmingId === row.id;
                const viewFteValues = MONTHS.map((_, mi) =>
                  inRange(viewYear, mi) ? (row.fte[absIdx(viewYear, mi)] || 0) : null
                );
                const rowYearTotal = viewFteValues.reduce((s, v) => v != null ? s + v : s, 0);

                return (
                  <React.Fragment key={row.id}>
                    <tr style={{
                      borderBottom: isConfirming ? 'none' : '1px solid var(--border)',
                      background: isConfirming ? 'rgba(240,88,88,0.04)' : '',
                      transition: 'background .15s',
                    }}>
                      <td style={{ padding: '8px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--accent-light)', border: '1px solid rgba(232,150,31,.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 800, color: 'var(--accent)',
                          }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{row.role}</div>
                            {row.fn && <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3, marginTop: 1 }}>{row.fn}</div>}
                          </div>
                        </div>
                      </td>
                      {MONTHS.map((_, mi) => {
                        const inRng = inRange(viewYear, mi);
                        const locked = isLocked(viewYear, mi);
                        const val = inRng ? (row.fte[absIdx(viewYear, mi)] || 0) : null;
                        return (
                          <td key={mi} style={{ padding: '4px 3px' }}>
                            {!inRng ? (
                              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--border-2)', padding: '7px 0' }}>—</div>
                            ) : locked ? (
                              <div className="eac-cell eac-locked" style={{ display: 'block', width: '100%', textAlign: 'right' }}>
                                {val > 0 ? val.toFixed(1) : '—'}
                              </div>
                            ) : (
                              <input
                                type="number" min="0" max="10" step="0.5"
                                className="eac-cell eac-editable"
                                value={val || ''}
                                placeholder="0"
                                onChange={e => updateFte(row.id, viewYear, mi, e.target.value)}
                                style={{ display: 'block', width: '100%' }}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', background: 'var(--surface-3)' }}>
                        {rowYearTotal > 0 ? rowYearTotal.toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {!isConfirming && (
                          <button className="btn btn-icon" onClick={() => setConfirmingId(row.id)}
                            title={`Remove ${row.role}`} style={{ color: 'var(--text-3)', padding: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M3 3.5l.7 8a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9l.7-8"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>

                    {isConfirming && (
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bad-bg)' }}>
                        <td colSpan={MONTHS.length + 3} style={{ padding: '10px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--bad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 1L13.06 12H.94L7 1Z"/><path d="M7 5v3M7 10v.5"/>
                            </svg>
                            <span style={{ fontSize: 13, color: 'var(--bad-text)', fontWeight: 500 }}>
                              Remove <strong>{row.role}</strong> from this project?
                            </span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingId(null)}>Cancel</button>
                              <button className="btn btn-danger btn-sm" onClick={() => removeRow(row.id)}>Remove</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={MONTHS.length + 3} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No people added yet — click "Add person" to assign from the pool.
                  </td>
                </tr>
              )}

              {/* Footer: FTE totals */}
              <tr style={{ background: 'var(--surface-3)', borderTop: '2px solid var(--border-2)', fontWeight: 700 }}>
                <td style={{ padding: '10px 20px', fontSize: 13 }}>Total FTE</td>
                {viewMonthlyFte.map((t, mi) => (
                  <td key={mi} style={{ padding: '10px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: t == null ? 'var(--border-2)' : t === 0 ? 'var(--text-3)' : 'var(--text)' }}>
                    {t == null ? '—' : t > 0 ? t.toFixed(1) : '—'}
                  </td>
                ))}
                <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {viewYearTotalFte.toFixed(1)}
                </td>
                <td />
              </tr>

              {/* Footer: cost totals */}
              <tr style={{ background: 'var(--accent-light)', fontWeight: 600, color: 'var(--accent)' }}>
                <td style={{ padding: '10px 20px', fontSize: 13 }}>Est. labour cost ($K)</td>
                {viewMonthlyCost.map((t, mi) => (
                  <td key={mi} style={{ padding: '10px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: t == null ? 'var(--accent-mid)' : t === 0 ? 'var(--accent-mid)' : 'var(--accent)' }}>
                    {t == null ? '—' : t > 0 ? t.toFixed(0) : '—'}
                  </td>
                ))}
                <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 14 }}>
                  {viewYearTotalCost.toFixed(0)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
