import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getProject, fmt, fmtPct, statusLabel, MONTHS } from '../data/mock.js';
import { LineChart, DonutChart, StackedBar } from '../components/Charts.jsx';

function Badge({ status }) {
  return <span className={`badge badge-${status}`}><span className={`dot dot-${status}`} />{statusLabel(status)}</span>;
}

let nextMid = 200;
let nextRid  = 300;

// ── Shared icons ────────────────────────────────────────────────────────────
function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" style={{ flexShrink: 0 }}>
      <circle cx="3" cy="2"  r="1.2"/><circle cx="7" cy="2"  r="1.2"/>
      <circle cx="3" cy="7"  r="1.2"/><circle cx="7" cy="7"  r="1.2"/>
      <circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/>
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8V2M3 5l3-3 3 3"/><path d="M1 10h10"/>
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v6M3 6l3 3 3-3"/><path d="M1 10h10"/>
    </svg>
  );
}

export default function Project({ projectId, navigate }) {
  const p = getProject(projectId);
  const [tab, setTab] = useState('overview');
  const [milestones, setMilestones] = useState(() => p.milestones.map(m => ({ ...m, _id: nextMid++ })));
  const [risks, setRisks] = useState(() => p.risks.map(r => ({ ...r, _id: nextRid++ })));
  const variance = (p.eac - p.budget) / p.budget * 100;

  const tabs = ['Overview', 'Update history', 'Milestones', 'Risks'];

  return (
    <div className="screen">
      {/* Topbar / breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <span className="breadcrumb-link" onClick={() => navigate('portfolio')}>Portfolio</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{p.name}</span>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('eac', p.id)}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="11" height="11" rx="1.5"/>
            <path d="M1 5h11M5 5v6"/>
          </svg>
          EAC Editor
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('resource', p.id)}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="4" r="2.5"/>
            <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
            <circle cx="10.5" cy="4" r="2"/>
            <path d="M11 8.5c1.1 0 2 .9 2 2"/>
          </svg>
          Resources
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('assists')}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 1l1.2 3.6H11L8.2 7l1.2 3.6L6.5 8.5 3.8 10.6 5 7 2.2 4.6h3.3L6.5 1Z"/>
          </svg>
          Draft update
        </button>
      </div>

      {/* Project header */}
      <div className="card card-p mb-5">
        <div className="flex items-start gap-4">
          <div className="grow">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 style={{ margin: 0 }}>{p.name}</h2>
              <Badge status={p.status} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
              PM: <strong style={{ color: 'var(--text-2)' }}>{p.pm}</strong> ·
              Director: <strong style={{ color: 'var(--text-2)' }}>{p.pd}</strong> ·
              WBS: <code className="mono">{p.wbs}</code> ·
              Last update: {p.lastUpdate}
            </div>
          </div>
          <DonutChart pct={p.percentComplete} size={70} stroke={8} color="var(--accent)" />
        </div>

        {/* EAC formula bar */}
        <div style={{ marginTop: 20, padding: '14px 0 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 10 }}>EAC build-up</div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Actual (SAP)', val: p.actual,    color: 'var(--text)',      bg: 'var(--surface-3)' },
              { label: '+', val: null },
              { label: 'Committed',   val: p.committed,  color: 'var(--accent)',    bg: 'var(--accent-light)' },
              { label: '+', val: null },
              { label: 'Labour ETC',  val: p.labourEtc,  color: 'var(--info)',      bg: 'var(--info-bg)' },
              { label: '+', val: null },
              { label: 'Other ETC',   val: p.otherEtc,   color: 'var(--info)',      bg: 'var(--info-bg)' },
              { label: '=', val: null },
              { label: 'EAC', val: p.eac, color: variance > 3 ? 'var(--warn-text)' : 'var(--ok-text)', bg: variance > 3 ? 'var(--warn-bg)' : 'var(--ok-bg)', bold: true },
            ].map((item, i) => item.val !== null ? (
              <div key={i} style={{ padding: '8px 14px', borderRadius: 8, background: item.bg, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.label}</span>
                <span style={{ fontWeight: item.bold ? 800 : 700, fontSize: 16, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{fmt(item.val)}</span>
              </div>
            ) : (
              <span key={i} style={{ fontSize: 18, color: 'var(--text-3)', fontWeight: 300 }}>{item.label}</span>
            ))}
            <div style={{ marginLeft: 8, fontSize: 13 }}>
              <span style={{ color: variance > 0 ? 'var(--warn)' : 'var(--ok)', fontWeight: 700 }}>
                {(variance >= 0 ? '+' : '')}{variance.toFixed(1)}%
              </span>
              <span style={{ color: 'var(--text-3)', marginLeft: 4 }}>vs {fmt(p.budget)} budget</span>
            </div>
          </div>
        </div>

        {/* Cost breakdown bar */}
        <div style={{ marginTop: 12 }}>
          <StackedBar segments={[
            { label: 'Actual',     value: p.actual,    color: '#7C6FE5' },
            { label: 'Committed',  value: p.committed, color: '#A594F9' },
            { label: 'Labour ETC', value: p.labourEtc, color: '#C4B8FF' },
            { label: 'Other ETC',  value: p.otherEtc,  color: '#DDD5FF' },
          ]} height={14} />
        </div>
      </div>

      {/* 5 KPI tiles */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Budget',      val: fmt(p.budget),   sub: 'approved' },
          { label: 'EAC',         val: fmt(p.eac),       sub: 'current estimate', color: variance > 3 ? 'var(--warn)' : undefined },
          { label: 'Variance',    val: `${(variance >= 0 ? '+' : '')}${variance.toFixed(1)}%`, sub: `vs ${fmt(p.budget)}`, color: variance > 0 ? 'var(--warn)' : 'var(--ok)' },
          { label: '% Complete',  val: `${p.percentComplete}%`, sub: 'progress to date' },
          { label: 'Months left', val: p.monthsLeft,    sub: `of ${p.monthsLeft + Math.round(p.percentComplete/100 * (p.monthsLeft + 6))} total` },
        ].map((k, i) => (
          <div key={i} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color || 'var(--text)' }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 items-stretch">
        {/* Left: chart */}
        <div className="card card-p grow" style={{ flex: '1.6' }}>
          <div className="flex items-center justify-between mb-4">
            <h4>Cost trend · {MONTHS[0]}–{MONTHS[11]} '26</h4>
            <div className="flex gap-3" style={{ fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 16, height: 2, background: 'var(--accent)', borderRadius: 1, display: 'inline-block' }} />
                EAC forecast
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 16, height: 0, borderTop: '2px dashed var(--bad)', display: 'inline-block' }} />
                Budget
              </span>
            </div>
          </div>
          <LineChart data={p.trend} budget={p.budget / 1000} width={460} height={160} />
          <div className="flex justify-between mt-2" style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {MONTHS.map(m => <span key={m}>{m}</span>)}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)' }}>
            Burn rate: <strong>{(p.actual / p.budget * 100 / (p.percentComplete || 1) * 100).toFixed(0)}%</strong> of plan ·
            Months left: <strong>{p.monthsLeft}</strong>
          </div>
        </div>

        {/* Right: tabs */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="flex" style={{ borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t.toLowerCase().replace(' ', '-'))}
                style={{
                  padding: '12px 12px 10px', fontSize: 12,
                  fontWeight: tab === t.toLowerCase().replace(' ', '-') ? 600 : 500,
                  color: tab === t.toLowerCase().replace(' ', '-') ? 'var(--accent)' : 'var(--text-3)',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  borderBottom: tab === t.toLowerCase().replace(' ', '-') ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1, transition: 'all .15s',
                }}>{t}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {tab === 'overview'       && <OverviewTab p={p} />}
            {tab === 'update-history' && <UpdatesTab p={p} />}
            {tab === 'milestones'     && <MilestonesTab milestones={milestones} setMilestones={setMilestones} />}
            {tab === 'risks'          && <RisksTab risks={risks} setRisks={setRisks} />}
          </div>
        </div>
      </div>

      {/* Sub-jobs table */}
      <div className="card mt-4">
        <div className="flex items-center justify-between p-5 pb-0 mb-3">
          <h4>WBS / Sub-job breakdown</h4>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('eac', p.id)}>Open EAC editor →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sub-job WBS</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Budget</th>
                <th style={{ textAlign: 'right' }}>Actual CTD</th>
                <th style={{ textAlign: 'right' }}>Committed</th>
                <th style={{ textAlign: 'right' }}>ETC</th>
                <th style={{ textAlign: 'right' }}>EAC</th>
                <th style={{ textAlign: 'right' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {p.subjobs.map((sj, i) => {
                const eac = sj.actual + sj.committed + sj.etc;
                const v   = eac - sj.budget;
                return (
                  <tr key={i}>
                    <td><code className="mono" style={{ fontSize: 11 }}>{sj.wbs}</code></td>
                    <td style={{ fontWeight: 500 }}>{sj.name}</td>
                    <td className="num text-right">{fmt(sj.budget)}</td>
                    <td className="num text-right" style={{ color: 'var(--text-2)' }}>{fmt(sj.actual)}</td>
                    <td className="num text-right" style={{ color: 'var(--text-2)' }}>{fmt(sj.committed)}</td>
                    <td className="num text-right" style={{ color: 'var(--text-2)' }}>{fmt(sj.etc)}</td>
                    <td className="num text-right" style={{ fontWeight: 600 }}>{fmt(eac)}</td>
                    <td className="num text-right" style={{ color: v > 0 ? 'var(--warn)' : 'var(--ok)', fontWeight: 600 }}>
                      {v > 0 ? '+' : ''}{fmt(Math.abs(v))}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: 'var(--surface-3)', fontWeight: 700 }}>
                <td colSpan={2} style={{ paddingLeft: 20 }}>Total</td>
                <td className="num text-right">{fmt(p.budget)}</td>
                <td className="num text-right">{fmt(p.actual)}</td>
                <td className="num text-right">{fmt(p.committed)}</td>
                <td className="num text-right">{fmt(p.labourEtc + p.otherEtc)}</td>
                <td className="num text-right">{fmt(p.eac)}</td>
                <td className="num text-right" style={{ color: p.eac > p.budget ? 'var(--warn)' : 'var(--ok)' }}>
                  {p.eac > p.budget ? '+' : ''}{fmt(Math.abs(p.eac - p.budget))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────

function OverviewTab({ p }) {
  return (
    <div className="flex-col gap-3">
      <KV label="Department"       val={p.department} />
      <KV label="WBS code"         val={<code className="mono" style={{ fontSize: 12 }}>{p.wbs}</code>} />
      <KV label="Project Director" val={p.pd} />
      <KV label="Months remaining" val={`${p.monthsLeft} months`} />
      <KV label="Budget"           val={fmt(p.budget)} />
      <KV label="EAC"              val={fmt(p.eac)} />
      <KV label="Actual to date"   val={fmt(p.actual)} />
    </div>
  );
}

function UpdatesTab({ p }) {
  return (
    <div className="flex-col gap-3">
      {p.updates.map((u, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span className={`dot dot-${u.status}`} style={{ marginTop: 5, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 2 }}>{u.month}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{u.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Milestones ──────────────────────────────────────────────────────────────

function parseMilestoneXlsx(arrayBuffer) {
  const wb   = XLSX.read(arrayBuffer, { type: 'array' });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const hdrs = (data[0] || []).map(h => String(h).trim().toLowerCase());
  const nameCol   = hdrs.indexOf('name');
  const dateCol   = hdrs.indexOf('date');
  const statusCol = hdrs.indexOf('status');
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const row  = data[i];
    const name = nameCol >= 0 && row[nameCol] ? String(row[nameCol]).trim() : '';
    if (!name) continue;
    const date   = dateCol   >= 0 && row[dateCol]   ? String(row[dateCol]).trim()             : '—';
    const status = statusCol >= 0 && row[statusCol] ? String(row[statusCol]).trim().toLowerCase() : '';
    out.push({
      _id:  nextMid++,
      name, date,
      done: ['done', 'yes', 'complete', 'completed'].includes(status),
      warn: ['at-risk', 'at risk', 'warn', 'warning'].includes(status),
    });
  }
  return out;
}

function downloadMilestoneTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Name', 'Date', 'Status'],
    ['Kickoff meeting',     'Jan 2026',    'done'],
    ['Design sign-off',     '15 Feb 2026', 'done'],
    ['UAT complete',        '30 Jun 2026', 'pending'],
    ['Go-live',             'Aug 2026',    'at-risk'],
    ['Closeout',            'Sep 2026',    'pending'],
  ]);
  ws['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Milestones');
  XLSX.writeFile(wb, 'milestones_template.xlsx');
}

function MilestonesTab({ milestones, setMilestones }) {
  const [adding, setAdding]               = useState(false);
  const [newName, setNewName]             = useState('');
  const [newDate, setNewDate]             = useState('');
  const [confirmingMid, setConfirmingMid] = useState(null);
  const [dragIdx, setDragIdx]             = useState(null);
  const [overIdx, setOverIdx]             = useState(null);
  const [importErr, setImportErr]         = useState(null);
  const fileRef = useRef(null);

  function toggleDone(id) {
    setConfirmingMid(null);
    setMilestones(prev => prev.map(m => m._id === id ? { ...m, done: !m.done, warn: m.done ? m.warn : false } : m));
  }

  function remove(id) {
    setMilestones(prev => prev.filter(m => m._id !== id));
    setConfirmingMid(null);
  }

  function addMilestone() {
    if (!newName.trim()) return;
    setMilestones(prev => [...prev, { _id: nextMid++, name: newName.trim(), date: newDate || '—', done: false }]);
    setNewName(''); setNewDate(''); setAdding(false);
  }

  function handleDrop(toIdx) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setOverIdx(null); return; }
    const arr = [...milestones];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(toIdx, 0, moved);
    setMilestones(arr);
    setDragIdx(null); setOverIdx(null);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportErr(null);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = parseMilestoneXlsx(ev.target.result);
        if (!imported.length) {
          setImportErr('No valid rows found. Headers must be: Name, Date, Status');
          return;
        }
        setMilestones(prev => [...prev, ...imported]);
      } catch {
        setImportErr('Could not parse file. Download the template to see expected format.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  return (
    <div className="flex-col gap-2">
      {/* Toolbar */}
      <div className="flex gap-2 mb-2" style={{ alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} · <GripIcon /> to reorder
        </span>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => fileRef.current.click()}>
          <UploadIcon /> Import .xlsx
        </button>
        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={downloadMilestoneTemplate}>
          <DownloadIcon /> Template
        </button>
      </div>

      {importErr && (
        <div style={{ fontSize: 11, color: 'var(--bad)', padding: '6px 10px', background: 'var(--bad-bg)', borderRadius: 6, marginBottom: 4 }}>
          {importErr}
        </div>
      )}

      {milestones.map((m, i) => {
        const isConfirming = confirmingMid === m._id;
        const isDragging   = dragIdx === i;
        const isTarget     = overIdx === i && dragIdx !== null && dragIdx !== i;
        return (
          <div
            key={m._id}
            draggable={!isConfirming}
            onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragIdx(i); }}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverIdx(i); }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            style={{
              borderBottom: '1px solid var(--border)',
              borderTop: isTarget ? '2px solid var(--accent)' : '2px solid transparent',
              opacity: isDragging ? 0.3 : 1,
              background: isConfirming ? 'var(--bad-bg)' : 'transparent',
              borderRadius: isConfirming ? 6 : 0,
              overflow: 'hidden',
              transition: 'opacity .1s, border-color .08s',
            }}
          >
            <div className="flex items-center gap-2" style={{ padding: '8px 0' }}>
              {!isConfirming && (
                <span style={{ color: 'var(--border-2)', cursor: 'grab', display: 'flex', alignItems: 'center', padding: '0 2px' }} title="Drag to reorder">
                  <GripIcon />
                </span>
              )}
              <button
                onClick={() => toggleDone(m._id)}
                style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer',
                  background: m.done ? 'var(--ok-bg)' : m.warn ? 'var(--warn-bg)' : 'var(--surface-3)',
                }}
                title={m.done ? 'Mark incomplete' : 'Mark done'}
              >
                {m.done ? (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="var(--ok-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1.5 5.5l3 3 5-5"/>
                  </svg>
                ) : m.warn ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--warn-text)" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 2v3M5 7.5v.5"/>
                  </svg>
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-3)' }} />
                )}
              </button>
              <div className="grow">
                <div style={{
                  fontSize: 13, fontWeight: m.done ? 400 : 600,
                  color: isConfirming ? 'var(--bad-text)' : m.done ? 'var(--text-3)' : 'var(--text)',
                  textDecoration: m.done ? 'line-through' : 'none',
                }}>{m.name}</div>
                {isConfirming
                  ? <div style={{ fontSize: 11, color: 'var(--bad)' }}>Remove this milestone?</div>
                  : <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.date}</div>
                }
              </div>
              {!isConfirming && m.warn && <span className="badge badge-warn" style={{ fontSize: 10 }}>At risk</span>}
              {!isConfirming && m.done && <span className="badge badge-neutral" style={{ fontSize: 10 }}>Done</span>}
              {isConfirming ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingMid(null)}>Cancel</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(m._id)}>Remove</button>
                </div>
              ) : (
                <button onClick={() => setConfirmingMid(m._id)} className="btn btn-icon" style={{ color: 'var(--text-3)', padding: 4 }} title="Remove">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h8M4.5 3V2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M3 3l.5 7h5L9 3"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {adding ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            className="input" style={{ flex: 1 }}
            placeholder="Milestone name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMilestone()}
            autoFocus
          />
          <input
            className="input" style={{ width: 120 }}
            placeholder="Date e.g. 30 Jun"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={addMilestone}>Add</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, alignSelf: 'flex-start' }} onClick={() => setAdding(true)}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5.5 1v9M1 5.5h9"/>
          </svg>
          Add milestone
        </button>
      )}
    </div>
  );
}

// ── Risks ───────────────────────────────────────────────────────────────────

function parseRiskXlsx(arrayBuffer) {
  const wb   = XLSX.read(arrayBuffer, { type: 'array' });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const hdrs = (data[0] || []).map(h => String(h).trim().toLowerCase());
  const titleCol      = hdrs.indexOf('title');
  const impactCol     = hdrs.indexOf('impact');
  const probCol       = hdrs.indexOf('probability');
  const mitigationCol = hdrs.indexOf('mitigation');
  const normalise = v => {
    const s = String(v || '').trim();
    if (/high/i.test(s))       return 'High';
    if (/medium|med/i.test(s)) return 'Medium';
    return 'Low';
  };
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const row   = data[i];
    const title = titleCol >= 0 && row[titleCol] ? String(row[titleCol]).trim() : '';
    if (!title) continue;
    out.push({
      _id:        nextRid++,
      id:         `R-${nextRid}`,
      title,
      impact:     impactCol     >= 0 ? normalise(row[impactCol])     : 'Medium',
      prob:       probCol       >= 0 ? normalise(row[probCol])       : 'Medium',
      mitigation: mitigationCol >= 0 && row[mitigationCol]
                    ? String(row[mitigationCol]).trim()
                    : 'To be defined.',
    });
  }
  return out;
}

function downloadRiskTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Title', 'Impact', 'Probability', 'Mitigation'],
    ['Vendor lead time slippage',       'High',   'Medium', 'Dual-source contract in progress.'],
    ['Headcount shortage in Wave 2',    'Medium', 'Low',    'Resourcing request submitted.'],
    ['Third-party certification delay', 'High',   'High',   'Engaged external expediter.'],
  ]);
  ws['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 50 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Risks');
  XLSX.writeFile(wb, 'risks_template.xlsx');
}

function RisksTab({ risks, setRisks }) {
  const [adding, setAdding]               = useState(false);
  const [form, setForm]                   = useState({ title: '', impact: 'Medium', prob: 'Medium', mitigation: '' });
  const [confirmingRid, setConfirmingRid] = useState(null);
  const [dragIdx, setDragIdx]             = useState(null);
  const [overIdx, setOverIdx]             = useState(null);
  const [importErr, setImportErr]         = useState(null);
  const fileRef = useRef(null);

  function remove(id) {
    setRisks(prev => prev.filter(r => r._id !== id));
    setConfirmingRid(null);
  }

  function addRisk() {
    if (!form.title.trim()) return;
    setRisks(prev => [...prev, {
      _id: nextRid++, id: `R-${nextRid}`,
      title: form.title.trim(),
      impact: form.impact, prob: form.prob,
      mitigation: form.mitigation.trim() || 'To be defined.',
    }]);
    setForm({ title: '', impact: 'Medium', prob: 'Medium', mitigation: '' });
    setAdding(false);
  }

  function handleDrop(toIdx) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setOverIdx(null); return; }
    const arr = [...risks];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(toIdx, 0, moved);
    setRisks(arr);
    setDragIdx(null); setOverIdx(null);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportErr(null);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = parseRiskXlsx(ev.target.result);
        if (!imported.length) {
          setImportErr('No valid rows found. Headers must be: Title, Impact, Probability, Mitigation');
          return;
        }
        setRisks(prev => [...prev, ...imported]);
      } catch {
        setImportErr('Could not parse file. Download the template to see expected format.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  return (
    <div className="flex-col gap-3">
      {/* Toolbar */}
      <div className="flex gap-2 mb-1" style={{ alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          {risks.length} risk{risks.length !== 1 ? 's' : ''} · <GripIcon /> to reorder
        </span>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => fileRef.current.click()}>
          <UploadIcon /> Import .xlsx
        </button>
        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={downloadRiskTemplate}>
          <DownloadIcon /> Template
        </button>
      </div>

      {importErr && (
        <div style={{ fontSize: 11, color: 'var(--bad)', padding: '6px 10px', background: 'var(--bad-bg)', borderRadius: 6, marginBottom: 4 }}>
          {importErr}
        </div>
      )}

      {risks.map((r, i) => {
        const isConfirming = confirmingRid === r._id;
        const isDragging   = dragIdx === i;
        const isTarget     = overIdx === i && dragIdx !== null && dragIdx !== i;
        return (
          <div
            key={r._id}
            draggable={!isConfirming}
            onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragIdx(i); }}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverIdx(i); }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            className="card"
            style={{
              padding: 14,
              marginTop: isTarget ? 0 : undefined,
              borderTop: isTarget ? '2px solid var(--accent)' : undefined,
              borderColor: isConfirming ? 'var(--bad)' : undefined,
              background: isConfirming ? 'var(--bad-bg)' : undefined,
              opacity: isDragging ? 0.3 : 1,
              cursor: isConfirming ? 'default' : 'grab',
              transition: 'opacity .1s',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {!isConfirming && (
                <span style={{ color: 'var(--border-2)', display: 'flex', alignItems: 'center', marginRight: 2 }} title="Drag to reorder">
                  <GripIcon />
                </span>
              )}
              <span style={{ fontSize: 11, fontWeight: 700, color: isConfirming ? 'var(--bad)' : 'var(--text-3)' }}>{r.id}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: isConfirming ? 'var(--bad-text)' : 'var(--text)' }}>{r.title}</span>
              <div className="grow" />
              {!isConfirming && (
                <>
                  <span className={`badge badge-${r.impact === 'High' ? 'bad' : r.impact === 'Medium' ? 'warn' : 'neutral'}`}>{r.impact} impact</span>
                  <span className={`badge badge-${r.prob   === 'High' ? 'bad' : r.prob   === 'Medium' ? 'warn' : 'neutral'}`}>{r.prob} prob</span>
                </>
              )}
              {isConfirming ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingRid(null)}>Cancel</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(r._id)}>Remove</button>
                </div>
              ) : (
                <button onClick={() => setConfirmingRid(r._id)} className="btn btn-icon" style={{ color: 'var(--text-3)', padding: 4 }} title="Remove">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h8M4.5 3V2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M3 3l.5 7h5L9 3"/>
                  </svg>
                </button>
              )}
            </div>
            {isConfirming
              ? <div style={{ fontSize: 12, color: 'var(--bad)', fontWeight: 500 }}>Remove this risk permanently?</div>
              : <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}><strong>Mitigation:</strong> {r.mitigation}</div>
            }
          </div>
        );
      })}

      {adding ? (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              className="input"
              placeholder="Risk title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
            <div className="flex gap-2">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Impact</div>
                <select className="select" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Probability</div>
                <select className="select" value={form.prob} onChange={e => setForm(f => ({ ...f, prob: e.target.value }))}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
            </div>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Mitigation plan"
              value={form.mitigation}
              onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))}
            />
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={addRisk}>Add risk</button>
            </div>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setAdding(true)}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5.5 1v9M1 5.5h9"/>
          </svg>
          Add risk
        </button>
      )}
    </div>
  );
}

function KV({ label, val }) {
  return (
    <div className="flex items-center">
      <span style={{ width: 140, fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{val}</span>
    </div>
  );
}
