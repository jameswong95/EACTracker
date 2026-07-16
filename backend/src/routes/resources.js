import { Router } from 'express';
import { query, tx } from '../db.js';
import { ah, requireFields } from '../util.js';

const r = Router();
const RPS_ALLOCATIONS_BASE_URL = (process.env.RPS_ALLOCATIONS_BASE_URL || 'https://rps.agilops.work/api/extract/projects/wbs').replace(/\/$/, '');
const RPS_RESOURCES_URL = process.env.RPS_RESOURCES_URL || 'https://rps.agilops.work/api/extract/resources';
const RPS_REQUEST_TIMEOUT_MS = Number(process.env.RPS_REQUEST_TIMEOUT_MS || 15000);
const RPS_RESOURCE_DEFAULT_GRADE = String(process.env.RPS_RESOURCE_DEFAULT_GRADE || 'E2').trim().toUpperCase();

function rpsHeaders() {
  const headers = { Accept: 'application/json' };
  if (process.env.RPS_API_KEY) headers['x-api-key'] = process.env.RPS_API_KEY;
  if (process.env.RPS_API_TOKEN) headers.Authorization = `Bearer ${process.env.RPS_API_TOKEN}`;
  return headers;
}

function monthAbs(value) {
  const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!match) return null;
  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

function absToMonthDate(abs) {
  const year = Math.floor(abs / 12);
  const month = ((abs % 12) + 12) % 12 + 1;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function allocationValue(allocation) {
  const value = allocation?.man_months ?? allocation?.fte ?? allocation?.qty ?? 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function expandWbsCandidates(values) {
  const candidates = [];
  function add(value) {
    const trimmed = String(value || '').trim();
    if (trimmed && !candidates.includes(trimmed)) candidates.push(trimmed);
  }

  for (const value of values) {
    const raw = String(value || '').trim();
    if (!raw) continue;
    add(raw);

    const slashMatch = raw.match(/^(\d+)\/(.+)$/);
    if (slashMatch) add(`SAP-${slashMatch[1]}-${slashMatch[2].replace(/\//g, '-')}`);

    const dashMatch = raw.match(/^(\d+)-(.+)$/);
    if (dashMatch) add(`SAP-${dashMatch[1]}-${dashMatch[2]}`);
  }

  return candidates;
}

function adaptRpsResource(resource, startAbs, length, localResource = null) {
  const fte = Array(length).fill(0);
  for (const allocation of resource.allocations || []) {
    const abs = monthAbs(allocation.month);
    if (abs == null) continue;
    const index = abs - startAbs;
    if (index < 0) continue;
    while (fte.length <= index) fte.push(0);
    fte[index] += allocationValue(allocation);
  }
  return {
    id: null,
    source: 'rps',
    external_id: resource.id ?? null,
    resource_name: resource.name || resource.role || 'Unnamed resource',
    role_name: resource.name || resource.role || 'Unnamed resource',
    function_title: resource.actual_function || resource.role || '',
    grade: localResource?.grade || resource.grade || '',
    resource_type: resource.type || null,
    local_resource_id: localResource?.id || null,
    is_hire: !!resource.is_hire,
    remarks: resource.remarks || null,
    total_man_months: Number(resource.total_man_months) || 0,
    fte_allocations: fte,
  };
}

async function fetchRpsAllocations(wbsCode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPS_REQUEST_TIMEOUT_MS);
  const headers = rpsHeaders();

  try {
    const url = `${RPS_ALLOCATIONS_BASE_URL}/${encodeURIComponent(wbsCode)}/allocations`;
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const err = new Error(`RPS allocations request failed for WBS "${wbsCode}": ${response.status} ${response.statusText}`);
      err.status = response.status >= 500 ? 502 : response.status;
      err.detail = body.slice(0, 500);
      err.wbsCode = wbsCode;
      throw err;
    }
    return response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('RPS allocations request timed out');
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRpsResources() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPS_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(RPS_RESOURCES_URL, { headers: rpsHeaders(), signal: controller.signal });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const err = new Error(`RPS resources request failed: ${response.status} ${response.statusText}`);
      err.status = response.status >= 500 ? 502 : response.status;
      err.detail = body.slice(0, 500);
      throw err;
    }
    return response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('RPS resources request timed out');
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function extractRpsResourceRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.resources)) return payload.resources;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function slugId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeRpsPoolResource(resource, validGrades) {
  const name = String(resource?.name || resource?.full_name || resource?.employee_name || resource?.display_name || '').trim();
  if (!name) return { skipped: true, reason: 'missing name', raw: resource };

  const rawExternalId = resource?.id ?? resource?.resource_id ?? resource?.employee_id ?? resource?.staff_id ?? resource?.email ?? name;
  const id = `rps:${slugId(rawExternalId) || slugId(name)}`;
  const incomingGrade = String(resource?.grade || resource?.employee_grade || resource?.band || resource?.level || '').trim().toUpperCase();
  const grade = validGrades.has(incomingGrade)
    ? incomingGrade
    : RPS_RESOURCE_DEFAULT_GRADE;
  if (!validGrades.has(grade)) {
    return { skipped: true, reason: `grade "${incomingGrade || RPS_RESOURCE_DEFAULT_GRADE}" is not in PFMS rate card`, raw: resource };
  }

  return {
    id,
    name,
    grade,
    is_active: resource?.is_active == null ? true : !!resource.is_active,
  };
}

// GET /api/resources/pool  (all people)
r.get('/pool', ah(async (_req, res) => {
  const result = await query(`
    SELECT rp.*, rg.title AS grade_title, rg.daily_rate, rg.monthly_rate
    FROM resource_pool rp
    JOIN resource_grades rg ON rg.grade = rp.grade
    WHERE rp.is_active
    ORDER BY rp.name`);
  res.json(result.rows);
}));

// GET /api/resources/grades
r.get('/grades', ah(async (_req, res) => {
  const result = await query(`SELECT * FROM resource_grades ORDER BY grade`);
  res.json(result.rows);
}));

// POST /api/resources/pool/sync-rps
// Fetches RPS resources and upserts them into the local PFMS resource pool.
r.post('/pool/sync-rps', ah(async (_req, res) => {
  const payload = await fetchRpsResources();
  const rows = extractRpsResourceRows(payload);
  if (!rows.length) {
    return res.status(502).json({ error: 'RPS resources response did not contain a resource list' });
  }

  const grades = await query(`SELECT grade FROM resource_grades`);
  const validGrades = new Set(grades.rows.map(row => String(row.grade).toUpperCase()));
  const normalized = rows.map(row => normalizeRpsPoolResource(row, validGrades));
  const skipped = normalized
    .filter(row => row.skipped)
    .map(row => ({ reason: row.reason, name: row.raw?.name || row.raw?.full_name || row.raw?.employee_name || null }));
  const resources = normalized.filter(row => !row.skipped);

  const summary = await tx(async (client) => {
    let created = 0;
    let updated = 0;

    for (const resource of resources) {
      const existingByName = await client.query(
        `SELECT id FROM resource_pool WHERE lower(name) = lower($1) LIMIT 1`,
        [resource.name],
      );

      if (existingByName.rows[0]) {
        await client.query(
          `UPDATE resource_pool
              SET grade = $2,
                  is_active = $3
            WHERE id = $1`,
          [existingByName.rows[0].id, resource.grade, resource.is_active],
        );
        updated++;
        continue;
      }

      const upsert = await client.query(
        `INSERT INTO resource_pool (id, name, grade, is_active)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               grade = EXCLUDED.grade,
               is_active = EXCLUDED.is_active
         RETURNING (xmax = 0) AS inserted`,
        [resource.id, resource.name, resource.grade, resource.is_active],
      );

      if (upsert.rows[0]?.inserted) created++;
      else updated++;
    }

    return { created, updated };
  });

  res.json({
    ok: true,
    source: 'rps',
    fetched: rows.length,
    imported: resources.length,
    created: summary.created,
    updated: summary.updated,
    skipped_count: skipped.length,
    skipped: skipped.slice(0, 25),
    default_grade: RPS_RESOURCE_DEFAULT_GRADE,
  });
}));

// GET /api/resources/external?project_id=...
// Optional debug override: /api/resources/external?project_id=...&wbs=SAP-...
// Proxies the RPS allocation API and adapts it to the Resource Plan shape.
r.get('/external', ah(async (req, res) => {
  const { project_id, wbs } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });

  const projectResult = await query(
    `SELECT id, name, wbs_code, sap_project_no, start_date, end_date
       FROM projects
      WHERE id = $1`,
    [project_id],
  );
  const localProject = projectResult.rows[0];
  if (!localProject) return res.status(404).json({ error: 'project not found' });

  const candidateWbsCodes = expandWbsCandidates([wbs, localProject.wbs_code, localProject.sap_project_no]);
  if (!candidateWbsCodes.length) return res.status(400).json({ error: 'project has no WBS code' });

  let payload = null;
  let wbsCode = candidateWbsCodes[0];
  const attempts = [];
  for (const candidate of candidateWbsCodes) {
    try {
      payload = await fetchRpsAllocations(candidate);
      wbsCode = candidate;
      break;
    } catch (err) {
      attempts.push({ wbs_code: candidate, status: err.status || 500, message: err.message });
      if ((err.status || 500) !== 404 || candidate === candidateWbsCodes.at(-1)) {
        err.message = `${err.message}. Attempted WBS values: ${candidateWbsCodes.join(', ')}`;
        err.rpsAttempts = attempts;
        throw err;
      }
    }
  }
  if (!payload?.success || !payload.project) {
    return res.status(502).json({ error: 'RPS allocations response was not successful' });
  }

  const resources = Array.isArray(payload.project.resources) ? payload.project.resources : [];
  const names = resources
    .map(resource => String(resource.name || '').trim())
    .filter(Boolean);
  const localResources = names.length
    ? await query(
        `SELECT id, name, grade
           FROM resource_pool
          WHERE lower(name) = ANY($1::text[])`,
        [[...new Set(names.map(name => name.toLowerCase()))]],
      )
    : { rows: [] };
  const localResourceByName = new Map(
    localResources.rows.map(resource => [String(resource.name || '').trim().toLowerCase(), resource]),
  );
  const firstAllocationAbs = resources
    .flatMap(resource => resource.allocations || [])
    .map(allocation => monthAbs(allocation.month))
    .filter(v => v != null)
    .sort((a, b) => a - b)[0];
  const lastAllocationAbs = resources
    .flatMap(resource => resource.allocations || [])
    .map(allocation => monthAbs(allocation.month))
    .filter(v => v != null)
    .sort((a, b) => b - a)[0];
  const startAbs = firstAllocationAbs ?? monthAbs(localProject.start_date) ?? (new Date().getFullYear() * 12);
  const length = Math.max(12, (lastAllocationAbs == null ? startAbs : lastAllocationAbs) - startAbs + 1);

  res.json({
    source: 'rps',
    fetched_at: new Date().toISOString(),
    wbs_code: wbsCode,
    allocation_start_date: absToMonthDate(startAbs),
    allocation_end_date: absToMonthDate(startAbs + length - 1),
    remote_project: {
      id: payload.project.id,
      name: payload.project.name,
      wbs_code: payload.project.wbs_code,
      status: payload.project.status,
      resource_count: Number(payload.project.resource_count) || resources.length,
      total_man_months: Number(payload.project.total_man_months) || 0,
      updated_at: payload.project.updated_at || null,
    },
    resources: resources.map(resource =>
      adaptRpsResource(resource, startAbs, length, localResourceByName.get(String(resource.name || '').trim().toLowerCase())),
    ),
  });
}));

// ---- Rate card / grade ownership (Finance/Admin edit; access gated in UI) ----

// POST /api/resources/grades  (add a grade / band to the rate card)
r.post('/grades', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['grade', 'title']);
  const ins = await query(
    `INSERT INTO resource_grades (grade, title, daily_rate, monthly_rate)
     VALUES ($1,$2,COALESCE($3,0),COALESCE($4,0))
     ON CONFLICT (grade) DO UPDATE
       SET title = EXCLUDED.title, daily_rate = EXCLUDED.daily_rate, monthly_rate = EXCLUDED.monthly_rate
     RETURNING *`,
    [String(b.grade).trim().toUpperCase(), b.title, b.daily_rate, b.monthly_rate]);
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/resources/grades/:grade  (edit rate card entry)
r.patch('/grades/:grade', ah(async (req, res) => {
  const editable = new Set(['title', 'daily_rate', 'monthly_rate']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(String(req.params.grade).toUpperCase());
  const upd = await query(`UPDATE resource_grades SET ${sets.join(', ')} WHERE grade = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'grade not found' });
  res.json(upd.rows[0]);
}));

// ---- Resource pool ownership (Finance/Admin edit; access gated in UI) ----

// POST /api/resources/pool  (add a person to the pool)
r.post('/pool', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['id', 'name', 'grade']);
  const ins = await query(
    `INSERT INTO resource_pool (id, name, grade, is_active)
     VALUES ($1,$2,$3,COALESCE($4,TRUE)) RETURNING *`,
    [String(b.id).trim(), b.name, String(b.grade).trim().toUpperCase(), b.is_active]);
  res.status(201).json(ins.rows[0]);
}));

// PATCH /api/resources/pool/:id
r.patch('/pool/:id', ah(async (req, res) => {
  const editable = new Set(['name', 'grade', 'is_active']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) { sets.push(`${k} = $${i++}`); vals.push(k === 'grade' ? String(v).toUpperCase() : v); }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE resource_pool SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'resource not found' });
  res.json(upd.rows[0]);
}));

// DELETE /api/resources/pool/:id  (soft delete -> is_active = FALSE)
r.delete('/pool/:id', ah(async (req, res) => {
  const upd = await query(`UPDATE resource_pool SET is_active = FALSE WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!upd.rows[0]) return res.status(404).json({ error: 'resource not found' });
  res.status(204).end();
}));

// GET /api/resources?project_id=... (assignments on a project)
r.get('/', ah(async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const result = await query(`
    SELECT pr.*, rp.name AS resource_name
    FROM project_resources pr
    LEFT JOIN resource_pool rp ON rp.id = pr.resource_id
    WHERE pr.project_id = $1
    ORDER BY pr.id`, [project_id]);
  res.json(result.rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'role_name', 'function_title', 'grade']);
  const ins = await query(`
    INSERT INTO project_resources (project_id, resource_id, role_name, function_title, grade, fte_allocations, sub_job_id)
    VALUES ($1,$2,$3,$4,$5,COALESCE($6,'[]'::jsonb),$7)
    RETURNING *`,
    [b.project_id, b.resource_id || null, b.role_name, b.function_title, b.grade,
     b.fte_allocations ? JSON.stringify(b.fte_allocations) : null,
     b.sub_job_id || null]);
  res.status(201).json(ins.rows[0]);
}));

r.patch('/:id', ah(async (req, res) => {
  const editable = new Set(['resource_id', 'role_name', 'function_title', 'grade', 'fte_allocations', 'sub_job_id']);
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (editable.has(k)) {
      sets.push(`${k} = $${i++}`);
      vals.push(k === 'fte_allocations' ? JSON.stringify(v) : v);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'no editable fields' });
  vals.push(req.params.id);
  const upd = await query(`UPDATE project_resources SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!upd.rows[0]) return res.status(404).json({ error: 'assignment not found' });
  res.json(upd.rows[0]);
}));

r.delete('/:id', ah(async (req, res) => {
  const d = await query(`DELETE FROM project_resources WHERE id = $1`, [req.params.id]);
  if (!d.rowCount) return res.status(404).json({ error: 'assignment not found' });
  res.status(204).end();
}));

export default r;
