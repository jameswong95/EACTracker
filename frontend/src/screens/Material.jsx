import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useProject, useCostModule, useMaterialAssets, useMaterialMisc, useFixedRates, fmt, MONTHS } from '../data/store.js';
import { api } from '../data/api.js';
import { firstError, nonNegativeNumber, requiredText } from '../data/validation.js';
import DatePicker from '../components/DatePicker.jsx';
import Icon from '../components/Icon.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import Select from '../components/Select.jsx';

const GR_STATUS = {
  not_ordered: { label: 'Not ordered', color: 'var(--text-3)' },
  ordered:     { label: 'Ordered',     color: 'var(--accent)' },
  partial:     { label: 'Part GR',     color: 'var(--warn)' },
  received:    { label: 'Received',    color: 'var(--ok)' },
};
const BATCH_STATUS = {
  pending:  { label: 'Pending',  color: 'var(--text-3)' },
  received: { label: 'Received', color: 'var(--ok)' },
};
const COST_ROLES = new Set(['Admin', 'Finance', 'Project Director']);

// Material module.
//   * Purchase Register - PO-line bulk procurement with GR batches.
//   * Asset List - one row per physical unit, linked to purchase data by PO number.
export default function Material({ projectId, navigate, role, session }) {
  const { project: p } = useProject(projectId);
  const [tab, setTab] = useState('register');

  const TABS = [
    ['register', 'Purchase register'],
    ['timeline', 'Timeline'],
    ['assets', 'Asset list'],
  ];

  return (
    <div className="screen material-screen">
      <div className="material-hero">
        <div className="material-title-block">
          <div className="module-inline-crumbs">
            <button type="button" onClick={() => navigate('portfolio')}>Portfolio</button>
            <span>/</span>
            <button type="button" onClick={() => navigate('project', projectId)}>{p?.name || projectId}</button>
            <span>/</span>
            <span className="module-inline-current">Material</span>
            <span className="material-category-badge">
              <span className="material-category-dot" />
              <span className="material-category-text">Material</span>
            </span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('project', projectId)}><Icon name="arrowLeft" size={13} /> Back</button>
      </div>

      <div className="material-nav" role="tablist" aria-label="Material views">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={tab === k ? 'active' : ''}
          >
            <Icon name={k === 'register' ? 'hash' : k === 'timeline' ? 'chartBar' : 'tag'} size={13} />
            <span>{l}</span>
          </button>
        ))}
      </div>

      <div className="material-view-panel" key={tab}>
        {tab === 'assets' && <AssetList projectId={projectId} role={role} session={session} />}
        {tab === 'register' && <PurchaseRegister projectId={projectId} role={role} session={session} />}
        {tab === 'timeline' && <MaterialTimeline projectId={projectId} role={role} />}
      </div>
    </div>
  );
}

const BLANK = {
  description: '', po_number: '',
};

const PO_BLANK = {
  description: '', vendor: '', quantity_ordered: '1', unit_cost: '',
  estimated_received_date: '', po_number: '',
};
const BATCH_BLANK = { description: 'GR batch', batch_quantity: '', estimated_received_date: '', gr_status: 'pending' };

function canViewPurchaseCosts(role) {
  return COST_ROLES.has(role);
}

function uniquePoOptions(items) {
  const seen = new Set();
  return (items || [])
    .filter(line => line.po_number)
    .filter(line => {
      const key = String(line.po_number).trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(line => ({
      value: line.po_number,
      label: `${line.po_number} - ${line.description || 'PO line'}`,
      line,
    }));
}

function purchaseAssetKey(poNumber, description) {
  return `${String(poNumber || '').trim()}::${String(description || '').trim().toLowerCase()}`;
}

function materialGroupKey(asset) {
  return String(asset?.description || asset?.asset_type || 'Uncategorised material').trim().toLowerCase();
}

function assetRateOptions(rates, currentDescription = '') {
  const options = (rates || [])
    .filter(rate => rate.label)
    .map(rate => ({
      value: rate.label,
      label: rate.code ? `${rate.label} (${rate.code})` : rate.label,
      rate,
    }));
  if (currentDescription && !options.some(option => option.value === currentDescription)) {
    return [{ value: currentDescription, label: currentDescription, rate: null }, ...options];
  }
  return options;
}

function findAssetRate(rates, description) {
  const text = String(description || '').trim().toLowerCase();
  if (!text) return null;
  return (rates || []).find(rate => String(rate.label || '').trim().toLowerCase() === text) || null;
}

function StatusPill({ status, type = 'po' }) {
  const source = type === 'batch' ? BATCH_STATUS : GR_STATUS;
  const meta = source[status] || source.ordered || source.pending;
  return <span className="material-status-pill" style={{ '--status-color': meta.color }}>{meta.label}</span>;
}

function PurchaseRegister({ projectId, role, session }) {
  const canEdit = role !== 'Project Director';
  const showCost = canViewPurchaseCosts(role);
  const { rows: assetRates } = useFixedRates();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(PO_BLANK);
  const [batchForms, setBatchForms] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function reload() {
    const data = await api.get(`/api/materials?project_id=${encodeURIComponent(projectId)}`);
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => { reload().catch(e => setErr(e.message || 'Failed to load purchase register')); }, [projectId]);

  async function addLine() {
    const validationError = firstError(
      requiredText(form.description, 'Item description'),
      requiredText(form.po_number, 'PO number'),
      requiredText(form.estimated_received_date, 'Estimated arrival date'),
      nonNegativeNumber(form.quantity_ordered, 'Quantity ordered'),
      showCost ? nonNegativeNumber(form.unit_cost, 'Unit cost') : null,
    );
    if (validationError) { setErr(validationError); return; }
    setBusy(true); setErr(null);
    try {
      const body = {
        project_id: projectId,
        description: form.description,
        vendor: form.vendor || null,
        po_number: form.po_number,
        quantity_ordered: Number(form.quantity_ordered) || 0,
        estimated_received_date: form.estimated_received_date,
        created_by: session?.id || null,
      };
      if (showCost) body.unit_cost = Number(form.unit_cost) || 0;
      await api.post('/api/materials', body);
      setForm(PO_BLANK);
      await reload();
    } catch (e) { setErr(e.message || 'Failed to add PO line'); }
    finally { setBusy(false); }
  }

  async function patchLine(id, patch) {
    setErr(null);
    try { await api.patch(`/api/materials/${id}`, patch); await reload(); return true; }
    catch (e) { setErr(e.message || 'Update failed'); return false; }
  }

  function applyAssetRateToForm(description) {
    const match = assetRates.find(rate => rate.label === description);
    setForm(f => ({
      ...f,
      description,
      unit_cost: showCost && match ? String(Number(match.rate) || 0) : f.unit_cost,
    }));
  }

  function applyAssetRateToLine(line, description) {
    const match = assetRates.find(rate => rate.label === description);
    const patch = { description };
    if (showCost && match) patch.unit_cost = Number(match.rate) || 0;
    patchLine(line.id, patch);
  }

  async function removeLine(line) {
    try { await api.del(`/api/materials/${line.id}`); setDeleteTarget(null); await reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  async function addBatch(line) {
    const subForm = batchForms[line.id] || BATCH_BLANK;
    const currentQty = batchTotal(line);
    const nextQty = Number(subForm.batch_quantity) || 0;
    const orderedQty = Number(line.quantity_ordered) || 0;
    const validationError = firstError(
      requiredText(subForm.description, 'Batch description'),
      nonNegativeNumber(subForm.batch_quantity, 'Batch quantity'),
      requiredText(subForm.estimated_received_date, 'Batch arrival date'),
    );
    if (validationError) { setErr(validationError); return; }
    if (currentQty + nextQty > orderedQty) {
      setErr(`Batch quantities exceed PO quantity (${currentQty + nextQty} > ${orderedQty})`);
      return;
    }
    try {
      await api.post(`/api/materials/${line.id}/sub-items`, {
        description: subForm.description,
        batch_quantity: nextQty,
        estimated_received_date: subForm.estimated_received_date,
        gr_status: subForm.gr_status,
        created_by: session?.id || null,
      });
      setBatchForms(f => ({ ...f, [line.id]: BATCH_BLANK }));
      await reload();
    } catch (e) { setErr(e.message || 'Failed to add GR batch'); }
  }

  async function patchBatch(line, batch, patch) {
    if (Object.prototype.hasOwnProperty.call(patch, 'batch_quantity')) {
      const otherQty = batchTotal(line, batch.id);
      const nextQty = Number(patch.batch_quantity) || 0;
      const orderedQty = Number(line.quantity_ordered) || 0;
      if (otherQty + nextQty > orderedQty) {
        setErr(`Batch quantities exceed PO quantity (${otherQty + nextQty} > ${orderedQty})`);
        return false;
      }
    }
    try { await api.patch(`/api/materials/${line.id}/sub-items/${batch.id}`, patch); await reload(); return true; }
    catch (e) { setErr(e.message || 'Batch update failed'); return false; }
  }

  async function removeBatch(line, batch) {
    try { await api.del(`/api/materials/${line.id}/sub-items/${batch.id}`); await reload(); }
    catch (e) { setErr(e.message || 'Batch delete failed'); }
  }

  const totalValue = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalOrdered = rows.reduce((sum, row) => sum + Number(row.quantity_ordered || 0), 0);
  const totalReceived = rows.reduce((sum, row) => sum + Number(row.received_quantity || 0), 0);
  const colSpan = 7 + (showCost ? 2 : 0) + (canEdit ? 1 : 0);
  const formAssetRate = findAssetRate(assetRates, form.description);

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: showCost ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">PO lines</div>
          <div className="kpi-value num">{rows.length}</div>
          <div className="kpi-sub">bulk procurement</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Received quantity</div>
          <div className="kpi-value num">{totalReceived.toFixed(1)}</div>
          <div className="kpi-sub">of {totalOrdered.toFixed(1)} ordered</div>
        </div>
        {showCost && (
          <div className="kpi-tile">
            <div className="kpi-label">Total PO value</div>
            <div className="kpi-value num">{fmt(totalValue)}</div>
            <div className="kpi-sub">visible to Finance, Admin, PD</div>
          </div>
        )}
      </div>

      {err && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
          <div className="alert-body">{err}</div>
          <button className="alert-close" onClick={() => setErr(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {canEdit && (
        <div className="card card-p" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add PO line</div>
          <div style={{ display: 'grid', gridTemplateColumns: showCost ? '1.8fr 1.1fr 0.8fr 0.9fr 1fr 1fr auto' : '1.8fr 1.1fr 0.8fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <Field label="Item description"><AssetRateSelect value={form.description} rates={assetRates} onChange={applyAssetRateToForm} /></Field>
            <Field label="Vendor"><input className="input" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} /></Field>
            <Field label="Qty ordered"><input className="input num" type="number" min="0" step="1" value={form.quantity_ordered} onChange={e => setForm(f => ({ ...f, quantity_ordered: e.target.value }))} style={{ textAlign: 'right' }} /></Field>
            {showCost && <Field label="Unit cost"><input className="input num" type="number" min="0" value={form.unit_cost} disabled={!!formAssetRate} title={formAssetRate ? 'Unit cost is controlled by Asset Rates' : undefined} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} style={{ textAlign: 'right' }} /></Field>}
            <Field label="Estimated arrival date"><DatePicker value={form.estimated_received_date} onChange={v => setForm(f => ({ ...f, estimated_received_date: v }))} placeholder="Arrival date" /></Field>
            <Field label="PO number"><input className="input" value={form.po_number} onChange={e => setForm(f => ({ ...f, po_number: e.target.value }))} /></Field>
            <button className="btn btn-primary btn-sm" onClick={addLine} disabled={busy}>{busy ? 'Adding...' : 'Add'}</button>
          </div>
        </div>
      )}

      <div className="card material-procurement-card">
        <div className="material-register-head">
          <div>
            <h4>Purchase register</h4>
            <div>PO lines drive the asset PO dropdown and the procurement timeline.</div>
          </div>
          <div className="material-register-stats">
            <span>{rows.length} PO line(s)</span>
            <span>{totalReceived.toFixed(1)} / {totalOrdered.toFixed(1)} received</span>
          </div>
        </div>
        <div className="table-wrap">
          <table className="material-procurement-table">
            <thead>
              <tr>
                <th style={{ width: 24 }} />
                <th>Item description</th>
                <th>Vendor</th>
                <th className="num">Qty ordered</th>
                {showCost && <th className="num">Unit cost</th>}
                {showCost && <th className="num">Total value</th>}
                <th>Estimated arrival date</th>
                <th>PO number</th>
                <th>GR status</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={colSpan} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No PO lines yet</td></tr>
              )}
              {rows.map(line => {
                const open = expanded === line.id;
                const lineAssetRate = findAssetRate(assetRates, line.description);
                const subForm = batchForms[line.id] || BATCH_BLANK;
                const batches = Array.isArray(line.sub_items) ? line.sub_items : [];
                return (
                  <React.Fragment key={line.id}>
                    <tr>
                      <td style={{ textAlign: 'center', cursor: 'pointer', color: 'var(--text-3)' }} onClick={() => setExpanded(open ? null : line.id)}>{open ? '▾' : '▸'}</td>
                      <td>{canEdit ? <AssetRateSelect value={line.description} rates={assetRates} onChange={value => value !== line.description && applyAssetRateToLine(line, value)} commitOnBlur style={{ minWidth: 220 }} /> : line.description}</td>
                      <td>{canEdit ? <input className="input" defaultValue={line.vendor || ''} onBlur={e => (e.target.value || null) !== line.vendor && patchLine(line.id, { vendor: e.target.value || null })} style={{ maxWidth: 140 }} /> : (line.vendor || '—')}</td>
                      <td className="num">{canEdit ? <input className="input num" type="number" min="0" step="1" defaultValue={unitCountFromQty(line.quantity_ordered)} onBlur={e => unitCountFromQty(e.target.value) !== unitCountFromQty(line.quantity_ordered) && patchLine(line.id, { quantity_ordered: unitCountFromQty(e.target.value) })} style={{ maxWidth: 90, textAlign: 'right' }} /> : unitCountFromQty(line.quantity_ordered)}</td>
                      {showCost && <td className="num">{canEdit ? <input className="input num" type="number" min="0" defaultValue={Number(line.unit_cost || 0)} disabled={!!lineAssetRate} title={lineAssetRate ? 'Unit cost is controlled by Asset Rates' : undefined} onBlur={e => Number(e.target.value) !== Number(line.unit_cost) && patchLine(line.id, { unit_cost: Number(e.target.value) || 0 })} style={{ maxWidth: 100, textAlign: 'right' }} /> : fmt(line.unit_cost)}</td>}
                      {showCost && <td className="num" style={{ fontWeight: 700 }}>{fmt(line.amount)}</td>}
                      <td>{canEdit ? <DatePicker value={line.estimated_received_date ? String(line.estimated_received_date).slice(0, 10) : ''} onChange={v => v && patchLine(line.id, { estimated_received_date: v })} placeholder="—" style={{ maxWidth: 150 }} /> : (line.estimated_received_date || '—')}</td>
                      <td>{canEdit ? <input className="input" defaultValue={line.po_number || ''} onBlur={e => e.target.value !== line.po_number && patchLine(line.id, { po_number: e.target.value })} style={{ maxWidth: 130 }} /> : (line.po_number || '—')}</td>
                      <td><StatusPill status={line.gr_status} /></td>
                      {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(line)} title="Delete"><Icon name="x" size={13} /></button></td>}
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={colSpan} style={{ background: 'var(--surface-2)', padding: '14px 18px' }}>
                          <GrBatchPanel
                            line={line}
                            batches={batches}
                            canEdit={canEdit}
                            form={subForm}
                            setForm={patch => setBatchForms(f => ({ ...f, [line.id]: { ...subForm, ...patch } }))}
                            addBatch={() => addBatch(line)}
                            patchBatch={(batch, patch) => patchBatch(line, batch, patch)}
                            removeBatch={batch => setDeleteTarget({ type: 'batch', line, batch })}
                          />
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
      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.type === 'batch' ? 'Delete GR batch?' : 'Delete PO line?'}
          message={deleteTarget.type === 'batch'
            ? 'This will remove the GR batch from this PO line.'
            : 'This will remove the item from this Material workspace.'}
          itemLabel={deleteTarget.type === 'batch' ? 'GR batch' : 'PO line'}
          itemName={deleteTarget.type === 'batch' ? deleteTarget.batch.description : deleteTarget.description}
          itemMeta={deleteTarget.type === 'batch'
            ? [deleteTarget.line.po_number, deleteTarget.batch.estimated_received_date].filter(Boolean).join(' · ')
            : deleteTarget.po_number}
          note={deleteTarget.type === 'batch'
            ? 'The parent PO line will remain.'
            : 'Any related GR batches under this item will be removed together.'}
          cancelLabel={deleteTarget.type === 'batch' ? 'Keep batch' : 'Keep item'}
          confirmLabel={deleteTarget.type === 'batch' ? 'Delete batch' : 'Delete item'}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget.type === 'batch'
            ? removeBatch(deleteTarget.line, deleteTarget.batch).then(() => setDeleteTarget(null))
            : removeLine(deleteTarget)}
        />
      )}
    </>
  );
}

function batchTotal(line, excludeId = null) {
  return (Array.isArray(line.sub_items) ? line.sub_items : [])
    .filter(batch => batch.id !== excludeId)
    .reduce((sum, batch) => sum + Number(batch.batch_quantity || 0), 0);
}

function GrBatchPanel({ line, batches, canEdit, form, setForm, addBatch, patchBatch, removeBatch }) {
  const orderedQty = Number(line.quantity_ordered || 0);
  const totalBatchQty = batches.reduce((sum, batch) => sum + Number(batch.batch_quantity || 0), 0);
  const receivedQty = batches
    .filter(batch => batch.gr_status === 'received')
    .reduce((sum, batch) => sum + Number(batch.batch_quantity || 0), 0);
  const remainingQty = Math.max(0, orderedQty - totalBatchQty);
  const progressPct = orderedQty > 0 ? Math.min(100, Math.round((totalBatchQty / orderedQty) * 100)) : 0;

  return (
    <div className="material-batch-panel">
      <div className="material-batch-summary">
        <div>
          <div className="material-batch-title">GR batches</div>
          <div className="material-batch-meta">
            Batched {totalBatchQty.toFixed(1)} / ordered {orderedQty.toFixed(1)} · Received {receivedQty.toFixed(1)} · Remaining {remainingQty.toFixed(1)}
          </div>
        </div>
        <div className="material-batch-progress">
          <span>{progressPct}% batched</span>
          <div className="progress"><div className="progress-fill" style={{ width: `${progressPct}%`, background: remainingQty === 0 ? 'var(--ok)' : 'var(--accent)' }} /></div>
        </div>
      </div>
      {batches.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>No GR batches yet</div>}
      {batches.map(batch => {
        return (
          <div key={batch.id} className={canEdit ? 'material-batch-row is-editable' : 'material-batch-row'}>
            <div>{canEdit ? <input className="input" defaultValue={batch.description} onBlur={e => e.target.value !== batch.description && patchBatch(batch, { description: e.target.value })} /> : batch.description}</div>
            <div>{canEdit ? <input className="input num" type="number" min="0" step="0.001" defaultValue={Number(batch.batch_quantity || 0)} onBlur={e => Number(e.target.value) !== Number(batch.batch_quantity) && patchBatch(batch, { batch_quantity: Number(e.target.value) || 0 })} style={{ textAlign: 'right' }} /> : Number(batch.batch_quantity || 0).toFixed(1)}</div>
            <div>{canEdit ? <DatePicker value={batch.estimated_received_date || ''} onChange={v => patchBatch(batch, { estimated_received_date: v || null })} placeholder="Arrival" /> : (batch.estimated_received_date || '—')}</div>
            <div>{canEdit ? (
              <Select
                value={batch.gr_status || 'pending'}
                options={Object.entries(BATCH_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
                onChange={value => patchBatch(batch, { gr_status: value })}
              />
            ) : <StatusPill status={batch.gr_status} type="batch" />}</div>
            {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => removeBatch(batch)} title="Delete"><Icon name="x" size={13} /></button>}
          </div>
        );
      })}
      {canEdit && (
        <div className="material-batch-row is-editable is-new">
          <input className="input" placeholder="Batch label" value={form.description} onChange={e => setForm({ description: e.target.value })} />
          <input className="input num" type="number" min="0" step="0.001" placeholder="Qty" value={form.batch_quantity} onChange={e => setForm({ batch_quantity: e.target.value })} style={{ textAlign: 'right' }} />
          <DatePicker value={form.estimated_received_date} onChange={v => setForm({ estimated_received_date: v })} placeholder="Arrival" />
          <Select
            value={form.gr_status}
            options={Object.entries(BATCH_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
            onChange={value => setForm({ gr_status: value })}
          />
          <button className="btn btn-primary btn-sm" onClick={addBatch}>Add batch</button>
        </div>
      )}
    </div>
  );
}

function MaterialTimeline({ projectId, role }) {
  const { items, loading, error } = useCostModule('materials', projectId);
  const showCost = canViewPurchaseCosts(role);
  const [year, setYear] = useState(new Date().getFullYear());
  const monthColumnWidth = 92;
  const firstColumnWidth = 300;
  const valueColumnWidth = showCost ? 120 : 90;
  const timelineRows = items.flatMap(line => {
    const batches = Array.isArray(line.sub_items) ? line.sub_items : [];
    if (batches.length) {
      return batches.map(batch => ({
        id: `batch-${batch.id}`,
        kind: 'batch',
        description: `${line.po_number || 'PO'} · ${batch.description || line.description}`,
        parentDescription: line.description,
        poNumber: line.po_number,
        quantity: Number(batch.batch_quantity || 0),
        amount: proportionalBatchAmount(line, batch),
        date: batch.estimated_received_date,
        status: batch.gr_status || 'pending',
      }));
    }
    return [{
      id: `line-${line.id}`,
      kind: 'line',
      description: line.description,
      parentDescription: '',
      poNumber: line.po_number,
      quantity: Number(line.quantity_ordered || 0),
      amount: Number(line.amount || 0),
      date: line.estimated_received_date,
      status: line.gr_status || 'ordered',
    }];
  });
  const timelineMinWidth = firstColumnWidth + (MONTHS.length * monthColumnWidth) + valueColumnWidth;

  function rowMonth(row) {
    const raw = row.date ? String(row.date).slice(0, 10) : '';
    const match = raw.match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]) };
  }

  function timelineValue(row, month) {
    const m = rowMonth(row);
    if (!m || m.year !== year || m.month !== month) return 0;
    return showCost ? Number(row.amount || 0) : Number(row.quantity || 0);
  }

  const colTotals = MONTHS.map((_, i) => timelineRows.reduce((sum, row) => sum + timelineValue(row, i + 1), 0));
  const yearTotal = colTotals.reduce((sum, value) => sum + value, 0);

  if (loading) return <div className="card card-p" style={{ color: 'var(--text-3)' }}>Loading timeline...</div>;
  if (error) return <div className="alert alert-error"><div className="alert-body">{error.message || 'Failed to load material timeline'}</div></div>;

  return (
    <>
      <div className="card card-p" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>
              Procurement timeline
            </div>
            <div style={{ fontWeight: 750, fontSize: 17 }}>{year}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              {showCost ? 'Values shown by estimated arrival date / GR batch arrival month' : 'Quantities shown by estimated arrival date / GR batch arrival month'}
            </div>
          </div>
          <div className="grow" />
          <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y - 1)}>Previous</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setYear(new Date().getFullYear())}>Current</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y + 1)}>Next</button>
          <div style={{ minWidth: 140, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{showCost ? 'Year value' : 'Year quantity'}</div>
            <div className="num" style={{ fontWeight: 800, fontSize: 18 }}>{showCost ? fmt(yearTotal) : yearTotal.toFixed(1)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: timelineMinWidth, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: firstColumnWidth }} />
            {MONTHS.map(m => <col key={m} style={{ width: monthColumnWidth }} />)}
            <col style={{ width: valueColumnWidth }} />
          </colgroup>
          <thead>
            <tr>
              <th>PO / batch</th>
              {MONTHS.map(m => <th key={m} className="num">{m}</th>)}
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {timelineRows.length === 0 && (
              <tr><td colSpan={MONTHS.length + 2} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>No purchase timeline rows yet</td></tr>
            )}
            {timelineRows.map(row => {
              const rowTotal = MONTHS.reduce((sum, _, i) => sum + timelineValue(row, i + 1), 0);
              const status = row.kind === 'batch' ? BATCH_STATUS[row.status] : GR_STATUS[row.status];
              return (
                <tr key={row.id}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: row.kind === 'line' ? 700 : 600, fontSize: 13 }}>{row.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {row.poNumber || 'No PO'} · {row.date || 'No date'} · <span style={{ color: status?.color || 'var(--text-3)', fontWeight: 700 }}>{status?.label || row.status}</span>
                    </div>
                  </td>
                  {MONTHS.map((m, i) => {
                    const val = timelineValue(row, i + 1);
                    return (
                      <td key={m} className="num" style={{ padding: '10px 8px', color: val ? 'var(--text)' : 'var(--text-3)', fontWeight: val ? 700 : 500 }}>
                        {val ? (showCost ? fmt(val) : val.toFixed(1)) : '—'}
                      </td>
                    );
                  })}
                  <td className="num" style={{ padding: '10px 12px', fontWeight: 800 }}>
                    {rowTotal ? (showCost ? fmt(rowTotal) : rowTotal.toFixed(1)) : '—'}
                  </td>
                </tr>
              );
            })}
            {timelineRows.length > 0 && (
              <tr style={{ background: 'var(--surface-2)', fontWeight: 800 }}>
                <td style={{ padding: '10px 12px' }}>{showCost ? 'Monthly value' : 'Monthly quantity'}</td>
                {colTotals.map((total, i) => (
                  <td key={MONTHS[i]} className="num" style={{ padding: '10px 8px' }}>
                    {total ? (showCost ? fmt(total) : total.toFixed(1)) : '—'}
                  </td>
                ))}
                <td className="num" style={{ padding: '10px 12px' }}>{showCost ? fmt(yearTotal) : yearTotal.toFixed(1)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function proportionalBatchAmount(line, batch) {
  const ordered = Number(line.quantity_ordered || 0);
  const amount = Number(line.amount || 0);
  const quantity = Number(batch.batch_quantity || 0);
  if (!ordered || !amount || !quantity) return 0;
  return amount * quantity / ordered;
}

function unitCountFromQty(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function buildReceiptAssignments(assets, purchaseRows) {
  const queues = {};
  for (const line of purchaseRows || []) {
    const key = purchaseAssetKey(line.po_number, line.description);
    if (!line.po_number || !key) continue;
    const batches = Array.isArray(line.sub_items) ? line.sub_items : [];
    const receivedBatches = batches
      .filter(batch => batch.gr_status === 'received')
      .sort((a, b) => String(a.estimated_received_date || '').localeCompare(String(b.estimated_received_date || '')) || Number(a.id || 0) - Number(b.id || 0));
    for (const batch of receivedBatches) {
      const count = unitCountFromQty(batch.batch_quantity);
      for (let i = 0; i < count; i += 1) {
        queues[key] = queues[key] || [];
        queues[key].push({
          batch_id: batch.id,
          batch_description: batch.description || 'GR batch',
          received_date: batch.estimated_received_date || '',
        });
      }
    }
  }

  const assignments = {};
  const used = {};
  const sortedAssets = [...(assets || [])].sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
  for (const asset of sortedAssets) {
    const key = purchaseAssetKey(asset.po_number, asset.description || asset.asset_type);
    const queue = queues[key] || [];
    const index = used[key] || 0;
    if (queue[index]) {
      assignments[asset.id] = queue[index];
      used[key] = index + 1;
    }
  }
  return assignments;
}

function AssetList({ projectId, role, session }) {
  const { assets, totals, reload } = useMaterialAssets(projectId);
  const { items: purchaseRows } = useCostModule('materials', projectId);
  const poOptions = useMemo(() => uniquePoOptions(purchaseRows), [purchaseRows]);
  const assetCounts = useMemo(() => {
    const byPo = {};
    const byLine = {};
    for (const asset of assets || []) {
      if (!asset.po_number) continue;
      byPo[asset.po_number] = (byPo[asset.po_number] || 0) + 1;
      const key = purchaseAssetKey(asset.po_number, asset.description || asset.asset_type);
      byLine[key] = (byLine[key] || 0) + 1;
    }
    return { byPo, byLine };
  }, [assets]);
  const purchaseQtyByPo = useMemo(() => {
    const counts = {};
    for (const line of purchaseRows || []) {
      if (!line.po_number) continue;
      counts[line.po_number] = (counts[line.po_number] || 0) + unitCountFromQty(line.quantity_ordered);
    }
    return counts;
  }, [purchaseRows]);
  const purchaseAssetSummary = useMemo(() => (purchaseRows || [])
    .filter(line => line.po_number)
    .map(line => {
      const expected = unitCountFromQty(line.quantity_ordered);
      const created = assetCounts.byLine[purchaseAssetKey(line.po_number, line.description)] || 0;
      return {
        line,
        expected,
        created,
        missing: Math.max(0, expected - created),
        extra: Math.max(0, created - expected),
      };
    }), [purchaseRows, assetCounts]);
  const purchaseAssetKeys = useMemo(() => new Set((purchaseRows || [])
    .filter(line => line.po_number)
    .map(line => purchaseAssetKey(line.po_number, line.description))), [purchaseRows]);
  const unmatchedAssets = useMemo(() => (assets || [])
    .filter(asset => asset.po_number && !purchaseAssetKeys.has(purchaseAssetKey(asset.po_number, asset.description || asset.asset_type))), [assets, purchaseAssetKeys]);
  const syncStats = useMemo(() => {
    const expected = purchaseAssetSummary.reduce((sum, row) => sum + row.expected, 0);
    const missing = purchaseAssetSummary.reduce((sum, row) => sum + row.missing, 0);
    const extra = purchaseAssetSummary.reduce((sum, row) => sum + row.extra, 0);
    const unmatched = unmatchedAssets.length;
    return {
      expected,
      created: assets.length,
      missing,
      extra,
      unmatched,
      needsSync: missing > 0 || extra > 0 || unmatched > 0,
    };
  }, [assets.length, purchaseAssetSummary, unmatchedAssets]);
  const syncGroups = useMemo(() => ({
    needsAction: purchaseAssetSummary.filter(row => row.missing || row.extra),
    inSync: purchaseAssetSummary.filter(row => !row.missing && !row.extra),
  }), [purchaseAssetSummary]);
  const receiptAssignments = useMemo(() => buildReceiptAssignments(assets, purchaseRows), [assets, purchaseRows]);
  const canEdit = role !== 'Project Director';
  const [form, setForm] = useState(BLANK);
  const [duplicateCount, setDuplicateCount] = useState(1);
  const [draftRows, setDraftRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assetViewMode, setAssetViewMode] = useState('material');
  const [collapsedMaterialGroups, setCollapsedMaterialGroups] = useState({});
  const materialAssetGroups = useMemo(() => {
    const groups = new Map();
    for (const asset of assets || []) {
      const key = materialGroupKey(asset);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: asset.description || asset.asset_type || 'Uncategorised material',
          rows: [],
        });
      }
      const group = groups.get(key);
      group.rows.push(asset);
    }
    return Array.from(groups.values())
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [assets]);
  const assetColSpan = canEdit ? 8 : 7;

  async function addAsset() {
    const rows = draftRows.length ? draftRows : [form];
    for (const row of rows) {
      const validationError = firstError(
        requiredText(row.description, 'Item'),
        requiredText(row.po_number, 'PO number'),
      );
      if (validationError) { setErr(validationError); return; }
    }
    setBusy(true); setErr(null);
    try {
      for (const row of rows) {
        await api.post('/api/material-assets', {
          project_id: projectId,
          description: row.description,
          po_number: row.po_number || null,
          created_by: session?.id || null,
        });
      }
      setForm(BLANK);
      setDraftRows([]);
      reload();
    } catch (e) { setErr(e.message || 'Failed to add asset(s)'); }
    finally { setBusy(false); }
  }

  function prepareBulkRows() {
    const validationError = firstError(
      requiredText(form.description, 'Item'),
      requiredText(form.po_number, 'PO number'),
    );
    if (validationError) { setErr(validationError); return; }
    const count = Math.max(1, Math.min(200, Number(duplicateCount) || 1));
    setDraftRows(Array.from({ length: count }, (_, i) => ({
      ...form,
      draft_id: `${Date.now()}-${i}`,
    })));
    setErr(null);
  }

  function patchDraft(index, patch) {
    setDraftRows(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  }

  function draftRowsFromPurchaseLine(line, count) {
    return Array.from({ length: count }, (_, i) => ({
      description: line.description || '',
      po_number: line.po_number || '',
      draft_id: `${line.id || line.po_number}-${Date.now()}-${i}`,
    }));
  }

  function prepareMissingAssets(line, count) {
    const qty = Math.max(1, Math.min(200, count || unitCountFromQty(line.quantity_ordered)));
    setDraftRows(draftRowsFromPurchaseLine(line, qty));
    setForm({
      description: line.description || '',
      po_number: line.po_number || '',
    });
    setDuplicateCount(qty);
    setErr(null);
  }

  function applyPoToForm(poNumber) {
    const match = poOptions.find(option => option.value === poNumber)?.line;
    const created = assetCounts.byPo[poNumber] || 0;
    const remaining = Math.max(1, (purchaseQtyByPo[poNumber] || unitCountFromQty(match?.quantity_ordered)) - created);
    setForm(f => ({
      ...f,
      po_number: poNumber,
      description: f.description || match?.description || '',
    }));
    setDuplicateCount(remaining);
  }

  function applyPoToDraft(index, poNumber) {
    const match = poOptions.find(option => option.value === poNumber)?.line;
    patchDraft(index, {
      po_number: poNumber,
      description: draftRows[index]?.description || match?.description || '',
    });
  }

  async function patchAsset(id, patch) {
    const validationError = firstError(
      Object.prototype.hasOwnProperty.call(patch, 'description') ? requiredText(patch.description, 'Description') : null,
      Object.prototype.hasOwnProperty.call(patch, 'po_number') ? requiredText(patch.po_number, 'PO number') : null,
    );
    if (validationError) { setErr(validationError); return false; }
    setErr(null);
    try { await api.patch(`/api/material-assets/${id}`, patch); reload(); return true; }
    catch (e) { setErr(e.message || 'Update failed'); return false; }
  }
  async function removeAsset(asset) {
    try { await api.del(`/api/material-assets/${asset.id}`); setDeleteTarget(null); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  function renderSyncRow({ line, expected, created, missing, extra }) {
    return (
      <div key={line.id || line.po_number} className={`material-asset-sync-row ${missing || extra ? 'needs-sync' : 'in-sync'}`}>
        <div>
          <div className="material-asset-sync-title">{line.description || 'Untitled material'}</div>
          <div className="material-asset-sync-meta">{line.po_number} · Purchase qty {expected} · Asset rows {created}</div>
        </div>
        <div className="material-asset-sync-counts">
          <span className={missing ? 'is-missing' : extra ? 'is-extra' : 'is-complete'}>{missing ? `${missing} missing` : `${extra} extra`}</span>
        </div>
        {canEdit && missing > 0 && (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => prepareMissingAssets(line, missing)}>
            Create missing rows
          </button>
        )}
        {canEdit && extra > 0 && <div className="material-asset-sync-action">Review rows</div>}
        {canEdit && !missing && !extra && (
          <div className="material-asset-sync-action is-muted">No action needed</div>
        )}
      </div>
    );
  }

  const syncWarningText = [
    syncStats.missing ? `${syncStats.missing} missing asset row(s): create rows for the increased PO quantity.` : null,
    syncStats.extra ? `${syncStats.extra} extra asset row(s): delete/relink rows or restore the PO quantity.` : null,
    syncStats.unmatched ? `${syncStats.unmatched} unmatched asset row(s): edit PO/material or remove obsolete rows.` : null,
  ].filter(Boolean).join(' ');

  function toggleMaterialGroup(key) {
    setCollapsedMaterialGroups(groups => ({ ...groups, [key]: !groups[key] }));
  }

  function renderAssetRow(a) {
    return (
      <tr key={a.id}>
        <td>{canEdit ? <input className="input" defaultValue={a.description} onBlur={e => e.target.value !== a.description && patchAsset(a.id, { description: e.target.value })} style={{ minWidth: 180 }} /> : a.description}</td>
        <td>{canEdit ? <input className="input" defaultValue={a.ip_address || ''} onBlur={e => e.target.value !== (a.ip_address || '') && patchAsset(a.id, { ip_address: e.target.value || null })} style={{ maxWidth: 140 }} /> : (a.ip_address || '—')}</td>
        <td>{canEdit ? <input className="input" defaultValue={a.mac_address || ''} onBlur={e => e.target.value !== (a.mac_address || '') && patchAsset(a.id, { mac_address: e.target.value || null })} style={{ maxWidth: 150 }} /> : (a.mac_address || '—')}</td>
        <td>{canEdit ? <input className="input" defaultValue={a.version || ''} onBlur={e => e.target.value !== (a.version || '') && patchAsset(a.id, { version: e.target.value || null })} style={{ maxWidth: 110 }} /> : (a.version || '—')}</td>
        <td>{canEdit ? <input className="input" defaultValue={a.equipment_description || ''} onBlur={e => e.target.value !== (a.equipment_description || '') && patchAsset(a.id, { equipment_description: e.target.value || null })} style={{ minWidth: 200 }} /> : (a.equipment_description || '—')}</td>
        <td>{canEdit ? <input className="input" defaultValue={a.equipment_status || ''} onBlur={e => e.target.value !== (a.equipment_status || '') && patchAsset(a.id, { equipment_status: e.target.value || null })} style={{ maxWidth: 150 }} /> : (a.equipment_status || '—')}</td>
        <td>{canEdit ? <input className="input" defaultValue={a.remarks || ''} onBlur={e => e.target.value !== (a.remarks || '') && patchAsset(a.id, { remarks: e.target.value || null })} style={{ minWidth: 200 }} /> : (a.remarks || '—')}</td>
        {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(a)} title="Delete"><Icon name="x" size={13} /></button></td>}
      </tr>
    );
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Assets</div>
          <div className="kpi-value num">{totals.asset_count || 0}</div>
          <div className="kpi-sub">physical units</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Linked PO numbers</div>
          <div className="kpi-value num" style={{ color: 'var(--accent)' }}>{new Set((assets || []).map(a => a.po_number).filter(Boolean)).size}</div>
          <div className="kpi-sub">cost lives in purchase register</div>
        </div>
      </div>

      {err && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
          <div className="alert-body">{err}</div>
          <button className="alert-close" onClick={() => setErr(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {(purchaseAssetSummary.length > 0 || unmatchedAssets.length > 0) && (
        <div className={`card material-asset-sync-card ${syncStats.needsSync ? 'needs-sync' : 'in-sync'}`} style={{ marginBottom: 20 }}>
          <div className="material-register-head">
            <div>
              <h4>Purchase Register / Asset List sync</h4>
              <div>Asset rows must match each PO line quantity before tracking serial numbers.</div>
            </div>
            <div className="material-register-stats">
              <span>{syncStats.expected} expected</span>
              <span>{syncStats.created} created</span>
              {syncGroups.inSync.length > 0 && <span className="is-complete">{syncGroups.inSync.length} in sync</span>}
              <span className={syncStats.needsSync ? 'is-missing' : 'is-complete'}>{syncStats.needsSync ? 'Needs sync' : 'In sync'}</span>
            </div>
          </div>
          {syncStats.needsSync && syncWarningText ? (
            <>
              <div className="material-asset-sync-banner needs-sync">
                <div>
                  <strong>Action needed</strong>
                  <span>{syncWarningText}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="material-asset-sync-quiet">
              <div className="material-asset-sync-quiet-main">
                <span className="dot-ok" />
                <div>
                  <strong>Purchase Register and Asset List are in sync</strong>
                  <span>All expected asset rows are ready for serial number tracking.</span>
                </div>
              </div>
              <span className="material-asset-sync-quiet-count">{syncGroups.inSync.length} item(s)</span>
            </div>
          )}
          {syncStats.needsSync && (
            <div className="material-asset-sync-list">
              {syncGroups.needsAction.length > 0 && (
                <section className="material-asset-sync-group">
                  {syncGroups.needsAction.map(renderSyncRow)}
                </section>
              )}
              {unmatchedAssets.length > 0 && (
                <section className="material-asset-sync-group">
                  <div className="material-asset-sync-group-head">
                    <span>Unmatched assets</span>
                    <em>{unmatchedAssets.length} asset row(s)</em>
                  </div>
                  <div className="material-asset-sync-row needs-sync">
                    <div>
                      <div className="material-asset-sync-title">Assets without current Purchase Register match</div>
                      <div className="material-asset-sync-meta">These assets have a PO/material that no longer matches an active PO line.</div>
                    </div>
                    <div className="material-asset-sync-counts">
                      <span>{unmatchedAssets.length} asset row(s)</span>
                      <span className="is-missing">Unmatched</span>
                    </div>
                    <div className="material-asset-sync-action">Edit PO/material or delete obsolete rows</div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <div className="card card-p material-asset-create" style={{ marginBottom: 20 }}>
          <div className="material-register-head" style={{ padding: 0, borderBottom: 0, marginBottom: 12 }}>
            <div>
              <h4>Bulk-create assets</h4>
              <div>Choose an item and PO from the Purchase Register, then create asset rows.</div>
            </div>
          </div>
          <div className="material-asset-create-grid">
            <Field label="Item"><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
            <Field label="PO number"><PoSelect value={form.po_number} options={poOptions} onChange={applyPoToForm} /></Field>
            <Field label="Rows">
              <input
                className="input num material-asset-row-count"
                type="number"
                min="1"
                max="200"
                value={duplicateCount}
                onChange={e => setDuplicateCount(e.target.value)}
              />
            </Field>
            <div className="material-asset-create-actions">
              {draftRows.length > 0 && (
                <span className="material-asset-ready-pill">{draftRows.length} ready</span>
              )}
              <button className="btn btn-ghost btn-sm" onClick={prepareBulkRows} disabled={busy}>
                <Icon name="hash" size={13} /> Prepare rows
              </button>
              {draftRows.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setDraftRows([])} disabled={busy} title="Clear prepared rows">
                  <Icon name="x" size={13} /> Clear
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={addAsset} disabled={busy}>
                {busy ? 'Saving...' : draftRows.length ? `Save ${draftRows.length} rows` : 'Save 1 row'}
              </button>
            </div>
          </div>
          {poOptions.length === 0 ? (
            <div className="material-soft-note">Create at least one Purchase Register PO line before linking assets.</div>
          ) : draftRows.length > 0 ? (
            <div className="material-soft-note">{draftRows.length} prepared row(s) ready to review below.</div>
          ) : (
            <div className="material-soft-note">Prepare duplicates the item and PO number like Excel drag-down.</div>
          )}
          {draftRows.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr><th>#</th><th>Item</th><th>PO number</th></tr>
                </thead>
                <tbody>
                  {draftRows.map((row, i) => (
                    <tr key={row.draft_id}>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{i + 1}</td>
                      <td><input className="input" value={row.description} onChange={e => patchDraft(i, { description: e.target.value })} /></td>
                      <td><PoSelect value={row.po_number} options={poOptions} onChange={value => applyPoToDraft(i, value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card material-procurement-card">
        <div className="material-register-head">
          <div>
            <h4>Asset list</h4>
            <div>Equipment details for asset rows created from the Purchase Register.</div>
          </div>
          <div className="material-register-stats">
            <span>{assets.length} unit(s)</span>
            <span>{poOptions.length} purchase PO(s)</span>
            <div className="material-asset-view-toggle" role="group" aria-label="Asset list view">
              <button type="button" className={assetViewMode === 'material' ? 'active' : ''} onClick={() => setAssetViewMode('material')}>Group by material</button>
              <button type="button" className={assetViewMode === 'flat' ? 'active' : ''} onClick={() => setAssetViewMode('flat')}>Flat list</button>
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="material-procurement-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>IP address</th>
                <th>MAC address</th>
                <th>Version</th>
                <th>Equipment description</th>
                <th>Equipment status</th>
                <th>Remarks</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && (
                <tr><td colSpan={assetColSpan} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No assets yet</td></tr>
              )}
              {assetViewMode === 'material' && materialAssetGroups.map(group => {
                const collapsed = collapsedMaterialGroups[group.key];
                return (
                  <React.Fragment key={group.key}>
                    <tr className="material-asset-group-row">
                      <td colSpan={assetColSpan}>
                        <button type="button" className="material-asset-group-toggle" onClick={() => toggleMaterialGroup(group.key)}>
                          <span className="material-asset-group-chevron">{collapsed ? '▸' : '▾'}</span>
                          <strong>{group.label}</strong>
                          <em>{group.rows.length} unit(s)</em>
                        </button>
                      </td>
                    </tr>
                    {!collapsed && group.rows.map(renderAssetRow)}
                  </React.Fragment>
                );
              })}
              {assetViewMode === 'flat' && assets.map(renderAssetRow)}
            </tbody>
          </table>
        </div>
      </div>
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete asset?"
          message="This will remove the asset from this project asset list."
          itemLabel="Asset"
          itemName={deleteTarget.description}
          itemMeta={[deleteTarget.asset_type, deleteTarget.po_number].filter(Boolean).join(' · ')}
          note="Only the asset record is removed. Purchase register lines are kept."
          cancelLabel="Keep asset"
          confirmLabel="Delete asset"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => removeAsset(deleteTarget)}
        />
      )}
    </>
  );
}

function PoSelect({ value, options, onChange }) {
  return (
    <Select
      value={value || ''}
      options={[{ value: '', label: options.length ? 'Select PO' : 'No PO lines' }, ...options]}
      onChange={onChange}
      placeholder={options.length ? 'Select PO' : 'No PO lines'}
      disabled={options.length === 0}
      style={{ width: '100%' }}
    />
  );
}

function AssetRateSelect({ value, rates, onChange, style, commitOnBlur = false }) {
  const [draft, setDraft] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const options = assetRateOptions(rates, value);
  useEffect(() => { setDraft(value || ''); }, [value]);
  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (ref.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);
  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(rect.width, 360), window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const maxHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const flip = spaceBelow < 180 && rect.top > spaceBelow;
      const top = flip ? Math.max(12, rect.top - Math.min(maxHeight, rect.top - 12) - 6) : rect.bottom + 6;
      setPos({ top, left, width, maxHeight: Math.min(maxHeight, flip ? rect.top - 18 : spaceBelow) });
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const query = draft.trim().toLowerCase();
  const filtered = options
    .filter(option => {
      if (!query) return true;
      const label = `${option.value} ${option.rate?.code || ''}`.toLowerCase();
      return label.includes(query);
    })
    .slice(0, 8);

  function handleChange(nextValue) {
    setDraft(nextValue);
    setOpen(true);
    if (!commitOnBlur) onChange(nextValue);
  }

  function commit() {
    if (commitOnBlur) onChange(draft);
  }

  function choose(option) {
    setDraft(option.value);
    setOpen(false);
    onChange(option.value);
  }

  const menu = open && filtered.length > 0 && pos ? createPortal(
    <div
      ref={menuRef}
      className="material-asset-rate-menu"
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
    >
      {filtered.map(option => (
        <button key={option.value} type="button" onMouseDown={e => e.preventDefault()} onClick={() => choose(option)}>
          <span>{option.value}</span>
          {option.rate?.code && <small>{option.value} ({option.rate.code})</small>}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="material-asset-rate-picker" ref={ref} style={style}>
      <input
        className="input material-asset-rate-select"
        value={draft}
        placeholder={options.length ? 'Select Material' : 'Type material'}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      <span className="material-asset-rate-caret">▾</span>
      {menu}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

const MISC_BLANK = { rate_code: '', description: '', unit: 'each', qty: '1', unit_rate: '' };

// Misc materials: per-project sub-threshold lines, optionally priced from the
// Finance-owned Asset Rates catalog. Small items lumped here instead of the
// individually-tracked Asset list.
function MiscMaterials({ projectId, role, session, threshold, reloadSettings }) {
  const { misc, total, reload } = useMaterialMisc(projectId);
  const { rows: rates } = useFixedRates();
  const canEdit = role !== 'Project Director';
  const isFinance = role === 'Finance' || role === 'Admin';
  const [form, setForm] = useState(MISC_BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const rateByCode = useMemo(() => {
    const m = {};
    for (const r of rates) if (r.code) m[r.code] = r;
    return m;
  }, [rates]);

  const previewAmount = (Number(form.qty) || 0) * (Number(form.unit_rate) || 0);

  function pickRate(code) {
    const r = rateByCode[code];
    setForm(f => ({
      ...f,
      rate_code: code,
      unit: r ? r.unit : f.unit,
      unit_rate: r ? String(Number(r.rate)) : f.unit_rate,
      description: f.description || (r ? r.label : ''),
    }));
  }

  async function addLine() {
    if (!form.description.trim()) { setErr('Description is required'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post('/api/material-misc', {
        project_id: projectId,
        rate_code: form.rate_code || null,
        description: form.description,
        unit: form.unit || 'each',
        qty: Number(form.qty) || 0,
        unit_rate: Number(form.unit_rate) || 0,
        created_by: session?.id || null,
      });
      setForm(MISC_BLANK);
      reload();
    } catch (e) { setErr(e.message || 'Failed to add'); }
    finally { setBusy(false); }
  }

  async function patchLine(id, patch) {
    setErr(null);
    try { await api.patch(`/api/material-misc/${id}`, patch); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }
  async function removeLine(line) {
    try { await api.del(`/api/material-misc/${line.id}`); setDeleteTarget(null); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  async function saveThreshold(value) {
    const v = Math.max(0, Number(value) || 0);
    setSavingThreshold(true);
    try { await api.put('/api/settings/material_asset_threshold', { value: v, user_id: session?.id || null }); reloadSettings(); }
    catch (e) { setErr(e.message || 'Could not save threshold'); }
    finally { setSavingThreshold(false); }
  }

  return (
    <>
      <div className="card card-p" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Asset threshold</div>
            {isFinance ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700 }}>$</span>
                <input className="input num" type="number" step="500" min="0" defaultValue={threshold}
                  onBlur={e => Number(e.target.value) !== threshold && saveThreshold(e.target.value)}
                  style={{ width: 120, textAlign: 'right', fontWeight: 700 }} disabled={savingThreshold} />
              </div>
            ) : <div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(threshold)}</div>}
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              {isFinance ? 'Finance-owned · applies to all projects' : 'Finance-owned · read-only'}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24, flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
              Items at or above <strong>{fmt(threshold)}</strong> are tracked individually on the <strong>Asset list</strong>.
              Smaller items are lumped here and can be priced from the Finance-owned Asset Rates catalog.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Misc total</div>
            <div style={{ fontWeight: 700, fontSize: 18 }} className="num">{fmt(total)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{misc.length} line(s)</div>
          </div>
        </div>
      </div>

      {err && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
          <div className="alert-body">{err}</div>
          <button className="alert-close" onClick={() => setErr(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {canEdit && (
        <div className="card card-p" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add misc line</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.8fr 0.8fr 0.7fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <Field label="From catalog">
              <Select
                value={form.rate_code}
                options={[
                  { value: '', label: '- free line -' },
                  ...rates.filter(r => r.code).map(r => ({ value: r.code, label: r.label })),
                ]}
                onChange={pickRate}
              />
            </Field>
            <Field label="Description"><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
            <Field label="Unit"><input className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></Field>
            <Field label="Qty"><input className="input num" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} style={{ textAlign: 'right' }} /></Field>
            <Field label="Unit rate"><input className="input num" type="number" value={form.unit_rate} onChange={e => setForm(f => ({ ...f, unit_rate: e.target.value }))} style={{ textAlign: 'right' }} /></Field>
            <Field label="Amount"><div className="num" style={{ fontWeight: 700, textAlign: 'right', padding: '8px 0' }}>{fmt(previewAmount)}</div></Field>
            <button className="btn btn-primary btn-sm" onClick={addLine} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Unit</th>
                <th className="num">Qty</th>
                <th className="num">Unit rate</th>
                <th className="num">Amount</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {misc.length === 0 && (
                <tr><td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No misc materials yet</td></tr>
              )}
              {misc.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{m.rate_code || '—'}</td>
                  <td>{canEdit ? <input className="input" defaultValue={m.description} onBlur={e => e.target.value !== m.description && patchLine(m.id, { description: e.target.value })} style={{ minWidth: 180 }} /> : m.description}</td>
                  <td>{canEdit ? <input className="input" defaultValue={m.unit} onBlur={e => e.target.value !== m.unit && patchLine(m.id, { unit: e.target.value })} style={{ maxWidth: 80 }} /> : m.unit}</td>
                  <td className="num">{canEdit ? <input className="input num" type="number" defaultValue={Number(m.qty)} onBlur={e => Number(e.target.value) !== Number(m.qty) && patchLine(m.id, { qty: Number(e.target.value) || 0 })} style={{ maxWidth: 80, textAlign: 'right' }} /> : m.qty}</td>
                  <td className="num">{canEdit ? <input className="input num" type="number" defaultValue={Number(m.unit_rate)} onBlur={e => Number(e.target.value) !== Number(m.unit_rate) && patchLine(m.id, { unit_rate: Number(e.target.value) || 0 })} style={{ maxWidth: 100, textAlign: 'right' }} /> : fmt(m.unit_rate)}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{fmt(m.amount)}</td>
                  {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(m)} title="Delete"><Icon name="x" size={13} /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete material line?"
          message="This will remove this miscellaneous material line."
          itemLabel="Material line"
          itemName={deleteTarget.description}
          itemMeta={deleteTarget.rate_code ? `Code: ${deleteTarget.rate_code}` : null}
          note="The line will no longer roll up into the Material forecast."
          cancelLabel="Keep line"
          confirmLabel="Delete line"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => removeLine(deleteTarget)}
        />
      )}
    </>
  );
}
