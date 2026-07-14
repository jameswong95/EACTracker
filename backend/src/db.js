import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.maxPoolSize,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  statement_timeout: config.database.statementTimeoutMillis,
  query_timeout: config.database.statementTimeoutMillis,
  ssl: config.database.ssl,
});

pool.on('error', (err) => {
  console.error('[pg] idle client error', err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (config.logSql) {
    console.log('[sql]', `${Date.now() - start}ms`, text.split('\n')[0].slice(0, 80));
  }
  return res;
}

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
