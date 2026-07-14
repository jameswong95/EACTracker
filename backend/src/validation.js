const PROJECT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,80}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function fail(message, details) {
  const err = new Error(message);
  err.status = 400;
  if (details) err.details = details;
  throw err;
}

function isBlank(value) {
  return value == null || value === '';
}

export function ensureObject(value, name = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${name} must be an object`);
  }
  return value;
}

export function projectId(value, name = 'project_id') {
  if (typeof value !== 'string' || !PROJECT_ID_RE.test(value.trim())) {
    fail(`${name} must be a valid project id`);
  }
  return value.trim();
}

export function positiveInt(value, name = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) fail(`${name} must be a positive integer`);
  return n;
}

export function text(value, name, { required = false, max = 500, trim = true } = {}) {
  if (isBlank(value)) {
    if (required) fail(`${name} is required`);
    return null;
  }
  if (typeof value !== 'string') fail(`${name} must be text`);
  const out = trim ? value.trim() : value;
  if (required && !out) fail(`${name} is required`);
  if (out.length > max) fail(`${name} must be ${max} characters or fewer`);
  return out || null;
}

export function number(value, name, { required = false, min = null, max = null } = {}) {
  if (isBlank(value)) {
    if (required) fail(`${name} is required`);
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) fail(`${name} must be a number`);
  if (min != null && n < min) fail(`${name} must be at least ${min}`);
  if (max != null && n > max) fail(`${name} must be at most ${max}`);
  return n;
}

export function integer(value, name, { required = false, min = null, max = null } = {}) {
  const n = number(value, name, { required, min, max });
  if (n == null) return null;
  if (!Number.isInteger(n)) fail(`${name} must be an integer`);
  return n;
}

export function month(value, name = 'month', opts = {}) {
  return integer(value, name, { min: 1, max: 12, ...opts });
}

export function year(value, name = 'year', { required = false } = {}) {
  return integer(value, name, { required, min: 2000, max: 2100 });
}

export function date(value, name, { required = false } = {}) {
  if (isBlank(value)) {
    if (required) fail(`${name} is required`);
    return null;
  }
  const raw = String(value).slice(0, 10);
  if (!DATE_RE.test(raw)) fail(`${name} must use YYYY-MM-DD`);
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw) {
    fail(`${name} must be a valid date`);
  }
  return raw;
}

export function oneOf(value, name, values, { required = false } = {}) {
  if (isBlank(value)) {
    if (required) fail(`${name} is required`);
    return null;
  }
  if (!values.includes(value)) fail(`${name} must be one of: ${values.join(', ')}`);
  return value;
}

export function userId(value, name = 'user_id', opts = {}) {
  return integer(value, name, { min: 1, ...opts });
}

export function validateNoUnknown(body, allowed) {
  const extra = Object.keys(body).filter(k => !allowed.has(k));
  if (extra.length) fail(`unknown field(s): ${extra.join(', ')}`);
}

export function validatePeriodRange(startYear, startMonth, endYear, endMonth) {
  if (startYear && startMonth && endYear && endMonth && (endYear * 12 + endMonth) < (startYear * 12 + startMonth)) {
    fail('end period must be after start period');
  }
}
