import React, { useState } from 'react';
import { useResourcePool, useRates, useAudit } from '../data/store.js';
import Select from './Select.jsx';
import { APP_MODULES, APP_ROLES, DEFAULT_ROLE_BADGE, PERMISSION_ROLES, ROLE_BADGE } from '../config/permissions.js';

function gradeColor(g) {
  if (g === 'E5') return 'var(--bad)';
  if (g === 'E4') return 'var(--warn-text)';
  if (g === 'E3') return 'var(--accent)';
  return 'var(--text-3)';
}
function gradeBg(g) {
  if (g === 'E5') return 'var(--bad-bg)';
  if (g === 'E4') return 'var(--warn-bg)';
  if (g === 'E3') return 'rgba(99,102,241,0.12)';
  return 'var(--surface-3)';
}

function ResourcePoolTab() {
  const RESOURCE_POOL = useResourcePool();
  const RATES = useRates();
  const [q, setQ] = useState('');
  const filtered = RESOURCE_POOL.filter(r =>
    !q ||
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.roles.some(fn => fn.toLowerCase().includes(q.toLowerCase())) ||
    r.grade.toLowerCase().includes(q.toLowerCase())
  );
  const rateOf = g => RATES.find(r => r.grade === g)?.daily ?? '—';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search name, grade, function..."
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none',
          }} />
        <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {filtered.length}/{RESOURCE_POOL.length}
        </span>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {filtered.map((r, i) => (
          <div key={r.id} style={{
            padding: '10px 12px',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
              }}>
                {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', flex: 1 }}>{r.name}</span>
              <span style={{
                padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                color: gradeColor(r.grade), background: gradeBg(r.grade),
              }}>{r.grade}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                ${rateOf(r.grade)}/d
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, paddingLeft: 34 }}>
              {r.roles.map((fn, j) => (
                <span key={j} style={{
                  padding: '2px 6px', borderRadius: 4,
                  background: 'var(--surface-3)', color: 'var(--text-2)',
                  fontSize: 10, fontWeight: 500,
                }}>{fn}</span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 12 }}>No match</div>
        )}
      </div>
    </div>
  );
}

function PermissionsTab({ roleAllowed, setRoleAllowed }) {
  function toggle(role, screenId) {
    setRoleAllowed(prev => {
      const cur = prev[role] || [];
      const next = cur.includes(screenId) ? cur.filter(s => s !== screenId) : [...cur, screenId];
      return { ...prev, [role]: next };
    });
  }

  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 0, marginBottom: 12 }}>
        Changes take effect immediately. Admin always has full access.
      </p>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 820 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>Screen</th>
              {PERMISSION_ROLES.map(r => (
                <th key={r} style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--text)', fontSize: 11, borderBottom: '1px solid var(--border)', minWidth: 70 }}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {APP_MODULES.map((s, i) => (
              <tr key={s.id} style={{
                borderBottom: i < APP_MODULES.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
              }}>
                <td style={{ padding: '8px 10px', color: 'var(--text)', fontSize: 12 }}>
                  <div style={{ fontWeight: 650 }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>{s.group}</div>
                </td>
                {PERMISSION_ROLES.map(r => (
                  <td key={r} style={{ padding: '8px', textAlign: 'center' }}>
                    <input type="checkbox"
                      checked={(roleAllowed[r] || []).includes(s.id)}
                      onChange={() => toggle(r, s.id)}
                      style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function auditRoleOptions(entries) {
  const seen = new Set(APP_ROLES);
  const extras = entries
    .map(entry => entry.role)
    .filter(Boolean)
    .filter(role => {
      if (seen.has(role)) return false;
      seen.add(role);
      return true;
    });
  return [
    { value: '', label: 'All roles' },
    ...APP_ROLES.map(role => ({ value: role, label: role })),
    ...extras.map(role => ({ value: role, label: role })),
  ];
}

function auditActionLabel(action) {
  return String(action || '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function AuditTab() {
  const { entries: auditEntries } = useAudit();
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('');
  const roleOptions = auditRoleOptions(auditEntries);
  const shown = auditEntries.filter(e =>
    (!q || String(e.action || '').toLowerCase().includes(q.toLowerCase()) ||
     String(e.detail || '').toLowerCase().includes(q.toLowerCase()) ||
     String(e.entityId || '').toLowerCase().includes(q.toLowerCase()) ||
     String(e.user || '').toLowerCase().includes(q.toLowerCase())) &&
    (!roleF || e.role === roleF)
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search action, user..."
          style={{
            flex: 1, minWidth: 120, padding: '6px 10px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none',
          }} />
        <Select value={roleF} onChange={setRoleF} options={roleOptions} style={{ width: 160 }} />
        <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{shown.length} entries</span>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 12 }}>
          {auditEntries.length === 0
            ? 'No entries yet — actions appear here as users work.'
            : 'No entries match.'}
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {shown.map((e, i) => {
            const badge = ROLE_BADGE[e.role] || DEFAULT_ROLE_BADGE;
            return (
            <div key={e.id} style={{
              padding: '10px 12px',
              borderBottom: i < shown.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <span style={{ fontWeight: 750, fontSize: 12, color: 'var(--text)', flex: 1 }}>{auditActionLabel(e.action)}</span>
                <span className="audit-role-chip" style={{ color: badge.color, background: badge.bg, minHeight: 20, fontSize: 10 }}>{e.role}</span>
              </div>
              <div style={{ display: 'grid', gap: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 650 }}>{e.user}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)', overflowWrap: 'anywhere' }}>{e.detail || e.entityId || '-'}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{e.ts}</span>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

const DRAWER_TABS = [
  { id: 'pool',        label: 'Resource Pool' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'audit',       label: 'Audit Trail' },
];

export default function AdminDrawer({ activeTab, setActiveTab, onClose, sidebarWidth, roleAllowed, setRoleAllowed }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 199,
        background: 'rgba(0,0,0,0.18)',
      }} />

      <div style={{
        position: 'fixed',
        left: sidebarWidth,
        top: 0,
        width: 360,
        height: '100vh',
        zIndex: 200,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'left .2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', flex: 1 }}>Admin</span>
            <button onClick={onClose} style={{
              width: 24, height: 24, borderRadius: 4, border: 'none',
              background: 'var(--surface-2)', color: 'var(--text-3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 2, marginBottom: -1 }}>
            {DRAWER_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '6px 11px', fontSize: 12,
                fontWeight: activeTab === t.id ? 700 : 500,
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === t.id ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer', fontFamily: 'inherit',
                borderRadius: '4px 4px 0 0', transition: 'color .12s',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {activeTab === 'pool'        && <ResourcePoolTab />}
          {activeTab === 'permissions' && <PermissionsTab roleAllowed={roleAllowed} setRoleAllowed={setRoleAllowed} />}
          {activeTab === 'audit'       && <AuditTab />}
        </div>
      </div>
    </>
  );
}
