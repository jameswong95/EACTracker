import { randomUUID, timingSafeEqual } from 'crypto';
import { config } from './config.js';
import { query } from './db.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ROLES = new Set(['Admin', 'Project Manager', 'Project Director', 'Leader', 'Finance']);
const ROLE_PRIORITY = ['Admin', 'Leader', 'Finance', 'Project Director', 'Project Manager'];

const WRITE_RULES = [
  [/^\/api\/users(?:\/|$)/, ['Admin']],
  [/^\/api\/(?:fixed-rates|fx-rates|settings)(?:\/|$)/, ['Admin', 'Finance']],
  [/^\/api\/sap(?:\/|$)/, ['Admin', 'Finance']],
  [/^\/api\/approvals(?:\/|$)/, ['Admin', 'Project Director', 'Leader']],
  [/^\/api\/periods(?:\/|$)/, ['Admin', 'Project Director', 'Finance']],
  [/^\/api\/resources\/pool\/sync-rps(?:\/|$)/, ['Admin', 'Finance']],
  [/^\/api\/resources\/grades(?:\/|$)/, ['Admin', 'Finance']],
  [/^\/api\/(?:resources|resource-requests)(?:\/|$)/, ['Admin', 'Project Manager', 'Project Director', 'Leader']],
  [/^\/api\/tender(?:\/|$)/, ['Admin', 'Project Manager', 'Project Director', 'Leader', 'Finance']],
  [
    /^\/api\/(?:projects|sub-jobs|eac|revrec|milestones|risks|updates|project-initiation|etc|materials|material-assets|material-misc|sub-con|others)(?:\/|$)/,
    ['Admin', 'Project Manager', 'Leader', 'Finance'],
  ],
];

function clean(value) {
  return String(value ?? '').replace(/[\r\n\t]/g, ' ').slice(0, 500);
}

function ipFor(req) {
  return clean(req.ip || req.socket?.remoteAddress || 'unknown');
}

function unauthorized(message = 'unauthorized', status = 401) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function readHeader(req, name) {
  return req.get(name) || req.get(name.toLowerCase()) || '';
}

function readFirstHeader(req, names) {
  for (const name of names) {
    const value = clean(readHeader(req, name));
    if (value) return value;
  }
  return '';
}

function normalizeRole(role) {
  const roles = String(role || '')
    .split(',')
    .map(clean)
    .filter(value => ROLES.has(value));
  return ROLE_PRIORITY.find(value => roles.includes(value)) || null;
}

function bootstrapRoleFor(username) {
  const email = String(username || '').trim().toLowerCase();
  if (!email || !config.auth.bootstrapAdminEmail) return null;
  if (email !== config.auth.bootstrapAdminEmail) return null;
  return normalizeRole(config.auth.bootstrapAdminRole) || 'Admin';
}

function allowedWriteRoles(path) {
  const rule = WRITE_RULES.find(([pattern]) => pattern.test(path));
  return rule ? rule[1] : ['Admin'];
}

export function logSecurity(req, type, message, meta = {}) {
  const event = {
    ts: new Date().toISOString(),
    level: 'warn',
    type: clean(type),
    message: clean(message),
    request_id: req?.id || null,
    method: req?.method || null,
    path: req?.originalUrl ? clean(req.originalUrl.split('?')[0]) : null,
    ip: req ? ipFor(req) : null,
    user_id: req?.user?.id ?? null,
    role: req?.user?.role || null,
    meta,
  };
  console.warn(JSON.stringify(event));
}

export function requestContext(req, res, next) {
  req.id = req.get('x-request-id') || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

export function securityHeaders(req, res, next) {
  const connectSrc = ["'self'", ...config.corsOrigins].join(' ');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `connect-src ${connectSrc}`,
      "form-action 'self'",
    ].join('; '),
  );
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

const buckets = new Map();

export function apiRateLimit(req, res, next) {
  const now = Date.now();
  const key = ipFor(req);
  const current = buckets.get(key);
  const windowMs = config.security.rateLimitWindowMs;
  const max = config.security.rateLimitMax;
  const bucket = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  buckets.set(key, bucket);

  res.setHeader('RateLimit-Limit', String(max));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > max) {
    logSecurity(req, 'rate_limit', 'API rate limit exceeded', { reset_at: new Date(bucket.resetAt).toISOString() });
    res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'too many requests' });
  }
  return next();
}

export function requireExpectedContentType(req, res, next) {
  if (!WRITE_METHODS.has(req.method)) return next();
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (req.path.startsWith('/sap/') && contentType.startsWith('multipart/form-data')) return next();
  if (contentType.startsWith('application/json')) return next();
  logSecurity(req, 'content_type_rejected', 'Unexpected content type', { content_type: clean(contentType || 'missing') });
  return res.status(415).json({ error: 'unsupported content type' });
}

async function lookupUser(username) {
  const result = await query(
    `SELECT id, username, full_name, initials, role, is_active
     FROM users
     WHERE LOWER(username) = LOWER($1)
     LIMIT 1`,
    [username],
  );
  return result.rows[0] || null;
}

export async function authenticate(req, _res, next) {
  if (config.auth.mode === 'disabled') return next();

  if (config.auth.mode === 'demo') {
    req.user = {
      id: Number(readHeader(req, 'x-demo-user-id')) || null,
      username: clean(readHeader(req, 'x-demo-username') || 'demo'),
      role: normalizeRole(readHeader(req, 'x-demo-role')) || 'Admin',
    };
    return next();
  }

  const providedSecret = readHeader(req, config.auth.proxySecretHeader);
  if (!safeCompare(providedSecret, config.auth.proxySecret)) {
    logSecurity(req, 'auth_failure', 'Proxy authentication secret missing or invalid');
    return next(unauthorized());
  }

  const username = readFirstHeader(req, [
    config.auth.usernameHeader,
    'x-auth-email',
    'x-auth-user',
    'x-auth-request-email',
    'x-auth-request-user',
    config.auth.userIdHeader,
  ]);
  if (!username) {
    logSecurity(req, 'auth_failure', 'Authenticated proxy request is missing username claim');
    return next(unauthorized());
  }

  try {
    const dbUser = await lookupUser(username);
    if (dbUser && !dbUser.is_active) {
      logSecurity(req, 'auth_failure', 'Authenticated user is inactive', { username });
      return next(unauthorized());
    }
    if (dbUser) {
      req.user = {
        id: dbUser.id,
        username: dbUser.username,
        full_name: dbUser.full_name,
        initials: dbUser.initials,
        role: dbUser.role,
      };
      return next();
    }
  } catch (e) {
    return next(e);
  }

  const role = normalizeRole(readHeader(req, config.auth.roleHeader)) || bootstrapRoleFor(username);
  const id = Number(readHeader(req, config.auth.userIdHeader));
  if (!role) {
    logSecurity(req, 'auth_failure', 'Authenticated proxy request is missing role claim and no linked PFMS user exists', { username });
    return next(unauthorized());
  }

  req.user = { id: Number.isInteger(id) && id > 0 ? id : null, username, role };
  return next();
}

export function authorize(req, _res, next) {
  if (!req.user && config.auth.mode !== 'disabled') {
    logSecurity(req, 'access_denied', 'Missing authenticated user');
    return next(unauthorized());
  }
  if (READ_METHODS.has(req.method)) return next();
  if (!WRITE_METHODS.has(req.method)) return next();

  const allowed = allowedWriteRoles(`${req.baseUrl}${req.path}`);
  const role = req.user?.role;
  if (role === 'Admin' || allowed.includes(role)) return next();

  logSecurity(req, 'access_denied', 'Role is not allowed to perform write operation', { allowed_roles: allowed });
  return next(unauthorized('forbidden', 403));
}
