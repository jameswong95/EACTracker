import React, { useState, useMemo } from 'react';
import { useProject, useCostModule, useEtc, useCostSchedule, fmt, MONTHS } from '../data/store.js';
import { api } from '../data/api.js';
import { CAT_COLORS } from '../components/Charts.jsx';
import DatePicker from '../components/DatePicker.jsx';
import Icon from '../components/Icon.jsx';

// Shared screen for the Material and Sub-Con modules. Each is a project-level
// purchase register: PO number (optional), description, goods received date (optional)
// and amount. A goods received date makes the item Committed in the Cost/Forecast tab;
// without one it is treated as ETC (Forecast). Everything entered here rolls up
// into a single category (Material or Sub-Con) — no sub-job assignment needed.
export default function CostModule({ module, title, etcKey, category, descPlaceholder, projectId, navigate, role, embedded = false }) {
  const { project: p, loading } = useProject(projectId);
  const { items, reload } = useCostModule(module, projectId);
  const { etc } = useEtc(projectId);
  const { schedule, reload: reloadSchedule } = useCostSchedule(module, projectId);
  const canEdit = role !== 'Project Director';

  const [form, setForm] = useState({ po_number: '', description: '', purchase_date: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [view, setView] = useState('register');

  const committedTotal = items.reduce((s, it) => s + (it.purchase_date ? Number(it.amount || 0) : 0), 0);
  const etcTotal       = items.reduce((s, it) => s + (it.purchase_date ? 0 : Number(it.amount || 0)), 0);

  async function addItem() {
    if (!form.description) { setErr('Description is required'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post(`/api/${module}`, {
        project_id: projectId,
        po_number: form.po_number || null,
        description: form.description,
        purchase_date: form.purchase_date || null,
        amount: Number(form.amount) || 0,
        created_by: null,
      });
      setForm({ po_number: '', description: '', purchase_date: '', amount: '' });
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
          <div className="cost-summary-label">Committed</div>
          <div className="kpi-value num">{fmt(committedTotal)}</div>
          <div className="cost-summary-sub">Goods received</div>
        </div>
        <div className="cost-summary-card forecast">
          <div className="cost-summary-label">ETC (Forecast)</div>
          <div className="kpi-value num">{fmt(etcTotal)}</div>
          <div className="cost-summary-sub">Awaiting goods received</div>
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

      <div className="cost-viewbar">
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
              <span className="field-label">PO number <span style={{ color: 'var(--text-3)', fontWeight: 500, textTransform: 'none' }}>(optional)</span></span>
              <input className="input" placeholder="e.g. PO-001" value={form.po_number} onChange={e => setForm(f => ({ ...f, po_number: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Description</span>
              <input className="input" placeholder={descPlaceholder || 'Description'} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Goods received date <span style={{ color: 'var(--text-3)', fontWeight: 500, textTransform: 'none' }}>(optional)</span></span>
              <DatePicker value={form.purchase_date} onChange={v => setForm(f => ({ ...f, purchase_date: v }))} placeholder="Select date" title="Date goods were received (leave empty for ETC)" />
            </label>
            <label className="field">
              <span className="field-label">Amount</span>
              <input className="input num" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ textAlign: 'right' }} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={addItem} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
          </div>
          <div className="cost-form-note">
            A goods received date marks the item as <strong>Committed</strong>; leave it empty to keep it in <strong>ETC (Forecast)</strong>.
          </div>
        </div>
      )}

      <div className="card cost-table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PO number</th>
                <th>Description</th>
                <th>Goods received date</th>
                <th>Bucket</th>
                <th className="num">Amount</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={canEdit ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No line items yet</td></tr>
              )}
              {items.map(it => {
                const committed = !!it.purchase_date;
                return (
                  <tr key={it.id}>
                    <td>
                      {canEdit ? (
                        <input className="input" defaultValue={it.po_number || ''} placeholder="—"
                          onBlur={async e => {
                            const nv = e.target.value.trim() || null;
                            if (nv === (it.po_number || null)) return;
                            const ok = await patchItem(it.id, { po_number: nv });
                            if (!ok) e.target.value = it.po_number || '';
                          }} style={{ maxWidth: 130 }} />
                      ) : (it.po_number || '—')}
                    </td>
                    <td>
                      {canEdit ? (
                        <input className="input" defaultValue={it.description}
                          onBlur={e => e.target.value !== it.description && patchItem(it.id, { description: e.target.value })} />
                      ) : it.description}
                    </td>
                    <td>
                      {canEdit ? (
                        <DatePicker value={it.purchase_date ? String(it.purchase_date).slice(0, 10) : ''}
                          onChange={v => patchItem(it.id, { purchase_date: v || null })} placeholder="—" style={{ maxWidth: 160 }} />
                      ) : (it.purchase_date ? String(it.purchase_date).slice(0, 10) : '—')}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                        color: committed ? 'var(--warn)' : 'var(--accent)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                        {committed ? 'Committed' : 'ETC'}
                      </span>
                    </td>
                    <td className="num">
                      {canEdit ? (
                        <input className="input num" type="number" defaultValue={Number(it.amount)}
                          onBlur={e => Number(e.target.value) !== Number(it.amount) && patchItem(it.id, { amount: Number(e.target.value) || 0 })} style={{ maxWidth: 120, textAlign: 'right' }} />
                      ) : fmt(it.amount)}
                    </td>
                    {canEdit && (
                      <td>
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

  const cells = useMemo(() => {
    const m = {};
    for (const s of schedule) m[`${s.entity_id}-${s.year}-${s.month}`] = Number(s.amount) || 0;
    return m;
  }, [schedule]);

  async function setCell(itemId, month, value) {
    try {
      await api.put(`/api/${module}/${itemId}/schedule`, { year, month, amount: Number(value) || 0 });
      reloadSchedule();
    } catch (e) { onError && onError(e.message || 'Save failed'); }
  }

  const colTotals = MONTHS.map((_, i) =>
    items.reduce((s, it) => s + (cells[`${it.id}-${year}-${i + 1}`] || 0), 0));
  const yearTotal = colTotals.reduce((a, b) => a + b, 0);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h4>Upcoming cost by month</h4>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
            Plan each line item's spend across the year — the footer shows the monthly forecast total.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y - 1)}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 13, minWidth: 42, textAlign: 'center' }}>{year}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y + 1)}>›</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Year total {fmt(yearTotal)}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', position: 'sticky', left: 0, background: 'var(--surface)', minWidth: 200 }}>Line item</th>
              {MONTHS.map(m => (
                <th key={m} style={{ padding: '8px 4px', fontSize: 10.5, color: 'var(--text-3)', textAlign: 'right', minWidth: 62 }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={13} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No line items yet</td></tr>
            )}
            {items.map(it => (
              <tr key={it.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '6px 12px', fontSize: 13, position: 'sticky', left: 0, background: 'var(--surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                  {it.description}
                </td>
                {MONTHS.map((m, i) => {
                  const month = i + 1;
                  const val = cells[`${it.id}-${year}-${month}`] || 0;
                  return (
                    <td key={m} style={{ padding: 2 }}>
                      {canEdit ? (
                        <input className="input num" type="number" defaultValue={val || ''} placeholder="0"
                          key={`${it.id}-${year}-${month}-${val}`}
                          onBlur={e => Number(e.target.value || 0) !== Number(val) && setCell(it.id, month, e.target.value)}
                          style={{ width: 60, textAlign: 'right', padding: '4px 6px', fontSize: 12 }} />
                      ) : (
                        <div style={{ width: 60, textAlign: 'right', fontSize: 12, color: val ? 'var(--text)' : 'var(--text-3)' }}>{val ? fmt(val) : '—'}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-2)' }}>
              <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 12, position: 'sticky', left: 0, background: 'var(--surface-2)' }}>Monthly forecast</td>
              {colTotals.map((t, i) => (
                <td key={i} style={{ padding: '8px 4px', textAlign: 'right', fontSize: 11.5, fontWeight: 600, color: t ? 'var(--accent)' : 'var(--text-3)' }}>
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
