import React, { useState } from 'react';
import { useProject, useCostModule, fmt, MONTHS } from '../data/store.js';
import { api } from '../data/api.js';
import { firstError, nonNegativeNumber, requiredText } from '../data/validation.js';
import { CAT_COLORS } from '../components/Charts.jsx';
import DatePicker from '../components/DatePicker.jsx';
import Icon from '../components/Icon.jsx';

// Shared screen for the Material and Sub-Con modules. Each is a project-level
// purchase register: description, estimated received date and amount. Everything
// entered here rolls up into a single category (Material or Sub-Con) with SAP
// remaining the source of truth for committed actuals.
export default function CostModule({ module, title, etcKey, category, descPlaceholder, projectId, navigate, role, embedded = false }) {
  const { project: p, loading } = useProject(projectId);
  const { items, reload } = useCostModule(module, projectId);
  const canEdit = role !== 'Project Director';
  const canHaveSubItems = module === 'materials' || module === 'sub-con';

  const [form, setForm] = useState({ description: '', estimated_received_date: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [view, setView] = useState('register');
  const [expanded, setExpanded] = useState(null);
  const [subForms, setSubForms] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const forecastFromNextMonthOnly = module === 'materials' || module === 'sub-con';
  const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const nextMonthKey = `${nextMonthStart.getFullYear()}-${String(nextMonthStart.getMonth() + 1).padStart(2, '0')}-01`;
  const isForecastDate = (value) => {
    if (!forecastFromNextMonthOnly) return true;
    const raw = value ? String(value).slice(0, 10) : '';
    return raw >= nextMonthKey;
  };
  const subItemTotal = items.reduce((sum, it) =>
    sum + (Array.isArray(it.sub_items)
      ? it.sub_items.reduce((s, sub) => s + (isForecastDate(sub.estimated_received_date) ? Number(sub.amount || 0) : 0), 0)
      : 0), 0);
  const forecastTotal = items.reduce((s, it) =>
    s + (isForecastDate(it.estimated_received_date) ? Number(it.amount || 0) : 0), 0) + subItemTotal;
  const nextEstimatedDate = items
    .flatMap(it => [
      it.estimated_received_date ? String(it.estimated_received_date).slice(0, 10) : '',
      ...(Array.isArray(it.sub_items) ? it.sub_items.map(sub => sub.estimated_received_date ? String(sub.estimated_received_date).slice(0, 10) : '') : []),
    ])
    .filter(Boolean)
    .sort()[0];

  async function addItem() {
    const validationError = firstError(
      requiredText(form.description, 'Description'),
      requiredText(form.estimated_received_date, 'Estimated received date'),
      nonNegativeNumber(form.amount, 'Amount')
    );
    if (validationError) { setErr(validationError); return; }
    setBusy(true); setErr(null);
    try {
      await api.post(`/api/${module}`, {
        project_id: projectId,
        description: form.description,
        estimated_received_date: form.estimated_received_date,
        amount: Number(form.amount) || 0,
        created_by: null,
      });
      setForm({ description: '', estimated_received_date: '', amount: '' });
      reload();
    } catch (e) { setErr(e.message || 'Failed to add'); }
    finally { setBusy(false); }
  }

  async function patchItem(id, patch) {
    const validationError = firstError(
      Object.prototype.hasOwnProperty.call(patch, 'description') ? requiredText(patch.description, 'Description') : null,
      Object.prototype.hasOwnProperty.call(patch, 'estimated_received_date') ? requiredText(patch.estimated_received_date, 'Estimated received date') : null,
      Object.prototype.hasOwnProperty.call(patch, 'amount') ? nonNegativeNumber(patch.amount, 'Amount') : null
    );
    if (validationError) { setErr(validationError); return false; }
    setErr(null);
    try { await api.patch(`/api/${module}/${id}`, patch); reload(); return true; }
    catch (e) { setErr(e.message || 'Update failed'); return false; }
  }

  async function removeItem(id) {
    try { await api.del(`/api/${module}/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  async function addSubItem(parentId) {
    const subForm = subForms[parentId] || { description: '', estimated_received_date: '', amount: '' };
    const validationError = firstError(
      requiredText(subForm.description, 'Sub-item description'),
      nonNegativeNumber(subForm.amount, 'Sub-item amount')
    );
    if (validationError) { setErr(validationError); return; }
    setErr(null);
    try {
      await api.post(`/api/${module}/${parentId}/sub-items`, {
        description: subForm.description,
        estimated_received_date: subForm.estimated_received_date || null,
        amount: Number(subForm.amount) || 0,
        created_by: null,
      });
      setSubForms(f => ({ ...f, [parentId]: { description: '', estimated_received_date: '', amount: '' } }));
      reload();
    } catch (e) { setErr(e.message || 'Failed to add sub-item'); }
  }

  async function patchSubItem(parentId, subId, patch) {
    const validationError = firstError(
      Object.prototype.hasOwnProperty.call(patch, 'description') ? requiredText(patch.description, 'Sub-item description') : null,
      Object.prototype.hasOwnProperty.call(patch, 'amount') ? nonNegativeNumber(patch.amount, 'Sub-item amount') : null
    );
    if (validationError) { setErr(validationError); return false; }
    setErr(null);
    try { await api.patch(`/api/${module}/${parentId}/sub-items/${subId}`, patch); reload(); return true; }
    catch (e) { setErr(e.message || 'Sub-item update failed'); return false; }
  }

  async function removeSubItem(parentId, subId) {
    try { await api.del(`/api/${module}/${parentId}/sub-items/${subId}`); reload(); }
    catch (e) { setErr(e.message || 'Sub-item delete failed'); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'sub-item') {
      await removeSubItem(deleteTarget.parentId, deleteTarget.id);
    } else {
      await removeItem(deleteTarget.id);
      if (expanded === deleteTarget.id) setExpanded(null);
    }
    setDeleteTarget(null);
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
          <div className="cost-summary-label">Forecast amount</div>
          <div className="kpi-value num">{fmt(forecastTotal)}</div>
          <div className="cost-summary-sub">Planning register</div>
        </div>
        <div className="cost-summary-card forecast">
          <div className="cost-summary-label">Next estimated received</div>
          <div className="kpi-value num">{nextEstimatedDate || '—'}</div>
          <div className="cost-summary-sub">Earliest line item date</div>
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
        {[
          ['register', 'Register', 'hash'],
          ['timeline', 'Timeline', 'chartBar'],
        ].map(([k, l, icon]) => (
          <button key={k} type="button" onClick={() => setView(k)} className={view === k ? 'active' : ''}>
            <Icon name={icon} size={13} />
            <span>{l}</span>
          </button>
        ))}
      </div>

      <div className="cost-view-panel" key={view}>
        {view === 'timeline' ? (
          <TimelineGrid items={items} />
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
              <DatePicker value={form.estimated_received_date} onChange={v => setForm(f => ({ ...f, estimated_received_date: v }))} placeholder="Select date" title="Estimated date the item will be received" />
            </label>
            <label className="field">
              <span className="field-label">Amount</span>
              <input className="input num" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ textAlign: 'right' }} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={addItem} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
          </div>
          <div className="cost-form-note">
            SAP import remains the committed source of truth; this register captures forecast planning dates and amounts.
          </div>
        </div>
      )}

      <div className="card cost-table-card">
        <div className="table-wrap cost-register-scroll">
          <table>
            <thead>
              <tr>
                {canHaveSubItems && <th className="cost-disclosure-head">Details</th>}
                <th>Description</th>
                <th>Estimated received date</th>
                <th className="num">Amount</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={(canEdit ? 4 : 3) + (canHaveSubItems ? 1 : 0)} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No line items yet</td></tr>
              )}
              {items.map(it => {
                const open = canHaveSubItems && expanded === it.id;
                const subItems = Array.isArray(it.sub_items) ? it.sub_items : [];
                const subTotal = subItems.reduce((sum, sub) => sum + Number(sub.amount || 0), 0);
                const subForm = subForms[it.id] || { description: '', estimated_received_date: '', amount: '' };
                return (
                  <React.Fragment key={it.id}>
                    <tr className={`cost-register-row${open ? ' is-expanded' : ''}`}>
                      {canHaveSubItems && (
                        <td className="cost-disclosure-cell">
                          <button
                            type="button"
                            className={`cost-disclosure-toggle${open ? ' is-open' : ''}${subItems.length ? ' has-subitems' : ''}`}
                            onClick={() => setExpanded(open ? null : it.id)}
                            aria-expanded={open}
                            aria-label={open ? 'Hide related sub-items' : 'Show related sub-items'}
                            title={open ? 'Hide related sub-items' : 'Show related sub-items'}
                          >
                            <span className="cost-disclosure-icon">
                              <Icon name="chevronRight" size={13} strokeWidth={2.4} />
                            </span>
                            {subItems.length > 0 && (
                              <span className="cost-disclosure-count">{subItems.length}</span>
                            )}
                          </button>
                        </td>
                      )}
                      <td>
                        {canEdit ? (
                          <input className="input" defaultValue={it.description}
                            onBlur={e => e.target.value !== it.description && patchItem(it.id, { description: e.target.value })} />
                        ) : it.description}
                        {canHaveSubItems && subItems.length > 0 && (
                          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
                            {subItems.length} sub-item{subItems.length === 1 ? '' : 's'} · {fmt(subTotal)}
                          </div>
                        )}
                      </td>
                      <td>
                        {canEdit ? (
                          <DatePicker value={it.estimated_received_date ? String(it.estimated_received_date).slice(0, 10) : ''}
                            onChange={v => v && patchItem(it.id, { estimated_received_date: v })} placeholder="—" style={{ maxWidth: 160 }} />
                        ) : (it.estimated_received_date ? String(it.estimated_received_date).slice(0, 10) : '—')}
                      </td>
                      <td className="num">
                        {canEdit ? (
                          <input className="input num" type="number" defaultValue={Number(it.amount)}
                            onBlur={e => Number(e.target.value) !== Number(it.amount) && patchItem(it.id, { amount: Number(e.target.value) || 0 })} style={{ maxWidth: 120, textAlign: 'right' }} />
                        ) : fmt(it.amount)}
                      </td>
                      {canEdit && (
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget({ type: 'item', id: it.id, description: it.description })} title="Delete"><Icon name="x" size={13} /></button>
                        </td>
                      )}
                    </tr>
                    {open && (
                      <tr className="cost-subitem-row">
                        <td colSpan={canEdit ? 5 : 4}>
                          <div className="cost-subitem-panel">
                            <div className="cost-subitem-head">
                              <div>
                                <div className="cost-subitem-title">Related / sub-items</div>
                                <div className="cost-subitem-subtitle">Break this line item into supporting costs.</div>
                              </div>
                              <div className="cost-subitem-total">Sub-total {fmt(subTotal)}</div>
                            </div>
                            {subItems.length === 0 && (
                              <div className="cost-subitem-empty">No sub-items yet</div>
                            )}
                            {subItems.map(sub => (
                              <div key={sub.id} className={canEdit ? 'cost-subitem-grid is-editable' : 'cost-subitem-grid'}>
                                <div>
                                  {canEdit ? (
                                    <input className="input" defaultValue={sub.description}
                                      onBlur={e => e.target.value !== sub.description && patchSubItem(it.id, sub.id, { description: e.target.value })} />
                                  ) : sub.description}
                                </div>
                                <div>
                                  {canEdit ? (
                                    <DatePicker value={sub.estimated_received_date ? String(sub.estimated_received_date).slice(0, 10) : ''}
                                      onChange={v => patchSubItem(it.id, sub.id, { estimated_received_date: v || null })} placeholder="—" />
                                  ) : (sub.estimated_received_date ? String(sub.estimated_received_date).slice(0, 10) : '—')}
                                </div>
                                <div>
                                  {canEdit ? (
                                    <input className="input num" type="number" defaultValue={Number(sub.amount)}
                                      onBlur={e => Number(e.target.value) !== Number(sub.amount) && patchSubItem(it.id, sub.id, { amount: Number(e.target.value) || 0 })} style={{ textAlign: 'right' }} />
                                  ) : fmt(sub.amount)}
                                </div>
                                {canEdit && (
                                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget({ type: 'sub-item', id: sub.id, parentId: it.id, description: sub.description })} title="Delete sub-item"><Icon name="x" size={13} /></button>
                                )}
                              </div>
                            ))}
                            {canEdit && (
                              <div className="cost-subitem-add">
                                <input className="input" placeholder="Sub-item description" value={subForm.description}
                                  onChange={e => setSubForms(f => ({ ...f, [it.id]: { ...subForm, description: e.target.value } }))} />
                                <DatePicker value={subForm.estimated_received_date}
                                  onChange={v => setSubForms(f => ({ ...f, [it.id]: { ...subForm, estimated_received_date: v } }))} placeholder="Date" />
                                <input className="input num" type="number" placeholder="0.00" value={subForm.amount}
                                  onChange={e => setSubForms(f => ({ ...f, [it.id]: { ...subForm, amount: e.target.value } }))} style={{ textAlign: 'right' }} />
                                <button className="btn btn-secondary btn-sm" onClick={() => addSubItem(it.id)}>Add sub-item</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
      </div>
      {deleteTarget && (
        <ConfirmDeleteModal
          target={deleteTarget}
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function ConfirmDeleteModal({ target, busy, onCancel, onConfirm }) {
  const isSubItem = target.type === 'sub-item';
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={() => !busy && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cost-delete-title" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 id="cost-delete-title" style={{ margin: 0 }}>
              Delete {isSubItem ? 'sub-item' : 'line item'}?
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              This action cannot be undone.
            </div>
          </div>
          <button className="btn btn-icon" onClick={onCancel} disabled={busy} aria-label="Close">
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--surface-2)',
            padding: 14,
            fontSize: 13,
            fontWeight: 750,
            color: 'var(--text)',
          }}>
            {target.description || (isSubItem ? 'Sub-item' : 'Line item')}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting...' : `Delete ${isSubItem ? 'sub-item' : 'line item'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Monthly timeline shared by Material / Sub-Con / Others. Values are locked to
// each register row's estimated received date and amount.
function TimelineGrid({ items }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [expandedParents, setExpandedParents] = useState(() => new Set());
  const firstColumnWidth = 320;
  const monthColumnWidth = 92;
  const timelineMinWidth = firstColumnWidth + (MONTHS.length * monthColumnWidth);

  const timelineRows = items.flatMap(it => {
    const subItems = Array.isArray(it.sub_items) ? it.sub_items : [];
    const subTotal = subItems.reduce((sum, sub) => sum + Number(sub.amount || 0), 0);
    return [
      {
        id: `item-${it.id}`,
        kind: 'item',
        itemId: it.id,
        description: it.description,
        amount: Number(it.amount) || 0,
        estimated_received_date: it.estimated_received_date,
        subCount: subItems.length,
        subTotal,
      },
      ...subItems.map(sub => ({
        id: `sub-${sub.id}`,
        kind: 'sub-item',
        parentId: it.id,
        description: sub.description,
        parentDescription: it.description,
        amount: Number(sub.amount) || 0,
        estimated_received_date: sub.estimated_received_date,
      })),
    ];
  });

  function timelineValue(row, month) {
    const raw = row.estimated_received_date ? String(row.estimated_received_date).slice(0, 10) : '';
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return 0;
    const itemYear = Number(match[1]);
    const itemMonth = Number(match[2]);
    return itemYear === year && itemMonth === month ? Number(row.amount) || 0 : 0;
  }

  const colTotals = MONTHS.map((_, i) =>
    timelineRows.reduce((s, row) => s + timelineValue(row, i + 1), 0));
  const yearTotal = colTotals.reduce((a, b) => a + b, 0);
  const unscheduledTotal = timelineRows
    .filter(row => row.amount && !row.estimated_received_date)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const parentIdsWithSubItems = timelineRows
    .filter(row => row.kind === 'item' && row.subCount > 0)
    .map(row => row.itemId);
  const allParentsExpanded = parentIdsWithSubItems.length > 0
    && parentIdsWithSubItems.every(id => expandedParents.has(id));
  const visibleTimelineRows = timelineRows.filter(row =>
    row.kind !== 'sub-item' || expandedParents.has(row.parentId));

  function toggleParent(id) {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllParents() {
    setExpandedParents(() => (
      allParentsExpanded ? new Set() : new Set(parentIdsWithSubItems)
    ));
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h4>Upcoming cost by month</h4>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
            Line items and sub-items are locked to the month of their estimated received date.
            {unscheduledTotal > 0 && (
              <span style={{ color: 'var(--warn)', fontWeight: 700 }}> · {fmt(unscheduledTotal)} unscheduled</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y - 1)}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 13, minWidth: 42, textAlign: 'center' }}>{year}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y + 1)}>›</button>
        </div>
        {parentIdsWithSubItems.length > 0 && (
          <button
            type="button"
            className={`btn btn-ghost btn-sm cost-timeline-expand-all${allParentsExpanded ? ' is-open' : ''}`}
            onClick={toggleAllParents}
          >
            <Icon name="chevronRight" size={13} />
            {allParentsExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Year total {fmt(yearTotal)}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: timelineMinWidth, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: firstColumnWidth }} />
            {MONTHS.map(m => <col key={m} style={{ width: monthColumnWidth }} />)}
          </colgroup>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', position: 'sticky', left: 0, background: 'var(--surface)', width: firstColumnWidth }}>Line item</th>
              {MONTHS.map(m => (
                <th key={m} style={{ padding: '8px 4px', fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center', width: monthColumnWidth }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timelineRows.length === 0 && (
              <tr><td colSpan={13} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No line items yet</td></tr>
            )}
            {visibleTimelineRows.map(row => {
              const isExpanded = row.kind === 'item' && expandedParents.has(row.itemId);
              return (
              <tr key={row.id} className={row.kind === 'sub-item' ? 'cost-timeline-sub-row' : 'cost-timeline-item-row'}>
                <td className="cost-timeline-label-cell" style={{ width: firstColumnWidth }}>
                  <div className={row.kind === 'sub-item' ? 'cost-timeline-label is-subitem' : 'cost-timeline-label'}>
                    {row.kind === 'sub-item' && <span className="cost-timeline-branch" />}
                    <div className="cost-timeline-label-main">
                      {row.kind === 'item' && row.subCount > 0 && (
                        <button
                          type="button"
                          className={`cost-timeline-toggle${isExpanded ? ' is-open' : ''}`}
                          onClick={() => toggleParent(row.itemId)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Collapse sub-items' : 'Expand sub-items'}
                          title={isExpanded ? 'Collapse sub-items' : 'Expand sub-items'}
                        >
                          <Icon name="chevronRight" size={12} strokeWidth={2.4} />
                        </button>
                      )}
                      <span className="cost-timeline-name">{row.description}</span>
                      {row.kind === 'sub-item' ? (
                        <span className="cost-timeline-chip">Sub-item</span>
                      ) : row.subCount > 0 ? (
                        <button
                          type="button"
                          className="cost-timeline-chip cost-timeline-chip-button"
                          onClick={() => toggleParent(row.itemId)}
                          aria-expanded={isExpanded}
                        >
                          {row.subCount} sub · {fmt(row.subTotal)}
                        </button>
                      ) : null}
                      {row.amount > 0 && !row.estimated_received_date && (
                        <span className="cost-timeline-chip is-warning">No date</span>
                      )}
                    </div>
                    {row.kind === 'sub-item' && (
                      <div className="cost-timeline-parent" title={row.parentDescription}>
                        under {row.parentDescription}
                      </div>
                    )}
                  </div>
                </td>
                {MONTHS.map((m, i) => {
                  const month = i + 1;
                  const val = timelineValue(row, month);
                  return (
                    <td key={m} style={{ padding: 2, textAlign: 'center', width: monthColumnWidth }}>
                      <div
                        className={`cost-timeline-value${row.kind === 'sub-item' ? ' is-subitem' : ''}${val ? ' has-value' : ''}`}
                        title="Locked to register estimated received date and amount"
                      >
                        {val ? fmt(val) : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-2)' }}>
              <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 12, position: 'sticky', left: 0, background: 'var(--surface-2)', width: firstColumnWidth }}>Monthly forecast</td>
              {colTotals.map((t, i) => (
                <td key={i} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: t ? 'var(--accent)' : 'var(--text-3)', width: monthColumnWidth }}>
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
