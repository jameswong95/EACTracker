import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Login from './screens/Login.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Portfolio from './screens/Portfolio.jsx';
import Project from './screens/Project.jsx';
import Resource from './screens/Resource.jsx';
import Material from './screens/Material.jsx';
import SubCon from './screens/SubCon.jsx';
import Others from './screens/Others.jsx';
import Tender from './screens/Tender.jsx';
import Tenders from './screens/Tenders.jsx';
import ProjectInitiation from './screens/ProjectInitiation.jsx';
import RevRec from './screens/RevRec.jsx';
import SapImport from './screens/SapImport.jsx';
import Standards from './screens/Standards.jsx';
import Assists from './screens/Assists.jsx';
import PdApprovals from './screens/PdApprovals.jsx';
import AdminPanel from './screens/AdminPanel.jsx';
import { logAction } from './data/auditLog.js';
import { api } from './data/api.js';

const ROLE_DEFAULTS = { 'Project Manager': 'portfolio', 'Project Director': 'portfolio', Finance: 'portfolio', Leader: 'portfolio', Admin: 'portfolio' };

// PRD §10: roles and minimum access
const ROLE_ALLOWED_INIT = {
  'Project Manager':  ['dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation', 'resource', 'material', 'sub-con', 'others', 'revrec', 'standards'],
  'Project Director': ['dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation', 'resource', 'material', 'sub-con', 'others', 'revrec', 'standards', 'pd-approvals'],
  Finance:            ['portfolio', 'tenders', 'tender', 'project', 'project-initiation', 'resource', 'material', 'sub-con', 'others', 'revrec', 'sap-import', 'standards', 'assists'],
  Leader:             ['dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation', 'resource', 'material', 'sub-con', 'others', 'revrec', 'sap-import', 'standards', 'assists', 'pd-approvals'],
  Admin:              ['dashboard', 'portfolio', 'project', 'standards', 'admin-pool', 'admin-permissions', 'admin-audit'],
};

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('pfms-session');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [role, setRole]       = useState(() => session?.role || 'Project Manager');
  const [theme, setTheme]     = useState(() => localStorage.getItem('pfms-theme') || 'light');
  const [screen, setScreen]   = useState(() => {
    const saved = localStorage.getItem('pfms-screen');
    const role  = session?.role || 'Project Manager';
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

  useEffect(() => {
    if (session) return;
    let alive = true;
    api.get('/api/auth/session')
      .then(s => {
        if (!alive || !s?.username || !s?.role) return;
        localStorage.setItem('pfms-session', JSON.stringify(s));
        handleSignIn(s);
        if (window.location.search) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [session]);

  // Responsive tables: on mobile, tag every table that has a header and copy
  // each column's header text onto its cells as data-label, so CSS can reflow
  // the table into stacked cards (no horizontal scrolling required).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    let raf = 0;
    function apply() {
      raf = 0;
      if (!mq.matches) return;
      document.querySelectorAll('table').forEach(table => {
        if (table.dataset.responsive === 'scroll') {
          table.classList.remove('rtable');
          return;
        }
        const ths = table.querySelectorAll('thead th');
        if (!ths.length) return;
        const labels = Array.from(ths).map(th =>
          th.textContent.replace(/[↑↓]/g, '').replace(/\s+/g, ' ').trim()
        );
        table.classList.add('rtable');
        table.querySelectorAll('tbody tr, tfoot tr').forEach(tr => {
          const cells = tr.children;
          if (cells.length === 1 && (cells[0].colSpan || 1) > 1) {
            tr.classList.add('rtable-full');
            return;
          }
          let col = 0;
          for (let i = 0; i < cells.length; i++) {
            const span = cells[i].colSpan || 1;
            if (span === 1 && labels[col]) cells[i].setAttribute('data-label', labels[col]);
            col += span;
          }
        });
      });
    }
    function schedule() { if (!raf) raf = setTimeout(apply, 90); }
    schedule();
    const obs = new MutationObserver(schedule);
    obs.observe(document.body, { childList: true, subtree: true });
    mq.addEventListener('change', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) clearTimeout(raf);
      obs.disconnect();
      mq.removeEventListener('change', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

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
    'project-initiation': <ProjectInitiation projectId={projectId} navigate={navigate} role={role} session={session} />,
    resource:     <Resource projectId={projectId} navigate={navigate} role={role} session={session} />,
    material:     <Material projectId={projectId} navigate={navigate} role={role} session={session} />,
    'sub-con':    <SubCon projectId={projectId} navigate={navigate} role={role} />,
    others:       <Others projectId={projectId} navigate={navigate} role={role} session={session} />,
    tender:       <Tender tenderId={projectId} navigate={navigate} role={role} session={session} />,
    tenders:      <Tenders navigate={navigate} role={role} session={session} />,
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
