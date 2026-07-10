import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

// A lightweight, fully styled date picker to replace the un-stylable native
// <input type="date"> popup. Value is an ISO 'YYYY-MM-DD' string (or '').
// All date math is done with local parts to avoid UTC off-by-one shifts.

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const pad = n => String(n).padStart(2, '0');
function parseISO(v) {
  if (!v) return null;
  const [y, m, d] = String(v).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
function fmtDisplay(v) {
  const p = parseISO(v);
  if (!p) return '';
  return `${pad(p.d)} ${MONTHS[p.m].slice(0, 3)} ${p.y}`;
}
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function DatePicker({ value, onChange, placeholder = 'Select date', title, style, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const today = new Date();
  const sel = parseISO(value);
  const [view, setView] = useState(() =>
    sel ? { y: sel.y, m: sel.m } : { y: today.getFullYear(), m: today.getMonth() });

  // Keep the visible month in sync when the value changes from outside.
  useEffect(() => {
    const p = parseISO(value);
    if (p) setView({ y: p.y, m: p.m });
  }, [value]);

  // Position the portal popup and wire close-on-outside / Escape handlers.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = 264;
      let left = r.left;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
      let top = r.bottom + 6;
      const height = 320;
      if (top + height > window.innerHeight - 8 && r.top - height - 6 > 0) top = r.top - height - 6;
      setPos({ top, left, width });
    };
    place();
    const onDoc = e => {
      if (popRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const start = new Date(view.y, view.m, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  const selDate = sel ? new Date(sel.y, sel.m, sel.d) : null;

  function pick(d) {
    onChange(toISO(d.getFullYear(), d.getMonth(), d.getDate()));
    setOpen(false);
  }
  function shiftMonth(delta) {
    setView(v => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  const navBtn = {
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)',
    color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit',
  };

  const popup = open && pos ? createPortal(
    <div
      ref={popRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left, width: 264, zIndex: 4000,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)', padding: 14,
        animation: 'dp-pop .12s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {MONTHS[view.m]} {view.y}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" style={navBtn} title="Previous month" onClick={() => shiftMonth(-1)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button type="button" style={navBtn} title="Next month" onClick={() => shiftMonth(1)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '.03em',
            textTransform: 'uppercase', color: 'var(--text-3)', padding: '4px 0' }}>{w}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === view.m;
          const isSel = selDate && sameDay(d, selDate);
          const isToday = sameDay(d, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(d)}
              style={{
                height: 32, borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12.5, fontWeight: isSel || isToday ? 700 : 500,
                border: isToday && !isSel ? '1px solid var(--accent)' : '1px solid transparent',
                background: isSel ? 'var(--accent)' : 'transparent',
                color: isSel ? '#fff' : inMonth ? 'var(--text)' : 'var(--text-3)',
                fontVariantNumeric: 'tabular-nums', transition: 'background .1s, color .1s',
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={() => { onChange(''); setOpen(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 600, color: 'var(--text-2)', padding: '2px 4px' }}>
          Clear
        </button>
        <button type="button" onClick={() => pick(new Date())}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 700, color: 'var(--accent)', padding: '2px 4px' }}>
          Today
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="input"
        title={title}
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          cursor: disabled ? 'default' : 'pointer', textAlign: 'left', ...style }}
      >
        <span style={{ color: value ? 'var(--text)' : 'var(--text-3)', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? fmtDisplay(value) : placeholder}
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={open ? 'var(--accent)' : 'var(--text-3)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
      {popup}
    </>
  );
}
