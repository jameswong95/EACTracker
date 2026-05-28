import React, { useState, useRef, useEffect } from 'react';
import { RESOURCE_POOL, RATES } from '../data/mock.js';
import { entries as auditEntries } from '../data/auditLog.js';

const ALL_SCREENS = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'portfolio',    label: 'Portfolio' },
  { id: 'project',      label: 'Project' },
  { id: 'eac',          label: 'EAC Editor' },
  { id: 'resource',     label: 'Resource Plan' },
  { id: 'revrec',       label: 'Rev. Rec.' },
  { id: 'sap-import',   label: 'SAP Import' },
  { id: 'standards',    label: 'Standards' },
  { id: 'assists',      label: 'AI Assist' },
  { id: 'pd-approvals', label: 'PD Approvals' },
];

const ROLE_LABELS = ['PM', 'PD', 'Finance'];

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

function FilterSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const label = options.find(o => o.value === value)?.label ?? 'All roles';
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        padding: '6px 26px 6px 9px', borderRadius: 6,
        border: '1px solid var(--border)', background: 'var(--surface-2)',
        color: 'var(--text)', fontSize: 12, fontFamily: 'inherit',
        cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap',
      }}>
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }}>
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 999,
          minWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.15)', overflow: 'hidden',
        }}>
          {options.map(o => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '7px 11px', fontSize: 12, cursor: 'pointer',
                color: o.value === value ? 'var(--accent)' : 'var(--text)',
                background: 'transparent', fontWeight: o.value === value ? 600 : 400,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{o.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourcePoolTab() {
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
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>Screen</th>
              {ROLE_LABELS.map(r => (
                <th key={r} style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--text)', fontSize: 11, borderBottom: '1px solid var(--border)', width: 48 }}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_SCREENS.map((s, i) => (
              <tr key={s.id} style={{
                borderBottom: i < ALL_SCREENS.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
              }}>
                <td style={{ padding: '8px 10px', fontWeight: 500, color: 'var(--text)', fontSize: 12 }}>{s.label}</td>
                {ROLE_LABELS.map(r => (
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

function AuditTab() {
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('');
  const roleOptions = [
    { value: '', label: 'All roles' },
    ...Array.from(new Set(auditEntries.map(e => e.role))).map(r => ({ value: r, label: r })),
  ];
  const shown = auditEntries.filter(e =>
    (!q || e.action.toLowerCase().includes(q.toLowerCase()) ||
     e.detail.toLowerCase().includes(q.toLowerCase()) ||
     e.user.toLowerCase().includes(q.toLowerCase())) &&
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
        <FilterSelect value={roleF} onChange={setRoleF} options={roleOptions} />
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
          {shown.map((e, i) => (
            <div key={e.id} style={{
              padding: '9px 12px',
              borderBottom: i < shown.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)', flex: 1 }}>{e.action}</span>
                <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'var(--surface-3)', color: 'var(--text-2)' }}>{e.role}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>{e.user}</span>
                {e.detail && <span style={{ fontSize: 11, color: 'var(--text-3)', flex: 1 }}>{e.detail}</span>}
                <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{e.ts}</span>
              </div>
            </div>
          ))}
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
