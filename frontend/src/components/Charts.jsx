import React from 'react';

/* ── LineChart ─────────────────────────────────────────────── */
export function LineChart({ data = [], budget, width = 400, height = 120, color = 'var(--accent)' }) {
  if (!data.length) return null;
  const pad = { t: 8, r: 8, b: 8, l: 8 };
  const w = width  - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const max = Math.max(...data, budget || 0) * 1.08;
  const px = (i) => pad.l + (i / (data.length - 1)) * w;
  const py = (v) => pad.t + h - (v / max) * h;

  const linePts = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const areaPts = [
    `${px(0)},${py(0) + h + pad.b}`,
    ...data.map((v, i) => `${px(i)},${py(v)}`),
    `${px(data.length - 1)},${py(0) + h + pad.b}`,
  ].join(' ');

  const budgetY = budget ? py(budget) : null;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Area */}
      <polygon points={areaPts} fill="url(#area-grad)" />
      {/* Line */}
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Budget line */}
      {budgetY && (
        <line x1={pad.l} y1={budgetY} x2={pad.l + w} y2={budgetY}
          stroke="var(--bad)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
      )}
      {/* Dots on last 2 points */}
      {data.slice(-2).map((v, ii) => {
        const i = data.length - 2 + ii;
        return <circle key={i} cx={px(i)} cy={py(v)} r="3" fill={color} />;
      })}
    </svg>
  );
}

/* ── BarChart ──────────────────────────────────────────────── */
export function BarChart({ bars = [], width = 300, height = 80, gap = 4 }) {
  if (!bars.length) return null;
  const max = Math.max(...bars.map(b => b.value), 1);
  const barW = (width - gap * (bars.length - 1)) / bars.length;
  return (
    <svg width={width} height={height}>
      {bars.map((b, i) => {
        const bh = Math.max((b.value / max) * (height - 16), 4);
        const color = b.color || (b.value > 100 ? 'var(--bad)' : b.value > 70 ? 'var(--warn)' : 'var(--ok)');
        return (
          <g key={i}>
            <rect
              x={i * (barW + gap)} y={height - bh - 16}
              width={barW} height={bh}
              rx="3" fill={color} opacity="0.85"
            />
            {b.label && (
              <text x={i * (barW + gap) + barW / 2} y={height - 2}
                textAnchor="middle" fontSize="9" fill="var(--text-3)">
                {b.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── DonutChart ────────────────────────────────────────────── */
export function DonutChart({ pct = 0, size = 80, stroke = 10, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle"
        fontSize={size > 60 ? 14 : 11} fontWeight="700" fill="var(--text)">
        {pct}%
      </text>
    </svg>
  );
}

/* ── Sparkline ─────────────────────────────────────────────── */
export function Sparkline({ data = [], width = 80, height = 28, color = 'var(--accent)' }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const px = (i) => (i / (data.length - 1)) * width;
  const py = (v) => height - ((v - min) / range) * (height - 2) - 1;
  const pts = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const last = data[data.length - 1];
  const trend = last > data[0] ? 1 : last < data[0] ? -1 : 0;
  const sparkColor = trend > 0 ? 'var(--bad)' : trend < 0 ? 'var(--ok)' : color;
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none"
        stroke={sparkColor} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px(data.length - 1)} cy={py(last)} r="2.5" fill={sparkColor} />
    </svg>
  );
}

/* ── StackedBar (for EAC breakdown) ───────────────────────── */
export function StackedBar({ segments = [], height = 20 }) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <div style={{ display: 'flex', height, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {segments.map((s, i) => (
        <div key={i} title={`${s.label}: ${s.value}`}
          style={{ flex: s.value / total, background: s.color, minWidth: s.value > 0 ? 2 : 0 }} />
      ))}
    </div>
  );
}
