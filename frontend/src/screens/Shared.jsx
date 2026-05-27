import React from 'react';

export const SVGFilters = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <filter id="wob" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="1.6" />
      </filter>
      <filter id="wob2" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="2.4" />
      </filter>
    </defs>
  </svg>
);

export const Arrow = ({ dir = 'right', length = 40, color = '#3a352f', label }) => {
  const w = dir === 'down' || dir === 'up' ? 26 : length;
  const h = dir === 'down' || dir === 'up' ? length : 26;
  const path =
    dir === 'right' ? `M4 ${h / 2} Q${w * 0.4} ${h / 2 - 3} ${w - 8} ${h / 2}` :
    dir === 'down'  ? `M${w / 2} 4 Q${w / 2 - 3} ${h * 0.4} ${w / 2} ${h - 8}` :
    dir === 'left'  ? `M${w - 4} ${h / 2} Q${w * 0.6} ${h / 2 + 3} 8 ${h / 2}` :
                      `M${w / 2} ${h - 4} Q${w / 2 + 3} ${h * 0.6} ${w / 2} 8`;
  const tip =
    dir === 'right' ? `M${w - 12} ${h / 2 - 5} L${w - 6} ${h / 2} L${w - 12} ${h / 2 + 5}` :
    dir === 'down'  ? `M${w / 2 - 5} ${h - 12} L${w / 2} ${h - 6} L${w / 2 + 5} ${h - 12}` :
    dir === 'left'  ? `M12 ${h / 2 - 5} L6 ${h / 2} L12 ${h / 2 + 5}` :
                      `M${w / 2 - 5} 12 L${w / 2} 6 L${w / 2 + 5} 12`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: '0 0 auto' }}>
      <svg width={w} height={h} style={{ overflow: 'visible' }}>
        <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        <path d={tip} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && <div style={{ fontFamily: 'Caveat', fontSize: 12, color: '#6b655e', whiteSpace: 'nowrap', marginTop: -4 }}>{label}</div>}
    </div>
  );
};

export const LineChart = ({ width = 300, height = 120, points, budgetLine = true, label }) => {
  const pts = points || [10, 18, 26, 34, 46, 58, 72, 80, 86, 90, 96, 104];
  const max = Math.max(...pts, budgetLine ? 100 : 0) * 1.05;
  const path = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * width;
    const y = height - (p / max) * height;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {budgetLine && (
        <line x1="0" y1={height - (100 / max) * height} x2={width} y2={height - (100 / max) * height}
          stroke="#b8442e" strokeWidth="1.2" strokeDasharray="4 3" />
      )}
      <path d={path} fill="none" stroke="#1a1815" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const x = (i / (pts.length - 1)) * width;
        const y = height - (p / max) * height;
        return <circle key={i} cx={x} cy={y} r="1.8" fill="#1a1815" />;
      })}
      {label && <text x={width - 4} y={14} textAnchor="end" fontFamily="Kalam" fontSize="11" fill="#6b655e">{label}</text>}
    </svg>
  );
};

export const BarChart = ({ width = 300, height = 100, bars, gap = 4 }) => {
  const data = bars || [
    { v: 30, c: '#6b655e' }, { v: 45, c: '#6b655e' }, { v: 55, c: '#6b655e' },
    { v: 62, c: '#6b655e' }, { v: 48, c: '#6b655e' }, { v: 70, c: '#1a1815' },
    { v: 80, c: '#1a1815' }, { v: 85, c: '#c98a2c' },
  ];
  const bw = (width - gap * (data.length - 1)) / data.length;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const x = i * (bw + gap);
        const bh = (d.v / 100) * height;
        return <rect key={i} x={x} y={height - bh} width={bw} height={bh} fill={d.c} rx="1" />;
      })}
    </svg>
  );
};

export const Status = ({ status = 'ok', children }) => {
  const label = children || (
    status === 'ok'   ? 'On Track' :
    status === 'warn' ? 'At Risk'  :
    status === 'bad'  ? 'Delayed'  :
    status === 'info' ? 'Completed' : '—'
  );
  return (
    <span className={`pill ${status}`}>
      <span className={`dot ${status}`} />
      {label}
    </span>
  );
};

export const Table = ({ cols, rows, colWidths }) => {
  const tmpl = colWidths || cols.map(() => '1fr').join(' ');
  const colStr = typeof tmpl === 'string' ? tmpl : tmpl.join(' ');
  return (
    <div className="tbl" style={{ gridTemplateColumns: colStr }}>
      {cols.map((c, i) => <div key={'h' + i} className="th">{c}</div>)}
      {rows.map((r, ri) =>
        r.map((c, ci) => (
          <div
            key={`${ri}-${ci}`}
            className={`td ${r.__cls || ''}`}
            style={r.__rowStyle || {}}
          >
            {c}
          </div>
        ))
      )}
    </div>
  );
};

export const Anno = ({ n, x, y, children, rot, w = '160px', side = 'r' }) => (
  <>
    <div className="anno-mark" style={{ left: x - 9, top: y - 9 }}>{n}</div>
    <div
      className={`note ${side === 'r' ? 'r' : ''}`}
      style={{
        left: side === 'r' ? x + 18 : 'auto',
        right: side === 'l' ? `calc(100% - ${x - 18}px)` : 'auto',
        top: y - 12,
        width: w,
        transform: rot ? `rotate(${rot}deg)` : undefined,
      }}
    >
      {children}
    </div>
  </>
);

export const Ph = ({ w = '100%', h = 60, label = 'img' }) => (
  <div className="ph" style={{ width: w, height: h }}>{label}</div>
);

export const NavItem = ({ active, ic, children }) => (
  <div className={`nav-item ${active ? 'active' : ''}`}>
    <span className="nav-ic" style={{ borderRadius: ic === 'dot' ? '50%' : 3 }} />
    <span>{children}</span>
  </div>
);

export const Logo = ({ size = 14 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <svg width={size * 1.6} height={size * 1.6} viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" fill="none" stroke="#1a1815" strokeWidth="1.8" rx="3" />
      <path d="M6 8 L6 18 M6 8 L13 8 Q15 10 13 12 L6 12 M10 14 L16 14 L18 18"
        stroke="#1a1815" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: size + 4, letterSpacing: '-0.01em' }}>PFMS</span>
  </div>
);

export const TopBar = ({ user = 'Sara Tan', role = 'Project Manager', tabs, active }) => (
  <div className="row p-4" style={{ borderBottom: '1.5px solid #1a1815', gap: 16, background: 'var(--paper-2)' }}>
    <Logo />
    {tabs && (
      <div className="row" style={{ gap: 4, marginLeft: 12 }}>
        {tabs.map((t, i) => (
          <div key={i} style={{
            padding: '4px 10px', borderRadius: 5,
            fontFamily: 'Kalam', fontSize: 13,
            background: t === active ? 'var(--ink)' : 'transparent',
            color: t === active ? 'var(--paper)' : 'var(--ink-2)',
            border: t === active ? '1.5px solid var(--ink)' : '1.5px solid transparent',
          }}>{t}</div>
        ))}
      </div>
    )}
    <div className="grow" />
    <div className="input" style={{ minWidth: 120, fontStyle: 'italic', color: 'var(--ink-3)' }}>🔍 search projects</div>
    <div className="row gap-3">
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ink-3)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>ST</div>
      <div className="col" style={{ gap: 0, lineHeight: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 700 }}>{user}</span>
        <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>{role}</span>
      </div>
    </div>
  </div>
);

export const NAV_BY_ROLE = {
  PM: [
    { ic: 'dot', label: 'Dashboard' },
    { ic: 'box', label: 'Projects' },
    { ic: 'box', label: 'Resources' },
    { ic: 'box', label: 'Recognition' },
    { ic: 'box', label: 'Updates' },
  ],
  PD: [
    { ic: 'dot', label: 'Portfolio' },
    { ic: 'box', label: 'Projects' },
    { ic: 'box', label: 'Recognition risk' },
    { ic: 'box', label: 'Approvals' },
    { ic: 'box', label: 'Updates' },
  ],
  Finance: [
    { ic: 'dot', label: 'SAP Import' },
    { ic: 'box', label: 'Period Lock' },
    { ic: 'box', label: 'Rate Card' },
    { ic: 'box', label: 'Projects' },
    { ic: 'box', label: 'Audit Log' },
  ],
};

export const Sidebar = ({ active = 'Dashboard', collapsed = false, items, user = 'Sara', role = 'PM' }) => {
  const defaultItems = items || NAV_BY_ROLE[role] || NAV_BY_ROLE.PM;
  return (
    <div className="col" style={{
      width: collapsed ? 44 : 130,
      flex: `0 0 ${collapsed ? 44 : 130}px`,
      borderRight: '1.5px solid var(--ink)',
      background: 'var(--paper-2)',
      padding: '12px 8px',
      gap: 2,
    }}>
      <Logo size={12} />
      <div className="hr thin mt-3" style={{ marginBottom: 6 }} />
      {defaultItems.map((it, i) => (
        <NavItem key={i} active={active === it.label} ic={it.ic}>
          {!collapsed && it.label}
        </NavItem>
      ))}
      <div className="grow" />
      <div className="t-xs" style={{ textAlign: 'center' }}>
        {collapsed ? user.split(' ').map(s => s[0]).join('') : `${user} · ${role}`}
      </div>
    </div>
  );
};
