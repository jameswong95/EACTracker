import React, { useState, useEffect } from 'react';
import { useResourcePool, useRates, useAudit } from '../data/store.js';
import { api } from '../data/api.js';
import Select from '../components/Select.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import {
  APP_MODULES,
  APP_ROLES,
  DEFAULT_ROLE_BADGE,
  PERMISSION_ACTIONS,
  PERMISSION_ROLES,
  ROLE_BADGE,
} from '../config/permissions.js';

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
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [editError, setEditError] = useState(null);

  useEffect(() => { setRows(RESOURCE_POOL); }, [RESOURCE_POOL]);

  async function reloadPool() {
    const pool = await api.get('/api/resources/pool');
    setRows(pool.map(r => ({
      id: r.id,
      name: r.name,
      grade: r.grade,
      roles: r.roles || [],
      dailyRate: Number(r.daily_rate) || 0,
      monthlyRate: Number(r.monthly_rate) || 0,
    })));
  }

  async function syncRpsPool() {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const result = await api.post('/api/resources/pool/sync-rps', {});
      setSyncResult(result);
      await reloadPool();
    } catch (e) {
      setSyncError(e?.message || 'Could not sync RPS resources.');
    } finally {
      setSyncing(false);
    }
  }

  async function patchPerson(id, patch) {
    setEditError(null);
    try {
      await api.patch(`/api/resources/pool/${encodeURIComponent(id)}`, patch);
      await reloadPool();
    } catch (e) {
      setEditError(e?.message || 'Could not update resource.');
    }
  }

  const gradeOptions = RATES.map(r => ({ value: r.grade, label: `${r.grade} · ${r.title}` }));

  const filtered = rows.filter(r =>
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
          {filtered.length} / {rows.length}
        </span>
        <button className="btn btn-ghost btn-sm" disabled={syncing} onClick={syncRpsPool}>
          {syncing ? 'Syncing...' : 'Sync RPS'}
        </button>
      </div>
      {syncError && (
        <div style={{ marginBottom: 12, padding: '8px 10px', border: '1px solid rgba(240,88,88,.25)', borderRadius: 6, color: 'var(--bad-text)', background: 'var(--bad-bg)', fontSize: 12 }}>
          {syncError}
        </div>
      )}
      {editError && (
        <div style={{ marginBottom: 12, padding: '8px 10px', border: '1px solid rgba(240,88,88,.25)', borderRadius: 6, color: 'var(--bad-text)', background: 'var(--bad-bg)', fontSize: 12 }}>
          {editError}
        </div>
      )}
      {syncResult && (
        <div style={{ marginBottom: 12, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', background: 'var(--surface-2)', fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: syncResult.skipped_count ? 'var(--warn-text)' : 'var(--ok)' }}>
            {syncResult.message || `RPS sync complete. Fetched ${syncResult.fetched}, created ${syncResult.created}, updated ${syncResult.updated}, deactivated ${syncResult.deactivated || 0}, skipped ${syncResult.skipped_count}.`}
          </div>
          <div style={{ marginTop: 4 }}>
            Fetched {syncResult.fetched}, created {syncResult.created}, updated {syncResult.updated}, unchanged {syncResult.unchanged || 0}, deactivated {syncResult.deactivated || 0}, skipped {syncResult.skipped_count}.
          </div>
          {(syncResult.skipped_summary || []).length > 0 && (
            <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
              {syncResult.skipped_summary.map(item => (
                <div key={item.reason}>
                  <strong>{item.count}</strong> skipped: {item.message}
                  {item.examples?.[0]?.fields?.length ? (
                    <span style={{ color: 'var(--text-3)' }}> · fields: {item.examples[0].fields.join(', ')}</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
                  <Select
                    value={r.grade}
                    options={gradeOptions}
                    onChange={grade => grade !== r.grade && patchPerson(r.id, { grade })}
                    style={{ minWidth: 130 }}
                  />
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

function PermissionsTab({ roleCrud, setRoleCrud }) {
  const [selectedRole, setSelectedRole] = useState(PERMISSION_ROLES[0] || 'Project Manager');
  const [groupFilter, setGroupFilter] = useState('all');
  const [q, setQ] = useState('');
  const groups = ['all', ...Array.from(new Set(APP_MODULES.map(module => module.group)))];

  function toggle(role, moduleId, action) {
    setRoleCrud(prev => {
      const current = Boolean(prev?.[role]?.[moduleId]?.[action]);
      const nextModule = {
        ...(prev?.[role]?.[moduleId] || {}),
        [action]: !current,
      };
      if (action === 'read' && current) {
        nextModule.create = false;
        nextModule.update = false;
        nextModule.delete = false;
      }
      if (action !== 'read' && !current) {
        nextModule.read = true;
      }
      return {
        ...prev,
        [role]: {
          ...(prev?.[role] || {}),
          [moduleId]: nextModule,
        },
      };
    });
  }

  function applyPreset(mode) {
    setRoleCrud(prev => {
      const nextRole = { ...(prev?.[selectedRole] || {}) };
      for (const module of APP_MODULES) {
        const current = { ...(nextRole[module.id] || {}) };
        if (mode === 'none') {
          nextRole[module.id] = { create: false, read: false, update: false, delete: false };
        } else if (mode === 'view') {
          nextRole[module.id] = { ...current, create: false, read: true, update: false, delete: false };
        } else if (mode === 'write') {
          nextRole[module.id] = { create: true, read: true, update: true, delete: false };
        } else if (mode === 'full') {
          nextRole[module.id] = { create: true, read: true, update: true, delete: true };
        }
      }
      return { ...prev, [selectedRole]: nextRole };
    });
  }

  const roleModules = roleCrud?.[selectedRole] || {};
  const counts = APP_MODULES.reduce((acc, module) => {
    const perms = roleModules[module.id] || {};
    if (perms.read) acc.visible += 1;
    if (perms.create || perms.update) acc.write += 1;
    if (perms.delete) acc.delete += 1;
    return acc;
  }, { visible: 0, write: 0, delete: 0 });
  const roleBadge = ROLE_BADGE[selectedRole] || DEFAULT_ROLE_BADGE;
  const filteredModules = APP_MODULES.filter(module => {
    if (groupFilter !== 'all' && module.group !== groupFilter) return false;
    if (!q.trim()) return true;
    const hay = `${module.label} ${module.group} ${module.id}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  const groupedModules = groups
    .filter(group => group !== 'all')
    .map(group => [group, filteredModules.filter(module => module.group === group)])
    .filter(([, modules]) => modules.length);

  return (
    <div className="permissions-workspace">
      <div className="permissions-hero">
        <div>
          <div className="permissions-eyebrow">Role permission matrix</div>
          <h3>Configure one role at a time</h3>
          <p>
            Changes take effect immediately. Admin remains locked with full access.
            Read controls visibility; create, update and delete control write actions.
          </p>
        </div>
        <div className="permission-role-picker">
          <label>Role</label>
          <Select
            value={selectedRole}
            options={PERMISSION_ROLES.map(role => ({ value: role, label: role }))}
            onChange={setSelectedRole}
          />
        </div>
      </div>

      <div className="permission-summary-grid">
        <div className="permission-summary-card role">
          <span>Selected role</span>
          <strong style={{ color: roleBadge.color }}>{selectedRole}</strong>
        </div>
        <div className="permission-summary-card">
          <span>Visible modules</span>
          <strong>{counts.visible} / {APP_MODULES.length}</strong>
        </div>
        <div className="permission-summary-card">
          <span>Create or update</span>
          <strong>{counts.write}</strong>
        </div>
        <div className="permission-summary-card">
          <span>Delete enabled</span>
          <strong>{counts.delete}</strong>
        </div>
      </div>

      <div className="permission-toolbar">
        <input
          className="input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search module..."
        />
        <Select
          value={groupFilter}
          options={groups.map(group => ({ value: group, label: group === 'all' ? 'All module groups' : group }))}
          onChange={setGroupFilter}
        />
        <div className="permission-presets">
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('view')}>View all</button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('write')}>Edit all</button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('full')}>Full CRUD</button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('none')}>Clear</button>
        </div>
      </div>

      <div className="permission-legend">
        {PERMISSION_ACTIONS.map(action => (
          <span key={action.id}><strong>{action.label}</strong> {action.id}</span>
        ))}
      </div>

      <div className="permission-module-sections">
        {groupedModules.map(([group, modules]) => (
          <section key={group} className="permission-module-section">
            <div className="permission-section-header">
              <h4>{group}</h4>
              <span>{modules.length} module{modules.length === 1 ? '' : 's'}</span>
            </div>
            <div className="permission-card-grid">
              {modules.map(module => {
                const perms = roleModules[module.id] || {};
                const readable = Boolean(perms.read);
                return (
                  <div key={module.id} className={`permission-card${readable ? ' active' : ''}`}>
                    <div className="permission-card-main">
                      <div>
                        <h5>{module.label}</h5>
                        <span>{module.id}</span>
                      </div>
                      <button
                        type="button"
                        className={`permission-access-switch${readable ? ' active' : ''}`}
                        onClick={() => toggle(selectedRole, module.id, 'read')}
                        aria-pressed={readable}
                      >
                        {readable ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    <div className="permission-card-actions" aria-label={`${selectedRole} permissions for ${module.label}`}>
                      {PERMISSION_ACTIONS.map(action => {
                        const checked = Boolean(perms[action.id]);
                        return (
                          <button
                            key={action.id}
                            type="button"
                            className={`crud-toggle${checked ? ' active' : ''}`}
                            title={`${action.id} ${module.label}`}
                            onClick={() => toggle(selectedRole, module.id, action.id)}
                          >
                            <span>{action.label}</span>
                            <small>{action.id}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {filteredModules.length === 0 && (
          <div className="permission-empty">No modules match the current filter.</div>
        )}
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
  return String(action || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function auditEntityLabel(entry) {
  return [entry.entityType, entry.entityId].filter(Boolean).join(' · ') || 'System event';
}

function AuditTab() {
  const { entries: auditEntries } = useAudit();
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('');

  const roleOptions = auditRoleOptions(auditEntries);
  const actionCount = new Set(auditEntries.map(e => e.action)).size;
  const userCount = new Set(auditEntries.map(e => e.user).filter(Boolean)).size;

  const shown = auditEntries.filter(e =>
    (!q ||
      String(e.action || '').toLowerCase().includes(q.toLowerCase()) ||
      String(e.detail || '').toLowerCase().includes(q.toLowerCase()) ||
      String(e.entityId || '').toLowerCase().includes(q.toLowerCase()) ||
      String(e.user || '').toLowerCase().includes(q.toLowerCase())) &&
    (!roleF || e.role === roleF)
  );

  return (
    <div className="audit-trail">
      <div className="audit-summary-grid">
        <div className="audit-summary-card">
          <span>Total events</span>
          <strong>{auditEntries.length}</strong>
        </div>
        <div className="audit-summary-card">
          <span>Showing</span>
          <strong>{shown.length}</strong>
        </div>
        <div className="audit-summary-card">
          <span>Users</span>
          <strong>{userCount}</strong>
        </div>
        <div className="audit-summary-card">
          <span>Action types</span>
          <strong>{actionCount}</strong>
        </div>
      </div>

      <div className="audit-toolbar">
        <input
          className="input audit-search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search action, user, entity or detail..."
        />
        <Select value={roleF} onChange={setRoleF} options={roleOptions} style={{ width: 220 }} />
      </div>

      {shown.length === 0 ? (
        <div className="audit-empty">
          {auditEntries.length === 0 ? 'No audit entries yet — actions will appear here as users work.' : 'No entries match the filter.'}
        </div>
      ) : (
        <div className="audit-table-card">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(e => {
                const badge = ROLE_BADGE[e.role] || DEFAULT_ROLE_BADGE;
                return (
                <tr key={e.id}>
                  <td className="audit-time">{e.ts}</td>
                  <td>
                    <div className="audit-user">{e.user}</div>
                  </td>
                  <td>
                    <span className="audit-role-chip" style={{ color: badge.color, background: badge.bg }}>{e.role}</span>
                  </td>
                  <td>
                    <span className="audit-action-chip">{auditActionLabel(e.action)}</span>
                  </td>
                  <td>
                    <span className="audit-entity">{auditEntityLabel(e)}</span>
                  </td>
                  <td className="audit-detail">{e.detail || '-'}</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const emptyForm = { id: null, display_name: '', email: '', role: 'Project Manager', is_active: true };
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editDraft, setEditDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      setUsers(await api.get('/api/users'));
    } catch (e) {
      setError(e.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  function editUser(user) {
    setEditDraft({
      id: user.id,
      display_name: user.full_name,
      email: user.username,
      role: user.role,
      is_active: user.is_active,
    });
    setError('');
    setMessage('');
  }

  function resetForm() {
    setForm(emptyForm);
    setError('');
    setMessage('');
  }

  function userPayload(source) {
    return {
      display_name: source.display_name.trim(),
      email: source.email.trim().toLowerCase(),
      role: source.role,
      is_active: source.is_active,
    };
  }

  async function saveUser(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = userPayload(form);
    try {
      const saved = await api.post('/api/users', payload);
      setMessage(`${saved.full_name} saved`);
      setForm(emptyForm);
      await loadUsers();
    } catch (e) {
      setError(e.message || 'Unable to save user');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editDraft) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await api.put(`/api/users/${editDraft.id}`, userPayload(editDraft));
      setMessage(`${saved.full_name} updated`);
      setEditDraft(null);
      await loadUsers();
    } catch (e) {
      setError(e.message || 'Unable to update user');
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.del(`/api/users/${user.id}`);
      setMessage(`${user.full_name} deleted`);
      if (editDraft?.id === user.id) setEditDraft(null);
      await loadUsers();
    } catch (e) {
      setError(e.message || 'Unable to delete user');
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <form className="user-add-form" onSubmit={saveUser} style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(220px, 1.4fr) minmax(170px, .8fr) auto',
        gap: 10,
        alignItems: 'end',
        marginBottom: 18,
      }}>
        <label style={{ display: 'grid', gap: 6, fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Display Name
          <input
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            required
            maxLength={160}
            style={{ padding: '9px 11px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          SSO Email
          <input
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            type="email"
            maxLength={254}
            placeholder="name@company.com"
            style={{ padding: '9px 11px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Role
          <Select
            value={form.role}
            options={APP_ROLES.map(role => ({ value: role, label: role }))}
            onChange={value => setForm(f => ({ ...f, role: value }))}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              style={{ accentColor: 'var(--accent)' }}
            />
            Active
          </label>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Add User'}
          </button>
          {(form.display_name || form.email || form.role !== emptyForm.role || !form.is_active) && (
            <button className="btn btn-ghost" type="button" onClick={resetForm}>Clear</button>
          )}
        </div>
      </form>

      {error && (
        <div style={{ marginBottom: 12, color: 'var(--bad-text)', background: 'var(--bad-bg)', border: '1px solid rgba(240,88,88,.2)', borderRadius: 6, padding: '9px 11px', fontSize: 13 }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ marginBottom: 12, color: 'var(--ok-text)', background: 'var(--ok-bg)', border: '1px solid rgba(34,197,139,.2)', borderRadius: 6, padding: '9px 11px', fontSize: 13 }}>
          {message}
        </div>
      )}

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Display Name', 'SSO Email', 'Role', 'Status', ''].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: h ? 'left' : 'right', fontWeight: 600,
                  color: 'var(--text-2)', fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.06em', borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} style={{ padding: 18, color: 'var(--text-3)' }}>Loading users...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 18, color: 'var(--text-3)' }}>No users yet</td></tr>
            )}
            {!loading && users.map((user, i) => (
              <tr key={user.id} style={{
                borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
              }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{user.full_name}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{user.username}</td>
                <td style={{ padding: '10px 12px' }}>{user.role}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span className={user.is_active ? 'badge badge-ok' : 'badge badge-bad'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => editUser(user)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" disabled={saving} onClick={() => setDeleteTarget(user)} style={{ marginLeft: 6 }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editDraft && (
        <div className="modal-overlay" role="presentation" onMouseDown={() => !saving && setEditDraft(null)}>
          <form className="modal user-edit-modal" onSubmit={saveEdit} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="user-edit-title">Edit user</div>
                <div className="user-edit-sub">{editDraft.display_name || editDraft.email}</div>
              </div>
            </div>
            <div className="modal-body user-edit-body">
              <label>
                <span>Display name</span>
                <input
                  className="input"
                  value={editDraft.display_name}
                  onChange={e => setEditDraft(d => ({ ...d, display_name: e.target.value }))}
                  required
                  maxLength={160}
                  autoFocus
                />
              </label>
              <label>
                <span>SSO email</span>
                <input
                  className="input"
                  value={editDraft.email}
                  onChange={e => setEditDraft(d => ({ ...d, email: e.target.value }))}
                  required
                  type="email"
                  maxLength={254}
                  placeholder="name@company.com"
                />
              </label>
              <label>
                <span>Role</span>
                <Select
                  value={editDraft.role}
                  options={APP_ROLES.map(role => ({ value: role, label: role }))}
                  onChange={value => setEditDraft(d => ({ ...d, role: value }))}
                />
              </label>
              <label className="user-edit-active">
                <input
                  type="checkbox"
                  checked={editDraft.is_active}
                  onChange={e => setEditDraft(d => ({ ...d, is_active: e.target.checked }))}
                />
                Active user
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setEditDraft(null)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete user?"
          message="This deactivates their PFMS access and removes them from the active user list."
          itemLabel="User"
          itemName={deleteTarget.full_name}
          itemMeta={`${deleteTarget.username} · ${deleteTarget.role}`}
          note="Existing audit history remains available for traceability."
          cancelLabel="Keep user"
          confirmLabel="Delete user"
          busy={saving}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteUser(deleteTarget)}
        />
      )}
    </div>
  );
}

function WipeDataTab() {
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canSubmit = confirmation.trim() === 'delete' && !busy;

  async function wipeData() {
    setError('');
    setResult(null);
    if (confirmation.trim() !== 'delete') {
      setError('Type delete to enable the wipe.');
      return;
    }

    setBusy(true);
    try {
      const response = await api.post('/api/admin/wipe-data', { confirmation: 'delete' });
      setResult(response);
      setConfirmation('');
      localStorage.removeItem('pfms-project');
      localStorage.removeItem('pfms-screen');
    } catch (e) {
      setError(e.message || 'Unable to wipe data');
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{
        border: '1px solid rgba(240,88,88,.35)',
        background: 'var(--bad-bg)',
        color: 'var(--bad-text)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 18,
      }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Permanent data wipe</div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          This removes project, tender, import, cost, approval, revenue recognition, settings and audit data. User accounts and the resource master are kept so Admin access is not lost.
        </div>
      </div>

      <label style={{
        display: 'block',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        color: 'var(--text-3)',
        marginBottom: 8,
      }}>
        Type delete to confirm
      </label>
      <input
        value={confirmation}
        onChange={e => { setConfirmation(e.target.value); setError(''); setResult(null); }}
        disabled={busy}
        placeholder="delete"
        style={{
          width: '100%',
          maxWidth: 360,
          padding: '10px 12px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: 14,
          marginBottom: 12,
        }}
      />

      <div>
        <button
          type="button"
          className="btn btn-danger"
          disabled={!canSubmit}
          onClick={() => setConfirmOpen(true)}
          style={{
            opacity: canSubmit ? 1 : 0.5,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {busy ? 'Wiping data...' : 'Wipe all data'}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: 14,
          padding: '10px 12px',
          border: '1px solid rgba(240,88,88,.25)',
          borderRadius: 6,
          background: 'var(--bad-bg)',
          color: 'var(--bad-text)',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 14,
          padding: '10px 12px',
          border: '1px solid var(--border)',
          borderRadius: 6,
          background: 'var(--surface-2)',
          color: 'var(--text-2)',
          fontSize: 13,
        }}>
          Wipe complete. {result.wipedTableCount} tables were cleared.
        </div>
      )}
      {confirmOpen && (
        <DeleteConfirmModal
          title="Wipe application data?"
          message="This permanently clears application records and cannot be undone."
          itemLabel="Confirmation"
          itemName="delete"
          itemMeta="Project, tender, import, cost, approval, revenue recognition, settings and audit data"
          note="User accounts and the resource master are kept so Admin access is not lost."
          cancelLabel="Cancel wipe"
          confirmLabel="Wipe all data"
          busy={busy}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={wipeData}
        />
      )}
    </div>
  );
}

const TAB_META = {
  users:       { title: 'Users',         sub: 'Link SSO email addresses to PFMS roles' },
  pool:        { title: 'Resource Pool', sub: 'Available resources and their functions' },
  permissions: { title: 'Permissions',   sub: 'Control screen access per role' },
  audit:       { title: 'Audit Trail',   sub: 'System activity log' },
  wipe:        { title: 'Data Wipe',     sub: 'Admin-only destructive data reset' },
};

export default function AdminPanel({ tab = 'pool', roleAllowed, setRoleAllowed, roleCrud, setRoleCrud }) {
  const meta = TAB_META[tab] || TAB_META.pool;
  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">{meta.title}</div>
          <div className="page-sub">{meta.sub}</div>
        </div>
      </div>

      {tab === 'users'       && <UsersTab />}
      {tab === 'pool'        && <ResourcePoolTab />}
      {tab === 'permissions' && <PermissionsTab roleAllowed={roleAllowed} setRoleAllowed={setRoleAllowed} roleCrud={roleCrud} setRoleCrud={setRoleCrud} />}
      {tab === 'audit'       && <AuditTab />}
      {tab === 'wipe'        && <WipeDataTab />}
    </div>
  );
}
