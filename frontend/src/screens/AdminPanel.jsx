import React, { useState, useRef, useEffect } from 'react';
import { RESOURCE_POOL } from '../data/mock.js';
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

/* Reusable custom dropdown to avoid native <select> */
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
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '7px 28px 7px 10px', borderRadius: 6,
          border: '1px solid var(--border)', background: 'var(--surface-2)',
          color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
          cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap',
        }}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 999,
          minWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.14)', overflow: 'hidden',
        }}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                color: o.value === value ? 'var(--accent)' : 'var(--text)',
                background: o.value === value ? 'var(--surface-2)' : 'transparent',
                fontWeight: o.value === value ? 600 : 400,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = o.value === value ? 'var(--surface-2)' : 'transparent'; }}
            >
              {o.label}
            </div>
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
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search name, grade or function..."
          style={{
            flex: 1, padding: '7px 12px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {filtered.length} / {RESOURCE_POOL.length}
        </span>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Name', 'Grade', 'Functions'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                  color: 'var(--text-2)', fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.06em', borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
              }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--accent)', color: '#fff', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    color: gradeColor(r.grade), background: gradeBg(r.grade),
                  }}>{r.grade}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {r.roles.map((fn, j) => (
                      <span key={j} style={{
                        padding: '2px 7px', borderRadius: 4,
                        background: 'var(--surface-3)', color: 'var(--text-2)',
                        fontSize: 11, fontWeight: 500,
                      }}>{fn}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  No resources match
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionsTab({ roleAllowed, setRoleAllowed }) {
  function toggle(role, screenId) {
    setRoleAllowed(prev => {
      const cur = prev[role] || [];
      const next = cur.includes(screenId)
        ? cur.filter(s => s !== screenId)
        : [...cur, screenId];
      return { ...prev, [role]: next };
    });
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 0, marginBottom: 16 }}>
        Changes take effect immediately. Admin always has full access.
      </p>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th style={{
                padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2)',
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                borderBottom: '1px solid var(--border)', width: 160,
              }}>Screen</th>
              {ROLE_LABELS.map(r => (
                <th key={r} style={{
                  padding: '8px 14px', textAlign: 'center', fontWeight: 700,
                  color: 'var(--text)', fontSize: 12,
                  borderBottom: '1px solid var(--border)', width: 80,
                }}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_SCREENS.map((s, i) => (
              <tr key={s.id} style={{
                borderBottom: i < ALL_SCREENS.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
              }}>
                <td style={{ padding: '9px 14px', fontWeight: 500, color: 'var(--text)' }}>
                  {s.label}
                </td>
                {ROLE_LABELS.map(r => {
                  const checked = (roleAllowed[r] || []).includes(s.id);
                  return (
                    <td key={r} style={{ padding: '9px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(r, s.id)}
                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                    </td>
                  );
                })}
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
    (!q ||
      e.action.toLowerCase().includes(q.toLowerCase()) ||
      e.detail.toLowerCase().includes(q.toLowerCase()) ||
      e.user.toLowerCase().includes(q.toLowerCase())) &&
    (!roleF || e.role === roleF)
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search action, user or detail..."
          style={{
            flex: 1, minWidth: 180, padding: '7px 12px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <FilterSelect value={roleF} onChange={setRoleF} options={roleOptions} />
        <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {shown.length} entries
        </span>
      </div>
      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: 13 }}>
          {auditEntries.length === 0 ? 'No audit entries yet — actions will appear here as users work.' : 'No entries match the filter.'}
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Time', 'User', 'Role', 'Action', 'Detail'].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                    color: 'var(--text-2)', fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((e, i) => (
                <tr key={e.id} style={{
                  borderBottom: i < shown.length - 1 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
                    {e.ts}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text)' }}>{e.user}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: 'var(--surface-3)', color: 'var(--text-2)',
                    }}>{e.role}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text)' }}>{e.action}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-3)', fontSize: 12 }}>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TAB_META = {
  pool:        { title: 'Resource Pool', sub: 'Available resources and their functions' },
  permissions: { title: 'Permissions',   sub: 'Control screen access per role' },
  audit:       { title: 'Audit Trail',   sub: 'System activity log' },
};

export default function AdminPanel({ tab = 'pool', roleAllowed, setRoleAllowed }) {
  const meta = TAB_META[tab] || TAB_META.pool;
  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">{meta.title}</div>
          <div className="page-sub">{meta.sub}</div>
        </div>
      </div>

      {tab === 'pool'        && <ResourcePoolTab />}
      {tab === 'permissions' && <PermissionsTab roleAllowed={roleAllowed} setRoleAllowed={setRoleAllowed} />}
      {tab === 'audit'       && <AuditTab />}
    </div>
  );
}
