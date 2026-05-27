import React from 'react';
import { projects, ROLE_USERS } from '../data/mock.js';

function Icon({ name, size = 16 }) {
  const s = size;
  const icons = {
    dashboard: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    ),
    portfolio: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="14" height="10" rx="1.5" />
        <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M1 8h14" />
      </svg>
    ),
    project: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" /><circle cx="8" cy="8" r="2" />
      </svg>
    ),
    eac: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="14" height="14" rx="1.5" /><path d="M1 5h14M5 5v9" />
      </svg>
    ),
    resource: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="5" r="2.5" /><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" />
        <circle cx="12" cy="5" r="2" /><path d="M12.5 10c1.38 0 2.5 1.12 2.5 2.5" />
      </svg>
    ),
    revrec: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="7" /><path d="M8 4v4l3 2" />
      </svg>
    ),
    approvals: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 6l-6 6-3-3" /><rect x="1" y="1" width="14" height="14" rx="2" />
      </svg>
    ),
    sap: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1v10M4 7l4 4 4-4M1 13h14" />
      </svg>
    ),
    standards: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="1" width="12" height="14" rx="1.5" /><path d="M5 5h6M5 8h6M5 11h4" />
      </svg>
    ),
    assists: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1l1.5 4.5H15l-4 3 1.5 4.5L8 10.5l-4.5 2.5L5 8.5 1 5.5h5.5L8 1Z" />
      </svg>
    ),
    sun: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" />
      </svg>
    ),
    moon: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5Z" />
      </svg>
    ),
    chevronLeft: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 12L6 8l4-4" />
      </svg>
    ),
    chevronRight: (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 12l4-4-4-4" />
      </svg>
    ),
  };
  return icons[name] || null;
}

const NAV = {
  PM: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'portfolio', label: 'My Projects', icon: 'portfolio' },
    { id: 'assists',   label: 'AI Assist',   icon: 'assists' },
  ],
  PD: [
    { id: 'portfolio', label: 'Portfolio', icon: 'portfolio' },
  ],
  Finance: [
    { id: 'sap-import', label: 'SAP Import', icon: 'sap' },
    { id: 'standards',  label: 'Standards',  icon: 'standards' },
    { id: 'portfolio',  label: 'Projects',   icon: 'project' },
  ],
};

const PROJECT_SUB = [
  { id: 'project',  label: 'Overview',       icon: 'project' },
  { id: 'eac',      label: 'EAC Editor',     icon: 'eac' },
  { id: 'resource', label: 'Resource Plan',  icon: 'resource' },
  { id: 'revrec',   label: 'Rev. Rec.',      icon: 'revrec' },
];

const ROLES = ['PM', 'PD', 'Finance'];

export default function Sidebar({ screen, projectId, navigate, role, switchRole, theme, toggleTheme, collapsed, onToggle }) {
  const activeProject = projects.find(p => p.id === projectId);
  const inProjectView = PROJECT_SUB.map(s => s.id).includes(screen);
  const navItems = NAV[role] || NAV.PM;

  const iconColor = 'rgba(255,255,255,0.40)';

  return (
    <nav
      className="sidebar"
      style={{
        width: collapsed ? 56 : 220,
        transition: 'width .2s ease',
        overflow: 'hidden',
        background: 'var(--sidebar-bg)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="sidebar-logo" style={{ padding: collapsed ? '18px 0' : '20px 16px 16px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6,
            background: 'rgba(255,255,255,0.12)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2h6a4 4 0 0 1 0 8H2V2Z" fill="rgba(253,252,248,0.75)" />
              <path d="M2 10h5" stroke="rgba(253,252,248,0.75)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.90)', lineHeight: 1.2 }}>PFMS</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                Financial Mgmt
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role switcher — hidden when collapsed */}
      {!collapsed && (
        <div style={{ padding: '12px 12px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>
            Viewing as
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                style={{
                  flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 700,
                  borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: role === r ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)',
                  color: role === r ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.40)',
                  transition: 'all .12s',
                }}
              >{r}</button>
            ))}
          </div>
        </div>
      )}

      {/* Main nav */}
      {!collapsed && <div className="sidebar-section">Navigation</div>}
      <div style={{ marginTop: collapsed ? 8 : 0 }}>
        {navItems.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            id={item.id}
            screen={screen}
            navigate={navigate}
            iconColor={iconColor}
            collapsed={collapsed}
          />
        ))}
      </div>

      {/* Project context */}
      {inProjectView && activeProject && (role === 'PM' || role === 'PD') && (
        <>
          {!collapsed && <div className="sidebar-section" style={{ marginTop: 4 }}>Project</div>}
          {!collapsed && (
            <div style={{
              margin: '0 10px 6px',
              padding: '8px 10px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.80)', lineHeight: 1.3 }}>
                {activeProject.name}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', marginTop: 3, letterSpacing: '0.04em' }}>
                {activeProject.id}
              </div>
            </div>
          )}
          {PROJECT_SUB.map(sub => (
            <SubItem
              key={sub.id}
              label={sub.label}
              icon={sub.icon}
              id={sub.id}
              screen={screen}
              navigate={navigate}
              projectId={projectId}
              collapsed={collapsed}
            />
          ))}
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Collapse toggle */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: collapsed ? '8px 0' : '8px 10px' }}>
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, padding: collapsed ? '7px 0' : '7px 8px',
            borderRadius: 6, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
            transition: 'all .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
          {!collapsed && 'Collapse'}
        </button>
      </div>

      {/* Theme + user */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: collapsed ? '12px 0' : '12px 16px' }}>
        {!collapsed && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={toggleTheme}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.50)',
                fontSize: 12, fontWeight: 500, fontFamily: 'inherit', transition: 'all .12s',
              }}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} />
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <button
            onClick={collapsed ? toggleTheme : undefined}
            title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.75)', flexShrink: 0,
              cursor: collapsed ? 'pointer' : 'default',
            }}
          >
            {ROLE_USERS[role]?.initials}
          </button>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.80)', lineHeight: 1.2 }}>
                {ROLE_USERS[role]?.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontWeight: 500 }}>
                {ROLE_USERS[role]?.title}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavItem({ icon, label, id, screen, navigate, iconColor, collapsed }) {
  const active = screen === id;
  return (
    <button
      className={`sidebar-item${active ? ' active' : ''}`}
      onClick={() => navigate(id)}
      title={collapsed ? label : undefined}
      style={collapsed ? { justifyContent: 'center', padding: '10px 0' } : {}}
    >
      <span style={{ color: active ? 'rgba(255,255,255,0.95)' : iconColor, flexShrink: 0 }}>
        <Icon name={icon} size={15} />
      </span>
      {!collapsed && label}
    </button>
  );
}

function SubItem({ label, icon, id, screen, navigate, projectId, collapsed }) {
  const active = screen === id;
  if (collapsed) {
    return (
      <button
        className={`sidebar-item${active ? ' active' : ''}`}
        onClick={() => navigate(id, projectId)}
        title={label}
        style={{ justifyContent: 'center', padding: '10px 0' }}
      >
        <span style={{ color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.40)', flexShrink: 0 }}>
          <Icon name={icon} size={15} />
        </span>
      </button>
    );
  }
  return (
    <button className={`sidebar-sub${active ? ' active' : ''}`} onClick={() => navigate(id, projectId)}>
      {label}
    </button>
  );
}
