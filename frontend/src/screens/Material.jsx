import React, { useState, useMemo } from 'react';
import { useProject, useMaterialAssets, useMaterialMisc, useFixedRates, fmt, MONTHS } from '../data/store.js';
import { api } from '../data/api.js';
import CostModule from './CostModule.jsx';
import DatePicker from '../components/DatePicker.jsx';
import Icon from '../components/Icon.jsx';

const GR_STATUS = {
  not_ordered: { label: 'Not ordered', color: 'var(--text-3)' },
  ordered:     { label: 'Ordered',     color: 'var(--accent)' },
  partial:     { label: 'Part GR',     color: 'var(--warn)' },
  received:    { label: 'Received',    color: 'var(--ok)' },
};

// Material module.
//   * Asset List  - live document of physical assets for forecast planning.
//     Carries vendor payment structure and a month-by-month dollar-planning
//     timeline. SAP import owns committed costs.
//   * Purchase register - description/date/amount line-item register.
export default function Material({ projectId, navigate, role, session }) {
  const { project: p } = useProject(projectId);
  const [tab, setTab] = useState('register');

  const TABS = [
    ['register', 'Purchase register'],
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
            <Icon name={k === 'register' ? 'hash' : 'tag'} size={13} />
            <span>{l}</span>
          </button>
        ))}
      </div>

      <div className="material-view-panel" key={tab}>
        {tab === 'assets' && <AssetList projectId={projectId} role={role} session={session} />}
        {tab === 'register' && (
          <CostModule
            module="materials" etcKey="material_etc" title="Material" category="Material"
            descPlaceholder="Description of items bought"
            projectId={projectId} navigate={navigate} role={role} embedded
          />
        )}
      </div>
    </div>
  );
}

const BLANK = {
  asset_tag: '', description: '', serial_no: '', location: '', vendor: '',
  gr_status: 'not_ordered', amount: '', need_by: '',
  advance_pct: '', milestone_pct: '', retention_pct: '',
};

function AssetList({ projectId, role, session }) {
  const { assets, schedule, totals, reload } = useMaterialAssets(projectId);
  const canEdit = role !== 'Project Director';
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const scheduleByAsset = useMemo(() => {
    const m = {};
    for (const s of schedule) {
      (m[s.asset_id] = m[s.asset_id] || {})[`${s.year}-${s.month}`] = Number(s.amount) || 0;
    }
    return m;
  }, [schedule]);

  async function addAsset() {
    if (!form.description.trim()) { setErr('Description is required'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post('/api/material-assets', {
        project_id: projectId,
        asset_tag: form.asset_tag || null,
        description: form.description,
        serial_no: form.serial_no || null,
        location: form.location || null,
        vendor: form.vendor || null,
        gr_status: form.gr_status,
        amount: Number(form.amount) || 0,
        need_by: form.need_by || null,
        advance_pct: Number(form.advance_pct) || 0,
        milestone_pct: Number(form.milestone_pct) || 0,
        retention_pct: Number(form.retention_pct) || 0,
        created_by: session?.id || null,
      });
      setForm(BLANK);
      reload();
    } catch (e) { setErr(e.message || 'Failed to add'); }
    finally { setBusy(false); }
  }

  async function patchAsset(id, patch) {
    setErr(null);
    try { await api.patch(`/api/material-assets/${id}`, patch); reload(); return true; }
    catch (e) { setErr(e.message || 'Update failed'); return false; }
  }
  async function removeAsset(asset) {
    try { await api.del(`/api/material-assets/${asset.id}`); setDeleteTarget(null); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }
  async function setCell(assetId, month, value) {
    try { await api.put(`/api/material-assets/${assetId}/schedule`, { year, month, amount: Number(value) || 0 }); reload(); }
    catch (e) { setErr(e.message || 'Save failed'); }
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Assets</div>
          <div className="kpi-value num">{totals.asset_count || 0}</div>
          <div className="kpi-sub">live document</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Forecast amount</div>
          <div className="kpi-value num" style={{ color: 'var(--accent)' }}>{fmt(totals.forecast_amount)}</div>
          <div className="kpi-sub">local planning total</div>
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
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add asset</div>
          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.8fr 1fr 1fr 1fr 1fr 0.9fr auto', gap: 8, alignItems: 'end' }}>
            <Field label="Tag"><input className="input" value={form.asset_tag} onChange={e => setForm(f => ({ ...f, asset_tag: e.target.value }))} /></Field>
            <Field label="Description"><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
            <Field label="Serial no"><input className="input" value={form.serial_no} onChange={e => setForm(f => ({ ...f, serial_no: e.target.value }))} /></Field>
            <Field label="Location"><input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></Field>
            <Field label="Vendor"><input className="input" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} /></Field>
            <Field label="GR status">
              <select className="input" value={form.gr_status} onChange={e => setForm(f => ({ ...f, gr_status: e.target.value }))}>
                {Object.entries(GR_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Amount"><input className="input num" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ textAlign: 'right' }} /></Field>
            <button className="btn btn-primary btn-sm" onClick={addAsset} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
            SAP import remains the committed source of truth; asset rows are local forecast planning.
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 24 }} />
                <th>Tag</th>
                <th>Description</th>
                <th>Serial</th>
                <th>Location</th>
                <th>Vendor</th>
                <th>GR</th>
                <th className="num">Amount</th>
                <th>Need by</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && (
                <tr><td colSpan={canEdit ? 10 : 9} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No assets yet</td></tr>
              )}
              {assets.map(a => {
                const gr = GR_STATUS[a.gr_status] || GR_STATUS.not_ordered;
                const open = expanded === a.id;
                return (
                  <React.Fragment key={a.id}>
                    <tr>
                      <td style={{ textAlign: 'center', cursor: 'pointer', color: 'var(--text-3)' }} onClick={() => setExpanded(open ? null : a.id)}>{open ? '▾' : '▸'}</td>
                      <td>{canEdit ? <input className="input" defaultValue={a.asset_tag || ''} onBlur={e => (e.target.value || null) !== a.asset_tag && patchAsset(a.id, { asset_tag: e.target.value || null })} style={{ maxWidth: 90 }} /> : (a.asset_tag || '—')}</td>
                      <td>{canEdit ? <input className="input" defaultValue={a.description} onBlur={e => e.target.value !== a.description && patchAsset(a.id, { description: e.target.value })} style={{ minWidth: 160 }} /> : a.description}</td>
                      <td>{canEdit ? <input className="input" defaultValue={a.serial_no || ''} onBlur={e => (e.target.value || null) !== a.serial_no && patchAsset(a.id, { serial_no: e.target.value || null })} style={{ maxWidth: 110 }} /> : (a.serial_no || '—')}</td>
                      <td>{canEdit ? <input className="input" defaultValue={a.location || ''} onBlur={e => (e.target.value || null) !== a.location && patchAsset(a.id, { location: e.target.value || null })} style={{ maxWidth: 110 }} /> : (a.location || '—')}</td>
                      <td>{canEdit ? <input className="input" defaultValue={a.vendor || ''} onBlur={e => (e.target.value || null) !== a.vendor && patchAsset(a.id, { vendor: e.target.value || null })} style={{ maxWidth: 110 }} /> : (a.vendor || '—')}</td>
                      <td>
                        {canEdit ? (
                          <select className="input" value={a.gr_status} onChange={e => patchAsset(a.id, { gr_status: e.target.value })} style={{ maxWidth: 120 }}>
                            {Object.entries(GR_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        ) : (
                          <span style={{ color: gr.color, fontWeight: 600, fontSize: 12 }}>{gr.label}</span>
                        )}
                      </td>
                      <td className="num">{canEdit ? <input className="input num" type="number" defaultValue={Number(a.amount)} onBlur={e => Number(e.target.value) !== Number(a.amount) && patchAsset(a.id, { amount: Number(e.target.value) || 0 })} style={{ maxWidth: 110, textAlign: 'right' }} /> : fmt(a.amount)}</td>
                      <td>{canEdit ? <DatePicker value={a.need_by ? String(a.need_by).slice(0, 10) : ''} onChange={v => patchAsset(a.id, { need_by: v || null })} placeholder="—" style={{ maxWidth: 150 }} /> : (a.need_by ? String(a.need_by).slice(0, 10) : '—')}</td>
                      {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(a)} title="Delete"><Icon name="x" size={13} /></button></td>}
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={canEdit ? 10 : 9} style={{ background: 'var(--surface-2)', padding: '14px 18px' }}>
                          <AssetDetail
                            asset={a} canEdit={canEdit} patchAsset={patchAsset}
                            year={year} setYear={setYear}
                            cells={scheduleByAsset[a.id] || {}} setCell={setCell}
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
        <MaterialDeleteConfirm
          title="Delete asset?"
          description={deleteTarget.description}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => removeAsset(deleteTarget)}
        />
      )}
    </>
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

// Per-asset detail: vendor payment structure + timeline dollar planning.
function AssetDetail({ asset, canEdit, patchAsset, year, setYear, cells, setCell }) {
  const amount = Number(asset.amount) || 0;
  const adv = Number(asset.advance_pct) || 0;
  const mil = Number(asset.milestone_pct) || 0;
  const ret = Number(asset.retention_pct) || 0;
  const pctTotal = adv + mil + ret;
  const scheduled = Object.entries(cells)
    .filter(([k]) => k.startsWith(`${year}-`))
    .reduce((s, [, v]) => s + Number(v || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Vendor payment structure */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Vendor payment structure</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <PayPct label="Advance %" value={asset.advance_pct} canEdit={canEdit} amount={amount} onSave={v => patchAsset(asset.id, { advance_pct: v })} />
          <PayPct label="Milestone %" value={asset.milestone_pct} canEdit={canEdit} amount={amount} onSave={v => patchAsset(asset.id, { milestone_pct: v })} />
          <PayPct label="Retention %" value={asset.retention_pct} canEdit={canEdit} amount={amount} onSave={v => patchAsset(asset.id, { retention_pct: v })} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)' }}>Allocated</div>
            <div style={{ fontWeight: 700, color: pctTotal > 100 ? 'var(--bad)' : 'var(--text)' }}>{pctTotal.toFixed(1)}%</div>
            {pctTotal > 100 && <div style={{ fontSize: 10, color: 'var(--bad)' }}>exceeds 100%</div>}
          </div>
        </div>
      </div>

      {/* Timeline dollar-planning */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Timeline dollar-planning</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y - 1)}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 13, minWidth: 42, textAlign: 'center' }}>{year}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y + 1)}>›</button>
          </div>
          <div className="grow" />
          <div style={{ fontSize: 11, color: scheduled > amount + 0.5 ? 'var(--bad)' : 'var(--text-3)' }}>
            Planned {fmt(scheduled)} / {fmt(amount)} {scheduled > amount + 0.5 ? '· over amount' : ''}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>{MONTHS.map(m => <th key={m} style={{ fontSize: 10, color: 'var(--text-3)', padding: '2px 4px', fontWeight: 600 }}>{m}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                {MONTHS.map((m, i) => {
                  const month = i + 1;
                  const val = cells[`${year}-${month}`] || 0;
                  return (
                    <td key={m} style={{ padding: 2 }}>
                      {canEdit ? (
                        <input className="input num" type="number" defaultValue={val || ''} placeholder="0"
                          key={`${asset.id}-${year}-${month}-${val}`}
                          onBlur={e => Number(e.target.value || 0) !== Number(val) && setCell(asset.id, month, e.target.value)}
                          style={{ width: 64, textAlign: 'right', padding: '4px 6px', fontSize: 12 }} />
                      ) : (
                        <div style={{ width: 64, textAlign: 'right', fontSize: 12, color: val ? 'var(--text)' : 'var(--text-3)' }}>{val ? fmt(val) : '—'}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PayPct({ label, value, canEdit, amount, onSave }) {
  const pct = Number(value) || 0;
  const dollars = amount * pct / 100;
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)' }}>{label}</div>
      {canEdit ? (
        <input className="input num" type="number" step="0.1" defaultValue={pct}
          onBlur={e => Number(e.target.value) !== pct && onSave(Number(e.target.value) || 0)}
          style={{ width: 80, textAlign: 'right' }} />
      ) : (
        <div style={{ fontWeight: 700 }}>{pct.toFixed(1)}%</div>
      )}
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{fmt(dollars)}</div>
    </div>
  );
}

const MISC_BLANK = { rate_code: '', description: '', unit: 'each', qty: '1', unit_rate: '' };

// Misc materials: per-project sub-threshold lines, optionally priced from the
// Finance-owned fixed-rate catalog. Small items lumped here instead of the
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
              Smaller items are lumped here and can be priced from the Finance-owned fixed-rate catalog.
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
              <select className="input" value={form.rate_code} onChange={e => pickRate(e.target.value)}>
                <option value="">— free line —</option>
                {rates.filter(r => r.code).map(r => <option key={r.id} value={r.code}>{r.label}</option>)}
              </select>
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
        <MaterialDeleteConfirm
          title="Delete material line?"
          description={deleteTarget.description}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => removeLine(deleteTarget)}
        />
      )}
    </>
  );
}

function MaterialDeleteConfirm({ title, description, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="material-delete-title" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 id="material-delete-title" style={{ margin: 0 }}>{title}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>This action cannot be undone.</div>
          </div>
          <button className="btn btn-icon" onClick={onCancel} aria-label="Close"><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)', padding: 14, fontSize: 13, fontWeight: 750 }}>
            {description || 'Untitled item'}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
