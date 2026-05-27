import React, { useState, useMemo } from 'react';
import { projects, fmt, fmtPct, statusLabel, ROLE_USERS } from '../data/mock.js';
import { Sparkline } from '../components/Charts.jsx';

export default function Portfolio({ navigate, role }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'name', dir: 1 });

  const baseList = role === 'PM' ? projects.filter(p => p.pm === ROLE_USERS.PM.name) : projects;

  const filtered = useMemo(() => {
    let list = [...baseList];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.pm.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    list.sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
    return list;
  }, [baseList, search, statusFilter, sort]);

  const totalBudget = baseList.reduce((a, p) => a + p.budget, 0);
  const totalEac = baseList.reduce((a, p) => a + p.eac, 0);
  const overdue = baseList.filter(p => {
    const d = new Date(p.lastUpdate);
    return (new Date('2026-05-26') - d) / 86400000 > 30;
  }).length;

  function toggleSort(key) {
    setSort(s => s.key === key ? { key, dir: s.dir * -1 } : { key, dir: 1 });
  }

  function Th({ col, label }) {
    const active = sort.key === col;
    return (
      <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          <span style={{ opacity: active ? 1 : 0.3, fontSize: 10 }}>{active && sort.dir === -1 ? '↓' : '↑'}</span>
        </span>
      </th>
    );
  }

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">Portfolio</div>
          <div className="page-sub">All projects · K. Rajah (Project Director)</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm">⤓ Export</button>
          <button className="btn btn-primary btn-sm">+ New project</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-tile">
          <div className="kpi-label">Portfolio Budget</div>
          <div className="kpi-value">{fmt(totalBudget)}</div>
          <div className="kpi-sub">{projects.length} active projects</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Portfolio EAC</div>
          <div className="kpi-value">{fmt(totalEac)}</div>
          <div className="kpi-sub" style={{ color: totalEac > totalBudget ? 'var(--warn)' : 'var(--ok)' }}>
            {fmtPct(totalEac, totalBudget)} vs budget
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Status mix</div>
          <div className="flex items-center gap-3 mt-2">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ok)' }}>{projects.filter(p => p.status === 'ok').length} on track</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--warn)' }}>{projects.filter(p => p.status === 'warn').length} at risk</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--bad)' }}>{projects.filter(p => p.status === 'bad').length} delayed</span>
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Overdue updates</div>
          <div className="kpi-value" style={{ color: overdue > 0 ? 'var(--bad)' : 'var(--ok)' }}>{overdue}</div>
          <div className="kpi-sub">&gt; 30 days without update</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input className="input" placeholder="🔍 Search project or PM…"
          style={{ width: 240 }} value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {[['all','All'], ['ok','On Track'], ['warn','At Risk'], ['bad','Delayed']].map(([k, l]) => (
            <button key={k} onClick={() => setStatusFilter(k)}
              className={`btn btn-sm ${statusFilter === k ? 'btn-secondary' : 'btn-ghost'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="grow" />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} of {projects.length} shown</span>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 8 }}></th>
                <Th col="name"    label="Project" />
                <Th col="pm"      label="PM" />
                <Th col="budget"  label="Budget" />
                <Th col="eac"     label="EAC" />
                <th>Variance</th>
                <Th col="percentComplete" label="Complete" />
                <th>Status</th>
                <Th col="lastUpdate" label="Last update" />
                <th>Trend</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const variance = (p.eac - p.budget) / p.budget * 100;
                const rowClass = p.status === 'bad' ? 'row-bad' : p.status === 'warn' ? 'row-warn' : '';
                return (
                  <tr key={p.id} className={rowClass} onClick={() => navigate('project', p.id)}>
                    <td style={{ padding: '13px 0 13px 12px' }}>
                      <span className={`dot dot-${p.status}`} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.id}</div>
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{p.pm}</td>
                    <td className="num" style={{ fontWeight: 500 }}>{fmt(p.budget)}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{fmt(p.eac)}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: variance > 0 ? 'var(--warn)' : 'var(--ok)' }}>
                        {(variance >= 0 ? '+' : '')}{variance.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress" style={{ width: 60 }}>
                          <div className={`progress-fill pf-${p.status}`} style={{ width: `${p.percentComplete}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.percentComplete}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${p.status}`}>{statusLabel(p.status)}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.lastUpdate}</td>
                    <td><Sparkline data={p.trend} width={72} height={24} /></td>
                    <td>
                      <button className="btn btn-ghost btn-sm"
                        onClick={e => { e.stopPropagation(); navigate('project', p.id); }}>
                        Open →
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
