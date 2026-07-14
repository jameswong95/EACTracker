import React, { useState, useMemo } from 'react';
import { useTender, fmt } from '../data/store.js';
import { api } from '../data/api.js';
import StLabour from './tender/StLabour.jsx';
import Prelim from './tender/Prelim.jsx';
import Icon from '../components/Icon.jsx';
import Select from '../components/Select.jsx';

const KINDS = [
  { id: 'resource', label: 'Resource' },
  { id: 'material', label: 'Material' },
  { id: 'subcon',   label: 'Sub-Con' },
  { id: 'others',   label: 'Other LOB/MISC' },
];
const CATS = ['PM', 'MISC'];
const KIND_OPTIONS = KINDS.map(k => ({ value: k.id, label: k.label }));
const CAT_OPTIONS = CATS.map(c => ({ value: c, label: c }));
const TENDER_STATUS_OPTIONS = ['draft', 'submitted', 'awarded', 'lost'].map(s => ({ value: s, label: s }));
const VO_STATUS_OPTIONS = [
  { value: 'potential', label: 'Potential' },
  { value: 'confirmed', label: 'Confirmed' },
];

const SUB_TABS = [
  { id: 'estimate', label: 'Estimate' },
  { id: 'vos',      label: 'Variation Orders' },
  { id: 'labour',   label: 'ST Labour' },
  { id: 'prelim',   label: 'Preliminaries' },
];

// Revenue = cost / (1 - GP%).  gp is a percentage (0..100).
function revenueFromCost(cost, gpPct) {
  const g = Math.max(0, Math.min(99.999, Number(gpPct) || 0)) / 100;
  return g >= 1 ? cost : cost / (1 - g);
}

// Tender module — pre-kickoff estimate planned by PM/PD at project onset.
// A standalone dataset (NOT tied to live Resource/Material/Sub-Con data); its
// aggregate total rolls up into Rev Rec as the "Planned (Tender)" line item.
export default function Tender({ tenderId, navigate, role, session }) {
  const { data, loading, reload } = useTender(tenderId);
  const canEdit = role !== 'Project Director';
  const isFinance = role === 'Finance' || role === 'Admin';

  const [form, setForm] = useState({
    kind: 'resource', category: 'PM', sub_job_label: '', description: '', qty: '1', unit_cost: '', notes: '',
  });
  const [voForm, setVoForm] = useState({ ref: '', description: '', amount: '', status: 'potential' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState('estimate');

  const tender = data?.tender;
  const items = data?.items || [];
  const totals = data?.totals || {};
  const vos = data?.vos || [];
  const voTotals = data?.voTotals || { confirmed_amount: 0, potential_amount: 0, confirmed_count: 0, potential_count: 0 };

  const gpPct = Number(tender?.gp_pct) || 0;

  const byKind = useMemo(() => {
    const m = { resource: [], material: [], subcon: [], others: [] };
    for (const it of items) (m[it.kind] || m.resource).push(it);
    return m;
  }, [items]);

  const grandTotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);

  // Blended margin: revenue is computed per-line using the line's own GP%
  // override where set, otherwise the tender-level GP%. The blended GP% is the
  // margin implied by total revenue vs total cost across all lines.
  const blended = useMemo(() => {
    let cost = 0, revenue = 0;
    for (const it of items) {
      const c = Number(it.amount || 0);
      const g = it.gp_pct != null ? Number(it.gp_pct) : gpPct;
      cost += c;
      revenue += revenueFromCost(c, g);
    }
    // Confirmed VOs contribute to revenue/cost too (potential shown separately).
    for (const v of vos) {
      if (v.status !== 'confirmed') continue;
      const c = Number(v.amount || 0);
      const g = v.gp_pct != null ? Number(v.gp_pct) : gpPct;
      cost += c;
      revenue += revenueFromCost(c, g);
    }
    const blendedGp = revenue > 0 ? (1 - cost / revenue) * 100 : 0;
    return { cost, revenue, margin: revenue - cost, blendedGp };
  }, [items, vos, gpPct]);

  async function addItem() {
    if (!form.description) { setErr('Description is required'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post(`/api/tender/${tender.id}/items`, {
        kind: form.kind,
        category: form.category,
        sub_job_label: form.sub_job_label || null,
        description: form.description,
        qty: Number(form.qty) || 1,
        unit_cost: Number(form.unit_cost) || 0,
        notes: form.notes || null,
      });
      setForm({ kind: form.kind, category: 'PM', sub_job_label: '', description: '', qty: '1', unit_cost: '', notes: '' });
      reload();
    } catch (e) { setErr(e.message || 'Failed to add'); }
    finally { setBusy(false); }
  }

  async function patchItem(id, patch) {
    try { await api.patch(`/api/tender/items/${id}`, patch); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }

  async function removeItem(id) {
    try { await api.del(`/api/tender/items/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  async function setStatus(status) {
    try { await api.patch(`/api/tender/${tender.id}`, { status }); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }

  async function setGp(value) {
    const gp = Math.max(0, Math.min(99.999, Number(value) || 0));
    try { await api.patch(`/api/tender/${tender.id}`, { gp_pct: gp }); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }

  async function addVo() {
    if (!voForm.description) { setErr('VO description is required'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post(`/api/tender/${tender.id}/vos`, {
        ref: voForm.ref || null,
        description: voForm.description,
        amount: Number(voForm.amount) || 0,
        status: voForm.status,
        created_by: session?.id || null,
      });
      setVoForm({ ref: '', description: '', amount: '', status: 'potential' });
      reload();
    } catch (e) { setErr(e.message || 'Failed to add VO'); }
    finally { setBusy(false); }
  }

  async function patchVo(id, patch) {
    try { await api.patch(`/api/tender/vos/${id}`, patch); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }

  async function removeVo(id) {
    try { await api.del(`/api/tender/vos/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  async function settleFad(settled) {
    try { await api.post(`/api/tender/${tender.id}/settle-fad`, { settled, user_id: session?.id || null }); reload(); }
    catch (e) { setErr(e.message || 'Settle failed'); }
  }

  async function initiateProject() {
    if (!window.confirm('Award this tender and create the live project? Tender inputs will be copied into project initiation, Resource Plan, Material, Sub-Con and Others.')) return;
    try {
      const result = await api.post(`/api/tender/${tender.id}/initiate`, { user_id: session?.id || null });
      reload();
      if (result?.project?.id) navigate('project-initiation', result.project.id);
    }
    catch (e) { setErr(e.message || 'Initiate failed'); }
  }

  if (loading) return (
    <div className="screen" style={{ padding: 28 }}>
      <div className="skel skel-title" style={{ width: 240, marginBottom: 20 }} />
      <div className="skel skel-card" />
    </div>
  );

  return (
    <div className="screen">
      <div className="module-inline-header">
        <div className="module-inline-crumbs">
          <button type="button" onClick={() => navigate('tenders')}>Tenders</button>
          <span>/</span>
          <span className="module-inline-current">{tender?.opportunity_name || tender?.name || `Tender #${tenderId}`}</span>
          <span className="material-category-badge" style={{ '--category-color': 'var(--warn)' }}>
            <span className="material-category-dot" />
            <span className="material-category-text">Pre-award</span>
          </span>
        </div>
        <div className="grow" />
        {canEdit && tender && (
          <Select value={tender.status} options={TENDER_STATUS_OPTIONS} onChange={setStatus} style={{ width: 140 }} />
        )}
        {canEdit && tender && tender.status !== 'awarded' && (
          <button className="btn btn-primary btn-sm" onClick={initiateProject} title="Award tender and initiate the project (inherits blended margin)">Award &amp; initiate</button>
        )}
        {tender && tender.status === 'awarded' && (
          <span className="badge badge-ok" style={{ alignSelf: 'center' }}>Awarded · project initiated</span>
        )}
        {tender?.project_id && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('project-initiation', tender.project_id)}>Open project</button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('tenders')}><Icon name="arrowLeft" size={13} /> Back</button>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="tab-btn"
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              padding: '8px 14px', fontSize: 13, fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-2)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'estimate' && (<>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Resource estimate</div>
          <div className="kpi-value num">{fmt(totals.resource_amount)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Material estimate</div>
          <div className="kpi-value num">{fmt(totals.material_amount)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Sub-Con estimate</div>
          <div className="kpi-value num">{fmt(totals.subcon_amount)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Others estimate</div>
          <div className="kpi-value num">{fmt(totals.others_amount)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Total (Planned Tender)</div>
          <div className="kpi-value num" style={{ color: 'var(--accent, var(--ok))' }}>{fmt(grandTotal)}</div>
          <div className="kpi-sub">rolls up to Rev Rec</div>
        </div>
      </div>

      {/* GP% -> revenue (blended margin). Revenue = cost / (1 - GP%). */}
      <div className="card card-p" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Target GP%</div>
            {canEdit && tender ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="input num" type="number" step="0.1" min="0" max="99.9" defaultValue={gpPct}
                  onBlur={e => Number(e.target.value) !== gpPct && setGp(e.target.value)}
                  style={{ width: 90, textAlign: 'right', fontWeight: 700 }} />
                <span style={{ fontWeight: 700 }}>%</span>
              </div>
            ) : <div style={{ fontWeight: 700, fontSize: 18 }}>{gpPct.toFixed(1)}%</div>}
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Revenue = cost ÷ (1 − GP%)</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Cost (est. + confirmed VO)</div>
            <div style={{ fontWeight: 700, fontSize: 18 }} className="num">{fmt(blended.cost)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Revenue</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ok)' }} className="num">{fmt(blended.revenue)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Margin ($)</div>
            <div style={{ fontWeight: 700, fontSize: 18 }} className="num">{fmt(blended.margin)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Blended GP%</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }} className="num">{blended.blendedGp.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
          Blended GP% is the effective margin across all lines (each line may carry its own GP% override). Confirmed VOs are included; potential VOs are excluded.
        </div>
      </div>

      {err && <div className="empty-state" style={{ color: 'var(--bad)', padding: 8, marginBottom: 12 }}>{err}</div>}

      {canEdit && tender && (
        <div className="card card-p" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add tender line</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1fr 1.6fr 0.7fr 0.9fr auto', gap: 8, alignItems: 'center' }}>
            <Select value={form.kind} options={KIND_OPTIONS} onChange={v => setForm(f => ({ ...f, kind: v }))} />
            <Select value={form.category} options={CAT_OPTIONS} onChange={v => setForm(f => ({ ...f, category: v }))} />
            <input className="input" placeholder="Sub-job (label)" value={form.sub_job_label} onChange={e => setForm(f => ({ ...f, sub_job_label: e.target.value }))} />
            <input className="input" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input className="input" type="number" placeholder="Qty" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
            <input className="input" type="number" placeholder="Unit cost" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} />
            <button className="btn btn-primary btn-sm" onClick={addItem} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
            Amount = Qty × Unit cost. Tender is a standalone estimate and does not affect live cost modules.
          </div>
        </div>
      )}

      {KINDS.map(k => {
        const rows = byKind[k.id];
        if (!rows.length && !canEdit) return null;
        const kindTotal = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
        return (
          <div className="card" style={{ marginBottom: 16 }} key={k.id}>
            <div className="card-p" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{k.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Subtotal: <strong>{fmt(kindTotal)}</strong></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Sub-job</th>
                    <th>Description</th>
                    <th className="num">Qty</th>
                    <th className="num">Unit cost</th>
                    <th className="num">Amount</th>
                    {canEdit && <th />}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No lines</td></tr>
                  )}
                  {rows.map(it => (
                    <tr key={it.id}>
                      <td>
                        {canEdit ? (
                          <Select value={it.category} options={CAT_OPTIONS} onChange={v => patchItem(it.id, { category: v })} style={{ maxWidth: 100 }} />
                        ) : it.category}
                      </td>
                      <td>
                        {canEdit ? (
                          <input className="input" defaultValue={it.sub_job_label || ''}
                            onBlur={e => (e.target.value || null) !== it.sub_job_label && patchItem(it.id, { sub_job_label: e.target.value || null })} style={{ maxWidth: 120 }} />
                        ) : (it.sub_job_label || '—')}
                      </td>
                      <td>
                        {canEdit ? (
                          <input className="input" defaultValue={it.description}
                            onBlur={e => e.target.value !== it.description && patchItem(it.id, { description: e.target.value })} />
                        ) : it.description}
                      </td>
                      <td className="num">
                        {canEdit ? (
                          <input className="input num" type="number" defaultValue={Number(it.qty)}
                            onBlur={e => Number(e.target.value) !== Number(it.qty) && patchItem(it.id, { qty: Number(e.target.value) || 0 })} style={{ maxWidth: 70, textAlign: 'right' }} />
                        ) : it.qty}
                      </td>
                      <td className="num">
                        {canEdit ? (
                          <input className="input num" type="number" defaultValue={Number(it.unit_cost)}
                            onBlur={e => Number(e.target.value) !== Number(it.unit_cost) && patchItem(it.id, { unit_cost: Number(e.target.value) || 0 })} style={{ maxWidth: 100, textAlign: 'right' }} />
                        ) : fmt(it.unit_cost)}
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>{fmt(it.amount)}</td>
                      {canEdit && (
                        <td><button className="btn btn-ghost btn-sm" onClick={() => removeItem(it.id)} title="Delete"><Icon name="x" size={13} /></button></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      </>)}

      {tab === 'vos' && tender && (
        <VoPanel
          vos={vos} voTotals={voTotals} gpPct={gpPct} canEdit={canEdit}
          voForm={voForm} setVoForm={setVoForm} addVo={addVo} patchVo={patchVo} removeVo={removeVo} busy={busy}
        />
      )}

      {tab === 'labour' && tender && <StLabour tenderId={tender.id} canEdit={canEdit} />}
      {tab === 'prelim' && tender && <Prelim   tenderId={tender.id} canEdit={canEdit} />}
    </div>
  );
}

// Variation Orders — potential vs confirmed. Confirmed VOs feed the blended
// margin / totals; potential VOs are tracked but excluded. No auto budget recalc.
function VoPanel({ vos, voTotals, gpPct, canEdit, voForm, setVoForm, addVo, patchVo, removeVo, busy }) {
  const rev = (amount, gp) => {
    const g = Math.max(0, Math.min(99.999, gp != null ? Number(gp) : Number(gpPct) || 0)) / 100;
    return g >= 1 ? Number(amount || 0) : Number(amount || 0) / (1 - g);
  };
  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Confirmed VOs</div>
          <div className="kpi-value num" style={{ color: 'var(--ok)' }}>{fmt(voTotals.confirmed_amount)}</div>
          <div className="kpi-sub">{voTotals.confirmed_count || 0} order(s) · in totals</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Potential VOs</div>
          <div className="kpi-value num" style={{ color: 'var(--warn)' }}>{fmt(voTotals.potential_amount)}</div>
          <div className="kpi-sub">{voTotals.potential_count || 0} order(s) · excluded</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Confirmed revenue</div>
          <div className="kpi-value num">{fmt(rev(voTotals.confirmed_amount, null))}</div>
          <div className="kpi-sub">at {Number(gpPct).toFixed(1)}% GP</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Exposure (all VOs)</div>
          <div className="kpi-value num">{fmt(Number(voTotals.confirmed_amount || 0) + Number(voTotals.potential_amount || 0))}</div>
        </div>
      </div>

      {canEdit && (
        <div className="card card-p" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add variation order</div>
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 2.2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
            <input className="input" placeholder="Ref (VO-01)" value={voForm.ref} onChange={e => setVoForm(f => ({ ...f, ref: e.target.value }))} />
            <input className="input" placeholder="Description" value={voForm.description} onChange={e => setVoForm(f => ({ ...f, description: e.target.value }))} />
            <input className="input num" type="number" placeholder="Amount" value={voForm.amount} onChange={e => setVoForm(f => ({ ...f, amount: e.target.value }))} style={{ textAlign: 'right' }} />
            <Select value={voForm.status} options={VO_STATUS_OPTIONS} onChange={v => setVoForm(f => ({ ...f, status: v }))} />
            <button className="btn btn-primary btn-sm" onClick={addVo} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
            Confirmed VOs contribute to the blended margin and totals. Budget/EAC are <strong>not</strong> recalculated automatically.
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Description</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th className="num">Revenue</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {vos.length === 0 && <tr><td colSpan={canEdit ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No variation orders</td></tr>}
              {vos.map(v => (
                <tr key={v.id}>
                  <td>
                    {canEdit ? (
                      <input className="input" defaultValue={v.ref || ''} onBlur={e => (e.target.value || null) !== v.ref && patchVo(v.id, { ref: e.target.value || null })} style={{ maxWidth: 100 }} />
                    ) : (v.ref || '—')}
                  </td>
                  <td>
                    {canEdit ? (
                      <input className="input" defaultValue={v.description} onBlur={e => e.target.value !== v.description && patchVo(v.id, { description: e.target.value })} />
                    ) : v.description}
                  </td>
                  <td className="num">
                    {canEdit ? (
                      <input className="input num" type="number" defaultValue={Number(v.amount)} onBlur={e => Number(e.target.value) !== Number(v.amount) && patchVo(v.id, { amount: Number(e.target.value) || 0 })} style={{ maxWidth: 120, textAlign: 'right' }} />
                    ) : fmt(v.amount)}
                  </td>
                  <td>
                    {canEdit ? (
                      <Select value={v.status} options={VO_STATUS_OPTIONS} onChange={status => patchVo(v.id, { status })} style={{ maxWidth: 140 }} />
                    ) : (
                      <span className={`badge badge-${v.status === 'confirmed' ? 'ok' : 'warn'}`} style={{ fontSize: 10 }}>{v.status}</span>
                    )}
                  </td>
                  <td className="num" style={{ color: 'var(--text-2)' }}>{fmt(rev(v.amount, v.gp_pct))}</td>
                  {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => removeVo(v.id)} title="Delete"><Icon name="x" size={13} /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
