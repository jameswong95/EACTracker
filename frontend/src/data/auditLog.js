const entries = [];
let _seq = 1;

export function logAction({ action, detail, user, role }) {
  entries.unshift({
    id: _seq++,
    ts: new Date().toLocaleString('en-SG', { dateStyle: 'short', timeStyle: 'short', hour12: false }),
    action,
    detail: detail || '',
    user:   user   || 'System',
    role:   role   || 'System',
  });
  if (entries.length > 500) entries.pop();
}

export { entries };
