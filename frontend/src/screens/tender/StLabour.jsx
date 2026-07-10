import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTenderLabour, fmt } from '../../data/store.js';
import { api } from '../../data/api.js';
import Select from '../../components/Select.jsx';
import Icon from '../../components/Icon.jsx';

const UNIT_OPTS = [
  { value: 'md', label: 'Man-days' },
  { value: 'mm', label: 'Man-months' },
  { value: 'hr', label: 'Hours' },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_OPTS = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));

// Build a contiguous list of { year, month } from an inclusive range.
function buildMonths(range) {
  if (!range) return [];
  const list = [];
  let y = range.start_year, m = range.start_month;
  const end = range.end_year * 12 + range.end_month;
  let guard = 0;
  while (y * 12 + m <= end && guard < 600) { list.push({ year: y, month: m }); m++; if (m > 12) { m = 1; y++; } guard++; }
  return list;
}

// ST (Straight-Time) Labour — plan resource effort by phase, function and month.
// Cost of a cell = qty * function rate. Totals roll up per year and grand total.
export default function StLabour({ tenderId, canEdit }) {
  const { data, reload } = useTenderLabour(tenderId);
  const [err, setErr] = useState(null);
  const [newPhase, setNewPhase] = useState('');
  const [newFn, setNewFn] = useState({ name: '', rate: '', unit: 'md' });
  const [showFns, setShowFns] = useState(true);
  const [alloc, setAlloc] = useState({});      // `${phase}:${fn}:${year}:${month}` -> string
  const savingRef = useRef(new Set());

  const phases = data?.phases || [];
  const functions = data?.functions || [];
  const range = data?.range || null;
  const months = useMemo(() => buildMonths(range), [range]);

  // Year groupings for the two-row header (year spans its months).
  const yearGroups = useMemo(() => {
    const g = [];
    for (const mo of months) {
      const last = g[g.length - 1];
      if (last && last.year === mo.year) last.count++;
      else g.push({ year: mo.year, count: 1 });
    }
    return g;
  }, [months]);

  const rateOf = useMemo(() => {
    const m = {};
    for (const f of functions) m[f.id] = Number(f.rate) || 0;
    return m;
  }, [functions]);

  // Sync local allocation map whenever the server data changes.
  useEffect(() => {
    const m = {};
    for (const a of (data?.allocations || [])) m[`${a.phase_id}:${a.function_id}:${a.year}:${a.month}`] = String(Number(a.qty));
    setAlloc(m);
  }, [data?.allocations]);

  const key = (p, f, mo) => `${p}:${f}:${mo.year}:${mo.month}`;
  const getNum = (p, f, mo) => Number(alloc[key(p, f, mo)] || 0);
  const cellCost = (p, f, mo) => getNum(p, f, mo) * (rateOf[f] || 0);

  const yearTotals = useMemo(() => {
    const t = {}; let grand = 0;
    for (const mo of months) {
      for (const ph of phases) for (const f of functions) {
        const c = getNum(ph.id, f.id, mo) * (rateOf[f.id] || 0);
        t[mo.year] = (t[mo.year] || 0) + c; grand += c;
      }
    }
    return { t, grand };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months, phases, functions, alloc, rateOf]);

  function report(fn) { return async (...a) => { try { await fn(...a); reload(); setErr(null); } catch (e) { setErr(e.message || 'Action failed'); } }; }

  const addPhase = report(async () => {
    if (!newPhase.trim()) { setErr('Phase name required'); return; }
    await api.post(`/api/tender/${tenderId}/labour/phases`, { name: newPhase.trim() });
    setNewPhase('');
  });
  const renamePhase = report((id, name) => api.patch(`/api/tender/labour/phases/${id}`, { name }));
  const delPhase = report((id) => api.del(`/api/tender/labour/phases/${id}`));

  const addFn = report(async () => {
    if (!newFn.name.trim()) { setErr('Function name required'); return; }
    await api.post(`/api/tender/${tenderId}/labour/functions`, { name: newFn.name.trim(), rate: Number(newFn.rate) || 0, unit: newFn.unit });
    setNewFn({ name: '', rate: '', unit: 'md' });
  });
  const patchFn = report((id, patch) => api.patch(`/api/tender/labour/functions/${id}`, patch));
  const delFn = report((id) => api.del(`/api/tender/labour/functions/${id}`));

  const updateRange = report((patch) => api.put(`/api/tender/${tenderId}/labour/range`, { ...range, ...patch }));

  // Save a single cell in the background (no reload) so keyboard entry stays snappy.
  async function saveCell(phaseId, fnId, mo, value) {
    const k = key(phaseId, fnId, mo);
    if (savingRef.current.has(k)) return;
    savingRef.current.add(k);
    try {
      await api.put(`/api/tender/${tenderId}/labour/allocation`, {
        phase_id: phaseId, function_id: fnId, year: mo.year, month: mo.month, qty: Number(value) || 0,
      });
      setErr(null);
    } catch (e) { setErr(e.message || 'Save failed'); }
    finally { savingRef.current.delete(k); }
  }

  const cellId = (phaseId, fi, mi) => `stl-${phaseId}-${fi}-${mi}`;
  function focusCell(phaseId, fi, mi) {
    const el = document.getElementById(cellId(phaseId, fi, mi));
    if (el) { el.focus(); el.select?.(); return true; }
    return false;
  }
  // Enter = down (next function); at the bottom, jump to top of the next month.
  // Shift+Enter = up; at the top, jump to bottom of the previous month.
  function onCellKeyDown(e, phaseId, fi, mi) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const nFns = functions.length, nMonths = months.length;
    if (e.shiftKey) {
      if (fi > 0) focusCell(phaseId, fi - 1, mi);
      else if (mi > 0) focusCell(phaseId, nFns - 1, mi - 1);
    } else {
      if (fi < nFns - 1) focusCell(phaseId, fi + 1, mi);
      else if (mi < nMonths - 1) focusCell(phaseId, 0, mi + 1);
      else e.target.blur();
    }
  }

  const cellBg = (q) => (!q ? undefined
    : q >= 1 ? 'color-mix(in srgb, var(--accent) 24%, var(--surface))'
      : 'color-mix(in srgb, var(--accent) 11%, var(--surface))');

  return (
    <div>
      {err && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="alert-body">{err}</div>
          <button className="alert-close" onClick={() => setErr(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Toolbar: timeline range + functions toggle + keyboard hint */}
      <div className="card card-p" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-2)' }}>Timeline</span>
          {range && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Select ghost style={{ minWidth: 88 }} value={String(range.start_month)} options={MONTH_OPTS}
                disabled={!canEdit} onChange={v => updateRange({ start_month: Number(v) })} />
              <input className="input num" type="number" defaultValue={range.start_year} disabled={!canEdit}
                onBlur={e => Number(e.target.value) !== range.start_year && updateRange({ start_year: Number(e.target.value) })}
                style={{ width: 74, textAlign: 'center' }} />
              <Icon name="arrowRight" size={12} style={{ color: 'var(--text-3)' }} />
              <Select ghost style={{ minWidth: 88 }} value={String(range.end_month)} options={MONTH_OPTS}
                disabled={!canEdit} onChange={v => updateRange({ end_month: Number(v) })} />
              <input className="input num" type="number" defaultValue={range.end_year} disabled={!canEdit}
                onBlur={e => Number(e.target.value) !== range.end_year && updateRange({ end_year: Number(e.target.value) })}
                style={{ width: 74, textAlign: 'center' }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>{months.length} mo</span>
            </div>
          )}
        </div>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={() => setShowFns(s => !s)}>
          {showFns ? 'Hide functions' : `Functions (${functions.length})`}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          <kbd>Enter</kbd> next · <kbd>Shift</kbd>+<kbd>Enter</kbd> up · <kbd>Tab</kbd> across
        </span>
      </div>

      {/* Functions catalogue (collapsible) */}
      {showFns && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-p" style={{ paddingBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Functions</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Roles and their unit cost rate (e.g. System Engineer, Project Manager).</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Function</th><th className="num">Rate (S$)</th><th>Unit</th>{canEdit && <th />}</tr>
              </thead>
              <tbody>
                {functions.length === 0 && (
                  <tr><td colSpan={canEdit ? 4 : 3} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 16 }}>No functions yet — add one below.</td></tr>
                )}
                {functions.map(f => (
                  <tr key={f.id}>
                    <td>
                      {canEdit ? (
                        <input className="input" defaultValue={f.name}
                          onBlur={e => e.target.value.trim() && e.target.value !== f.name && patchFn(f.id, { name: e.target.value.trim() })} style={{ maxWidth: 220 }} />
                      ) : f.name}
                    </td>
                    <td className="num">
                      {canEdit ? (
                        <input className="input num" type="number" defaultValue={Number(f.rate)}
                          onBlur={e => Number(e.target.value) !== Number(f.rate) && patchFn(f.id, { rate: Number(e.target.value) || 0 })} style={{ maxWidth: 120, textAlign: 'right' }} />
                      ) : fmt(f.rate)}
                    </td>
                    <td>
                      {canEdit ? (
                        <Select ghost style={{ minWidth: 120 }} value={f.unit} options={UNIT_OPTS} onChange={v => patchFn(f.id, { unit: v })} />
                      ) : (UNIT_OPTS.find(u => u.value === f.unit)?.label || f.unit)}
                    </td>
                    {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => delFn(f.id)} title="Delete"><Icon name="x" size={13} /></button></td>}
                  </tr>
                ))}
                {canEdit && (
                  <tr>
                    <td><input className="input" placeholder="Function name" value={newFn.name}
                      onChange={e => setNewFn(s => ({ ...s, name: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addFn()} style={{ maxWidth: 220 }} /></td>
                    <td className="num"><input className="input num" type="number" placeholder="0" value={newFn.rate}
                      onChange={e => setNewFn(s => ({ ...s, rate: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addFn()} style={{ maxWidth: 120, textAlign: 'right' }} /></td>
                    <td><Select ghost style={{ minWidth: 120 }} value={newFn.unit} options={UNIT_OPTS} onChange={v => setNewFn(s => ({ ...s, unit: v }))} /></td>
                    <td><button className="btn btn-primary btn-sm" onClick={addFn}>Add</button></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-phase monthly allocation matrices */}
      {phases.length === 0 && (
        <div className="card card-p" style={{ marginBottom: 16, textAlign: 'center', color: 'var(--text-3)' }}>
          No phases yet. Add a phase of work below to start allocating resources.
        </div>
      )}

      {phases.map(ph => {
        const phaseGrand = functions.reduce((s, f) => s + months.reduce((ms, mo) => ms + cellCost(ph.id, f.id, mo), 0), 0);
        return (
          <div className="card" style={{ marginBottom: 16 }} key={ph.id}>
            <div className="card-p" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
              {canEdit ? (
                <input className="input" defaultValue={ph.name}
                  onBlur={e => e.target.value.trim() && e.target.value !== ph.name && renamePhase(ph.id, e.target.value.trim())}
                  style={{ fontWeight: 700, maxWidth: 320 }} />
              ) : <div style={{ fontSize: 13, fontWeight: 700 }}>{ph.name}</div>}
              <div className="grow" />
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Phase total: <strong style={{ color: 'var(--text)' }}>{fmt(phaseGrand)}</strong></div>
              {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => delPhase(ph.id)} title="Delete phase">Delete</button>}
            </div>
            <div className="table-wrap">
              <table style={{ whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1, minWidth: 150 }}>Function</th>
                    <th rowSpan={2} className="num">Rate</th>
                    {yearGroups.map(g => <th key={g.year} className="num" colSpan={g.count} style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>{g.year}</th>)}
                    <th rowSpan={2} className="num" style={{ borderLeft: '2px solid var(--border)' }}>Total (S$)</th>
                  </tr>
                  <tr>
                    {months.map((mo, mi) => (
                      <th key={mi} className="num" style={{ fontSize: 11, fontWeight: 600, minWidth: 54 }}>{MONTHS[mo.month - 1]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {functions.length === 0 && (
                    <tr><td colSpan={months.length + 3} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 16 }}>Add functions above first.</td></tr>
                  )}
                  {functions.map((f, fi) => {
                    const rowTotal = months.reduce((s, mo) => s + cellCost(ph.id, f.id, mo), 0);
                    return (
                      <tr key={f.id}>
                        <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1, fontWeight: 500 }}>{f.name}</td>
                        <td className="num" style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmt(f.rate)}</td>
                        {months.map((mo, mi) => {
                          const q = getNum(ph.id, f.id, mo);
                          return (
                            <td key={mi} className="num" style={{ padding: 2, background: cellBg(q) }}>
                              {canEdit ? (
                                <input
                                  id={cellId(ph.id, fi, mi)}
                                  type="number" step="0.05" inputMode="decimal"
                                  value={alloc[key(ph.id, f.id, mo)] ?? ''}
                                  placeholder="—"
                                  onChange={e => setAlloc(a => ({ ...a, [key(ph.id, f.id, mo)]: e.target.value }))}
                                  onBlur={e => saveCell(ph.id, f.id, mo, e.target.value)}
                                  onFocus={e => e.target.select()}
                                  onKeyDown={e => onCellKeyDown(e, ph.id, fi, mi)}
                                  style={{ width: 50, textAlign: 'center', border: 'none', background: 'transparent', padding: '6px 2px', fontSize: 12, color: 'inherit' }}
                                  title={`${f.name} · ${MONTHS[mo.month - 1]} ${mo.year}`}
                                />
                              ) : (q || '')}
                            </td>
                          );
                        })}
                        <td className="num" style={{ fontWeight: 600, borderLeft: '2px solid var(--border)' }}>{fmt(rowTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {functions.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--surface-2)', fontWeight: 700 }}>Subtotal (S$)</td>
                      <td style={{ background: 'var(--surface-2)' }} />
                      {months.map((mo, mi) => {
                        const mt = functions.reduce((s, f) => s + cellCost(ph.id, f.id, mo), 0);
                        return <td key={mi} className="num" style={{ fontSize: 11, fontWeight: 600, background: 'var(--surface-2)' }}>{mt ? fmt(mt) : '·'}</td>;
                      })}
                      <td className="num" style={{ fontWeight: 700, borderLeft: '2px solid var(--border)', background: 'var(--surface-2)' }}>{fmt(phaseGrand)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        );
      })}

      {canEdit && (
        <div className="card card-p" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input" placeholder="New phase of work (e.g. Design, Build, Commissioning)" value={newPhase}
            onChange={e => setNewPhase(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPhase()} style={{ maxWidth: 360 }} />
          <button className="btn btn-primary btn-sm" onClick={addPhase}>Add phase</button>
        </div>
      )}

      {/* Grand summary — total by year + grand total */}
      {phases.length > 0 && functions.length > 0 && (
        <div className="card">
          <div className="card-p" style={{ paddingBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Labour summary</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Straight-time labour cost across all phases.</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{yearGroups.map(g => <th key={g.year} className="num">{g.year}</th>)}<th className="num">Grand total (S$)</th></tr>
              </thead>
              <tbody>
                <tr>
                  {yearGroups.map(g => <td key={g.year} className="num">{fmt(yearTotals.t[g.year] || 0)}</td>)}
                  <td className="num" style={{ fontWeight: 700, color: 'var(--accent, var(--ok))' }}>{fmt(yearTotals.grand)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
