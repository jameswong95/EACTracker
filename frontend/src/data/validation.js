export function requiredText(value, label, { max = 300 } = {}) {
  const text = String(value ?? '').trim();
  if (!text) return `${label} is required`;
  if (text.length > max) return `${label} must be ${max} characters or fewer`;
  return null;
}

export function nonNegativeNumber(value, label, { required = false, max = null } = {}) {
  if (value == null || value === '') {
    return required ? `${label} is required` : null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (n < 0) return `${label} cannot be negative`;
  if (max != null && n > max) return `${label} must be ${max} or less`;
  return null;
}

export function integerRange(value, label, { required = false, min = null, max = null } = {}) {
  if (value == null || value === '') {
    return required ? `${label} is required` : null;
  }
  const n = Number(value);
  if (!Number.isInteger(n)) return `${label} must be a whole number`;
  if (min != null && n < min) return `${label} must be at least ${min}`;
  if (max != null && n > max) return `${label} must be ${max} or less`;
  return null;
}

export function monthNumber(value, label, opts = {}) {
  return integerRange(value, label, { min: 1, max: 12, ...opts });
}

export function yearNumber(value, label, opts = {}) {
  return integerRange(value, label, { min: 2000, max: 2100, ...opts });
}

export function periodRange(startYear, startMonth, endYear, endMonth) {
  if (!startYear || !startMonth || !endYear || !endMonth) return null;
  if ((Number(endYear) * 12 + Number(endMonth)) < (Number(startYear) * 12 + Number(startMonth))) {
    return 'End period must be after start period';
  }
  return null;
}

export function firstError(...errors) {
  return errors.find(Boolean) || null;
}
