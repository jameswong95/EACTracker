#!/usr/bin/env node
/**
 * scripts/run-sql.mjs
 * Run a SQL file against the DATABASE_URL configured in .env
 * Usage: node scripts/run-sql.mjs <path-to-sql-file>
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node scripts/run-sql.mjs <file.sql>');
  process.exit(1);
}

const sqlPath = resolve(fileURLToPath(import.meta.url), '..', '..', sqlFile);
const sql     = readFileSync(sqlPath, 'utf8');
const isProduction = process.env.NODE_ENV === 'production';

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (isProduction && !url) {
    console.error('[db] DATABASE_URL is required when NODE_ENV=production.');
    process.exit(1);
  }
  return url || 'postgres://postgres:postgres@127.0.0.1:5432/eac_tracker';
}

const client = new Client({
  connectionString: databaseUrl(),
  ssl: process.env.DATABASE_SSL === '1'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_ALLOW_SELF_SIGNED !== '1' }
    : undefined,
});

try {
  await client.connect();
  console.log(`[db] Connected — running ${sqlFile}`);
  await client.query(sql);
  console.log(`[db] Done.`);
} catch (err) {
  console.error(`[db] Error in ${sqlFile}:`, err.message);
  process.exit(1);
} finally {
  await client.end();
}
