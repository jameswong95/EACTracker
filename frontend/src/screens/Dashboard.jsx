import React from 'react';
import { useProjects, fmt, fmtPct, statusLabel } from '../data/store.js';
import { Sparkline } from '../components/Charts.jsx';

const NOW = new Date();
const PERIOD_CLOSE = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 10);
const daysLeft = Math.max(0, Math.round((PERIOD_CLOSE - NOW) / 86400000));

function StatusDot({ status }) {
  const colors = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', info: 'var(--info)' };
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
      background: colors[status] || 'var(--text-3)',
    }} />
  );
}

export default function Dashboard({ navigate, session }) {
  const { projects, loading } = useProjects();
  const myName = session?.full_name;
  const myProjects = myName ? projects.filter(p => p.pm === myName || p.pd === myName) : projects;
  const portfolioEac = myProjects.reduce((a, p) => a + p.eac, 0);
  const portfolioBudget = myProjects.reduce((a, p) => a + p.budget, 0);
  const variance = portfolioEac - portfolioBudget;

  const tasks = buildTasks(myProjects);

  return (
    <div className="screen">

      {/* Header */}
      <div className="dash-header">
        <div>
          <div className="dash-greeting">Good morning, {session?.full_name?.split(' ')[0] || 'there'}</div>
          <div className="dash-period-label">
            {NOW.toLocaleString('en', { month: 'long', year: 'numeric' })} &middot; Period closes in {daysLeft} days
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('assists')}>
          Draft monthly update
        </button>
      </div>

      {/* Period pulse strip */}
      <div className="dash-pulse">
        <div className="pulse-stat">
          My projects <strong>{myProjects.length}</strong>
        </div>
        <div className="pulse-sep" />
        <div className="pulse-stat">
          Portfolio EAC <strong className="mono">{fmt(portfolioEac)}</strong>
        </div>
        <div className="pulse-sep" />
        <div className="pulse-stat">
          vs budget{' '}
          <strong className="mono" style={{ color: variance > 0 ? 'var(--warn)' : 'var(--ok)' }}>
            {variance >= 0 ? '+' : ''}{fmt(variance)}
          </strong>
        </div>
        <div className="pulse-sep" />
        <div className="pulse-stat">
          {NOW.toLocaleString('en', { month: 'short' })} closes <strong>{daysLeft} days</strong>
        </div>
      </div>

      {/* Two-column body */}
      <div className="dash-body">

        {/* Left — Requires attention */}
        <div className="dash-panel">
          <div className="dash-panel-head">Requires attention</div>
          {tasks.length === 0 ? (
            <div className="dash-task-row">
              <StatusDot status="ok" />
              <div>
                <div className="dash-task-label">All projects on track</div>
                <div className="dash-task-sub">No actions required for May period</div>
              </div>
            </div>
          ) : tasks.map((t, i) => (
            <div key={i} className="dash-task-row" style={{ cursor: t.action ? 'pointer' : 'default' }}
              onClick={() => t.action && navigate(t.action, t.actionId)}>
              <StatusDot status={t.status} />
              <div className="grow min-w-0">
                <div className="dash-task-label">{t.label}</div>
                <div className="dash-task-sub">{t.sub}</div>
              </div>
              {t.action && (
                <span className="dash-proj-cta" style={{ fontSize: 13 }}>&#8594;</span>
              )}
            </div>
          ))}
        </div>

        {/* Right — My projects */}
        <div className="dash-panel">
          <div className="dash-panel-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>My projects</span>
            <span style={{ cursor: 'pointer', fontWeight: 400, letterSpacing: 'normal', textTransform: 'none', fontSize: 11 }}
              onClick={() => navigate('portfolio')}>
              View all &#8594;
            </span>
          </div>
          {myProjects.map(p => <ProjectRow key={p.id} project={p} navigate={navigate} />)}
        </div>

      </div>

      {/* Recent updates */}
      <div className="dash-panel mt-4">
        <div className="dash-panel-head">Recent updates</div>
        {myProjects.flatMap(p =>
          (p.updates || []).slice(0, 1).map(u => ({ ...u, projectName: p.name, pid: p.id, pStatus: p.status }))
        ).map((u, i, arr) => (
          <div key={i} className="dash-task-row"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--surface-2)' : 'none' }}>
            <StatusDot status={u.status || u.pStatus} />
            <div className="grow min-w-0">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span className="dash-task-label" style={{ fontWeight: 700 }}>{u.projectName}</span>
                <span className="dash-task-sub" style={{ margin: 0 }}>{u.month}</span>
              </div>
              <div className="dash-task-sub" style={{ margin: 0 }}>{u.text}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

function ProjectRow({ project: p, navigate }) {
  const variance = (p.eac - p.budget) / p.budget * 100;
  return (
    <div className="dash-proj-row" onClick={() => navigate('project', p.id)} style={{ cursor: 'pointer' }}>
      <StatusDot status={p.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="dash-proj-name">{p.name}</div>
        <div className="dash-proj-code">{p.id}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="dash-proj-eac">{fmt(p.eac)}</div>
        <div className="dash-proj-var" style={{ color: variance > 0 ? 'var(--warn)' : 'var(--ok)' }}>
          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
        </div>
      </div>
      {p.trend && (
        <div style={{ flexShrink: 0 }}>
          <Sparkline data={p.trend} width={60} height={24} />
        </div>
      )}
      <span className="dash-proj-cta">&#8594;</span>
    </div>
  );
}

function buildTasks(myProjects) {
  const tasks = [];
  myProjects.forEach(p => {
    const variance = (p.eac - p.budget) / p.budget * 100;
    if (variance > 2) {
      tasks.push({
        status: 'warn',
        label: `${p.name} — EAC variance ${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`,
        sub: 'Review cost items and submit updated EAC before period close',
        action: 'eac',
        actionId: p.id,
      });
    }
  });
  if (daysLeft <= 14) {
    tasks.push({
      status: 'info',
      label: `May period closes in ${daysLeft} days`,
      sub: 'Ensure all EAC updates are submitted and approved',
      action: null,
    });
  }
  return tasks;
}
