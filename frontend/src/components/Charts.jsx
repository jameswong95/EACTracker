import React, { useId } from 'react';

// ── PRD colour constants (§6.1) ──────────────────────────────────────────
export const C = {
  budget:    '#2F6BBD',
  actual:    '#008C95',
  committed: '#C99000',
  forecast:  '#7030A0',
  cash:      '#ED7D31',
  fav:       '#2E7D32',
  attn:      '#F5A000',
  adverse:   '#C62828',
  neutral:   '#6B7280',
  milestone: '#F5A000',
};

// Category colours — consistent across portfolio & project (PRD §5.4.3)
export const CAT_COLORS = {
  'PM':               '#2F6BBD',
  'PM/MISC':          '#2F6BBD',
  'Material':         '#008C95',
  'Subcon':           '#C99000',
  'Spares':           '#7030A0',
  'Other LOB and MISC': '#6B7280',
  'Other LOB/MISC':   '#6B7280',
  'Others LOB/MISC':  '#6B7280',
  'Others':           '#6B7280',
};

export function fmtShort(v) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

// ── SegmentedRing — multi-segment donut (PRD §4.5, §5.4.3) ──────────────
export function SegmentedRing({ segments = [], size = 140, stroke = 18, centerLabel, centerSub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let cumOffset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--surface-3)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const pct = s.value / total;
        const dash = pct * circ;
        const start = cumOffset;
        cumOffset += dash;
        return (
          <circle key={i} cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-start}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        );
      })}
      {centerLabel && (
        <text x={size / 2} y={size / 2 - (centerSub ? 5 : 0)}
          textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)">
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text x={size / 2} y={size / 2 + 16}
          textAnchor="middle" fontSize="11" fill="var(--text-3)">{centerSub}</text>
      )}
    </svg>
  );
}

// ── MultiSeriesLineChart — PRD §4.4, §5.2 ─────────────────────────────
// series: [{ label, values: number[], color, dashed?, area?, strokeWidth? }]
// labels: string[] (x axis)
// asAtIndex: vertical "as at" marker
export function MultiSeriesLineChart({
  series = [], labels = [], asAtIndex = null,
  width = 540, height = 200, showXAxis = true, showGrid = true,
  zones = false, unit = '', milestones = [],
}) {
  const pad = { t: zones ? 22 : 12, r: 16, b: showXAxis ? 28 : 8, l: 52 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const n = Math.max(...series.map(s => s.values.length), labels.length, 2);
  const allVals = series.flatMap(s => s.values).filter(v => v != null && !isNaN(v));
  const dataMax = allVals.length ? Math.max(...allVals) : 1;
  const dataMin = Math.min(0, ...(allVals.length ? allVals : [0]));
  const range   = dataMax - dataMin || 1;

  const px = (i) => pad.l + (i / Math.max(n - 1, 1)) * W;
  const py = (v) => pad.t + H - ((v - dataMin) / range) * H;

  function fmtK(v) {
    const abs = Math.abs(v);
    if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return String(Math.round(v));
  }

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(f => dataMin + f * range);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }} overflow="visible">
      {/* Forecast zone shading + ACTUAL / FORECAST labels */}
      {zones && asAtIndex != null && (
        <>
          <rect x={px(asAtIndex)} y={pad.t} width={pad.l + W - px(asAtIndex)} height={H}
            fill="var(--text-3)" opacity="0.05" />
          <text x={(pad.l + px(asAtIndex)) / 2} y={pad.t - 8} textAnchor="middle"
            fontSize="9.5" fontWeight="700" fill="var(--text-3)" letterSpacing="0.08em">ACTUAL</text>
          <text x={(px(asAtIndex) + pad.l + W) / 2} y={pad.t - 8} textAnchor="middle"
            fontSize="9.5" fontWeight="700" fill="var(--text-3)" letterSpacing="0.08em">FORECAST</text>
        </>
      )}
      {showGrid && gridVals.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} y1={py(v)} x2={pad.l + W} y2={py(v)}
            stroke="var(--border)" strokeWidth="1" opacity="0.5" />
          <text x={pad.l - 6} y={py(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-3)">
            {fmtK(v)}{unit}
          </text>
        </g>
      ))}
      {showXAxis && labels.map((l, i) => {
        const step = labels.length <= 12 ? 1 : Math.ceil(labels.length / 8);
        if (i % step !== 0 && i !== labels.length - 1) return null;
        return (
          <text key={i} x={px(i)} y={pad.t + H + 18}
            textAnchor="middle" fontSize="9.5" fill="var(--text-3)">{l}</text>
        );
      })}
      {asAtIndex != null && (
        <>
          <line x1={px(asAtIndex)} y1={pad.t} x2={px(asAtIndex)} y2={pad.t + H}
            stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 3" />
          {!zones && (
            <text x={px(asAtIndex) + 4} y={pad.t + 9} fontSize="9" fill="var(--text-3)">As at</text>
          )}
        </>
      )}
      {series.map((s, si) => {
        if (!s.area) return null;
        const vals = s.values;
        const area = [`${px(0)},${py(dataMin)}`,
          ...vals.map((v, i) => v != null ? `${px(i)},${py(v)}` : null).filter(Boolean),
          `${px(vals.length - 1)},${py(dataMin)}`].join(' ');
        return <polygon key={si} points={area} fill={s.color} opacity={0.06} />;
      })}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => v != null ? `${px(i)},${py(v)}` : null);
        const segments = [];
        let cur = [];
        pts.forEach(p => { if (p) cur.push(p); else if (cur.length) { segments.push(cur); cur = []; } });
        if (cur.length) segments.push(cur);
        return segments.map((seg, j) => (
          <polyline key={`${si}-${j}`} points={seg.join(' ')} fill="none"
            stroke={s.color} strokeWidth={s.strokeWidth || 2}
            strokeDasharray={s.dashed ? '6 4' : undefined}
            strokeLinecap="round" strokeLinejoin="round"
            opacity={s.opacity ?? 1} />
        ));
      })}
      {/* per-series point markers */}
      {series.map((s, si) => s.markers
        ? s.values.map((v, i) => v != null
            ? <circle key={`m${si}-${i}`} cx={px(i)} cy={py(v)} r="2.4"
                fill={s.color} opacity={s.opacity ?? 1} />
            : null)
        : null)}
      {/* milestone payment markers (orange squares) */}
      {milestones.map((m, i) => (
        <rect key={`ms${i}`} x={px(m.index) - 4} y={py(m.value) - 4} width="8" height="8"
          rx="1" fill={C.milestone || '#F5A000'} stroke="#fff" strokeWidth="1" />
      ))}
      {series.map((s, si) => {
        if (s.dashed || s.markers) return null;
        const endIdx = asAtIndex != null ? Math.min(asAtIndex, s.values.length - 1) : s.values.length - 1;
        const v = s.values[endIdx];
        if (v == null) return null;
        return <circle key={si} cx={px(endIdx)} cy={py(v)} r="3" fill={s.color} />;
      })}
    </svg>
  );
}

// ── HorizontalBarChart — PRD §4.3 ────────────────────────────────────────
export function HorizontalBarChart({ bars = [], maxAbs }) {
  const absMax = maxAbs || Math.max(...bars.map(b => Math.abs(b.value)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {bars.map((b, i) => {
        const isAdverse = b.value < 0;
        const col = b.color || (isAdverse ? C.adverse : b.value === 0 ? C.neutral : C.fav);
        const pct = Math.min(100, (Math.abs(b.value) / absMax) * 100);
        const dispVal = Math.abs(b.value) >= 1e6
          ? `${isAdverse ? '-' : '+'}${fmtShort(Math.abs(b.value))}`
          : `${isAdverse ? '-' : '+'}${fmtShort(Math.abs(b.value))}`;
        return (
          <div key={i} className="hbar-row">
            <div className="hbar-label" title={b.label}>{b.label}</div>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width: `${pct}%`, background: col, opacity: 0.85 }} />
            </div>
            <div className="hbar-amount" style={{ color: col, fontWeight: 700, fontSize: 12 }}>
              {b.pct != null
                ? `${isAdverse ? '-' : '+'}${Math.abs(b.pct).toFixed(1)}%`
                : dispVal}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── DivergingBarChart — EAC Variance % (diverging around zero) ───────────
// bars: [{ label, pct, color }]. Positive pct extends right (overrun),
// negative extends left (under budget), around a central zero axis.
export function DivergingBarChart({ bars = [], height }) {
  if (!bars.length) return <div style={{ color: 'var(--text-3)', fontSize: 12 }}>No data</div>;

  const W        = 480;   // viewBox width
  const leftW    = 128;   // label column
  const rightPad = 46;    // room for value labels
  const topPad   = 6;
  const rowH     = 22;
  const rowGap   = 7;
  const axisH    = 20;

  const plotLeft  = leftW;
  const plotRight = W - rightPad;
  const plotW     = plotRight - plotLeft;
  const n         = bars.length;
  const plotBottom = topPad + n * (rowH + rowGap);
  const H = height || (plotBottom + axisH);

  // Symmetric axis domain with a "nice" step so tick labels stay readable.
  const vals = bars.map(b => b.pct);
  const rawMax = Math.max(5, Math.max(...vals.map(Math.abs)));
  const niceSteps = [5, 10, 20, 25, 50, 100];
  const step = niceSteps.find(s => rawMax / s <= 4) || 100;
  const bound = Math.ceil(rawMax / step) * step;
  const axisMin = -bound;
  const axisMax = bound;
  const span = (axisMax - axisMin) || 1;
  const xOf = v => plotLeft + ((v - axisMin) / span) * plotW;
  const zeroX = xOf(0);

  const ticks = [];
  for (let t = axisMin; t <= axisMax + 0.001; t += step) ticks.push(t);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* gridlines + axis tick labels */}
      {ticks.map((t, i) => {
        const x = xOf(t);
        const isZero = t === 0;
        return (
          <g key={i}>
            <line x1={x} y1={topPad} x2={x} y2={plotBottom}
              stroke={isZero ? 'var(--border-2)' : 'var(--border)'} strokeWidth="1"
              opacity={isZero ? 0.9 : 0.3}
              strokeDasharray={isZero ? '' : '2 3'} />
            <text x={x} y={plotBottom + 13} textAnchor="middle" fontSize="9" fill="var(--text-3)">
              {t > 0 ? `+${t}` : t}%
            </text>
          </g>
        );
      })}

      {/* bars + labels */}
      {bars.map((b, i) => {
        const y = topPad + i * (rowH + rowGap);
        const cy = y + rowH / 2;
        const isPos = b.pct >= 0;
        const bx = isPos ? zeroX : xOf(b.pct);
        const bw = Math.max(1, Math.abs(xOf(b.pct) - zeroX));
        const col = b.color;
        const valX = isPos ? bx + bw + 6 : zeroX + 6;
        return (
          <g key={i}>
            <text x={plotLeft - 10} y={cy + 3} textAnchor="end" fontSize="10.5" fill="var(--text-2)">
              {b.label}
            </text>
            <rect x={bx} y={y + 2} width={bw} height={rowH - 4} rx="2" fill={col} opacity="0.9" />
            <text x={valX} y={cy + 3} textAnchor="start" fontSize="10" fontWeight="700" fill={col}>
              {isPos ? '+' : ''}{b.pct.toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── GroupedBarChart — PRD §5.4.1 ─────────────────────────────────────────
export function GroupedBarChart({ groups = [], height = 160 }) {
  const allVals = groups.flatMap(g => g.bars.map(b => b.value));
  const max = Math.max(...allVals, 1);
  const barW = 26, gap = 4, grpGap = 16;
  const bars0 = groups[0]?.bars.length || 1;
  const grpW = bars0 * (barW + gap) - gap;
  const totalW = 40 + groups.length * (grpW + grpGap);
  const H = height - 36;

  function fmtK(v) {
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return String(Math.round(v));
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${totalW} ${height}`} width={totalW} height={height}
        style={{ width: '100%', maxWidth: totalW, minWidth: 260 }}>
        {/* y-axis labels */}
        {[0, 0.5, 1].map((f, i) => {
          const v = max * f;
          const y = H + 8 - f * H;
          return (
            <g key={i}>
              <line x1={36} y1={y} x2={totalW - 4} y2={y}
                stroke="var(--border)" strokeWidth="1" opacity="0.4" />
              <text x={34} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-3)">{fmtK(v)}</text>
            </g>
          );
        })}
        {groups.map((g, gi) => {
          const gx = 40 + gi * (grpW + grpGap);
          return (
            <g key={gi}>
              {g.bars.map((b, bi) => {
                const bh = Math.max((b.value / max) * H, 2);
                const bx = gx + bi * (barW + gap);
                return (
                  <g key={bi}>
                    <rect x={bx} y={H + 8 - bh} width={barW} height={bh}
                      fill={b.color} opacity={0.85} rx={2} />
                  </g>
                );
              })}
              <text x={gx + grpW / 2} y={H + 26} textAnchor="middle" fontSize="11" fill="var(--text-3)">
                {g.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── LineChart (legacy-compat) ─────────────────────────────────────────────── */
export function LineChart({ data = [], budget, width = 400, height = 120, color = 'var(--accent)' }) {
  if (!data.length) return null;
  const pad = { t: 8, r: 0, b: 8, l: 0 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const max = Math.max(...data, budget || 0) * 1.08 || 1;
  const px = (i) => pad.l + (i / (data.length - 1)) * w;
  const py = (v) => pad.t + h - (v / max) * h;
  const linePts = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const areaPts = [
    `${px(0)},${pad.t + h + pad.b}`,
    ...data.map((v, i) => `${px(i)},${py(v)}`),
    `${px(data.length - 1)},${pad.t + h + pad.b}`,
  ].join(' ');
  const budgetY = budget ? py(budget) : null;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
      style={{ overflow: 'visible', width: '100%', height: `${height}px` }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill="url(#area-grad)" />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {budgetY && (
        <line x1={pad.l} y1={budgetY} x2={pad.l + w} y2={budgetY}
          stroke={C.adverse} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
      )}
    </svg>
  );
}

/* ── BarChart (legacy-compat) ──────────────────────────────────────────── */
export function BarChart({ bars = [], width = 300, height = 80, gap = 4 }) {
  if (!bars.length) return null;
  const max = Math.max(...bars.map(b => b.value), 1);
  const barW = (width - gap * (bars.length - 1)) / bars.length;
  return (
    <svg width={width} height={height}>
      {bars.map((b, i) => {
        const bh = Math.max((b.value / max) * (height - 16), 4);
        const color = b.color || (b.value > 100 ? C.adverse : b.value > 70 ? C.attn : C.fav);
        return (
          <g key={i}>
            <rect x={i * (barW + gap)} y={height - bh - 16}
              width={barW} height={bh} rx="3" fill={color} opacity="0.85" />
            {b.label && (
              <text x={i * (barW + gap) + barW / 2} y={height - 2}
                textAnchor="middle" fontSize="9" fill="var(--text-3)">{b.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── DonutChart (single %) ─────────────────────────────────── */
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
export function Sparkline({ data = [], width = 80, height = 28, color }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const px = (i) => (i / (data.length - 1)) * width;
  const py = (v) => height - ((v - min) / range) * (height - 2) - 1;
  const pts = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const last = data[data.length - 1];
  const trend = last > data[0] ? 1 : last < data[0] ? -1 : 0;
  const col = color || (trend > 0 ? C.adverse : trend < 0 ? C.fav : C.neutral);
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px(data.length - 1)} cy={py(last)} r="2.5" fill={col} />
    </svg>
  );
}

/* ── StackedBar ────────────────────────────────────────────── */
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
