import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Login from './screens/Login.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Portfolio from './screens/Portfolio.jsx';
import Project from './screens/Project.jsx';
import Resource from './screens/Resource.jsx';
import RevRec from './screens/RevRec.jsx';
import SapImport from './screens/SapImport.jsx';
import Standards from './screens/Standards.jsx';
import Assists from './screens/Assists.jsx';
import PdApprovals from './screens/PdApprovals.jsx';
import AdminPanel from './screens/AdminPanel.jsx';
import { logAction } from './data/auditLog.js';

const ROLE_DEFAULTS = { PM: 'portfolio', PD: 'portfolio', Finance: 'portfolio', Leader: 'portfolio', Admin: 'portfolio' };

// PRD §10: roles and minimum access
const ROLE_ALLOWED_INIT = {
  PM:      ['dashboard', 'portfolio', 'project', 'resource', 'revrec', 'standards'],
  PD:      ['dashboard', 'portfolio', 'project', 'resource', 'revrec', 'standards', 'pd-approvals'],
  Finance: ['portfolio', 'project', 'resource', 'revrec', 'sap-import', 'standards', 'assists'],
  Leader:  ['dashboard', 'portfolio', 'project', 'resource', 'revrec', 'sap-import', 'standards', 'assists', 'pd-approvals'],
  Admin:   ['dashboard', 'portfolio', 'project', 'admin-pool', 'admin-permissions', 'admin-audit'],
};

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('pfms-session');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [role, setRole]       = useState(() => session?.role || 'PM');
  const [theme, setTheme]     = useState(() => localStorage.getItem('pfms-theme') || 'light');
  const [screen, setScreen]   = useState(() => {
    const saved = localStorage.getItem('pfms-screen');
    const role  = session?.role || 'PM';
    const allowed = ROLE_ALLOWED_INIT[role] || [];
    if (saved && allowed.includes(saved)) return saved;
    return ROLE_DEFAULTS[role];
  });
  const [projectId, setProjectId] = useState(
    () => localStorage.getItem('pfms-project') || 'PR-2025-014'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [roleAllowed, setRoleAllowed] = useState(ROLE_ALLOWED_INIT);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pfms-theme', theme);
  }, [theme]);

  function handleSignIn(s) {
    setSession(s);
    setRole(s.role);
    const savedScreen = localStorage.getItem('pfms-screen');
    const allowed = ROLE_ALLOWED_INIT[s.role] || [];
    setScreen(savedScreen && allowed.includes(savedScreen) ? savedScreen : ROLE_DEFAULTS[s.role]);
    logAction({ action: 'Sign in', detail: s.full_name, user: s.full_name, role: s.role });
  }

  function handleSignOut() {
    logAction({ action: 'Sign out', detail: session?.full_name, user: session?.full_name, role });
    localStorage.removeItem('pfms-session');
    localStorage.removeItem('pfms-screen');
    localStorage.removeItem('pfms-project');
    setSession(null);
  }

  function navigate(s, pid) {
    if (!(roleAllowed[role] || []).includes(s)) return;
    setScreen(s);
    localStorage.setItem('pfms-screen', s);
    if (pid) {
      setProjectId(pid);
      localStorage.setItem('pfms-project', pid);
    }
    setMobileNavOpen(false);
  }

  function switchRole(newRole) {
    logAction({ action: 'Switch role', detail: `${role} → ${newRole}`, user: session?.full_name || 'System', role: newRole });
    setRole(newRole);
    const def = ROLE_DEFAULTS[newRole];
    setScreen(def);
    localStorage.setItem('pfms-screen', def);
    setMobileNavOpen(false);
  }

  if (!session) return <Login onSignIn={handleSignIn} />;

  const allowed = roleAllowed[role] || [];
  const activeScreen = allowed.includes(screen) ? screen : ROLE_DEFAULTS[role];

  const screens = {
    dashboard:    <Dashboard navigate={navigate} session={session} />,
    portfolio:    <Portfolio navigate={navigate} role={role} session={session} />,
    project:      <Project key={projectId} projectId={projectId} navigate={navigate} role={role} session={session} />,
    resource:     <Resource projectId={projectId} navigate={navigate} role={role} />,
    revrec:       <RevRec projectId={projectId} navigate={navigate} role={role} />,
    'sap-import': <SapImport navigate={navigate} session={session} />,
    standards:    <Standards navigate={navigate} role={role} />,
    assists:      <Assists navigate={navigate} />,
    'pd-approvals':      <PdApprovals navigate={navigate} session={session} />,
    'admin-pool':        <AdminPanel tab="pool"        roleAllowed={roleAllowed} setRoleAllowed={setRoleAllowed} />,
    'admin-permissions': <AdminPanel tab="permissions" roleAllowed={roleAllowed} setRoleAllowed={setRoleAllowed} />,
    'admin-audit':       <AdminPanel tab="audit"       roleAllowed={roleAllowed} setRoleAllowed={setRoleAllowed} />,
  };

  return (
    <div className="app">
      <Sidebar
        screen={activeScreen}
        projectId={projectId}
        navigate={navigate}
        role={role}
        switchRole={switchRole}
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        mobileOpen={mobileNavOpen}
        roleAllowed={roleAllowed}
        setRoleAllowed={setRoleAllowed}
        session={session}
        onSignOut={handleSignOut}
      />
      {mobileNavOpen && (
        <div className="mobile-overlay" onClick={() => setMobileNavOpen(false)} />
      )}
      <main className="main">
        <div className="mobile-topbar">
          <button className="hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
            <span /><span /><span />
          </button>
          <span className="mobile-topbar-title">PFMS</span>
        </div>
        {screens[activeScreen] || screens[ROLE_DEFAULTS[role]]}
      </main>
    </div>
  );
}
