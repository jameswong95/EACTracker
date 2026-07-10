import React, { useState, useMemo } from 'react';
import { useTenderPrelim, useTenderFx, fmt } from '../../data/store.js';
import { api } from '../../data/api.js';
import Select from '../../components/Select.jsx';
import Icon from '../../components/Icon.jsx';

// Preliminaries — miscellaneous project set-up costs. Each line is entered in a
// chosen currency and converted to a Singapore Dollar equivalent using FAD rates.
// Total (S$) = cost * qty * (1 + esc%/100) * FAD rate.
export default function Prelim({ tenderId, canEdit }) {
  const { rows, reload } = useTenderPrelim(tenderId);
  const { rows: fx } = useTenderFx(tenderId);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({ sn: '', description: '', currency: 'SGD', cost: '', esc_pct: '', qty: '1' });

  const rateOf = useMemo(() => {
    const m = { SGD: 1 };
    for (const r of fx) m[r.currency] = Number(r.rate_to_sgd) || 0;
    return m;
  }, [fx]);

  const currencyOpts = useMemo(
    () => [{ value: 'SGD', label: 'SGD' }, ...fx.map(r => ({ value: r.currency, label: r.currency }))],
    [fx]
  );

  const totalSgd = (it) => {
    const rate = rateOf[it.currency] != null ? rateOf[it.currency] : 1;
    return Number(it.cost || 0) * Number(it.qty || 0) * (1 + Number(it.esc_pct || 0) / 100) * rate;
  };

  const grandTotal = rows.reduce((s, it) => s + totalSgd(it), 0);

  function report(fn) { return async (...a) => { try { await fn(...a); reload(); setErr(null); } catch (e) { setErr(e.message || 'Action failed'); } }; }

  const addItem = report(async () => {
    if (!form.description.trim()) { setErr('Description is required'); return; }
    await api.post(`/api/tender/${tenderId}/prelim`, {
      sn: form.sn || null, description: form.description.trim(), currency: form.currency,
      cost: Number(form.cost) || 0, esc_pct: Number(form.esc_pct) || 0, qty: Number(form.qty) || 1,
    });
    setForm({ sn: '', description: '', currency: 'SGD', cost: '', esc_pct: '', qty: '1' });
  });
  const patchItem = report((id, patch) => api.patch(`/api/tender/prelim/${id}`, patch));
  const removeItem = report((id) => api.del(`/api/tender/prelim/${id}`));

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

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 16 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Preliminary items</div>
          <div className="kpi-value num">{rows.length}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Total equivalent (S$)</div>
          <div className="kpi-value num" style={{ color: 'var(--accent, var(--ok))' }}>{fmt(grandTotal)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-p" style={{ paddingBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Preliminaries</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Total (S$) = Cost × Qty × (1 + Esc%) × FAD rate.</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 70 }}>S/N</th>
                <th>Description</th>
                <th>Curr.</th>
                <th className="num">Cost</th>
                <th className="num">Esc %</th>
                <th className="num">Qty</th>
                <th className="num">Total (S$)</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 18 }}>No preliminary items yet.</td></tr>
              )}
              {rows.map(it => (
                <tr key={it.id}>
                  <td>
                    {canEdit ? (
                      <input className="input" defaultValue={it.sn || ''}
                        onBlur={e => (e.target.value || null) !== it.sn && patchItem(it.id, { sn: e.target.value || null })} style={{ maxWidth: 64 }} />
                    ) : (it.sn || '—')}
                  </td>
                  <td>
                    {canEdit ? (
                      <input className="input" defaultValue={it.description}
                        onBlur={e => e.target.value.trim() && e.target.value !== it.description && patchItem(it.id, { description: e.target.value.trim() })} />
                    ) : it.description}
                  </td>
                  <td>
                    {canEdit ? (
                      <Select ghost style={{ minWidth: 80 }} value={it.currency} options={currencyOpts}
                        onChange={v => patchItem(it.id, { currency: v })} />
                    ) : it.currency}
                  </td>
                  <td className="num">
                    {canEdit ? (
                      <input className="input num" type="number" defaultValue={Number(it.cost)}
                        onBlur={e => Number(e.target.value) !== Number(it.cost) && patchItem(it.id, { cost: Number(e.target.value) || 0 })} style={{ maxWidth: 110, textAlign: 'right' }} />
                    ) : fmt(it.cost)}
                  </td>
                  <td className="num">
                    {canEdit ? (
                      <input className="input num" type="number" defaultValue={Number(it.esc_pct)}
                        onBlur={e => Number(e.target.value) !== Number(it.esc_pct) && patchItem(it.id, { esc_pct: Number(e.target.value) || 0 })} style={{ maxWidth: 70, textAlign: 'right' }} />
                    ) : `${Number(it.esc_pct)}%`}
                  </td>
                  <td className="num">
                    {canEdit ? (
                      <input className="input num" type="number" defaultValue={Number(it.qty)}
                        onBlur={e => Number(e.target.value) !== Number(it.qty) && patchItem(it.id, { qty: Number(e.target.value) || 0 })} style={{ maxWidth: 70, textAlign: 'right' }} />
                    ) : it.qty}
                  </td>
                  <td className="num" style={{ fontWeight: 600 }}>{fmt(totalSgd(it))}</td>
                  {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => removeItem(it.id)} title="Delete"><Icon name="x" size={13} /></button></td>}
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td colSpan={6} style={{ fontWeight: 700, textAlign: 'right' }}>Total equivalent (S$)</td>
                  <td className="num" style={{ fontWeight: 700 }}>{fmt(grandTotal)}</td>
                  {canEdit && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {canEdit && (
          <div className="card-p" style={{ borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Add preliminary item</div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 2.2fr 90px 1fr 0.8fr 0.7fr auto', gap: 8, alignItems: 'end' }}>
              <label className="field"><span className="field-label">S/N</span>
                <input className="input" value={form.sn} onChange={e => setForm(f => ({ ...f, sn: e.target.value }))} /></label>
              <label className="field"><span className="field-label">Description</span>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
              <label className="field"><span className="field-label">Currency</span>
                <Select value={form.currency} options={currencyOpts} onChange={v => setForm(f => ({ ...f, currency: v }))} /></label>
              <label className="field"><span className="field-label">Cost</span>
                <input className="input num" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} style={{ textAlign: 'right' }} /></label>
              <label className="field"><span className="field-label">Esc %</span>
                <input className="input num" type="number" value={form.esc_pct} onChange={e => setForm(f => ({ ...f, esc_pct: e.target.value }))} style={{ textAlign: 'right' }} /></label>
              <label className="field"><span className="field-label">Qty</span>
                <input className="input num" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} style={{ textAlign: 'right' }} /></label>
              <button className="btn btn-primary btn-sm" onClick={addItem}>Add</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
