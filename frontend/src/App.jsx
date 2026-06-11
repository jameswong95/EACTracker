import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Login from './screens/Login.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Portfolio from './screens/Portfolio.jsx';
import Project from './screens/Project.jsx';
import EacEditor from './screens/EacEditor.jsx';
import Resource from './screens/Resource.jsx';
import RevRec from './screens/RevRec.jsx';
import SapImport from './screens/SapImport.jsx';
import Standards from './screens/Standards.jsx';
import Assists from './screens/Assists.jsx';
import PdApprovals from './screens/PdApprovals.jsx';
import AdminPanel from './screens/AdminPanel.jsx';
import { logAction } from './data/auditLog.js';

const ROLE_DEFAULTS = { PM: 'dashboard', PD: 'portfolio', Finance: 'sap-import', Admin: 'admin-pool' };

const ROLE_ALLOWED_INIT = {
  PM:      ['dashboard', 'portfolio', 'project', 'eac', 'resource', 'revrec', 'assists'],
  PD:      ['portfolio', 'project', 'eac', 'resource', 'revrec'],
  Finance: ['sap-import', 'standards', 'portfolio'],
  Admin:   ['admin-pool', 'admin-permissions', 'admin-audit'],
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
  const [screen, setScreen]   = useState(() => ROLE_DEFAULTS[session?.role || 'PM']);
  const [projectId, setProjectId] = useState('PR-2025-014');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [roleAllowed, setRoleAllowed] = useState(ROLE_ALLOWED_INIT);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pfms-theme', theme);
  }, [theme]);

  function handleSignIn(s) {
    setSession(s);
    setRole(s.role);
    setScreen(ROLE_DEFAULTS[s.role]);
    logAction({ action: 'Sign in', detail: s.full_name, user: s.full_name, role: s.role });
  }

  function handleSignOut() {
    logAction({ action: 'Sign out', detail: session?.full_name, user: session?.full_name, role });
    localStorage.removeItem('pfms-session');
    setSession(null);
  }

  function navigate(s, pid) {
    if (!(roleAllowed[role] || []).includes(s)) return;
    setScreen(s);
    if (pid) setProjectId(pid);
  }

  function switchRole(newRole) {
    logAction({ action: 'Switch role', detail: `${role} → ${newRole}`, user: session?.full_name || 'System', role: newRole });
    setRole(newRole);
    setScreen(ROLE_DEFAULTS[newRole]);
  }

  if (!session) return <Login onSignIn={handleSignIn} />;

  const allowed = roleAllowed[role] || [];
  const activeScreen = allowed.includes(screen) ? screen : ROLE_DEFAULTS[role];

  const screens = {
    dashboard:    <Dashboard navigate={navigate} session={session} />,
    portfolio:    <Portfolio navigate={navigate} role={role} session={session} />,
    project:      <Project key={projectId} projectId={projectId} navigate={navigate} />,
    eac:          <EacEditor projectId={projectId} navigate={navigate} />,
    resource:     <Resource projectId={projectId} navigate={navigate} />,
    revrec:       <RevRec projectId={projectId} navigate={navigate} />,
    'sap-import': <SapImport navigate={navigate} session={session} />,
    standards:    <Standards navigate={navigate} />,
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
        roleAllowed={roleAllowed}
        setRoleAllowed={setRoleAllowed}
        session={session}
        onSignOut={handleSignOut}
      />
      <main className="main">
        {screens[activeScreen] || screens[ROLE_DEFAULTS[role]]}
      </main>
    </div>
  );
}
