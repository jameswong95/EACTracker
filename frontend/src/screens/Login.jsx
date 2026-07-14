import React, { useEffect, useState } from 'react';
import { api } from '../data/api.js';

const ROLE_BADGE = {
  'Project Manager':  { color: 'var(--info-text)',  bg: 'var(--info-bg)'  },
  'Project Director': { color: 'var(--accent)',     bg: 'var(--accent-light)' },
  Finance:            { color: 'var(--ok-text)',    bg: 'var(--ok-bg)'    },
  Leader:             { color: '#7030A0',           bg: 'rgba(112,48,160,0.12)' },
  Admin:              { color: 'var(--bad-text)',   bg: 'var(--bad-bg)'   },
};
const DEFAULT_ROLE_BADGE = { color: 'var(--text-2)', bg: 'var(--surface-3)' };
const ROLE_ORDER = { Admin: 0, Leader: 1, Finance: 2, 'Project Director': 3, 'Project Manager': 4 };

export default function Login({ onSignIn }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [username, setUsername] = useState('');
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => api.get('/api/users')
      .then(rows => { if (!alive) return;
        const sorted = [...rows].sort((a, b) =>
          (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
          || a.full_name.localeCompare(b.full_name));
        setUsers(sorted); setLoading(false); setError(null); })
      .catch(e   => {
        if (!alive) return;
        if (e.status === 401) {
          setUsers([]);
          setError(null);
        } else {
          setError(e.message);
        }
        setLoading(false);
      });
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { alive = false; window.removeEventListener('focus', onFocus); };
  }, []);

  async function signIn(u) {
    if (!u) return;
    setBusy(true);
    try {
      // No real auth — just resolve the user record and persist locally.
      const session = {
        id:        u.id,
        username:  u.username,
        full_name: u.full_name,
        initials:  u.initials,
        role:      u.role,
        signedAt:  new Date().toISOString(),
      };
      localStorage.setItem('pfms-session', JSON.stringify(session));
      onSignIn(session);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  function signInByUsername(e) {
    e?.preventDefault();
    const u = users.find(x => x.username.toLowerCase() === username.trim().toLowerCase());
    if (!u) { setError(`No user found for "${username}"`); return; }
    setError(null);
    signIn(u);
  }

  function signInWithSso() {
    window.location.assign('/oauth2/start?rd=%2F%3Fsso%3D1');
  }

  return (
    <div className="login-screen" style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg)', color: 'var(--text)',
    }}>
      {/* ── Left: brand panel ─────────────────────────────── */}
      <div className="login-brand-panel" style={{
        flex: '0 0 42%', minWidth: 360,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        padding: '48px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'var(--accent)', display: 'grid', placeItems: 'center',
              color: 'var(--surface)', fontWeight: 800, fontSize: 13,
            }}>P</div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              PFMS
            </span>
          </div>

          <h1 style={{ marginTop: 64, maxWidth: 360, fontSize: 32, lineHeight: 1.15, letterSpacing: '-0.5px' }}>
            Project Financial Management System
          </h1>
          <p style={{ marginTop: 16, maxWidth: 360, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.55 }}>
            EAC tracking, revenue recognition, resource planning and SAP import — for project managers, project directors and finance.
          </p>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          v1.0 · Internal · {users.length || '—'} users
        </div>
      </div>

      {/* ── Right: sign-in panel ─────────────────────────── */}
      <div className="login-main-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 48,
      }}>
        <div className="login-card" style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>
            Use company single sign-on, or pick a local account where enabled.
          </p>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={signInWithSso}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 18 }}
          >
            Continue with SSO
          </button>

          <form onSubmit={signInByUsername} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.08em', color: 'var(--text-3)',
            }}>
              Username
            </label>
            <input
              className="input"
              autoFocus
              placeholder="e.g. s.tan"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(null); }}
              disabled={busy || loading}
              style={{
                padding: '10px 12px', fontSize: 14,
                background: 'var(--surface)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 'var(--r)',
                outline: 'none',
              }}
            />

            {error && (
              <div style={{
                fontSize: 12, color: 'var(--bad-text)',
                background: 'var(--bad-bg)', padding: '8px 12px',
                borderRadius: 'var(--r-sm)', border: '1px solid rgba(240,88,88,.2)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={busy || loading || !username.trim()}
              style={{
                marginTop: 6, justifyContent: 'center',
                opacity: (busy || loading || !username.trim()) ? 0.5 : 1,
              }}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              Or pick an account
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Quick-pick user list (dev / demo) */}
          <div className="login-user-list" style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            maxHeight: 280, overflowY: 'auto',
            border: '1px solid var(--border)', borderRadius: 'var(--r)',
            background: 'var(--surface)',
          }}>
            {loading && (
              <div style={{ padding: 16, fontSize: 13, color: 'var(--text-3)' }}>Loading users…</div>
            )}
            {!loading && users.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: 'var(--text-3)' }}>
                Local account sign-in is unavailable. Continue with SSO.
              </div>
            )}
            {!loading && users.map(u => {
              const badge = ROLE_BADGE[u.role] || DEFAULT_ROLE_BADGE;
              return (
                <button
                  className="login-user-row"
                  key={u.id}
                  type="button"
                  onClick={() => signIn(u)}
                  disabled={busy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: 'transparent',
                    border: 'none', borderBottom: '1px solid var(--border)',
                    color: 'var(--text)', textAlign: 'left', cursor: 'pointer',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--surface-3)', color: 'var(--text-2)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {u.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.username}</div>
                  </div>
                  <span className="login-role-badge" style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 'var(--r-sm)',
                    color: badge.color, background: badge.bg,
                  }}>
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
            By signing in you agree to the PFMS internal use policy.
          </div>
        </div>
      </div>
    </div>
  );
}
