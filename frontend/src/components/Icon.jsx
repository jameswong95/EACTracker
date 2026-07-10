import React from 'react';

const paths = {
  arrowLeft: <path d="M15 18l-6-6 6-6M9 12h12" />,
  arrowRight: <path d="M9 6l6 6-6 6M3 12h12" />,
  download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  alertTriangle: <><path d="M12 3l10 18H2L12 3z" /><path d="M12 9v5M12 18h.01" /></>,
  hash: <path d="M10 3L8 21M16 3l-2 18M4 9h16M3 15h16" />,
  building: <><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" /><path d="M9 21v-4h3v4M8 7h.01M13 7h.01M8 11h.01M13 11h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 14.5-4 16 0" /></>,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2.5 21c1.2-3.5 11.8-3.5 13 0" /><path d="M17 5.5a3 3 0 0 1 0 5.8M18.5 14.5c1.8.7 3 1.9 3.5 3.5" /></>,
  tag: <><path d="M20 13l-7 7L4 11V4h7l9 9z" /><circle cx="8" cy="8" r="1" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  currency: <><circle cx="12" cy="12" r="9" /><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .8-3 2s1.2 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.6-.6-3.2-1.7M12 6v12" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  check: <path d="M5 12l4 4 10-10" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  refresh: <><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" /><path d="M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16" /><path d="M20 20v-4h-4" /></>,
  chartBar: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  square: <rect x="5" y="5" width="14" height="14" rx="2" />,
  sparkles: <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" /></>,
  trendUp: <path d="M4 16l6-6 4 4 6-8M14 6h6v6" />,
  trendDown: <path d="M4 8l6 6 4-4 6 8M14 18h6v-6" />,
  dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
};

export default function Icon({ name, size = 14, strokeWidth = 2, className, style, title }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {paths[name] || paths.dot}
    </svg>
  );
}
