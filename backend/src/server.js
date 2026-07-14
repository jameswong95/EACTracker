import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { join } from 'path';

import { pool } from './db.js';
import { config } from './config.js';
import {
  apiRateLimit,
  authenticate,
  authorize,
  logSecurity,
  requestContext,
  requireExpectedContentType,
  securityHeaders,
} from './security.js';
import projectsRouter   from './routes/projects.js';
import subJobsRouter    from './routes/subJobs.js';
import eacRouter        from './routes/eac.js';
import revrecRouter     from './routes/revrec.js';
import milestonesRouter from './routes/milestones.js';
import risksRouter      from './routes/risks.js';
import updatesRouter    from './routes/updates.js';
import resourcesRouter  from './routes/resources.js';
import approvalsRouter  from './routes/approvals.js';
import periodsRouter    from './routes/periods.js';
import usersRouter      from './routes/users.js';
import sapRouter        from './routes/sap.js';
import auditRouter      from './routes/audit.js';
import alertsRouter     from './routes/alerts.js';
import tenderRouter     from './routes/tender.js';
import projectInitiationRouter from './routes/projectInitiation.js';
import etcRouter        from './routes/etc.js';
import resourceRequestsRouter from './routes/resourceRequests.js';
import materialAssetsRouter from './routes/materialAssets.js';
import materialMiscRouter from './routes/materialMisc.js';
import fixedRatesRouter from './routes/fixedRates.js';
import settingsRouter from './routes/settings.js';
import fxRatesRouter from './routes/fxRates.js';
import adminRouter      from './routes/admin.js';
import { materialsRouter, subConRouter, othersRouter } from './routes/costItems.js';

const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1);

app.use(requestContext);
app.use(securityHeaders);

const corsOptions = config.corsOrigins.length
  ? {
      origin(origin, cb) {
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        const err = new Error('CORS origin not allowed');
        err.status = 403;
        return cb(err);
      },
      credentials: true,
    }
  : config.isProduction
    ? { origin: false }
    : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.use('/api', apiRateLimit);
app.use('/api', requireExpectedContentType);
app.use(express.json({ limit: config.security.jsonBodyLimit }));

app.get('/api/health', async (_req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS now, current_database() AS db');
    res.json({
      ok: true,
      service: 'pfms-backend',
      environment: config.appEnv,
      nodeEnv: config.nodeEnv,
      demoAuthEnabled: config.demoAuthEnabled,
      ...r.rows[0],
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: config.isProduction ? 'database unavailable' : e.message });
  }
});

app.get('/api/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: config.isProduction ? 'not ready' : e.message });
  }
});

app.get('/api/auth/session', authenticate, async (req, res, next) => {
  const username = req.user?.username || '';
  const namePart = username.split('@')[0] || username;
  const fullName = req.user?.full_name || namePart
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || username;
  const initials = req.user?.initials || fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'U';

  try {
    const result = await pool.query(
      `INSERT INTO users (username, full_name, initials, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (username) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           initials = EXCLUDED.initials,
           role = EXCLUDED.role,
           is_active = TRUE
       RETURNING id, username, full_name, initials, role`,
      [username, fullName, initials, req.user?.role],
    );
    res.json({
      ...result.rows[0],
      signedAt: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

app.use('/api', authenticate, authorize);

app.use('/api/projects',   projectsRouter);
app.use('/api/sub-jobs',   subJobsRouter);
app.use('/api/eac',        eacRouter);
app.use('/api/revrec',     revrecRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/risks',      risksRouter);
app.use('/api/updates',    updatesRouter);
app.use('/api/resources',  resourcesRouter);
app.use('/api/resource-requests', resourceRequestsRouter);
app.use('/api/approvals',  approvalsRouter);
app.use('/api/periods',    periodsRouter);
app.use('/api/users',      usersRouter);
app.use('/api/sap',        sapRouter);
app.use('/api/audit',      auditRouter);
app.use('/api/alerts',     alertsRouter);
app.use('/api/tender',     tenderRouter);
app.use('/api/project-initiation', projectInitiationRouter);
app.use('/api/etc',        etcRouter);
app.use('/api/materials',  materialsRouter);
app.use('/api/material-assets', materialAssetsRouter);
app.use('/api/material-misc', materialMiscRouter);
app.use('/api/fixed-rates', fixedRatesRouter);
app.use('/api/settings',   settingsRouter);
app.use('/api/fx-rates',   fxRatesRouter);
app.use('/api/sub-con',    subConRouter);
app.use('/api/others',     othersRouter);
app.use('/api/admin',      adminRouter);

app.use('/api', (req, res) => {
  logSecurity(req, 'not_found', 'Unknown API route requested');
  res.status(404).json({ error: 'not found', path: req.path });
});

if (existsSync(config.frontendDistDir)) {
  app.use(express.static(config.frontendDistDir, {
    etag: true,
    maxAge: config.isProduction ? '1h' : 0,
    setHeaders(res, filePath) {
      if (filePath.includes(`${join('dist', 'assets')}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  app.get('*', (_req, res) => {
    res.sendFile(join(config.frontendDistDir, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(404).json({ error: 'frontend build not found; run npm run build in frontend' });
  });
}

// error handler
app.use((err, req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) {
    console.error('[err]', err);
  }
  if (status >= 400) {
    logSecurity(req, status >= 500 ? 'exception' : 'request_rejected', err.message || 'request rejected', {
      status,
      code: err.code || null,
    });
  }
  res.status(status).json({
    error: config.isProduction && status >= 500 ? 'internal error' : err.message || 'internal error',
    request_id: req.id,
  });
});

const server = app.listen(config.port, () => {
  console.log(`[pfms-backend] listening on http://localhost:${config.port} (${config.appEnv}; NODE_ENV=${config.nodeEnv})`);
});

async function shutdown(signal) {
  console.log(`[pfms-backend] ${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
