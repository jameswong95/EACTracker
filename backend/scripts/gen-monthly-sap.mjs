#!/usr/bin/env node
/**
 * Generate 6 monthly SAP snapshots (Jan–Jun 2026) from Sample.xlsx.
 *
 * Strategy: Sample.xlsx represents the June end-state. We back-scale the
 * "actuals" columns (TOT_COST, COM_CST, REV, PB, GP) by a monthly factor so
 * earlier months show partial execution. PLAN_COS (budget) and QUOT_PR
 * (contract value) stay constant — those don't change over the project life.
 *
 * Output: Sample-2026-01.xlsx … Sample-2026-06.xlsx in the repo root.
 */
import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// Column indices (0-based) — must match backend/src/routes/sap.js
const SCALE_COLS = [
  17, // LAB
  19, // FOH
  20, // MAT
  22, // DOC
  23, // SCO
  24, // TOT_COST  (actual cost)
  31, // COM_CST   (committed)
  44, // REV       (revenue recognised)
  45, // PB        (progress billing)
  47, // GP        (gross profit)
];

// Monthly progression: Jan starts at 18%, ramps to 100% in June.
// Tweaked so mid-life-cycle projects show varied status across months.
const MONTHS = [
  { num: 1, label: 'Jan', factor: 0.18 },
  { num: 2, label: 'Feb', factor: 0.34 },
  { num: 3, label: 'Mar', factor: 0.52 },
  { num: 4, label: 'Apr', factor: 0.70 },
  { num: 5, label: 'May', factor: 0.87 },
  { num: 6, label: 'Jun', factor: 1.00 },
];

const srcBuf = readFileSync(join(ROOT, 'Sample.xlsx'));
const srcWb  = XLSX.read(srcBuf, { type: 'buffer', cellDates: true });
const srcWs  = srcWb.Sheets[srcWb.SheetNames[0]];
const srcRows = XLSX.utils.sheet_to_json(srcWs, { header: 1, defval: null, raw: true });

// Detect data rows: any row whose col 0 is 'Total', or starts with a known
// project number (which always begins with a digit and contains '/' or is followed by '-').
function isDataRow(row) {
  const c0 = row?.[0];
  if (c0 === 'Total') return true;
  if (typeof c0 !== 'string') return false;
  // Project header rows start with 'Project' — those have no costs.
  if (c0 === 'Project') return false;
  // Sub-job / summary rows: start with a 9-digit SAP project number.
  return /^\d{9}/.test(c0);
}

function scaleRow(row, factor) {
  const out = row.slice();
  for (const c of SCALE_COLS) {
    const v = out[c];
    if (typeof v === 'number' && Number.isFinite(v)) {
      // Round to 2 decimals for currency
      out[c] = Math.round(v * factor * 100) / 100;
    }
  }
  return out;
}

for (const m of MONTHS) {
  const newRows = srcRows.map(r => (isDataRow(r) ? scaleRow(r, m.factor) : r));
  const ws = XLSX.utils.aoa_to_sheet(newRows, { cellDates: true });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, srcWb.SheetNames[0]);
  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const fname = `Sample-2026-${String(m.num).padStart(2, '0')}.xlsx`;
  writeFileSync(join(ROOT, fname), out);
  console.log(`wrote ${fname}  (factor ${m.factor.toFixed(2)} → ${m.label} 2026)`);
}
