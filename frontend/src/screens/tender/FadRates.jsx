import React, { useState } from 'react';
import { useTenderFx } from '../../data/store.js';
import { api } from '../../data/api.js';
import Icon from '../../components/Icon.jsx';

// FAD / FX rates — foreign currency conversion rates to Singapore Dollars.
// rate_to_sgd = value in S$ of 1 unit of the foreign currency. SGD itself = 1.
// FAD is settled (locked) by Finance; once settled, rates are read-only until
// Finance unsettles.
export default function FadRates({ tenderId, canEdit, tender, isFinance, onSettle }) {
  const { rows, reload } = useTenderFx(tenderId);
  const [err, setErr] = useState(null);
  const [adding, setAdding] = useState({ currency: '', rate_to_sgd: '' });
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const settled = !!tender?.fad_settled_at;
  const editable = canEdit && !settled;

  async function patchRate(id, value) {
    const rate = Number(value);
    if (!Number.isFinite(rate) || rate < 0) { setErr('Enter a valid non-negative rate'); return; }
    try { await api.patch(`/api/tender/fx/${id}`, { rate_to_sgd: rate }); reload(); setErr(null); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }

  async function addCurrency() {
    const cur = adding.currency.trim().toUpperCase();
    if (!cur) { setErr('Currency code is required'); return; }
    try {
      await api.post(`/api/tender/${tenderId}/fx`, { currency: cur, rate_to_sgd: Number(adding.rate_to_sgd) || 0 });
      setAdding({ currency: '', rate_to_sgd: '' });
      reload(); setErr(null);
    } catch (e) { setErr(e.message || 'Add failed'); }
  }

  async function removeCurrency(id) {
    try { await api.del(`/api/tender/fx/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  async function runImport() {
    // Accept lines like "USD 1.35", "GBP=1.71", "EUR,1.46"
    const rates = {};
    for (const line of importText.split(/\r?\n/)) {
      const m = line.trim().match(/^([A-Za-z]{2,4})\s*[=,\s]\s*([0-9.]+)/);
      if (m) rates[m[1].toUpperCase()] = Number(m[2]);
    }
    if (!Object.keys(rates).length) { setErr('No valid "CUR rate" lines found'); return; }
    try {
      await api.post(`/api/tender/${tenderId}/fx/import`, { rates });
      setShowImport(false); setImportText(''); reload(); setErr(null);
    } catch (e) { setErr(e.message || 'Import failed'); }
  }

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

      <div className="card">
        <div className="card-p" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>FAD exchange rates</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Value in S$ of 1 unit of each currency. SGD is the base (1.0000).</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {settled && (
              <span className="badge badge-ok" style={{ fontSize: 10 }}>
                Settled by Finance{tender?.fad_settled_at ? ` · ${String(tender.fad_settled_at).slice(0, 10)}` : ''}
              </span>
            )}
            {isFinance && (
              <button className="btn btn-sm btn-primary" onClick={() => onSettle && onSettle(!settled)}>
                {settled ? 'Unsettle FAD' : 'Settle FAD'}
              </button>
            )}
            {editable && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(s => !s)}>
                {showImport ? 'Close import' : 'Import rates'}
              </button>
            )}
          </div>
        </div>

        {settled && !isFinance && (
          <div className="card-p" style={{ paddingTop: 0, fontSize: 11, color: 'var(--text-3)' }}>
            Rates are locked because Finance has settled the FAD. Ask Finance to unsettle before editing.
          </div>
        )}

        {showImport && editable && (
          <div className="card-p" style={{ paddingTop: 0 }}>
            <textarea
              className="input"
              rows={5}
              placeholder={'Paste rates, one per line:\nUSD 1.35\nGBP 1.71\nEUR 1.46'}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={runImport}>Apply import</button>
              <span style={{ fontSize: 11, color: 'var(--text-3)', alignSelf: 'center' }}>Existing currencies are updated; new ones are added.</span>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Currency</th>
                <th className="num">Rate to S$</th>
                <th>Last updated</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>SGD <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(base)</span></td>
                <td className="num" style={{ fontWeight: 600 }}>1.0000</td>
                <td style={{ color: 'var(--text-3)' }}>—</td>
                {editable && <td />}
              </tr>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.currency}</td>
                  <td className="num">
                    {editable ? (
                      <input className="input num" type="number" step="0.0001" defaultValue={Number(r.rate_to_sgd)}
                        onBlur={e => Number(e.target.value) !== Number(r.rate_to_sgd) && patchRate(r.id, e.target.value)}
                        style={{ maxWidth: 120, textAlign: 'right' }} />
                    ) : Number(r.rate_to_sgd).toFixed(4)}
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{r.updated_at ? String(r.updated_at).slice(0, 10) : '—'}</td>
                  {editable && (
                    <td><button className="btn btn-ghost btn-sm" onClick={() => removeCurrency(r.id)} title="Delete"><Icon name="x" size={13} /></button></td>
                  )}
                </tr>
              ))}
              {editable && (
                <tr>
                  <td>
                    <input className="input" placeholder="e.g. JPY" value={adding.currency}
                      onChange={e => setAdding(a => ({ ...a, currency: e.target.value }))} style={{ maxWidth: 100, textTransform: 'uppercase' }} />
                  </td>
                  <td className="num">
                    <input className="input num" type="number" step="0.0001" placeholder="0.0000" value={adding.rate_to_sgd}
                      onChange={e => setAdding(a => ({ ...a, rate_to_sgd: e.target.value }))} style={{ maxWidth: 120, textAlign: 'right' }} />
                  </td>
                  <td />
                  <td><button className="btn btn-primary btn-sm" onClick={addCurrency}>Add</button></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
