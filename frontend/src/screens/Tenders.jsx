import React, { useMemo, useState } from 'react';
import { useTenderList, useUsers, fmt } from '../data/store.js';
import { api } from '../data/api.js';
import Select from '../components/Select.jsx';
import Icon from '../components/Icon.jsx';

// Tenders — top-level (portfolio-wide) module.
// Plan-ahead register: for every project, PM/PD estimate the resource, material
// and sub-con cost before kickoff. When a tender is marked "awarded", its
// category totals surface in that project's Rev Rec tab (Tender cost).
const STATUS_BADGE = {
  draft:     { cls: 'neutral', label: 'Draft' },
  submitted: { cls: 'accent',  label: 'Submitted' },
  awarded:   { cls: 'ok',      label: 'Awarded' },
  lost:      { cls: 'bad',     label: 'Lost' },
};

export default function Tenders({ navigate, session }) {
  const { rows, loading, reload } = useTenderList(session?.id, session?.role);
  const users = useUsers();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({
    opportunity_name: '',
    customer: '',
    department: '',
    pm_user_id: session?.role === 'Project Manager' ? session?.id : '',
    pd_user_id: '',
  });

  const scoped = session?.role === 'Project Manager' || session?.role === 'Project Director';

  const pmUsers = useMemo(() => users.filter(u => u.role === 'Project Manager'), [users]);
  const pdUsers = useMemo(() => users.filter(u => u.role === 'Project Director'), [users]);

  // Build the option list for a PM/PD cell, always including the currently
  // assigned user even if their role no longer matches the expected pool.
  function optionsFor(list, curId, curName) {
    const base = list.some(u => u.id === curId) || !curId
      ? list
      : [{ id: curId, full_name: curName || curId }, ...list];
    return [
      { value: '', label: '— Unassigned' },
      ...base.map(u => ({ value: u.id, label: u.full_name })),
    ];
  }

  async function assign(tenderId, field, value) {
    try {
      await api.patch(`/api/tender/${tenderId}`, { [field]: value || null });
      reload();
    } catch { /* keep current selection on failure */ }
  }

  async function createTender() {
    if (!form.opportunity_name.trim()) { setErr('Opportunity name is required'); return; }
    setBusy(true); setErr(null);
    try {
      const tender = await api.post('/api/tender', { ...form, created_by: session?.id || null });
      setForm({ opportunity_name: '', customer: '', department: '', pm_user_id: session?.role === 'Project Manager' ? session?.id : '', pd_user_id: '' });
      setAdding(false);
      reload();
      navigate('tender', tender.id);
    } catch (e) { setErr(e.message || 'Could not create tender'); }
    finally { setBusy(false); }
  }

  const totals = useMemo(() => rows.reduce((a, r) => ({
    total:    a.total    + Number(r.total_amount || 0),
    resource: a.resource + Number(r.resource_amount || 0),
    material: a.material + Number(r.material_amount || 0),
    subcon:   a.subcon   + Number(r.subcon_amount || 0),
    others:   a.others   + Number(r.others_amount || 0),
    awarded:  a.awarded  + (r.tender_status === 'awarded' ? 1 : 0),
  }), { total: 0, resource: 0, material: 0, subcon: 0, others: 0, awarded: 0 }), [rows]);

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
          <span className="module-inline-current">Tenders</span>
          <span className="material-category-badge" style={{ '--category-color': 'var(--warn)' }}>
            <span className="material-category-dot" />
            <span className="material-category-text">Pre-award</span>
          </span>
        </div>
        <div className="grow" />
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ New tender'}
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 18 }}>
        Pre-award opportunities live here only. They become projects only when you award and initiate them.
      </div>

      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}><div className="alert-body">{err}</div></div>}

      {adding && (
        <div className="card card-p" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Create tender opportunity</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <label className="field">
              <span className="field-label">Opportunity name</span>
              <input className="input" value={form.opportunity_name} onChange={e => setForm(f => ({ ...f, opportunity_name: e.target.value }))} placeholder="e.g. EAC Refresh Programme" />
            </label>
            <label className="field">
              <span className="field-label">Customer</span>
              <input className="input" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Department</span>
              <input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">PM</span>
              <Select value={form.pm_user_id || ''} options={optionsFor(pmUsers, form.pm_user_id, '')} onChange={v => setForm(f => ({ ...f, pm_user_id: v }))} placeholder="— Unassigned" />
            </label>
            <label className="field">
              <span className="field-label">PD</span>
              <Select value={form.pd_user_id || ''} options={optionsFor(pdUsers, form.pd_user_id, '')} onChange={v => setForm(f => ({ ...f, pd_user_id: v }))} placeholder="— Unassigned" />
            </label>
            <button className="btn btn-primary btn-sm" onClick={createTender} disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Total tender value</div>
          <div className="kpi-value num" style={{ color: 'var(--accent, var(--ok))' }}>{fmt(totals.total)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Resource</div>
          <div className="kpi-value num">{fmt(totals.resource)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Material</div>
          <div className="kpi-value num">{fmt(totals.material)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Sub-Con</div>
          <div className="kpi-value num">{fmt(totals.subcon)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Other LOB and MISC</div>
          <div className="kpi-value num">{fmt(totals.others)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Awarded</div>
          <div className="kpi-value num">{totals.awarded} / {rows.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-p" style={{ paddingBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Tender register</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
            Select an opportunity to plan or edit its tender estimate.
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>PM</th>
                <th>PD</th>
                <th>Status</th>
                <th className="num">Resource</th>
                <th className="num">Material</th>
                <th className="num">Sub-Con</th>
                <th className="num">Other LOB and MISC</th>
                <th className="num">Total</th>
                <th className="num">Lines</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>{scoped ? 'No tenders assigned to you' : 'No tenders yet'}</td></tr>
              )}
              {rows.map(r => {
                const badge = STATUS_BADGE[r.tender_status] || STATUS_BADGE.draft;
                return (
                  <tr
                    key={r.tender_id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('tender', r.tender_id)}
                  >
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.tender_name || r.project_name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                        {r.project_id ? `Project ${r.project_id}` : `Tender #${r.tender_id}`}
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <Select
                        ghost
                        style={{ fontSize: 12, minWidth: 120, maxWidth: 160 }}
                        value={r.pm_user_id || ''}
                        options={optionsFor(pmUsers, r.pm_user_id, r.pm_name)}
                        placeholder="— Unassigned"
                        onChange={v => assign(r.tender_id, 'pm_user_id', v)}
                      />
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <Select
                        ghost
                        style={{ fontSize: 12, minWidth: 120, maxWidth: 160 }}
                        value={r.pd_user_id || ''}
                        options={optionsFor(pdUsers, r.pd_user_id, r.pd_name)}
                        placeholder="— Unassigned"
                        onChange={v => assign(r.tender_id, 'pd_user_id', v)}
                      />
                    </td>
                    <td>
                      <span className={`badge badge-${badge.cls}`} style={{ fontSize: 10 }}>{badge.label}</span>
                    </td>
                    <td className="num text-right">{fmt(r.resource_amount)}</td>
                    <td className="num text-right">{fmt(r.material_amount)}</td>
                    <td className="num text-right">{fmt(r.subcon_amount)}</td>
                    <td className="num text-right">{fmt(r.others_amount)}</td>
                    <td className="num text-right" style={{ fontWeight: 700 }}>{fmt(r.total_amount)}</td>
                    <td className="num text-right" style={{ color: 'var(--text-3)' }}>{r.item_count}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={e => { e.stopPropagation(); navigate('tender', r.tender_id); }}
                      >
                        Open <Icon name="arrowRight" size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
