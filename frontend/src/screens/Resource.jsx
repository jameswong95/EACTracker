import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useProject, useResourcePool, useRates, useResourceRequests, fmt, MONTHS } from '../data/store.js';
import { api } from '../data/api.js';
import { CAT_COLORS } from '../components/Charts.jsx';
import Icon from '../components/Icon.jsx';

let nextId = 100;

/* ── Searchable person picker ── */
function PersonSelect({ available, onSelect, onCancel }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(true);
  const ref = useRef();
  const debounceTimer = useRef();

  function handleQueryChange(val) {
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(val), 150);
  }

  const filtered = available
    .filter(p => p.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
    .slice(0, 10);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onCancel();
    }
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      clearTimeout(debounceTimer.current);
    };
  }, [onCancel]);

  function select(person) { onSelect(person); setQuery(''); }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 240 }}>
      <div style={{ position: 'relative' }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
          stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l3 3"/>
        </svg>
        <input className="input" style={{ paddingLeft: 30 }} placeholder="Search by name…"
          value={query} autoFocus
          onChange={e => { handleQueryChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' && filtered.length > 0) select(filtered[0]);
            if (e.key === 'Escape') onCancel();
          }}
        />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border-2)',
          borderRadius: 8, boxShadow: 'var(--shadow-md)', maxHeight: 240, overflowY: 'auto',
        }}>
          {filtered.length === 0
            ? <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)' }}>No match found</div>
            : filtered.map(p => (
              <div key={p.id} onMouseDown={() => select(p)}
                style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-light)', border: '1px solid rgba(232,150,31,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: 'var(--accent)',
                }}>{p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                <span className="badge badge-accent" style={{ fontSize: 10 }}>{p.grade}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

/* ── Custom role picker (avoids native <select> OS styling) ── */
function RoleSelect({ roles, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text)',
          fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: open ? '0 0 0 3px rgba(232,150,31,.12)' : 'none',
          transition: 'border-color .12s, box-shadow .12s',
        }}
      >
        <span>{value}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ flexShrink: 0, marginLeft: 8, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M0 0l5 6 5-6z" fill="var(--accent)" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border-2)',
          borderRadius: 8, boxShadow: 'var(--shadow-md)', overflow: 'hidden',
        }}>
          {roles.map(r => (
            <div key={r}
              onMouseDown={() => { onChange(r); setOpen(false); }}
              style={{
                padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                fontWeight: r === value ? 600 : 400,
                color: r === value ? 'var(--accent)' : 'var(--text)',
                background: r === value ? 'var(--accent-light)' : '',
              }}
              onMouseEnter={e => { if (r !== value) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = r === value ? 'var(--accent-light)' : ''; }}
            >
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Resource({ projectId, navigate, role, session }) {
  const { project: p, loading } = useProject(projectId);
  const RESOURCE_POOL = useResourcePool();
  const RATES = useRates();
  if (loading || !p) return <div className="screen"><div style={{ padding: 40, color: 'var(--text-3)' }}>Loading…</div></div>;
  return <ResourceBody p={p} navigate={navigate} RESOURCE_POOL={RESOURCE_POOL} RATES={RATES} role={role} session={session} />;
}

function ResourceBody({ p, navigate, RESOURCE_POOL, RATES, role, session }) {
  const canEdit = role !== 'Project Director';
  const { requests, reload: reloadRequests } = useResourceRequests(p.id);
  // Plan starts at (startYear, startMonth); the timeline extends indefinitely to the
  // right. All labour is parked under the PM/MISC category (shown in the breadcrumb).
  const startYear  = p.startYear  ?? 2026;
  const startMonth = p.startMonth ?? 0;    // 0 = January
  const startAbs   = startYear * 12 + startMonth;

  const nowYear  = new Date().getFullYear();
  const nowMonth = new Date().getMonth(); // 0-indexed
  const nowAbs   = nowYear * 12 + nowMonth;

  const dataMonths = Math.max(12, ...(p.resources || []).map(r => (r.fte || []).length));

  // Horizon = number of months rendered; grows as you scroll right ("infinite").
  const [horizon, setHorizon] = useState(() =>
    Math.max(24, dataMonths, nowAbs - startAbs + 10)
  );

  // Metadata for display month index i (0-based from plan start).
  function monthMeta(i) {
    const abs = startAbs + i;
    const year = Math.floor(abs / 12);
    const m = ((abs % 12) + 12) % 12;
    return { abs, year, m, absQuarter: Math.floor(abs / 3), q: Math.floor(m / 3) + 1 };
  }

  // Locked quarters → Actual cost; unlocked quarters → ETC. Locking granularity is a quarter.
  const [lockedQuarters, setLockedQuarters] = useState(() => {
    const s = new Set();
    const scan = Math.max(24, dataMonths, nowAbs - startAbs + 10);
    for (let i = 0; i < scan; i++) {
      const q = Math.floor((startAbs + i) / 3);
      if (q * 3 + 2 < nowAbs) s.add(q); // whole quarter has elapsed → actuals
    }
    return s;
  });
  function isLocked(i) { return lockedQuarters.has(monthMeta(i).absQuarter); }
  function toggleQuarter(absQuarter) {
    if (!canEdit) return;
    setLockedQuarters(prev => {
      const n = new Set(prev);
      if (n.has(absQuarter)) n.delete(absQuarter); else n.add(absQuarter);
      return n;
    });
  }

  const [rows, setRows] = useState(() =>
    p.resources.map(r => {
      const fte = Array(dataMonths).fill(0);
      (r.fte || []).forEach((v, i) => { if (i < dataMonths) fte[i] = parseFloat(v) || 0; });
      return { ...r, id: nextId++, dbId: r.id, fte, fn: r.fn || '' };
    })
  );
  const [adding, setAdding]           = useState(false);
  const [pendingPerson, setPendingPerson] = useState(null);
  const [pendingFn, setPendingFn]     = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [saveStatus, setSaveStatus]   = useState(null);
  const [importErr, setImportErr]     = useState(null);
  const saveTimer    = useRef();
  const firstRender  = useRef(true);
  const importRef    = useRef(null);

  function monthLabel(i) { const mm = monthMeta(i); return `${MONTHS[mm.m]}-${String(mm.year).slice(2)}`; }

  function isPmCategorySubjob(s) {
    const suffix = String(s?.suffix || '');
    if (!suffix) return false;
    const parts = suffix.split('-');
    return (parts.slice(-2).join('-') || suffix) === '1-1';
  }

  function downloadResourceTemplate() {
    const cols = Array.from({ length: horizon }, (_, i) => monthLabel(i));
    const header = ['Name', 'Grade', 'Function', ...cols];
    const dataRows = rows.map(r =>
      [r.role, r.grade, r.fn, ...cols.map((_, i) => r.fte[i] || '')]);
    const blankRows = Array(3).fill(['', '', '', ...cols.map(() => '')]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows, ...blankRows]);
    ws['!cols'] = [{ wch: 22 }, { wch: 7 }, { wch: 24 }, ...cols.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resource Plan');
    XLSX.writeFile(wb, `resource_plan_${p.id}.xlsx`);
  }

  function handleResourceImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportErr(null);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb   = XLSX.read(ev.target.result, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const hdrs = (data[0] || []).map(h => String(h).trim());
        const nameCol  = hdrs.findIndex(h => /name/i.test(h));
        const gradeCol = hdrs.findIndex(h => /grade/i.test(h));
        const fnCol    = hdrs.findIndex(h => /function|role/i.test(h));
        const monthCols = Array.from({ length: horizon }, (_, i) => hdrs.indexOf(monthLabel(i)));
        if (nameCol === -1) { setImportErr('No "Name" column found.'); return; }
        let added = 0, updated = 0;
        setRows(prev => {
          const next = [...prev];
          for (let ri = 1; ri < data.length; ri++) {
            const row  = data[ri];
            const name = row[nameCol] ? String(row[nameCol]).trim() : '';
            if (!name) continue;
            const grade = gradeCol >= 0 && row[gradeCol] ? String(row[gradeCol]).trim() : 'E2';
            const fn    = fnCol    >= 0 && row[fnCol]    ? String(row[fnCol]).trim()    : '';
            const existing = next.find(r => r.role === name);
            const target = existing || { id: nextId++, role: name, grade, fn, fte: Array(dataMonths).fill(0) };
            monthCols.forEach((col, i) => {
              if (col === -1) return;
              if (existing && isLocked(i)) return; // don't overwrite locked actuals
              const v = parseFloat(row[col]);
              if (!isNaN(v)) { while (target.fte.length <= i) target.fte.push(0); target.fte[i] = Math.max(0, v); }
            });
            if (existing) updated++; else { next.push(target); added++; }
          }
          if (updated + added === 0) { setImportErr('No valid rows found.'); return prev; }
          return next.map(r => ({ ...r }));
        });
      } catch { setImportErr('Could not parse file. Download the template to see expected format.'); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  const assignedNames = new Set(rows.map(r => r.role));
  const available = RESOURCE_POOL.filter(p => !assignedNames.has(p.name));

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const toSave = rows.filter(r => r.dbId);
      if (!toSave.length) return;
      setSaveStatus('saving');
      Promise.all(toSave.map(r =>
        api.patch(`/api/resources/${r.dbId}`, { fte_allocations: r.fte })
      ))
        .then(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus(null), 2000); })
        .catch(() => { setSaveStatus('error'); setTimeout(() => setSaveStatus(null), 3000); });
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [rows]);

  function handlePersonSelected(person) {
    setPendingPerson(person);
    setPendingFn(person.roles?.[0] || '');
  }

  async function confirmAdd() {
    if (!pendingPerson) return;
    const fte = Array(dataMonths).fill(0);
    const poolEntry = RESOURCE_POOL.find(r => r.name === pendingPerson.name);
    let dbId = null;
    try {
      const created = await api.post('/api/resources', {
        project_id: p.id,
        resource_id: poolEntry?.id || null,
        role_name: pendingPerson.name,
        function_title: pendingFn.trim() || '',
        grade: pendingPerson.grade,
        fte_allocations: fte,
      });
      dbId = created.id;
    } catch (e) { console.error('Failed to create resource', e); }
    setRows(prev => [...prev, {
      id: nextId++, dbId, role: pendingPerson.name,
      grade: pendingPerson.grade, fn: pendingFn.trim(), fte,
    }]);
    setPendingPerson(null); setPendingFn(''); setAdding(false);
  }

  function cancelAdd() { setAdding(false); setPendingPerson(null); setPendingFn(''); }

  function updateFte(rowId, i, val) {
    if (isLocked(i)) return;
    const num = Math.max(0, parseFloat(val) || 0);
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const fte = r.fte.slice();
      while (fte.length <= i) fte.push(0);
      fte[i] = num;
      return { ...r, fte };
    }));
  }

  function removeRow(rowId) {
    const row = rows.find(r => r.id === rowId);
    if (row?.dbId) api.del(`/api/resources/${row.dbId}`).catch(console.error);
    setRows(prev => prev.filter(r => r.id !== rowId));
    setConfirmingId(null);
  }

  const rateOf = (grade) => { const rt = RATES.find(x => x.grade === grade); return rt ? rt.monthly : 0; };

  // Continuous months in view + per-month aggregates.
  const months  = Array.from({ length: horizon }, (_, i) => monthMeta(i));
  const colFte  = months.map((_, i) => rows.reduce((s, r) => s + (r.fte[i] || 0), 0));
  const colCost = months.map((_, i) => rows.reduce((s, r) => s + (r.fte[i] || 0) * rateOf(r.grade) / 1000, 0));

  // Open placeholder resource requests -> forecast rows in the timeline. Each
  // request contributes its headcount FTE for every month in its need window
  // (from need_year/need_month to need_end_year/need_end_month, inclusive). If
  // no end is set it runs to the end of the visible horizon. Requested cost is
  // always treated as ETC (forecast), never committed.
  const openReqs = (requests || []).filter(r => r.status === 'open');
  const reqRows = openReqs.map(rq => {
    const hc = Number(rq.headcount) || 1;
    const fromAbs = (Number(rq.need_year) || startYear) * 12 + ((Number(rq.need_month) || 1) - 1);
    const startI = Math.max(0, fromAbs - startAbs);
    let endI = months.length - 1;
    if (rq.need_end_year && rq.need_end_month) {
      endI = Number(rq.need_end_year) * 12 + (Number(rq.need_end_month) - 1) - startAbs;
    }
    const fte = months.map((_, i) => (i >= startI && i <= endI ? hc : 0));
    return { ...rq, fte, hc };
  });
  const reqColFte   = months.map((_, i) => reqRows.reduce((s, r) => s + (r.fte[i] || 0), 0));
  const reqColCost  = months.map((_, i) => reqRows.reduce((s, r) => s + (r.fte[i] || 0) * rateOf(r.grade) / 1000, 0));
  const reqCostK    = reqColCost.reduce((a, b) => a + b, 0);
  const reqFteTotal = reqColFte.reduce((a, b) => a + b, 0);

  // SAP COM_CST is the committed/actual commitment source. Resource-plan
  // locked quarters only control editability; unlocked quarters remain ETC.
  const committedCostK = (p.subjobs || [])
    .filter(isPmCategorySubjob)
    .reduce((sum, s) => sum + (Number(s.committed) || 0), 0) / 1000;
  let etcCostK = 0;
  months.forEach((mm, i) => {
    if (!lockedQuarters.has(mm.absQuarter)) etcCostK += colCost[i];
  });
  etcCostK += reqCostK; // requested headcount is forecast -> ETC
  const totalCostK = committedCostK + etcCostK;
  const totalFte   = colFte.reduce((a, b) => a + b, 0);
  const peakFte    = Math.max(0, ...colFte);
  const nameColW = 240;
  const monthColW = 72;
  const totalColW = 76;
  const tableW = nameColW + months.length * monthColW + totalColW;
  const stickyL = {
    position: 'sticky',
    left: 0,
    zIndex: 3,
    overflow: 'hidden',
    boxShadow: '1px 0 0 var(--border)',
  };
  const stickyR = {
    position: 'sticky',
    right: 0,
    zIndex: 3,
    boxShadow: '-1px 0 0 var(--border)',
  };

  // Contiguous quarter groups for the header lock toggles.
  const qGroups = [];
  months.forEach((mm, i) => {
    const last = qGroups[qGroups.length - 1];
    if (last && last.absQuarter === mm.absQuarter) last.span++;
    else qGroups.push({ absQuarter: mm.absQuarter, start: i, span: 1, year: mm.year, q: mm.q });
  });

  return (
    <div className="screen">
      <div className="module-inline-header">
        <div className="module-inline-crumbs">
          <button type="button" onClick={() => navigate('portfolio')}>Portfolio</button>
          <span>/</span>
          <button type="button" onClick={() => navigate('project', p.id)}>{p.name}</button>
          <span>/</span>
          <span className="module-inline-current">Resource Plan</span>
          <span className="material-category-badge" style={{ '--category-color': CAT_COLORS['PM'] }}>
            <span className="material-category-dot" />
            <span className="material-category-text">PM category</span>
          </span>
        </div>
        <div className="grow" />
        {saveStatus === 'saving' && (
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Saving…</span>
        )}
        {saveStatus === 'saved' && (
          <span style={{ fontSize: 12, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 6l3 3 6-6"/>
            </svg>
            Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span style={{ fontSize: 12, color: 'var(--bad)' }}>Save failed</span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('project', p.id)}><Icon name="arrowLeft" size={13} /> Back</button>
      </div>

      {/* KPI tiles — all-project totals so they stay stable as you navigate years */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Committed labour cost</div>
          <div className="kpi-value num">{fmt(committedCostK * 1000)}</div>
          <div className="kpi-sub">SAP COM_CST · PM category</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">ETC labour cost</div>
          <div className="kpi-value num" style={{ color: 'var(--accent)' }}>{fmt(etcCostK * 1000)}</div>
          <div className="kpi-sub">unlocked quarters + requests · forecast</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Total labour cost</div>
          <div className="kpi-value num">{fmt(totalCostK * 1000)}</div>
          <div className="kpi-sub">committed + ETC · {rows.length} people</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Peak FTE month</div>
          <div className="kpi-value num">{peakFte.toFixed(1)}</div>
          <div className="kpi-sub">across timeline</div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Card header */}
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h4>FTE plan by person</h4>
            {importErr && <div style={{ fontSize: 11, color: 'var(--bad)', marginTop: 3 }}>{importErr}</div>}
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
              PM category · scroll right for more months ·
              <span style={{ color: 'var(--text-2)', fontWeight: 600, marginLeft: 4 }}>Locked = Committed</span>
              <span style={{ marginLeft: 4 }}>·</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600, marginLeft: 4 }}>Unlocked = ETC</span>
            </div>
          </div>

          {canEdit && (
            <button className="btn btn-ghost btn-sm" onClick={() => setHorizon(h => h + 12)} title="Show more months">
              + Months
            </button>
          )}

          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleResourceImport} />
          {canEdit && (
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => { setImportErr(null); importRef.current.click(); }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8V2M3 5l3-3 3 3"/><path d="M1 10h10"/>
              </svg>
              Import
            </button>
          )}
          {canEdit && (
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={downloadResourceTemplate}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2v6M3 6l3 3 3-3"/><path d="M1 10h10"/>
              </svg>
              Template
            </button>
          )}
          {canEdit && !adding && (
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              Add person
            </button>
          )}
        </div>

        {/* Add person panel */}
        {adding && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {!pendingPerson ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PersonSelect available={available} onSelect={handlePersonSelected} onCancel={cancelAdd} />
                <button className="btn btn-ghost btn-sm" onClick={cancelAdd}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => { setPendingPerson(null); setPendingFn(''); }}
                  title="Change person"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 6, background: 'var(--surface-3)', border: '1px solid var(--border-2)', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-light)', border: '1px solid rgba(232,150,31,.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: 'var(--accent)',
                  }}>{pendingPerson.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{pendingPerson.name}</span>
                  <span className="badge badge-accent" style={{ fontSize: 10 }}>{pendingPerson.grade}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
                    <path d="M1.5 5h7M6 2.5L8.5 5 6 7.5"/>
                  </svg>
                </button>
                <div style={{ flex: 1 }}>
                  {pendingPerson.roles?.length > 1 ? (
                    <RoleSelect roles={pendingPerson.roles} value={pendingFn} onChange={setPendingFn} />
                  ) : (
                    <div style={{ padding: '7px 12px', fontSize: 13, color: 'var(--text-2)', background: 'var(--surface-3)', borderRadius: 6, border: '1px solid var(--border-2)' }}>
                      {pendingFn}
                    </div>
                  )}
                </div>
                <button className="btn btn-primary btn-sm" onClick={confirmAdd}>Add</button>
                <button className="btn btn-ghost btn-sm" onClick={cancelAdd}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div
          style={{ overflowX: 'auto' }}
          onScroll={e => {
            const el = e.currentTarget;
            if (el.scrollWidth - el.scrollLeft - el.clientWidth < 240) setHorizon(h => h + 6);
          }}
        >
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: tableW }}>
            <colgroup>
              <col style={{ width: nameColW }} />
              {months.map((_, i) => <col key={i} style={{ width: monthColW }} />)}
              <col style={{ width: totalColW }} />
            </colgroup>
            <thead>
              {/* Quarter lock row */}
              <tr>
                <th rowSpan={2} style={{ padding: '10px 20px', textAlign: 'left', verticalAlign: 'bottom', background: 'var(--surface)', ...stickyL, zIndex: 2 }}>Name</th>
                {qGroups.map(g => {
                  const locked = lockedQuarters.has(g.absQuarter);
                  return (
                    <th key={g.absQuarter} colSpan={g.span} style={{
                      padding: '6px 4px', textAlign: 'center',
                      background: locked ? 'var(--surface-3)' : 'transparent',
                      borderLeft: '1px solid var(--border)',
                    }}>
                      <button
                        onClick={() => toggleQuarter(g.absQuarter)}
                        disabled={!canEdit}
                        title={locked ? 'Locked (Actual) — click to unlock (ETC)' : 'Unlocked (ETC) — click to lock (Actual)'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          cursor: canEdit ? 'pointer' : 'default',
                          fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em',
                          padding: '2px 8px', borderRadius: 20,
                          border: `1px solid ${locked ? 'var(--border-2)' : 'var(--accent)'}`,
                          background: locked ? 'var(--surface)' : 'var(--accent-light)',
                          color: locked ? 'var(--text-2)' : 'var(--accent)', fontFamily: 'inherit',
                        }}
                      >
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
                          {locked
                            ? <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" />
                            : <path d="M4 5.5V4a2 2 0 0 1 3.8-.8" />}
                        </svg>
                        Q{g.q} {g.year}
                      </button>
                    </th>
                  );
                })}
                <th rowSpan={2} style={{ padding: '10px 8px', textAlign: 'right', background: 'var(--surface-3)', verticalAlign: 'bottom', ...stickyR, zIndex: 2 }}>Total</th>
              </tr>
              {/* Month row */}
              <tr>
                {months.map((mm, i) => {
                  const locked = lockedQuarters.has(mm.absQuarter);
                  return (
                    <th key={i} style={{
                      padding: '6px 4px', textAlign: 'center', fontSize: 10.5, lineHeight: 1.2,
                      color: locked ? 'var(--text-3)' : 'var(--accent)',
                      background: locked ? 'var(--surface-3)' : 'transparent',
                    }}>
                      {MONTHS[mm.m]}<br />
                      <span style={{ fontSize: 9, color: 'var(--text-3)' }}>{String(mm.year).slice(2)}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const initials = row.role.split(' ').map(n => n[0]).join('').slice(0, 2);
                const isConfirming = confirmingId === row.id;
                const rowTotal = months.reduce((s, _, i) => s + (row.fte[i] || 0), 0);

                return (
                  <React.Fragment key={row.id}>
                    <tr style={{
                      borderBottom: isConfirming ? 'none' : '1px solid var(--border)',
                      background: isConfirming ? 'rgba(240,88,88,0.04)' : '',
                      transition: 'background .15s',
                    }}>
                      <td style={{ padding: '8px 12px 8px 20px', background: 'var(--surface)', ...stickyL }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--accent-light)', border: '1px solid rgba(232,150,31,.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 800, color: 'var(--accent)',
                          }}>{initials}</div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.role}</div>
                            {row.fn && <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.fn}</div>}
                          </div>
                          {canEdit && !isConfirming && (
                            <button className="btn btn-icon" onClick={() => setConfirmingId(row.id)}
                              title={`Remove ${row.role}`} style={{ color: 'var(--text-3)', padding: '4px', flexShrink: 0 }}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M3 3.5l.7 8a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9l.7-8"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      {months.map((mm, i) => {
                        const locked = lockedQuarters.has(mm.absQuarter);
                        const val = row.fte[i] || 0;
                        return (
                          <td key={i} style={{ padding: '4px 5px', background: locked ? 'var(--surface-3)' : 'transparent' }}>
                            {locked ? (
                              <div className="eac-cell eac-locked" style={{ display: 'block', width: '100%', minWidth: 0, textAlign: 'center' }}>
                                {val > 0 ? val.toFixed(1) : '—'}
                              </div>
                            ) : (
                              <input
                                type="number" min="0" max="10" step="0.5"
                                className="eac-cell eac-editable"
                                value={val || ''}
                                placeholder="0"
                                onChange={e => updateFte(row.id, i, e.target.value)}
                                style={{ display: 'block', width: '100%', minWidth: 0, textAlign: 'center' }}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', background: 'var(--surface-3)', ...stickyR }}>
                        {rowTotal > 0 ? rowTotal.toFixed(1) : '—'}
                      </td>
                    </tr>

                    {isConfirming && (
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bad-bg)' }}>
                        <td colSpan={months.length + 2} style={{ padding: 0, background: 'var(--bad-bg)' }}>
                          <div style={{
                            position: 'sticky', left: 0, zIndex: 1, width: 'fit-content', maxWidth: '100%',
                            padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--bad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 1L13.06 12H.94L7 1Z"/><path d="M7 5v3M7 10v.5"/>
                            </svg>
                            <span style={{ fontSize: 13, color: 'var(--bad-text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              Remove <strong>{row.role}</strong> from this project?
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingId(null)}>Cancel</button>
                              <button className="btn btn-danger btn-sm" onClick={() => removeRow(row.id)}>Remove</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={months.length + 2} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, position: 'sticky', left: 0, background: 'var(--surface)' }}>
                    No people added yet — click "Add person" to assign from the pool.
                  </td>
                </tr>
              )}

              {/* Open placeholder resource requests — read-only forecast rows */}
              {reqRows.map(rq => {
                const rangeLabel = reqRangeLabel(rq);
                const rowTotal = rq.fte.reduce((s, v) => s + (v || 0), 0);
                return (
                  <tr key={`req-${rq.id}`} style={{ borderBottom: '1px dashed var(--border-2)', background: 'var(--accent-light)' }}>
                    <td style={{ padding: '8px 12px 8px 20px', background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))', ...stickyL }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.04em', color: 'var(--accent)', border: '1px dashed var(--accent)', borderRadius: 4, padding: '2px 5px' }}>REQ</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rq.function_title}{rq.grade ? ` · ${rq.grade}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3, marginTop: 1 }}>
                            Requested{rangeLabel ? ` · ${rangeLabel}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    {months.map((mm, i) => {
                      const val = rq.fte[i] || 0;
                      return (
                        <td key={i} style={{ padding: '4px 5px' }}>
                          <div className="eac-cell" style={{ display: 'block', width: '100%', minWidth: 0, textAlign: 'center', fontStyle: 'italic', color: val > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                            {val > 0 ? val.toFixed(1) : '—'}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))', ...stickyR }}>
                      {rowTotal > 0 ? rowTotal.toFixed(1) : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* Footer: FTE totals */}
              <tr style={{ background: 'var(--surface-3)', borderTop: '2px solid var(--border-2)', fontWeight: 700 }}>
                <td style={{ padding: '10px 20px', fontSize: 13, background: 'var(--surface-3)', ...stickyL }}>Total FTE</td>
                {colFte.map((t, i) => (
                  <td key={i} style={{ padding: '10px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: t === 0 ? 'var(--text-3)' : 'var(--text)' }}>
                    {t > 0 ? t.toFixed(1) : '—'}
                  </td>
                ))}
                <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', background: 'var(--surface-3)', ...stickyR }}>
                  {totalFte.toFixed(1)}
                </td>
              </tr>

              {/* Footer: cost totals */}
              <tr style={{ background: 'var(--accent-light)', fontWeight: 600, color: 'var(--accent)' }}>
                <td style={{ padding: '10px 20px', fontSize: 13, background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))', ...stickyL }}>Est. labour cost ($K)</td>
                {colCost.map((t, i) => (
                  <td key={i} style={{ padding: '10px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: t === 0 ? 'var(--accent-mid)' : 'var(--accent)' }}>
                    {t > 0 ? t.toFixed(0) : '—'}
                  </td>
                ))}
                <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 14, background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))', ...stickyR }}>
                  {totalCostK.toFixed(0)}
                </td>
              </tr>

              {/* Footer: requested (forecast) headcount + cost */}
              {reqRows.length > 0 && (
                <>
                  <tr style={{ background: 'var(--surface)', fontWeight: 600, color: 'var(--accent)', borderTop: '1px dashed var(--border-2)' }}>
                    <td style={{ padding: '8px 20px', fontSize: 12, background: 'var(--surface)', ...stickyL }}>Requested FTE (forecast)</td>
                    {reqColFte.map((t, i) => (
                      <td key={i} style={{ padding: '8px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontStyle: 'italic', color: t === 0 ? 'var(--text-3)' : 'var(--accent)' }}>
                        {t > 0 ? t.toFixed(1) : '—'}
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', background: 'var(--surface)', ...stickyR }}>
                      {reqFteTotal.toFixed(1)}
                    </td>
                  </tr>
                  <tr style={{ background: 'var(--surface)', fontWeight: 600, color: 'var(--accent)' }}>
                    <td style={{ padding: '8px 20px', fontSize: 12, background: 'var(--surface)', ...stickyL }}>Requested cost ($K · ETC)</td>
                    {reqColCost.map((t, i) => (
                      <td key={i} style={{ padding: '8px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontStyle: 'italic', color: t === 0 ? 'var(--text-3)' : 'var(--accent)' }}>
                        {t > 0 ? t.toFixed(0) : '—'}
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, background: 'var(--surface)', ...stickyR }}>
                      {reqCostK.toFixed(0)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder headcount requests (resourcing asks, no real name) */}
      <PlaceholderRequests projectId={p.id} role={role} session={session} RATES={RATES} requests={requests} reload={reloadRequests} />

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}

/* ── Placeholder headcount requests ──────────────────────────────────────
   A PM-raised "resourcing need" that is NOT tied to a real person and does
   not feed actual cost. Every ask carries a justification (remarks). Open
   requests are surfaced to the PD via the project Overview alerts, creating
   a visible, timestamped record of "PM asked for help". */
const REQ_STATUS = {
  open:     { label: 'Open',     color: 'var(--accent)' },
  resolved: { label: 'Resolved', color: 'var(--ok)' },
  declined: { label: 'Declined', color: 'var(--text-3)' },
};

function relTime(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

// "From -> To" label for a request's need window.
function reqRangeLabel(rq) {
  const f = rq.need_month ? `${MONTHS[(Number(rq.need_month) || 1) - 1]}${rq.need_year ? ` ${rq.need_year}` : ''}` : null;
  const t = rq.need_end_month ? `${MONTHS[(Number(rq.need_end_month) || 1) - 1]}${rq.need_end_year ? ` ${rq.need_end_year}` : ''}` : null;
  if (f && t) return `${f} → ${t}`;
  if (f) return `from ${f}`;
  if (t) return `until ${t}`;
  return null;
}

function PlaceholderRequests({ projectId, role, session, RATES, requests, reload }) {
  const canRaise   = role === 'Project Manager' || role === 'Leader' || role === 'Admin';
  const canResolve = role === 'Project Director' || role === 'Leader' || role === 'Admin';

  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ function_title: '', grade: '', need_month: '', need_year: '', need_end_month: '', need_end_year: '', remarks: '' });
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNote, setResolveNote] = useState('');

  const grades = (RATES || []).map(r => r.grade);
  const openCount = requests.filter(r => r.status === 'open').length;

  function reset() {
    setForm({ function_title: '', grade: '', need_month: '', need_year: '', need_end_month: '', need_end_year: '', remarks: '' });
    setAdding(false); setErr(null);
  }

  async function submit() {
    if (!form.function_title.trim()) { setErr('Role / function is required.'); return; }
    if (!form.remarks.trim())        { setErr('A justification (remarks) is required.'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post('/api/resource-requests', {
        project_id: projectId,
        function_title: form.function_title.trim(),
        grade: form.grade || null,
        need_year: form.need_year || null,
        need_month: form.need_month || null,
        need_end_year: form.need_end_year || null,
        need_end_month: form.need_end_month || null,
        remarks: form.remarks.trim(),
        created_by: session?.id || null,
      });
      reset(); reload();
    } catch (e) { setErr(e?.message || 'Could not save request.'); }
    finally { setBusy(false); }
  }

  async function setStatus(id, status, note) {
    setBusy(true);
    try {
      await api.patch(`/api/resource-requests/${id}`, {
        status, resolved_by: session?.id || null,
        resolution_note: note != null ? note : undefined,
      });
      setResolvingId(null); setResolveNote(''); reload();
    } catch (e) { setErr(e?.message || 'Could not update request.'); }
    finally { setBusy(false); }
  }

  async function del(id) {
    setBusy(true);
    try { await api.del(`/api/resource-requests/${id}`); reload(); }
    catch (e) { setErr(e?.message || 'Could not delete request.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ overflow: 'hidden', marginTop: 20 }}>
      <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Placeholder headcount requests
            {openCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid rgba(232,150,31,.25)', borderRadius: 20, padding: '1px 8px' }}>
                {openCount} open
              </span>
            )}
          </h4>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
            Un-named resourcing asks (distinct from confirmed headcount above). Open requests are flagged to the PD on the project Overview.
          </div>
          {err && <div style={{ fontSize: 11, color: 'var(--bad)', marginTop: 4 }}>{err}</div>}
        </div>
        {canRaise && !adding && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(true); setErr(null); }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 1v10M1 6h10" />
            </svg>
            New request
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
            <label style={{ flex: '2 1 200px', fontSize: 11, color: 'var(--text-3)' }}>
              Role / function *
              <input className="input" style={{ marginTop: 4 }} placeholder="e.g. System Engineer"
                value={form.function_title} autoFocus
                onChange={e => setForm(f => ({ ...f, function_title: e.target.value }))} />
            </label>
            <label style={{ flex: '0 1 90px', fontSize: 11, color: 'var(--text-3)' }}>
              Grade
              <select className="input" style={{ marginTop: 4 }} value={form.grade}
                onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
                <option value="">—</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label style={{ flex: '0 1 110px', fontSize: 11, color: 'var(--text-3)' }}>
              From (month)
              <select className="input" style={{ marginTop: 4 }} value={form.need_month}
                onChange={e => setForm(f => ({ ...f, need_month: e.target.value }))}>
                <option value="">—</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
            <label style={{ flex: '0 1 90px', fontSize: 11, color: 'var(--text-3)' }}>
              From (year)
              <input className="input" type="number" min="2024" max="2035" style={{ marginTop: 4 }}
                placeholder={String(new Date().getFullYear())} value={form.need_year}
                onChange={e => setForm(f => ({ ...f, need_year: e.target.value }))} />
            </label>
            <label style={{ flex: '0 1 110px', fontSize: 11, color: 'var(--text-3)' }}>
              To (month)
              <select className="input" style={{ marginTop: 4 }} value={form.need_end_month}
                onChange={e => setForm(f => ({ ...f, need_end_month: e.target.value }))}>
                <option value="">—</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
            <label style={{ flex: '0 1 90px', fontSize: 11, color: 'var(--text-3)' }}>
              To (year)
              <input className="input" type="number" min="2024" max="2035" style={{ marginTop: 4 }}
                placeholder={String(new Date().getFullYear())} value={form.need_end_year}
                onChange={e => setForm(f => ({ ...f, need_end_year: e.target.value }))} />
            </label>
          </div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
            Justification (remarks) *
            <textarea className="input" style={{ marginTop: 4, minHeight: 54, resize: 'vertical' }}
              placeholder='e.g. "Spike in Feb due to commissioning overlap on two sites"'
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>Submit request</button>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={reset}>Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {requests.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          No placeholder requests. {canRaise ? 'Raise one when you need resourcing help that has no named person yet.' : ''}
        </div>
      ) : (
        <div>
          {requests.map(rq => {
            const st = REQ_STATUS[rq.status] || REQ_STATUS.open;
            const needBy = rq.need_month ? `${MONTHS[rq.need_month - 1]}${rq.need_year ? ` ${rq.need_year}` : ''}` : null;
            const isOpen = rq.status === 'open';
            return (
              <div key={rq.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, marginTop: 2, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', color: st.color, background: `color-mix(in srgb, ${st.color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${st.color} 35%, transparent)`, borderRadius: 20, padding: '2px 9px' }}>
                  {st.label}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {rq.function_title}
                    {rq.grade && <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 6 }}>{rq.grade}</span>}
                    <span style={{ color: 'var(--text-3)', fontWeight: 500, marginLeft: 8 }}>
                      {Number(rq.headcount) % 1 === 0 ? Number(rq.headcount) : Number(rq.headcount).toFixed(1)} FTE
                    </span>
                    {needBy && <span style={{ color: 'var(--text-3)', fontWeight: 500, marginLeft: 8 }}>· need by {needBy}</span>}
                  </div>
                  {rq.remarks && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3, whiteSpace: 'pre-wrap' }}>{rq.remarks}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                    Raised{rq.created_by_name ? ` by ${rq.created_by_name}` : ''} {relTime(rq.created_at)}
                    {!isOpen && rq.resolved_by_name && <> · {st.label.toLowerCase()} by {rq.resolved_by_name} {relTime(rq.resolved_at)}</>}
                    {!isOpen && rq.resolution_note && <> — "{rq.resolution_note}"</>}
                  </div>

                  {/* Resolve inline note */}
                  {resolvingId === rq.id && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <label style={{ flex: '1 1 240px', fontSize: 11, color: 'var(--text-3)' }}>
                        Response note (optional)
                        <input className="input" style={{ marginTop: 4 }} placeholder="e.g. Approved — assigning E4 from pool"
                          value={resolveNote} autoFocus
                          onChange={e => setResolveNote(e.target.value)} />
                      </label>
                      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setStatus(rq.id, 'resolved', resolveNote)}>Mark resolved</button>
                      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setStatus(rq.id, 'declined', resolveNote)}>Decline</button>
                      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setResolvingId(null); setResolveNote(''); }}>Cancel</button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ flexShrink: 0, display: 'flex', gap: 6 }}>
                  {isOpen && canResolve && resolvingId !== rq.id && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setResolvingId(rq.id); setResolveNote(''); }}>Respond</button>
                  )}
                  {isOpen && !canResolve && canRaise && (
                    <button className="btn btn-icon" title="Withdraw request" disabled={busy} onClick={() => del(rq.id)} style={{ color: 'var(--text-3)' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M3 3.5l.7 8a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9l.7-8"/>
                      </svg>
                    </button>
                  )}
                  {!isOpen && canResolve && (
                    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setStatus(rq.id, 'open')}>Reopen</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

