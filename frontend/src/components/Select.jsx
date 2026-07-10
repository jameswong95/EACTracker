import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

// A lightweight, fully styled single-select to replace the un-stylable native
// <select> option list. Renders its popup through a portal so it is never
// clipped by table/overflow containers. When the list has more than 8 options
// a search box is shown to filter them.
//   options: [{ value, label }]  ·  value: string  ·  onChange(value)
const SEARCH_THRESHOLD = 8;

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  ghost = false,
  title,
  style,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [active, setActive] = useState(-1);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));
  const showSearch = options.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    if (!showSearch || !search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(o => String(o.label).toLowerCase().includes(q));
  }, [options, search, showSearch]);

  // Position the portal popup + wire close-on-outside / Escape handlers.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.max(r.width, 200);
      let left = r.left;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
      const maxH = 320;
      let top = r.bottom + 6;
      let flip = false;
      if (top + maxH > window.innerHeight - 8 && r.top - maxH - 6 > 0) { top = r.top - 6; flip = true; }
      setPos({ top, left, width, flip });
    };
    place();
    const onDoc = e => {
      if (popRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = e => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(filtered.length - 1, a + 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
      if (e.key === 'Enter' && active >= 0 && filtered[active]) { e.preventDefault(); choose(filtered[active]); }
    };
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
  }, [open, filtered, active]);

  // Focus the search box when the popup opens.
  useEffect(() => {
    if (open && showSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open, showSearch]);

  // Keep the active row within bounds as the filtered list shrinks.
  useEffect(() => { setActive(a => (a >= filtered.length ? filtered.length - 1 : a)); }, [filtered.length]);

  function toggle() {
    if (disabled) return;
    if (!open) {
      setSearch('');
      setActive(options.findIndex(o => String(o.value) === String(value)));
    }
    setOpen(o => !o);
  }
  function choose(opt) {
    onChange(opt.value);
    setSearch('');
    setOpen(false);
  }

  const popup = open && pos ? createPortal(
    <div
      ref={popRef}
      style={{
        position: 'fixed', left: pos.left, width: pos.width, zIndex: 4000,
        ...(pos.flip ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)', padding: 6,
        maxHeight: 320, display: 'flex', flexDirection: 'column', animation: 'dp-pop .12s ease',
      }}
      role="listbox"
    >
      {showSearch && (
        <div style={{ padding: 2, marginBottom: 4 }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={searchRef}
              className="input"
              value={search}
              onChange={e => { setSearch(e.target.value); setActive(0); }}
              placeholder="Search…"
              style={{ paddingLeft: 30, fontSize: 12.5 }}
            />
          </div>
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.length === 0 && (
          <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-3)' }}>No matches</div>
        )}
        {filtered.map((o, i) => {
          const isSel = String(o.value) === String(value);
          const isActive = i === active;
          return (
            <div
              key={o.value === '' ? '__empty' : o.value}
              role="option"
              aria-selected={isSel}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '8px 10px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                fontSize: 12.5, lineHeight: 1.3,
                fontWeight: isSel ? 700 : 500,
                fontStyle: o.value === '' ? 'italic' : 'normal',
                color: isSel ? 'var(--accent)' : o.value === '' ? 'var(--text-3)' : 'var(--text)',
                background: isActive ? 'var(--surface-3)' : 'transparent',
                transition: 'background .1s',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
              {isSel && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  const hasValue = !!selected && selected.value !== '';

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={`select${ghost ? ' select-ghost' : ''}${hasValue ? '' : ' is-empty'}`}
        title={title}
        disabled={disabled}
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          backgroundImage: 'none', textAlign: 'left',
          cursor: disabled ? 'default' : 'pointer', ...style,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={open ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform .12s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {popup}
    </>
  );
}
