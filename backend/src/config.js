import { resolve } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const AUTH_MODES = new Set(['demo', 'proxy', 'disabled']);

const rootDir = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const backendDir = resolve(rootDir, 'backend');
const frontendDistDir = resolve(rootDir, 'frontend', 'dist');

const nodeEnv = process.env.NODE_ENV || 'development';
const appEnv = process.env.APP_ENV || nodeEnv;
const isProduction = nodeEnv === 'production';

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (isProduction && !value) {
    throw new Error(`${name} is required when NODE_ENV=production`);
  }
  return value;
}

function requiredWhen(condition, name) {
  const value = process.env[name] || '';
  if (condition && !value) {
    throw new Error(`${name} is required for this production security configuration`);
  }
  return value;
}

function boolEnv(name, fallback = false) {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function enumEnv(name, fallback, allowed) {
  const value = process.env[name] || fallback;
  if (!allowed.has(value)) {
    throw new Error(`${name} must be one of: ${Array.from(allowed).join(', ')}`);
  }
  return value;
}

function csvEnv(name) {
  return String(process.env[name] || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

const databaseUrl = required(
  'DATABASE_URL',
  isProduction ? undefined : 'postgres://postgres:postgres@127.0.0.1:5432/eac_tracker',
);
const authMode = enumEnv('AUTH_MODE', isProduction ? 'proxy' : 'demo', AUTH_MODES);

if (isProduction && ['demo', 'disabled'].includes(authMode)) {
  throw new Error('AUTH_MODE=proxy is required when NODE_ENV=production');
}

export const config = {
  nodeEnv,
  appEnv,
  isProduction,
  rootDir,
  backendDir,
  frontendDistDir,
  port: intEnv('PORT', 4000),
  trustProxy: boolEnv('TRUST_PROXY', isProduction),
  logSql: boolEnv('LOG_SQL', false),
  demoAuthEnabled: boolEnv('ALLOW_DEMO_AUTH', !isProduction),
  corsOrigins: csvEnv('CORS_ORIGIN'),
  auth: {
    mode: authMode,
    proxySecretHeader: process.env.AUTH_PROXY_SECRET_HEADER || 'x-auth-proxy-secret',
    proxySecret: requiredWhen(isProduction && authMode === 'proxy', 'AUTH_PROXY_SECRET'),
    userIdHeader: process.env.AUTH_USER_ID_HEADER || 'x-auth-user-id',
    usernameHeader: process.env.AUTH_USERNAME_HEADER || 'x-auth-username',
    roleHeader: process.env.AUTH_ROLE_HEADER || 'x-auth-role',
    bootstrapAdminEmail: String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase(),
    bootstrapAdminRole: process.env.BOOTSTRAP_ADMIN_ROLE || 'Admin',
  },
  security: {
    jsonBodyLimit: process.env.JSON_BODY_LIMIT || '1mb',
    uploadMaxBytes: intEnv('UPLOAD_MAX_BYTES', 10 * 1024 * 1024),
    sapMaxRows: intEnv('SAP_MAX_ROWS', 25_000),
    rateLimitWindowMs: intEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    rateLimitMax: intEnv('RATE_LIMIT_MAX', isProduction ? 600 : 5_000),
  },
  database: {
    url: databaseUrl,
    maxPoolSize: intEnv('PG_POOL_MAX', 10),
    idleTimeoutMillis: intEnv('PG_IDLE_TIMEOUT_MS', 30_000),
    connectionTimeoutMillis: intEnv('PG_CONNECTION_TIMEOUT_MS', 10_000),
    statementTimeoutMillis: intEnv('PG_STATEMENT_TIMEOUT_MS', 30_000),
    ssl: boolEnv('DATABASE_SSL', false)
      ? { rejectUnauthorized: !boolEnv('DATABASE_SSL_ALLOW_SELF_SIGNED', false) }
      : undefined,
  },
};
