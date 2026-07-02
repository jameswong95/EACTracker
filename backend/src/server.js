import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { pool } from './db.js';
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

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS now, current_database() AS db');
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api/projects',   projectsRouter);
app.use('/api/sub-jobs',   subJobsRouter);
app.use('/api/eac',        eacRouter);
app.use('/api/revrec',     revrecRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/risks',      risksRouter);
app.use('/api/updates',    updatesRouter);
app.use('/api/resources',  resourcesRouter);
app.use('/api/approvals',  approvalsRouter);
app.use('/api/periods',    periodsRouter);
app.use('/api/users',      usersRouter);
app.use('/api/sap',        sapRouter);
app.use('/api/audit',      auditRouter);
app.use('/api/alerts',     alertsRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'not found', path: req.path }));

// error handler
app.use((err, _req, res, _next) => {
  console.error('[err]', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'internal error' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`[pfms-backend] listening on http://localhost:${port}`);
});
