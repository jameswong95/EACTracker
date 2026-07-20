import multer from 'multer';
import * as XLSX from 'xlsx';
import { config } from './config.js';

const SPREADSHEET_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'application/octet-stream',
]);

function uploadError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const spreadsheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.security.uploadMaxBytes, files: 1 },
  fileFilter(_req, file, cb) {
    const nameOk = /\.(xlsx|xls|csv)$/i.test(file.originalname || '');
    const mimeOk = SPREADSHEET_MIMES.has(file.mimetype);
    if (nameOk && mimeOk) return cb(null, true);
    return cb(uploadError('only Excel or CSV spreadsheet uploads are allowed'));
  },
});

export function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function buildAliasMap(aliasGroups) {
  const map = new Map();
  for (const [field, aliases] of Object.entries(aliasGroups)) {
    for (const alias of aliases) map.set(normalizeHeader(alias), field);
  }
  return map;
}

export function parseSpreadsheetRows(file, { aliases, maxRows = 5000 } = {}) {
  if (!file) throw uploadError('file required (field name: file)');
  const aliasMap = buildAliasMap(aliases || {});
  const wb = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

  let headerIndex = -1;
  let bestScore = 0;
  for (let i = 0; i < Math.min(matrix.length, 20); i++) {
    const score = (matrix[i] || []).reduce((count, cell) => (
      aliasMap.has(normalizeHeader(cell)) ? count + 1 : count
    ), 0);
    if (score > bestScore) {
      bestScore = score;
      headerIndex = i;
    }
  }

  if (headerIndex < 0 || bestScore < 2) {
    throw uploadError('could not find a valid spreadsheet header row');
  }

  const header = matrix[headerIndex] || [];
  const fieldsByColumn = header.map(cell => aliasMap.get(normalizeHeader(cell)) || null);
  const rows = [];

  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const raw = matrix[i] || [];
    if (!raw.some(cell => String(cell ?? '').trim() !== '')) continue;
    const row = { _rowNumber: i + 1 };
    raw.forEach((cell, idx) => {
      const field = fieldsByColumn[idx];
      if (field) row[field] = cell;
    });
    rows.push(row);
    if (rows.length > maxRows) {
      throw uploadError(`spreadsheet exceeds ${maxRows} data rows`, 413);
    }
  }

  return {
    filename: file.originalname,
    sheet: wb.SheetNames[0],
    header_row: headerIndex + 1,
    rows,
  };
}

export function cleanText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function spreadsheetNumber(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let text = String(value).trim();
  if (!text) return null;
  let multiplier = 1;
  if (/^\(.*\)$/.test(text)) {
    multiplier = -1;
    text = text.slice(1, -1);
  }
  text = text.replace(/[$,\s]/g, '');
  const n = Number(text);
  return Number.isFinite(n) ? n * multiplier : null;
}
