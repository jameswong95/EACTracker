import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
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

const ROLE_DEFAULTS = { PM: 'dashboard', PD: 'portfolio', Finance: 'sap-import' };

const ROLE_ALLOWED = {
  PM:      ['dashboard', 'portfolio', 'project', 'eac', 'resource', 'revrec', 'assists'],
  PD:      ['portfolio', 'project', 'eac', 'resource', 'revrec'],
  Finance: ['sap-import', 'standards', 'portfolio'],
};

export default function App() {
  const [role, setRole]       = useState('PM');
  const [theme, setTheme]     = useState(() => localStorage.getItem('pfms-theme') || 'light');
  const [screen, setScreen]   = useState('dashboard');
  const [projectId, setProjectId] = useState('PR-2025-014');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pfms-theme', theme);
  }, [theme]);

  function navigate(s, pid) {
    if (!ROLE_ALLOWED[role].includes(s)) return;
    setScreen(s);
    if (pid) setProjectId(pid);
  }

  function switchRole(newRole) {
    setRole(newRole);
    setScreen(ROLE_DEFAULTS[newRole]);
  }

  const allowed = ROLE_ALLOWED[role];
  const activeScreen = allowed.includes(screen) ? screen : ROLE_DEFAULTS[role];

  const screens = {
    dashboard:    <Dashboard navigate={navigate} />,
    portfolio:    <Portfolio navigate={navigate} role={role} />,
    project:      <Project key={projectId} projectId={projectId} navigate={navigate} />,
    eac:          <EacEditor projectId={projectId} navigate={navigate} />,
    resource:     <Resource projectId={projectId} navigate={navigate} />,
    revrec:       <RevRec projectId={projectId} navigate={navigate} />,
    'sap-import': <SapImport navigate={navigate} />,
    standards:    <Standards navigate={navigate} />,
    assists:      <Assists navigate={navigate} />,
    'pd-approvals': <PdApprovals navigate={navigate} />,
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
      />
      <main className="main">
        {screens[activeScreen] || screens[ROLE_DEFAULTS[role]]}
      </main>
    </div>
  );
}
