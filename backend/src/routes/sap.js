import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { query, tx } from '../db.js';
import { ah, logAudit } from '../util.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

/**
 * Parse a ZPSR0021A Excel buffer.
 * Layout (from sample):
 *   Row N  : header — 'Project' label with WBS at col E (index 4) and name at col O (index 14)
 *   Row N+2: project total — WBS as first cell, then numeric columns
 *   Row N+3..: sub-jobs — WBS-suffix at col 0, description at col 11, costs from col 17 on
 *   Row …   : 'Total' row with WBS at col 3
 *
 * Column index map (0-based) based on row-13 header in Sheet1:
 *   17 = LAB
 *   19 = FOH
 *   20 = MAT
 *   22 = Doc
 *   23 = SCO
 *   24 = Tot_Cost
 *   32 = COM_CST
 *   34 = PLAN_COS
 *   44 = QUOT_PR
 *   45 = REV
 *   46 = PB
 *   47 = O/S PB
 *   48 = Gr Profit
 */
const C = {
  LAB: 17, FOH: 19, MAT: 20, DOC: 22, SCO: 23, TOT: 24,
  COM: 31, PLAN: 33, QUOT: 43, REV: 44, PB: 45, OSPB: 46, GP: 47,
};

const num = (v) => (v == null || v === '' ? 0 : Number(v) || 0);

function parseDdMmYyyy(s) {
  if (!s) return null;
  if (s instanceof Date) return s.toISOString().slice(0, 10);
  const str = String(s).trim();
  const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseWorkbook(buf) {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

  const projects = [];
  let current = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const c0 = row[0];

    // Project header row: col 0 is empty/'Project' label, col 4 has WBS, col 14 has name
    if (c0 === 'Project' && row[4]) {
      current = {
        sap_project_no:  String(row[4]).trim(),
        name:            row[14] ? String(row[14]).trim() : '',
        responsible_id:  row[21] != null && row[21] !== '' ? Number(row[21]) || null : null,
        responsible:     row[22] ? String(row[22]).trim() : null,
        customer:        row[26] ? String(row[26]).trim() : null,
        start_date:      parseDdMmYyyy(row[32]),
        end_date:        parseDdMmYyyy(row[37] || row[36]),
        totals:          null,
        sub_jobs:        [],
      };
      projects.push(current);
      continue;
    }

    // Skip if no active project context
    if (!current) continue;

    // Total row at end of project block
    if (c0 === 'Total' && row[3] === current.sap_project_no) {
      current.totals = {
        lab: num(row[C.LAB]), foh: num(row[C.FOH]), mat: num(row[C.MAT]),
        doc: num(row[C.DOC]), sco: num(row[C.SCO]),
        tot_cost: num(row[C.TOT]), com_cst: num(row[C.COM]), plan_cos: num(row[C.PLAN]),
        quot_pr: num(row[C.QUOT]), rev: num(row[C.REV]), pb: num(row[C.PB]),
        os_pb: num(row[C.OSPB]), gr_profit: num(row[C.GP]),
      };
      current = null;  // end of block
      continue;
    }

    // Sub-job or project-summary row: col 0 has WBS like '214687801/035' or '...-N'
    if (typeof c0 === 'string' && c0.startsWith(current?.sap_project_no || '')) {
      const wbsCode = c0.trim();
      const suffixMatch = wbsCode.slice(current.sap_project_no.length);
      const suffix = suffixMatch.startsWith('-') ? suffixMatch.slice(1) : '';

      // Project-summary row (no suffix) — use as totals fallback if 'Total' row missing
      if (!suffix) {
        if (!current.totals) {
          current.totals = {
            lab: num(row[C.LAB]), foh: num(row[C.FOH]), mat: num(row[C.MAT]),
            doc: num(row[C.DOC]), sco: num(row[C.SCO]),
            tot_cost: num(row[C.TOT]), com_cst: num(row[C.COM]), plan_cos: num(row[C.PLAN]),
            quot_pr: num(row[C.QUOT]), rev: num(row[C.REV]), pb: num(row[C.PB]),
            os_pb: num(row[C.OSPB]), gr_profit: num(row[C.GP]),
          };
        }
        continue;
      }

      // Sub-job row
      current.sub_jobs.push({
        wbs_code:    wbsCode,
        wbs_suffix:  suffix,
        name:        row[11] ? String(row[11]).trim() : '(unnamed)',
        is_warranty: suffix === 'W',
        lab: num(row[C.LAB]), foh: num(row[C.FOH]), mat: num(row[C.MAT]),
        doc: num(row[C.DOC]), sco: num(row[C.SCO]),
        tot_cost: num(row[C.TOT]), com_cst: num(row[C.COM]), plan_cos: num(row[C.PLAN]),
      });
    }
  }

  return projects;
}

// POST /api/sap/preview  (multipart/form-data, field name 'file')
r.post('/preview', upload.single('file'), ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required (field name: file)' });
  const projects = parseWorkbook(req.file.buffer);
  res.json({
    filename: req.file.originalname,
    project_count: projects.length,
    sub_job_count: projects.reduce((s, p) => s + p.sub_jobs.length, 0),
    projects,
  });
}));

// POST /api/sap/commit  (multipart/form-data with file + form fields period_year, period_month, imported_by)
r.post('/commit', upload.single('file'), ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const periodYear  = Number(req.body.period_year);
  const periodMonth = Number(req.body.period_month);
  const importedBy  = req.body.imported_by ? Number(req.body.imported_by) : null;
  if (!periodYear || !periodMonth) {
    return res.status(400).json({ error: 'period_year and period_month required' });
  }

  const projects = parseWorkbook(req.file.buffer);

  const summary = await tx(async (c) => {
    // Create import record
    const imp = await c.query(`
      INSERT INTO sap_imports (period_year, period_month, filename, sheet_count, imported_by, status)
      VALUES ($1,$2,$3,1,$4,'ok') RETURNING id`,
      [periodYear, periodMonth, req.file.originalname, importedBy]);
    const importId = imp.rows[0].id;

    // Resolve a SAP "Responsible Person" to a users.id — match by sap_employee_id,
    // then by case-insensitive full_name, otherwise auto-create a PM user.
    const resolvePm = async (sapId, fullName) => {
      if (!sapId && !fullName) return null;
      if (sapId) {
        const byId = await c.query(`SELECT id FROM users WHERE sap_employee_id = $1`, [sapId]);
        if (byId.rows[0]) return byId.rows[0].id;
      }
      if (fullName) {
        const byName = await c.query(
          `SELECT id FROM users WHERE LOWER(full_name) = LOWER($1) LIMIT 1`, [fullName]);
        if (byName.rows[0]) {
          if (sapId) {
            await c.query(
              `UPDATE users SET sap_employee_id = $1 WHERE id = $2 AND sap_employee_id IS NULL`,
              [sapId, byName.rows[0].id]);
          }
          return byName.rows[0].id;
        }
      }
      if (!fullName) return null;
      // Auto-create as PM
      const parts = fullName.split(/\s+/).filter(Boolean);
      const initials = (parts[0]?.[0] || '?') + (parts[parts.length - 1]?.[0] || '');
      let base = (parts[0]?.[0] || 'x').toLowerCase() + '.' +
                 (parts[parts.length - 1] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = base;
      for (let i = 2; i < 100; i++) {
        const exists = await c.query(`SELECT 1 FROM users WHERE username = $1`, [username]);
        if (!exists.rows.length) break;
        username = `${base}${i}`;
      }
      const ins = await c.query(
        `INSERT INTO users (username, full_name, initials, role, sap_employee_id)
         VALUES ($1,$2,$3,'PM',$4) RETURNING id`,
        [username, fullName, initials.toUpperCase(), sapId]);
      return ins.rows[0].id;
    };

    let created = 0, updated = 0, exceptions = 0;

    for (const p of projects) {
      if (!p.totals) { exceptions++; continue; }
      const pmUserId = await resolvePm(p.responsible_id, p.responsible);
      const t = p.totals;
      // SAP convention: revenue items (QUOT_PR, REV, PB) stored as credits (negative).
      // Flip sign for app storage so positive = the amount we'll be paid / billed.
      const quot = -t.quot_pr;
      const rev  = -t.rev;
      const pb   = -t.pb;
      const osPb = rev - pb;

      // Log raw project row
      await c.query(`
        INSERT INTO sap_import_rows (
          import_id, row_type, wbs_code, description,
          lab, foh, mat, doc, sco, tot_cost, com_cst, plan_cos,
          quot_pr, rev, pb, os_pb, gr_profit,
          sap_start_date, sap_end_date, responsible_person, customer
        ) VALUES (
          $1,'project',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [importId, p.sap_project_no, p.name,
         t.lab, t.foh, t.mat, t.doc, t.sco, t.tot_cost, t.com_cst, t.plan_cos,
         quot, rev, pb, osPb, t.gr_profit,
         p.start_date, p.end_date, p.responsible, p.customer]);

      // Upsert project — derive id from SAP no
      const projectId = `SAP-${p.sap_project_no.replace(/[^A-Za-z0-9]/g, '-')}`;
      const existing = await c.query(`SELECT id FROM projects WHERE id = $1`, [projectId]);
      const wbsCode = p.sap_project_no;

      if (existing.rows.length) {
        await c.query(`
          UPDATE projects SET
            name             = $2,
            customer         = COALESCE($3, customer),
            end_date         = COALESCE($4, end_date),
            budget           = $5,
            actual           = $6,
            committed        = $7,
            contract_value   = $8,
            rev_recognised   = $9,
            progress_billing = $10,
            gr_profit_sap    = $11,
            pm_user_id       = COALESCE($12, pm_user_id),
            last_sap_import  = NOW(),
            updated_at       = NOW()
          WHERE id = $1`,
          [projectId, p.name, p.customer, p.end_date,
           t.plan_cos, t.tot_cost, t.com_cst, quot, rev, pb, t.gr_profit, pmUserId]);
        updated++;
      } else {
        await c.query(`
          INSERT INTO projects (
            id, name, wbs_code, sap_project_no, customer, department,
            start_date, end_date,
            contract_value, initial_budget, budget, eac, actual, committed,
            rev_recognised, progress_billing, gr_profit_sap,
            pm_user_id, last_sap_import
          ) VALUES (
            $1,$2,$3,$4,$5,'(unassigned)',
            COALESCE($6, CURRENT_DATE), COALESCE($7, CURRENT_DATE + INTERVAL '1 year'),
            $8,$9,$10,$11,$12,$13,$14,$15,$16,
            $17, NOW())`,
          [projectId, p.name || p.sap_project_no, wbsCode, p.sap_project_no, p.customer,
           p.start_date, p.end_date,
           quot, t.plan_cos, t.plan_cos, t.tot_cost + t.com_cst, t.tot_cost, t.com_cst,
           rev, pb, t.gr_profit, pmUserId]);
        created++;
      }

      // Replace sub-jobs (delete + reinsert keeps it simple and idempotent)
      await c.query(`DELETE FROM sub_jobs WHERE project_id = $1`, [projectId]);
      let order = 0;
      for (const s of p.sub_jobs) {
        await c.query(`
          INSERT INTO sub_jobs (
            project_id, wbs_code, wbs_suffix, name, sort_order, is_warranty,
            lab, foh, mat, doc, sco, tot_cost, com_cst, plan_cos
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [projectId, s.wbs_code, s.wbs_suffix, s.name, order++, s.is_warranty,
           s.lab, s.foh, s.mat, s.doc, s.sco, s.tot_cost, s.com_cst, s.plan_cos]);

        await c.query(`
          INSERT INTO sap_import_rows (
            import_id, row_type, wbs_code, description,
            lab, foh, mat, doc, sco, tot_cost, com_cst, plan_cos
          ) VALUES ($1,'subjob',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [importId, s.wbs_code, s.name,
           s.lab, s.foh, s.mat, s.doc, s.sco, s.tot_cost, s.com_cst, s.plan_cos]);
      }

      await logAudit(c, {
        entity_type: 'project', entity_id: projectId,
        action: 'import', field_name: 'sap_import',
        new_value: String(importId), user_id: importedBy
      });
    }

    // Update import summary
    await c.query(`
      UPDATE sap_imports
      SET projects_created = $1, projects_updated = $2, exceptions = $3,
          status = CASE WHEN $3 > 0 THEN 'warn' ELSE 'ok' END
      WHERE id = $4`,
      [created, updated, exceptions, importId]);

    // Lock the period
    await c.query(`
      INSERT INTO period_locks (period_year, period_month, is_locked, locked_by, locked_at)
      VALUES ($1,$2,TRUE,$3,NOW())
      ON CONFLICT (period_year, period_month)
      DO UPDATE SET is_locked = TRUE, locked_by = EXCLUDED.locked_by, locked_at = NOW()`,
      [periodYear, periodMonth, importedBy]);

    return { import_id: importId, created, updated, exceptions, project_count: projects.length };
  });

  res.status(201).json(summary);
}));

// GET /api/sap/imports  (history)
r.get('/imports', ah(async (_req, res) => {
  const result = await query(`
    SELECT si.*, u.full_name AS imported_by_name
    FROM sap_imports si
    LEFT JOIN users u ON u.id = si.imported_by
    ORDER BY si.imported_at DESC
    LIMIT 100`);
  res.json(result.rows);
}));

// GET /api/sap/imports/:id/rows
r.get('/imports/:id/rows', ah(async (req, res) => {
  const result = await query(
    `SELECT * FROM sap_import_rows WHERE import_id = $1 ORDER BY id`,
    [req.params.id]);
  res.json(result.rows);
}));

export default r;
