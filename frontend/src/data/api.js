// Small fetch wrapper. Same-origin by default; set VITE_API_BASE_URL when the
// frontend is deployed separately from the backend.
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    ...opts,
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const j = await res.json(); if (j.error) msg = j.error; } catch (_) { /* ignore */ }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get:  (p)        => request(p),
  post: (p, body)  => request(p, { method: 'POST',   body: JSON.stringify(body) }),
  put:  (p, body)  => request(p, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:(p, body)  => request(p, { method: 'PATCH',  body: JSON.stringify(body) }),
  del:  (p)        => request(p, { method: 'DELETE' }),

  // multipart helper for SAP import
  upload: async (p, formData) => {
    const res = await fetch(BASE + p, { method: 'POST', body: formData });
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); if (j.error) msg = j.error; } catch (_) { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  },
};
