import React, { useState, useMemo, useEffect } from 'react';
import { useProject, useCostModule, useEtc, useCostSchedule, fmt, MONTHS } from '../data/store.js';
import { api } from '../data/api.js';
import { CAT_COLORS } from '../components/Charts.jsx';
import DatePicker from '../components/DatePicker.jsx';
import Icon from '../components/Icon.jsx';

// Shared screen for the Material, Sub-Con and Other LOB/MISC modules. These are
// project-level planning registers; SAP import remains the committed-cost source.
export default function CostModule({ module, title, etcKey, category, descPlaceholder, projectId, navigate, role, embedded = false }) {
  const { project: p, loading } = useProject(projectId);
  const { items, reload } = useCostModule(module, projectId);
  const { etc } = useEtc(projectId);
  const { schedule, reload: reloadSchedule } = useCostSchedule(module, projectId);
  const canEdit = role !== 'Project Director';

  const [form, setForm] = useState({ description: '', estimated_received_date: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [view, setView] = useState('register');

  const plannedTotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const datedTotal   = items.reduce((s, it) => s + (it.estimated_received_date ? Number(it.amount || 0) : 0), 0);

  async function addItem() {
    if (!form.description) { setErr('Description is required'); return; }
    if (!form.estimated_received_date) { setErr('Estimated received date is required'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post(`/api/${module}`, {
        project_id: projectId,
        description: form.description,
        estimated_received_date: form.estimated_received_date || null,
        amount: Number(form.amount) || 0,
        created_by: null,
      });
      setForm({ description: '', estimated_received_date: '', amount: '' });
      reload();
    } catch (e) { setErr(e.message || 'Failed to add'); }
    finally { setBusy(false); }
  }

  async function patchItem(id, patch) {
    setErr(null);
    try { await api.patch(`/api/${module}/${id}`, patch); reload(); return true; }
    catch (e) { setErr(e.message || 'Update failed'); return false; }
  }

  async function removeItem(id) {
    try { await api.del(`/api/${module}/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  if (loading) return (
    <div className={embedded ? 'cost-module cost-module-embedded' : 'screen cost-module'}>
      <div className="skel skel-title" style={{ width: 240, marginBottom: 20 }} />
      <div className="skel skel-card" />
    </div>
  );

  return (
    <div className={embedded ? 'cost-module cost-module-embedded' : 'screen cost-module'}>
      {!embedded && (
        <div className="cost-module-header">
          <div>
            <div className="module-inline-crumbs">
              <button type="button" onClick={() => navigate('portfolio')}>Portfolio</button>
              <span>/</span>
              <button type="button" onClick={() => navigate('project', projectId)}>{p?.name || projectId}</button>
              <span>/</span>
              <span className="module-inline-current">{title}</span>
              {category && (
                <span className="material-category-badge" style={{ '--category-color': CAT_COLORS[category] || 'var(--accent)' }}>
                  <span className="material-category-dot" />
                  <span className="material-category-text">{category}</span>
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('project', projectId)}><Icon name="arrowLeft" size={13} /> Back</button>
        </div>
      )}

      <div className="cost-summary-grid">
        <div className="cost-summary-card">
          <div className="cost-summary-label">{title} line items</div>
          <div className="kpi-value num">{items.length}</div>
          <div className="cost-summary-sub">Purchase register</div>
        </div>
        <div className="cost-summary-card committed">
          <div className="cost-summary-label">Estimated received</div>
          <div className="kpi-value num">{fmt(datedTotal)}</div>
          <div className="cost-summary-sub">Scheduled by date</div>
        </div>
        <div className="cost-summary-card forecast">
          <div className="cost-summary-label">ETC (Forecast)</div>
          <div className="kpi-value num">{fmt(plannedTotal)}</div>
          <div className="cost-summary-sub">Local register forecast</div>
        </div>
      </div>

      {err && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="alert-body">{err}</div>
          <button className="alert-close" onClick={() => setErr(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className={`cost-viewbar ${view === 'timeline' ? 'is-timeline' : 'is-register'}`}>
        {[['register', 'Register'], ['timeline', 'Timeline']].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setView(k)} className={view === k ? 'active' : ''}>{l}</button>
        ))}
      </div>

      {view === 'timeline' ? (
        <TimelineGrid
          items={items} schedule={schedule} module={module}
          canEdit={canEdit} reloadSchedule={reloadSchedule} onError={setErr}
        />
      ) : (
      <>
      {canEdit && (
        <div className="card card-p cost-entry-card">
          <div className="cost-section-title">Add line item</div>
          <div className="cost-entry-grid">
            <label className="field">
              <span className="field-label">Description</span>
              <input className="input" placeholder={descPlaceholder || 'Description'} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Estimated received date</span>
              <DatePicker value={form.estimated_received_date} onChange={v => setForm(f => ({ ...f, estimated_received_date: v }))} placeholder="Select date" title="Estimated date the line item will be received" />
            </label>
            <label className="field">
              <span className="field-label">Amount</span>
              <input className="input num" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ textAlign: 'right' }} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={addItem} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
          </div>
          <div className="cost-form-note">
            The estimated received date places the amount on the timeline. Committed cost comes from SAP import, not this local register.
          </div>
        </div>
      )}

      <div className="card cost-table-card">
        <div className="table-wrap">
          <table className="cost-register-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Estimated received date</th>
                <th>Bucket</th>
                <th className="num">Amount</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No line items yet</td></tr>
              )}
              {items.map(it => {
                return (
                  <tr key={it.id} className="cost-register-row">
                    <td className="cost-register-desc">
                      {canEdit ? (
                        <input className="input" defaultValue={it.description}
                          onBlur={e => e.target.value !== it.description && patchItem(it.id, { description: e.target.value })} />
                      ) : it.description}
                    </td>
                    <td className="cost-register-date">
                      {canEdit ? (
                        <DatePicker value={it.estimated_received_date ? String(it.estimated_received_date).slice(0, 10) : ''}
                          onChange={v => patchItem(it.id, { estimated_received_date: v || null })} placeholder="—" style={{ maxWidth: 160 }} />
                      ) : (it.estimated_received_date ? String(it.estimated_received_date).slice(0, 10) : '—')}
                    </td>
                    <td className="cost-register-bucket">
                      <span className="cost-register-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                        color: 'var(--accent)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                        Forecast
                      </span>
                    </td>
                    <td className="num cost-register-amount">
                      {canEdit ? (
                        <input className="input num" type="number" defaultValue={Number(it.amount)}
                          onBlur={e => Number(e.target.value) !== Number(it.amount) && patchItem(it.id, { amount: Number(e.target.value) || 0 })} style={{ maxWidth: 120, textAlign: 'right' }} />
                      ) : fmt(it.amount)}
                    </td>
                    {canEdit && (
                      <td className="cost-register-action">
                        <button className="btn btn-ghost btn-sm" onClick={() => removeItem(it.id)} title="Delete"><Icon name="x" size={13} /></button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

// Monthly dollar-planning timeline shared by Material / Sub-Con / Others.
// One row per line item; columns are the 12 months of the selected year; the
// footer row shows the upcoming cost per month. Cells persist to the register's
// /schedule endpoint.
function TimelineGrid({ items, schedule, module, canEdit, reloadSchedule, onError }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearTouched, setYearTouched] = useState(false);

  function estimatedParts(item) {
    if (!item.estimated_received_date) return null;
    const d = new Date(`${String(item.estimated_received_date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }

  const cells = useMemo(() => {
    const m = {};
    const estimatedIds = new Set(items.filter(it => estimatedParts(it)).map(it => String(it.id)));
    for (const s of schedule) {
      if (estimatedIds.has(String(s.entity_id))) continue;
      m[`${s.entity_id}-${s.year}-${s.month}`] = Number(s.amount) || 0;
    }
    for (const it of items) {
      const est = estimatedParts(it);
      if (!est) continue;
      m[`${it.id}-${est.year}-${est.month}`] = Number(it.amount) || 0;
    }
    return m;
  }, [schedule, items]);

  useEffect(() => {
    if (yearTouched || !items.length) return;
    const currentYear = new Date().getFullYear();
    const years = new Set();
    for (const it of items) {
      const est = estimatedParts(it);
      if (est) years.add(est.year);
    }
    for (const s of schedule) years.add(Number(s.year));
    if (!years.size || years.has(currentYear)) return;
    setYear(Math.min(...years));
  }, [items, schedule, yearTouched]);

  function moveYear(delta) {
    setYearTouched(true);
    setYear(y => y + delta);
  }

  async function setCell(itemId, month, value) {
    try {
      await api.put(`/api/${module}/${itemId}/schedule`, { year, month, amount: Number(value) || 0 });
      reloadSchedule();
    } catch (e) { onError && onError(e.message || 'Save failed'); }
  }

  const colTotals = MONTHS.map((_, i) =>
    items.reduce((s, it) => s + (cells[`${it.id}-${year}-${i + 1}`] || 0), 0));
  const yearTotal = colTotals.reduce((a, b) => a + b, 0);
  const mobileMonths = MONTHS.map((name, i) => {
    const month = i + 1;
    const entries = items
      .map(it => ({
        item: it,
        amount: cells[`${it.id}-${year}-${month}`] || 0,
        estimated: estimatedParts(it),
      }))
      .filter(row => row.amount || row.estimated?.month === month);
    return { name, month, total: colTotals[i], entries };
  });
  const lineColW = 320;
  const monthColW = 96;
  const tableW = lineColW + MONTHS.length * monthColW;

  return (
    <div className="card timeline-card">
      <div className="timeline-head">
        <div className="timeline-title-block">
          <h4>Upcoming cost by month</h4>
          <div className="timeline-subtitle">
            Estimated received dates place the full amount automatically; manual cells can split the plan across months.
          </div>
        </div>
        <div className="timeline-year-controls">
          <button className="btn btn-ghost btn-sm" onClick={() => moveYear(-1)}>‹</button>
          <span className="timeline-year">{year}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => moveYear(1)}>›</button>
        </div>
        <div className="timeline-year-total">Year total {fmt(yearTotal)}</div>
      </div>
      <div className="timeline-mobile-list">
        {items.length === 0 ? (
          <div className="timeline-empty">No line items yet</div>
        ) : mobileMonths.map(m => (
          <section key={m.month} className={`timeline-month-card${m.total ? ' has-total' : ''}`}>
            <div className="timeline-month-head">
              <div>
                <div className="timeline-month-name">{m.name}</div>
                <div className="timeline-month-year">{year}</div>
              </div>
              <div className="timeline-month-total">{m.total ? fmt(m.total) : '—'}</div>
            </div>
            {m.entries.length ? (
              <div className="timeline-month-lines">
                {m.entries.map(({ item, amount, estimated }) => (
                  <div key={item.id} className="timeline-month-line">
                    <div className="timeline-month-desc">
                      <span>{item.description}</span>
                      {estimated && (
                        <small>Est. {String(item.estimated_received_date).slice(0, 10)}</small>
                      )}
                    </div>
                    <div className="timeline-month-amount">{amount ? fmt(amount) : '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="timeline-month-empty">No planned cost</div>
            )}
          </section>
        ))}
      </div>
      <div className="timeline-table-wrap">
        <table data-responsive="scroll" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: tableW, minWidth: '100%' }}>
          <colgroup>
            <col style={{ width: lineColW }} />
            {MONTHS.map(m => <col key={m} style={{ width: monthColW }} />)}
          </colgroup>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', position: 'sticky', left: 0, background: 'var(--surface)', width: lineColW }}>Line item</th>
              {MONTHS.map(m => (
                <th key={m} style={{ padding: '8px 8px', fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center', width: monthColW }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={13} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No line items yet</td></tr>
            )}
            {items.map(it => (
              <tr key={it.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '6px 12px', fontSize: 13, position: 'sticky', left: 0, background: 'var(--surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: lineColW }}>
                  {it.description}
                  {it.estimated_received_date && (
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
                      Est. {String(it.estimated_received_date).slice(0, 10)}
                    </div>
                  )}
                </td>
                {MONTHS.map((m, i) => {
                  const month = i + 1;
                  const val = cells[`${it.id}-${year}-${month}`] || 0;
                  const isEstimatedDriven = !!estimatedParts(it);
                  return (
                    <td key={m} style={{ padding: '3px 8px', width: monthColW, textAlign: 'center' }}>
                      {canEdit && !isEstimatedDriven ? (
                        <input className="input num" type="number" defaultValue={val || ''} placeholder="0"
                          key={`${it.id}-${year}-${month}-${val}`}
                          onBlur={e => Number(e.target.value || 0) !== Number(val) && setCell(it.id, month, e.target.value)}
                          style={{ width: '100%', textAlign: 'center', padding: '4px 8px', fontSize: 12, boxSizing: 'border-box' }} />
                      ) : (
                        <div
                          title={isEstimatedDriven ? 'Driven by estimated received date' : undefined}
                          style={{ width: '100%', textAlign: 'center', fontSize: 12, boxSizing: 'border-box', color: val ? 'var(--text)' : 'var(--text-3)' }}
                        >
                          {val ? fmt(val) : '—'}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-2)' }}>
              <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 12, position: 'sticky', left: 0, background: 'var(--surface-2)', width: lineColW }}>Monthly forecast</td>
              {colTotals.map((t, i) => (
                <td key={i} style={{ padding: '8px 8px', width: monthColW, textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: t ? 'var(--accent)' : 'var(--text-3)' }}>
                  {t ? fmt(t) : '—'}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
