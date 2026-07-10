import React, { useMemo, useState } from 'react';
import { useProject, useProjectInitiation, fmt } from '../data/store.js';
import { api } from '../data/api.js';
import Icon from '../components/Icon.jsx';

const KINDS = [
  { id: 'resource', label: 'Resource' },
  { id: 'material', label: 'Material' },
  { id: 'subcon', label: 'Sub-Con' },
  { id: 'others', label: 'Others LOB/MISC' },
];
const CATS = ['PM', 'MISC'];

const BLANK = { kind: 'resource', category: 'PM', sub_job_label: '', description: '', qty: '1', unit_cost: '', notes: '' };

export default function ProjectInitiation({ projectId, navigate, role }) {
  const { project: p, loading } = useProject(projectId);
  const { items, totals, tender, loading: loadingInit, reload } = useProjectInitiation(projectId);
  const canEdit = role !== 'Project Director';
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const byKind = useMemo(() => {
    const m = { resource: [], material: [], subcon: [], others: [] };
    for (const item of items) (m[item.kind] || m.resource).push(item);
    return m;
  }, [items]);

  async function addItem() {
    if (!form.description.trim()) { setErr('Description is required'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post('/api/project-initiation', {
        project_id: projectId,
        kind: form.kind,
        category: form.category,
        sub_job_label: form.sub_job_label || null,
        description: form.description,
        qty: Number(form.qty) || 1,
        unit_cost: Number(form.unit_cost) || 0,
        notes: form.notes || null,
      });
      setForm(BLANK);
      reload();
    } catch (e) { setErr(e.message || 'Could not add line'); }
    finally { setBusy(false); }
  }

  async function patchItem(id, patch) {
    setErr(null);
    try { await api.patch(`/api/project-initiation/${id}`, patch); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }

  async function removeItem(id) {
    try { await api.del(`/api/project-initiation/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  if (loading || loadingInit) return (
    <div className="screen">
      <div className="skel skel-title" style={{ width: 260, marginBottom: 20 }} />
      <div className="skel skel-card" />
    </div>
  );

  return (
    <div className="screen">
      <div className="module-inline-header">
        <div className="module-inline-crumbs">
          <button type="button" onClick={() => navigate('portfolio')}>Portfolio</button>
          <span>/</span>
          <button type="button" onClick={() => navigate('project', projectId)}>{p?.name || projectId}</button>
          <span>/</span>
          <span className="module-inline-current">Project initiation</span>
        </div>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('project', projectId)}><Icon name="arrowLeft" size={13} /> Back</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Tender snapshot</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{tender ? `#${tender.id}` : '—'}</div>
          <div className="kpi-sub">{tender?.opportunity_name || tender?.name || 'No linked tender'}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Resource estimate</div>
          <div className="kpi-value num">{fmt(totals.resource)}</div>
          <div className="kpi-sub">copied from tender</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Material estimate</div>
          <div className="kpi-value num">{fmt(totals.material)}</div>
          <div className="kpi-sub">editable handover copy</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Sub-Con + Others</div>
          <div className="kpi-value num">{fmt(Number(totals.subcon || 0) + Number(totals.others || 0))}</div>
          <div className="kpi-sub">forecast handover</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Total initiation estimate</div>
          <div className="kpi-value num" style={{ color: 'var(--accent)' }}>{fmt(totals.total)}</div>
          <div className="kpi-sub">{totals.count || 0} line(s)</div>
        </div>
      </div>

      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}><div className="alert-body">{err}</div></div>}

      <div className="card card-p" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Tender estimate handover</div>
            <div style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.65 }}>
              These rows are a project-side copy of the pre-award tender estimate. Editing here updates only Project initiation;
              the original Tender record remains unchanged.
            </div>
          </div>
          {tender && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('tender', tender.id)}>Open original tender</button>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="card card-p" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Add initiation line</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr .75fr 1fr 1.6fr .7fr .9fr auto', gap: 8, alignItems: 'end' }}>
            <label className="field">
              <span className="field-label">Kind</span>
              <select className="input" value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}>
                {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Category</span>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Sub-job</span>
              <input className="input" value={form.sub_job_label} onChange={e => setForm(f => ({ ...f, sub_job_label: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Description</span>
              <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Qty</span>
              <input className="input num" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Unit cost</span>
              <input className="input num" type="number" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={addItem} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
          </div>
        </div>
      )}

      {KINDS.map(k => {
        const rows = byKind[k.id] || [];
        const subtotal = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
        return (
          <div className="card" style={{ marginBottom: 16 }} key={k.id}>
            <div className="card-p" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{k.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Subtotal: <strong>{fmt(subtotal)}</strong></div>
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
                    <th>Source</th>
                    {canEdit && <th />}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No lines</td></tr>
                  )}
                  {rows.map(it => (
                    <tr key={it.id}>
                      <td>
                        {canEdit ? (
                          <select className="input" value={it.category} onChange={e => patchItem(it.id, { category: e.target.value })} style={{ maxWidth: 90 }}>
                            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : it.category}
                      </td>
                      <td>
                        {canEdit ? (
                          <input className="input" defaultValue={it.sub_job_label || ''} onBlur={e => (e.target.value || null) !== it.sub_job_label && patchItem(it.id, { sub_job_label: e.target.value || null })} style={{ maxWidth: 130 }} />
                        ) : (it.sub_job_label || '—')}
                      </td>
                      <td>
                        {canEdit ? (
                          <input className="input" defaultValue={it.description} onBlur={e => e.target.value !== it.description && patchItem(it.id, { description: e.target.value })} />
                        ) : it.description}
                      </td>
                      <td className="num">
                        {canEdit ? (
                          <input className="input num" type="number" defaultValue={Number(it.qty)} onBlur={e => Number(e.target.value) !== Number(it.qty) && patchItem(it.id, { qty: Number(e.target.value) || 0 })} style={{ maxWidth: 80, textAlign: 'right' }} />
                        ) : it.qty}
                      </td>
                      <td className="num">
                        {canEdit ? (
                          <input className="input num" type="number" defaultValue={Number(it.unit_cost)} onBlur={e => Number(e.target.value) !== Number(it.unit_cost) && patchItem(it.id, { unit_cost: Number(e.target.value) || 0 })} style={{ maxWidth: 110, textAlign: 'right' }} />
                        ) : fmt(it.unit_cost)}
                      </td>
                      <td className="num" style={{ fontWeight: 700 }}>{fmt(it.amount)}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: 11 }}>
                        {it.source_tender_item_id ? `Tender line #${it.source_tender_item_id}` : 'Manual'}
                      </td>
                      {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => removeItem(it.id)} title="Delete"><Icon name="x" size={13} /></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
