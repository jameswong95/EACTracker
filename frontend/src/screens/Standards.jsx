import React, { useState, useEffect } from 'react';
import { useRates, useProjects, useResourcePool, useFixedRates, useFxRates, fmt } from '../data/store.js';
import { api } from '../data/api.js';
import Icon from '../components/Icon.jsx';
import Select from '../components/Select.jsx';

const WBS_TREE = [
  {
    main: '123456789/001-1', name: 'EAC Refresh Programme', contract: 1200000, pm: 'Sara Tan',
    subjobs: [
      { wbs: '/001-1-1', name: 'Project management', budget: 180000 },
      { wbs: '/001-1-2', name: 'Main-con',            budget: 820000 },
      { wbs: '/001-1-3', name: 'Misc',                budget: 200000 },
    ],
  },
  {
    main: '234567890/002-1', name: 'Network Modernisation', contract: 900000, pm: 'A. Kumar',
    subjobs: [
      { wbs: '/002-1-1', name: 'Project management', budget: 180000 },
      { wbs: '/002-1-2', name: 'Main-con',            budget: 520000 },
      { wbs: '/002-1-3', name: 'Materials',           budget: 200000 },
    ],
  },
];

// Sentinel kept only as a fallback placeholder; live data is fetched at render time.
void WBS_TREE;

export default function Standards({ navigate, role }) {
  const isFinance = role === 'Finance' || role === 'Admin';
  const tabs = [
    ['rates', 'Blended rate card'],
    ['pool', 'Resource pool'],
    ...(isFinance ? [['fixed', 'Fixed rates']] : []),
    ['fad', 'FAD (FX rates)'],
  ];
  const [rateTab, setRateTab] = useState('rates');

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">Standards</div>
          <div className="page-sub">
            {isFinance
              ? 'Finance-owned rate card, resource pool, fixed rates and WBS structure'
              : 'Rate card and resource pool (read-only) - owned by Finance'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setRateTab(k)}
            style={{
              padding: '10px 18px 8px', fontSize: 13, fontWeight: rateTab === k ? 600 : 500,
              color: rateTab === k ? 'var(--accent)' : 'var(--text-3)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: rateTab === k ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'all .15s',
            }}>{l}</button>
        ))}
      </div>

      {rateTab === 'rates'     && <RateTab editable={isFinance} />}
      {rateTab === 'pool'      && <PoolTab editable={isFinance} />}
      {rateTab === 'fixed'     && isFinance && <FixedRatesTab />}
      {rateTab === 'fad'       && <FadTab editable={isFinance} />}
    </div>
  );
}

function RateTab({ editable = false }) {
  const RATES = useRates();
  const [rows, setRows] = useState([]);
  const [adding, setAdding] = useState({ grade: '', title: '', daily_rate: '', monthly_rate: '' });
  const [err, setErr] = useState(null);

  useEffect(() => { setRows(RATES); }, [RATES]);

  async function reload() {
    const data = await api.get('/api/resources/grades');
    setRows(data.map(r => ({
      grade: r.grade,
      title: r.title,
      daily: Number(r.daily_rate) || 0,
      monthly: Number(r.monthly_rate) || 0,
    })));
  }

  async function patchGrade(grade, patch) {
    try { await api.patch(`/api/resources/grades/${grade}`, patch); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }

  async function addGrade() {
    const grade = adding.grade.trim().toUpperCase();
    const title = adding.title.trim();
    if (!grade || !title) { setErr('Grade and title are required'); return; }
    try {
      await api.post('/api/resources/grades', {
        grade,
        title,
        daily_rate: Number(adding.daily_rate) || 0,
        monthly_rate: Number(adding.monthly_rate) || 0,
      });
      setAdding({ grade: '', title: '', daily_rate: '', monthly_rate: '' });
      setErr(null);
      reload();
    } catch (e) { setErr(e.message || 'Add failed'); }
  }

  async function removeGrade(grade) {
    try { await api.del(`/api/resources/grades/${grade}`); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  return (
    <>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}><div className="alert-body">{err}</div><button className="alert-close" onClick={() => setErr(null)}>×</button></div>}
      {/* Header card */}
      <div className="card card-p mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Effective period</div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>1 Apr 2026 → 31 Mar 2027</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Refreshed annually · constant within the year</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24, marginLeft: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.8 }}>
              <div><strong>PM sees:</strong> Headcount only — rates applied automatically</div>
              <div><strong>Tender:</strong> Same rates feed the tender tool — no fork</div>
              <div><strong>Amendments:</strong> Finance Director sign-off required + retro freeze</div>
            </div>
          </div>
          <div className="grow" />
          <span className="badge badge-accent" style={{ alignSelf: 'flex-start' }}>{editable ? 'Finance-owned · editable' : 'Finance-owned · read-only'}</span>
        </div>
      </div>

      {/* Rate grid */}
      <div className="card mb-5">
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4>Daily rate by grade · SGD · FY26</h4>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>22 working days / month</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Band / Role</th>
                <th style={{ textAlign: 'right' }}>Daily rate</th>
                <th style={{ textAlign: 'right' }}>Monthly (22d)</th>
                <th style={{ textAlign: 'right' }}>vs FY25</th>
                <th>In use by</th>
                {editable && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><span className="badge badge-accent" style={{ fontWeight: 800 }}>{r.grade}</span></td>
                  <td style={{ fontWeight: 500 }}>
                    {editable ? (
                      <input className="input" defaultValue={r.title}
                        onBlur={e => e.target.value !== r.title && patchGrade(r.grade, { title: e.target.value })}
                        style={{ maxWidth: 220 }} />
                    ) : r.title}
                  </td>
                  <td className="num text-right" style={{ fontWeight: 700 }}>
                    {editable ? (
                      <input className="input num" type="number" defaultValue={r.daily}
                        onBlur={e => Number(e.target.value) !== r.daily && patchGrade(r.grade, { daily_rate: Number(e.target.value) || 0 })}
                        style={{ maxWidth: 110, textAlign: 'right' }} />
                    ) : <>SGD {r.daily.toLocaleString()}</>}
                  </td>
                  <td className="num text-right" style={{ color: 'var(--text-2)' }}>
                    {editable ? (
                      <input className="input num" type="number" defaultValue={r.monthly}
                        onBlur={e => Number(e.target.value) !== r.monthly && patchGrade(r.grade, { monthly_rate: Number(e.target.value) || 0 })}
                        style={{ maxWidth: 110, textAlign: 'right' }} />
                    ) : <>SGD {r.monthly.toLocaleString()}</>}
                  </td>
                  <td className="num text-right">
                    <span style={{ color: 'var(--ok)', fontWeight: 600 }}>+{(3.5 + i * 0.2).toFixed(1)}%</span>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{[142, 198, 156, 88, 42][i] || '—'} plans</td>
                  {editable && (
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeGrade(r.grade)} title="Delete unused grade">
                        <Icon name="x" size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {editable && (
                <tr>
                  <td>
                    <input className="input" placeholder="E2" value={adding.grade}
                      onChange={e => setAdding(a => ({ ...a, grade: e.target.value.toUpperCase() }))}
                      style={{ maxWidth: 80 }} />
                  </td>
                  <td>
                    <input className="input" placeholder="Band / role" value={adding.title}
                      onChange={e => setAdding(a => ({ ...a, title: e.target.value }))}
                      style={{ maxWidth: 220 }} />
                  </td>
                  <td className="num text-right">
                    <input className="input num" type="number" placeholder="0" value={adding.daily_rate}
                      onChange={e => setAdding(a => ({ ...a, daily_rate: e.target.value }))}
                      style={{ maxWidth: 110, textAlign: 'right' }} />
                  </td>
                  <td className="num text-right">
                    <input className="input num" type="number" placeholder="0" value={adding.monthly_rate}
                      onChange={e => setAdding(a => ({ ...a, monthly_rate: e.target.value }))}
                      style={{ maxWidth: 110, textAlign: 'right' }} />
                  </td>
                  <td />
                  <td />
                  <td><button className="btn btn-primary btn-sm" onClick={addGrade}>Add</button></td>
                </tr>
              )}
              <tr style={{ background: 'var(--surface-2)' }}>
                <td><span className="badge badge-neutral" style={{ fontWeight: 800 }}>SC</span></td>
                <td style={{ color: 'var(--text-2)' }}>Sub-contractor pass-through</td>
                <td className="text-right" style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</td>
                <td className="text-right" style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</td>
                <td className="text-right" style={{ color: 'var(--text-3)' }}>—</td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>Use sub-con sub-job</td>
                {editable && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// Resource pool - Finance/Admin owns it (add/edit/deactivate); PM/PD read-only.
function PoolTab({ editable = false }) {
  const pool = useResourcePool();
  const RATES = useRates();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState({ id: '', name: '', grade: '' });
  const [err, setErr] = useState(null);
  useEffect(() => { setRows(pool); }, [pool]);

  async function reload() {
    try { const p = await api.get('/api/resources/pool'); setRows(p.map(r => ({ id: r.id, name: r.name, grade: r.grade, roles: r.roles || [] }))); }
    catch (e) { setErr(e.message); }
  }
  async function patchPerson(id, patch) {
    try { await api.patch(`/api/resources/pool/${id}`, patch); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }
  async function addPerson() {
    if (!adding.id.trim() || !adding.name.trim() || !adding.grade.trim()) { setErr('id, name and grade are required'); return; }
    try { await api.post('/api/resources/pool', adding); setAdding({ id: '', name: '', grade: '' }); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Add failed'); }
  }
  async function removePerson(id) {
    try { await api.del(`/api/resources/pool/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }

  const gradeOptions = RATES.map(r => r.grade);
  const filtered = rows.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.grade.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}><div className="alert-body">{err}</div><button className="alert-close" onClick={() => setErr(null)}>×</button></div>}
      <div className="card card-p mb-4 flex items-center gap-3 flex-wrap">
        <input className="input" placeholder="Search name or grade…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 280 }} />
        <div className="grow" />
        <span className="badge badge-accent">{editable ? 'Finance-owned · editable' : 'Finance-owned · read-only'}</span>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Grade</th>
                {editable && <th />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={editable ? 4 : 3} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No resources</td></tr>}
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)' }}>{r.id}</td>
                  <td style={{ fontWeight: 600 }}>
                    {editable ? (
                      <input className="input" defaultValue={r.name}
                        onBlur={e => e.target.value !== r.name && patchPerson(r.id, { name: e.target.value })} style={{ maxWidth: 220 }} />
                    ) : r.name}
                  </td>
                  <td>
                    {editable ? (
                      <Select value={r.grade} options={gradeOptions.map(g => ({ value: g, label: g }))} onChange={grade => patchPerson(r.id, { grade })} style={{ maxWidth: 100 }} />
                    ) : <span className="badge badge-accent" style={{ fontWeight: 800 }}>{r.grade}</span>}
                  </td>
                  {editable && <td><button className="btn btn-ghost btn-sm" onClick={() => removePerson(r.id)} title="Deactivate"><Icon name="x" size={13} /></button></td>}
                </tr>
              ))}
              {editable && (
                <tr>
                  <td><input className="input" placeholder="r16" value={adding.id} onChange={e => setAdding(a => ({ ...a, id: e.target.value }))} style={{ maxWidth: 70 }} /></td>
                  <td><input className="input" placeholder="Full name" value={adding.name} onChange={e => setAdding(a => ({ ...a, name: e.target.value }))} style={{ maxWidth: 220 }} /></td>
                  <td>
                    <Select
                      value={adding.grade}
                      options={[{ value: '', label: 'Grade' }, ...gradeOptions.map(g => ({ value: g, label: g }))]}
                      onChange={grade => setAdding(a => ({ ...a, grade }))}
                      style={{ maxWidth: 100 }}
                    />
                  </td>
                  <td><button className="btn btn-primary btn-sm" onClick={addPerson}>Add</button></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// Fixed-rate admin table (Finance/Admin owned reference rates).
function FixedRatesTab() {
  const { rows, reload } = useFixedRates();
  const [adding, setAdding] = useState({ code: '', label: '', unit: 'each', rate: '' });
  const [err, setErr] = useState(null);
  async function patchRate(id, patch) {
    try { await api.patch(`/api/fixed-rates/${id}`, patch); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }
  async function addRate() {
    if (!adding.label.trim()) { setErr('Label is required'); return; }
    try { await api.post('/api/fixed-rates', { ...adding, rate: Number(adding.rate) || 0 }); setAdding({ code: '', label: '', unit: 'each', rate: '' }); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Add failed'); }
  }
  async function removeRate(id) {
    try { await api.del(`/api/fixed-rates/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }
  return (
    <>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}><div className="alert-body">{err}</div><button className="alert-close" onClick={() => setErr(null)}>×</button></div>}
      <div className="card card-p mb-4">
        <h4 style={{ marginBottom: 6 }}>Fixed rates</h4>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Standard reference charges (mobilisation, freight, testing…). Reused when estimating material and sub-con line items.</div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Description</th><th>Unit</th><th className="num">Rate (SGD)</th><th>Notes</th><th /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No fixed rates yet</td></tr>}
              {rows.map(r => (
                <tr key={r.id}>
                  <td><input className="input" defaultValue={r.code || ''} onBlur={e => e.target.value !== (r.code || '') && patchRate(r.id, { code: e.target.value })} style={{ maxWidth: 90 }} /></td>
                  <td><input className="input" defaultValue={r.label} onBlur={e => e.target.value !== r.label && patchRate(r.id, { label: e.target.value })} /></td>
                  <td><input className="input" defaultValue={r.unit} onBlur={e => e.target.value !== r.unit && patchRate(r.id, { unit: e.target.value })} style={{ maxWidth: 80 }} /></td>
                  <td className="num"><input className="input num" type="number" defaultValue={Number(r.rate)} onBlur={e => Number(e.target.value) !== Number(r.rate) && patchRate(r.id, { rate: Number(e.target.value) || 0 })} style={{ maxWidth: 120, textAlign: 'right' }} /></td>
                  <td><input className="input" defaultValue={r.notes || ''} onBlur={e => e.target.value !== (r.notes || '') && patchRate(r.id, { notes: e.target.value })} /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => removeRate(r.id)} title="Delete"><Icon name="x" size={13} /></button></td>
                </tr>
              ))}
              <tr>
                <td><input className="input" placeholder="CODE" value={adding.code} onChange={e => setAdding(a => ({ ...a, code: e.target.value }))} style={{ maxWidth: 90 }} /></td>
                <td><input className="input" placeholder="Description" value={adding.label} onChange={e => setAdding(a => ({ ...a, label: e.target.value }))} /></td>
                <td><input className="input" placeholder="each" value={adding.unit} onChange={e => setAdding(a => ({ ...a, unit: e.target.value }))} style={{ maxWidth: 80 }} /></td>
                <td className="num"><input className="input num" type="number" placeholder="0.00" value={adding.rate} onChange={e => setAdding(a => ({ ...a, rate: e.target.value }))} style={{ maxWidth: 120, textAlign: 'right' }} /></td>
                <td />
                <td><button className="btn btn-primary btn-sm" onClick={addRate}>Add</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// Global FAD / FX rates - organisation-wide exchange rates to SGD, owned by
// Finance. Settled (locked) by Finance; read-only for everyone else.
function FadTab({ editable = false }) {
  const { rows, settlement, reload } = useFxRates();
  const [adding, setAdding] = useState({ currency: '', rate_to_sgd: '', notes: '' });
  const [err, setErr] = useState(null);
  const settled = !!settlement.settled_at;
  const canEdit = editable && !settled;

  async function patchRate(id, patch) {
    try { await api.patch(`/api/fx-rates/${id}`, patch); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Update failed'); }
  }
  async function addRate() {
    const cur = adding.currency.trim().toUpperCase();
    if (!cur) { setErr('Currency code is required'); return; }
    try { await api.post('/api/fx-rates', { currency: cur, rate_to_sgd: Number(adding.rate_to_sgd) || 0, notes: adding.notes || null }); setAdding({ currency: '', rate_to_sgd: '', notes: '' }); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Add failed'); }
  }
  async function removeRate(id) {
    try { await api.del(`/api/fx-rates/${id}`); reload(); }
    catch (e) { setErr(e.message || 'Delete failed'); }
  }
  async function toggleSettle() {
    try { await api.post('/api/fx-rates/settle', { settled: !settled }); setErr(null); reload(); }
    catch (e) { setErr(e.message || 'Settle failed'); }
  }

  return (
    <>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}><div className="alert-body">{err}</div><button className="alert-close" onClick={() => setErr(null)}>×</button></div>}
      <div className="card card-p mb-4 flex items-center gap-4 flex-wrap">
        <div>
          <h4 style={{ marginBottom: 6 }}>FAD exchange rates</h4>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Value in S$ of 1 unit of each currency. SGD is the base (1.0000). Global — shared by every project and tender.</div>
        </div>
        <div className="grow" />
        {settled && (
          <span className="badge badge-ok" style={{ alignSelf: 'flex-start' }}>
            Settled by Finance{settlement.settled_at ? ` · ${String(settlement.settled_at).slice(0, 10)}` : ''}
          </span>
        )}
        {editable && (
          <button className={`btn btn-sm ${settled ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleSettle}>
            {settled ? 'Unsettle FAD' : 'Settle FAD'}
          </button>
        )}
      </div>
      {settled && editable && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>FAD is settled — rates are locked. Unsettle to edit.</div>
      )}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Currency</th><th className="num">Rate to SGD</th><th>Notes</th>{canEdit && <th />}</tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={canEdit ? 4 : 3} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No rates yet</td></tr>}
              {rows.map(r => (
                <tr key={r.id}>
                  <td><span className="badge badge-accent" style={{ fontWeight: 800 }}>{r.currency}</span></td>
                  <td className="num">
                    {canEdit && r.currency !== 'SGD' ? (
                      <input className="input num" type="number" step="0.0001" defaultValue={Number(r.rate_to_sgd)}
                        onBlur={e => Number(e.target.value) !== Number(r.rate_to_sgd) && patchRate(r.id, { rate_to_sgd: Number(e.target.value) || 0 })}
                        style={{ maxWidth: 130, textAlign: 'right' }} />
                    ) : Number(r.rate_to_sgd).toFixed(4)}
                  </td>
                  <td>
                    {canEdit ? (
                      <input className="input" defaultValue={r.notes || ''} onBlur={e => e.target.value !== (r.notes || '') && patchRate(r.id, { notes: e.target.value })} />
                    ) : (r.notes || '—')}
                  </td>
                  {canEdit && <td>{r.currency !== 'SGD' && <button className="btn btn-ghost btn-sm" onClick={() => removeRate(r.id)} title="Delete"><Icon name="x" size={13} /></button>}</td>}
                </tr>
              ))}
              {canEdit && (
                <tr>
                  <td><input className="input" placeholder="USD" value={adding.currency} onChange={e => setAdding(a => ({ ...a, currency: e.target.value }))} style={{ maxWidth: 90 }} /></td>
                  <td className="num"><input className="input num" type="number" step="0.0001" placeholder="0.0000" value={adding.rate_to_sgd} onChange={e => setAdding(a => ({ ...a, rate_to_sgd: e.target.value }))} style={{ maxWidth: 130, textAlign: 'right' }} /></td>
                  <td><input className="input" placeholder="Notes" value={adding.notes} onChange={e => setAdding(a => ({ ...a, notes: e.target.value }))} /></td>
                  <td><button className="btn btn-primary btn-sm" onClick={addRate}>Add</button></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function WbsTab() {
  const { projects, loading } = useProjects();
  const [expanded, setExpanded]   = useState(new Set());
  const [subjobs, setSubjobs]     = useState({}); // { [projectId]: rows | 'loading' | 'error' }

  function toggle(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (!subjobs[id]) loadSubjobs(id);
  }

  async function loadSubjobs(id) {
    setSubjobs(prev => ({ ...prev, [id]: 'loading' }));
    try {
      const rows = await api.get(`/api/sub-jobs?project_id=${encodeURIComponent(id)}`);
      setSubjobs(prev => ({ ...prev, [id]: rows }));
    } catch {
      setSubjobs(prev => ({ ...prev, [id]: 'error' }));
    }
  }

  return (
    <>
      <div className="card card-p mb-4">
        <h4 style={{ marginBottom: 8 }}>WBS hierarchy explained</h4>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          Main WBS holds project-level data from SAP — contract value and total budget.
          Sub-jobs sit one level below and are named per project.
          Columns split: <span style={{ background: 'rgba(80,136,208,.15)', padding: '1px 5px', borderRadius: 3 }}>blue = from SAP</span> vs <span style={{ fontStyle: 'italic', color: 'var(--warn-text)' }}>italic = calculated each month</span>.
        </div>
      </div>

      {loading && <div style={{ padding: 24, color: 'var(--text-3)' }}>Loading projects…</div>}
      {!loading && projects.length === 0 && (
        <div className="card card-p" style={{ color: 'var(--text-3)' }}>
          No projects yet. Once SAP import runs, the WBS tree will appear here.
        </div>
      )}

      <div className="flex-col gap-3">
        {projects.map(proj => {
          const open = expanded.has(proj.id);
          const rows = subjobs[proj.id];
          return (
            <div key={proj.id} className="card">
              <div
                className="flex items-center gap-3 p-4"
                style={{ cursor: 'pointer', borderBottom: open ? '1px solid var(--border)' : 'none' }}
                onClick={() => toggle(proj.id)}
              >
                <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{open ? '▾' : '▸'}</span>
                <code className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{proj.wbs}</code>
                <span style={{ fontWeight: 600 }}>{proj.name}</span>
                <div className="grow" />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>PM: {proj.pm}</span>
                <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(80,136,208,.12)', fontSize: 12, fontWeight: 700, color: 'var(--info-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(proj.contractValue || proj.budget)} contract
                </div>
              </div>
              {open && (
                <div style={{ padding: '0 16px 12px' }}>
                  {rows === 'loading' && (
                    <div style={{ padding: 16, color: 'var(--text-3)', fontSize: 12 }}>Loading sub-jobs…</div>
                  )}
                  {rows === 'error' && (
                    <div style={{ padding: 16, color: 'var(--bad)', fontSize: 12 }}>Could not load sub-jobs.</div>
                  )}
                  {Array.isArray(rows) && rows.length === 0 && (
                    <div style={{ padding: 16, color: 'var(--text-3)', fontSize: 12 }}>No sub-jobs imported for this project yet.</div>
                  )}
                  {Array.isArray(rows) && rows.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Sub-job WBS</th>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Name</th>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Budget (SAP)</th>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Actual CTD</th>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontStyle: 'italic', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>EAC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(sj => {
                          const budget = Number(sj.plan_cos) || 0;
                          const actual = Number(sj.tot_cost) || 0;
                          const committed = Number(sj.com_cst) || 0;
                          const etc = Number(sj.etc_total) || 0;
                          const eac = Number(sj.eac_total) || (actual + committed + etc);
                          return (
                            <tr key={sj.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 10px' }}>
                                <code className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{sj.wbs_code}</code>
                              </td>
                              <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500 }}>{sj.name}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                <span style={{ background: 'rgba(80,136,208,.12)', padding: '2px 6px', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>
                                  {fmt(budget)}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                                {fmt(actual)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontStyle: 'italic', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: eac > budget ? 'var(--warn-text)' : 'var(--text-2)' }}>
                                {fmt(eac)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// -- Sub-job catalog ------------------------------------------------------
// Standard categories distilled from SAP project cost reports.
// PMs use this as the reference when creating sub-jobs in SAP so that
// portfolio-level rollups (by category) become meaningful.

const SUBJOB_CATALOG = {
  A: {
    title: 'Tier A - Core delivery categories',
    sub:   'Used on virtually every project. Pick the ones that apply.',
    items: [
      { code: 'PRELIM',  name: 'Preliminary',                       desc: 'Site setup, mobilisation, project preliminaries.' },
      { code: 'PM',      name: 'Project Management',                desc: 'PM time, project coordination, governance.' },
      { code: 'ENG',     name: 'PM & Engineering',                  desc: 'Combined PM + engineering effort (use when not split).' },
      { code: 'SD',      name: 'System Design',                     desc: 'System-level design effort.' },
      { code: 'ID',      name: 'Installation Design',               desc: 'Installation drawings and design.' },
      { code: 'MFG',     name: 'Manufacturing / Hardware',          desc: 'Equipment manufacturing, hardware procurement.' },
      { code: 'SW',      name: 'Software / Licences',               desc: 'Software development, licences, services.' },
      { code: 'INST',    name: 'Installation & Cabling',            desc: 'On-site installation and cabling work.' },
      { code: 'SUB',     name: 'Sub-contractor',                    desc: 'Sub-contracted scope (pass-through cost).' },
      { code: 'SUP',     name: 'Site Supervision',                  desc: 'On-site supervisory effort.' },
      { code: 'STC',     name: 'Site Testing & Commissioning',      desc: 'Field testing, commissioning, handover.' },
      { code: 'DRF',     name: 'Drafting Support',                  desc: 'Drafting, CAD, documentation support.' },
      { code: 'PLN',     name: 'Planning Support (IWR / Primavera)',desc: 'Planning, scheduling, Primavera support.' },
      { code: 'MAT',     name: 'Materials',                         desc: 'Bulk materials separate from equipment.' },
      { code: 'LAB',     name: 'Labour',                            desc: 'Direct labour not captured elsewhere.' },
    ],
  },
  B: {
    title: 'Tier B - Compliance & assurance (project-dependent)',
    sub:   'Add only when the contract requires them.',
    items: [
      { code: 'EMC',     name: 'EMC & Type Test',                   desc: 'EMC testing, type approval.' },
      { code: 'RAM',     name: 'System Assurance (RAM)',            desc: 'Reliability/availability/maintainability.' },
      { code: 'SAFE',    name: 'Safety',                            desc: 'Safety case, safety assurance.' },
      { code: 'ITSEC',   name: 'IT Network Security',               desc: 'Cyber/network security scope.' },
      { code: 'CIVDEF',  name: 'Civil Defence Provision',           desc: 'CD compliance items.' },
      { code: 'FAT',     name: 'FAT / Staging',                     desc: 'Factory acceptance, staging environment.' },
      { code: 'TRAIN',   name: 'Training (STC / ITTC)',             desc: 'End-user / operator training.' },
    ],
  },
  C: {
    title: 'Tier C - Lifecycle & exception buckets',
    sub:   'Always create these even if zero - they isolate exception costs and warranty/VO from the main scope.',
    items: [
      { code: 'R',   name: 'Rework',                  suffix: '-R',     desc: 'Rework cost - tracked separately for margin analysis.' },
      { code: 'CC',  name: 'Customer Complaints',     suffix: '-C',     desc: 'Handling of customer complaints.' },
      { code: 'ENT', name: 'Entertainment Expenses',  suffix: '-E',     desc: 'Entertainment expenses (audit-tracked).' },
      { code: 'AST', name: 'Project Assets',          suffix: '-A',     desc: 'Capitalised project assets.' },
      { code: 'VO',  name: 'Variation Orders (parent)', suffix: '-VO', desc: 'VO scope. Cost children sit under this (e.g. -VO-1).' },
      { code: 'W',   name: 'DLP / Warranty',          suffix: '-W',     desc: 'Defect Liability Period / warranty months.' },
      { code: 'WA',  name: 'Warranty - Accepted',     suffix: '-W-A',   desc: 'Warranty cost accepted/agreed.' },
      { code: 'WN',  name: 'Non-warranty Cost',       suffix: '-WN',    desc: 'Costs outside warranty cover.' },
      { code: 'WAC', name: 'Accepted Warranty Costs', suffix: '-WA',    desc: 'Warranty costs accepted for reimbursement.' },
      { code: 'ERR', name: 'Error in Creation',       suffix: '-ERR',   desc: 'Housekeeping bucket for SAP entry errors.' },
    ],
  },
};

const TIER_COLOR = {
  A: { bg: 'rgba(80,136,208,.12)',  text: 'var(--info-text)' },
  B: { bg: 'rgba(160,120,200,.15)', text: 'var(--accent)' },
  C: { bg: 'rgba(200,140,80,.14)',  text: 'var(--warn-text)' },
};

function CatalogTab() {
  return (
    <>
      <div className="card card-p mb-4">
        <h4 style={{ marginBottom: 8 }}>Standard sub-job catalog</h4>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          Use these category names when creating sub-jobs in SAP so portfolio
          rollups stay consistent. SAP remains the source of truth for the WBS
          code and cost numbers - this list is a reference to keep naming
          standardised across projects.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10, lineHeight: 1.6 }}>
          SAP format: <code className="mono">{'<wbs>-<seq>'}</code> for Tier A/B
          items (e.g. <code className="mono">214687801/035-6</code> = Project Management).
          Tier C items use a suffix (e.g. <code className="mono">...-W</code> for warranty).
        </div>
      </div>

      <div className="flex-col gap-4">
        {Object.entries(SUBJOB_CATALOG).map(([tier, group]) => (
          <div key={tier} className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                background: TIER_COLOR[tier].bg, color: TIER_COLOR[tier].text,
              }}>
                Tier {tier}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{group.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{group.sub}</div>
              </div>
              <div className="grow" />
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{group.items.length} categories</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Code</th>
                    <th>Category</th>
                    {tier === 'C' && <th style={{ width: 110 }}>SAP suffix</th>}
                    <th>Description / when to use</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(item => (
                    <tr key={item.code}>
                      <td>
                        <code className="mono" style={{ fontSize: 11, fontWeight: 600, color: TIER_COLOR[tier].text }}>
                          {item.code}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      {tier === 'C' && (
                        <td>
                          <code className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                            {item.suffix}
                          </code>
                        </td>
                      )}
                      <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{item.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-p mt-4">
        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-2)' }}>Tip:</strong> If a project needs a category
          you cannot find here, flag it to Finance so the catalog can be extended.
          Creating ad-hoc names in SAP breaks portfolio reporting.
        </div>
      </div>
    </>
  );
}

// ── Purchases tab (Finance read-only cross-project view) ──────────────────

const PURCHASE_CATEGORIES = {
  hardware:    { label: 'Hardware',     color: '#5088d0' },
  software:    { label: 'Software',     color: '#6f42c1' },
  licence:     { label: 'Licence',      color: '#28a745' },
  subcontract: { label: 'Sub-contract', color: '#e8961f' },
  other:       { label: 'Other',        color: '#909090' },
};

function PurchasesTab() {
  const [rows, setRows]   = useState(null);
  const [err, setErr]     = useState(null);
  const [q, setQ]         = useState('');
  const [catFilter, setCatFilter]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  useEffect(() => {
    api.get('/api/sub-jobs/planned-items/all')
      .then(setRows)
      .catch(e => { setErr(e); setRows([]); });
  }, []);

  if (err && (!rows || rows.length === 0)) {
    return <div className="card card-p" style={{ color: 'var(--bad)' }}>Failed to load: {err.message}</div>;
  }
  if (rows === null) {
    return <div style={{ padding: 24, color: 'var(--text-3)' }}>Loading purchases…</div>;
  }

  const projects = Array.from(new Set(rows.map(r => r.project_id))).sort();

  const filtered = rows.filter(r => {
    if (catFilter && r.category !== catFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (projectFilter && r.project_id !== projectFilter) return false;
    if (q) {
      const hay = `${r.description} ${r.vendor || ''} ${r.project_name} ${r.sub_job_name} ${r.wbs_code}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const totals = filtered.reduce((acc, r) => {
    const c = r.category;
    acc[c] = (acc[c] || 0) + Number(r.amount || 0);
    acc._total += Number(r.amount || 0);
    return acc;
  }, { _total: 0 });

  return (
    <>
      <div className="card card-p mb-4">
        <h4 style={{ marginBottom: 8 }}>Planned purchases across all projects</h4>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Cross-project view of every item PMs have planned at sub-job level.
          Use this to consolidate licence renewals or hardware buys before they
          turn into SAP commitments. Read-only — items are entered by PMs on their project pages.
        </div>
      </div>

      {/* Category totals */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(PURCHASE_CATEGORIES).map(([k, info]) => (
          <div key={k} className="card" style={{ padding: '10px 14px', minWidth: 140 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: info.color, marginBottom: 4 }}>
              {info.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(totals[k] || 0)}
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: '10px 14px', minWidth: 140, background: 'var(--accent-light)', borderColor: 'var(--accent)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--accent)', marginBottom: 4 }}>
            Total
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
            {fmt(totals._total)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-p mb-3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search description, vendor, project, WBS..."
          style={{ flex: 1, minWidth: 220, padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
        <Select
          value={catFilter}
          options={[{ value: '', label: 'All categories' }, ...Object.entries(PURCHASE_CATEGORIES).map(([value, info]) => ({ value, label: info.label }))]}
          onChange={setCatFilter}
          style={{ width: 170 }}
        />
        <Select
          value={statusFilter}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'planned', label: 'Planned' },
            { value: 'committed', label: 'Committed' },
            { value: 'received', label: 'Received' },
          ]}
          onChange={setStatusFilter}
          style={{ width: 150 }}
        />
        <Select
          value={projectFilter}
          options={[{ value: '', label: 'All projects' }, ...projects.map(pid => ({ value: pid, label: pid }))]}
          onChange={setProjectFilter}
          style={{ width: 160 }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} of {rows.length}</span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            {rows.length === 0
              ? 'No planned items have been recorded yet. PMs can add them from the sub-job breakdown on each project page.'
              : 'No items match the filters.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Project</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Sub-job</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Category</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Description</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Vendor</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Amount</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Added by</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => {
                const cat = PURCHASE_CATEGORIES[it.category] || { label: it.category, color: '#909090' };
                return (
                  <tr key={it.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{it.project_name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{it.project_id}</div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <code className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>{it.wbs_code}</code>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{it.sub_job_name}</div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                        background: cat.color + '22', color: cat.color,
                      }}>{cat.label}</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{it.description}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-3)' }}>{it.vendor || '—'}</td>
                    <td className="num text-right" style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {fmt(Number(it.amount))}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-2)', textTransform: 'capitalize' }}>{it.status}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-3)' }}>{it.created_by_name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
