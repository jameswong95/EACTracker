#!/usr/bin/env node
/**
 * Run the deployable database schema in deterministic order.
 *
 * Order:
 *   1. db/schema.sql
 *   2. db/migrations/migrate-###-*.sql sorted by number, then filename
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptsDir);
const dbDir = join(rootDir, 'db');
const schemaPath = join(dbDir, 'schema.sql');
const migrationsDir = join(dbDir, 'migrations');
const isProduction = process.env.NODE_ENV === 'production';

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (isProduction && !url) {
    console.error('[db] DATABASE_URL is required when NODE_ENV=production.');
    process.exit(1);
  }
  return url || 'postgres://postgres:postgres@127.0.0.1:5432/eac_tracker';
}

function migrationRank(file) {
  const match = file.match(/^migrate-(\d+)-.*\.sql$/);
  if (!match) return null;
  return [Number(match[1]), file];
}

if (!existsSync(schemaPath)) {
  console.error(`[db] Missing baseline schema: ${relative(rootDir, schemaPath).replaceAll('\\', '/')}`);
  process.exit(1);
}

if (!existsSync(migrationsDir)) {
  console.error(`[db] Missing migrations directory: ${relative(rootDir, migrationsDir).replaceAll('\\', '/')}`);
  process.exit(1);
}

const migrations = [
  { path: schemaPath },
  ...readdirSync(migrationsDir)
    .map(file => ({ file, rank: migrationRank(file) }))
    .filter(item => item.rank)
    .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1].localeCompare(b.rank[1]))
    .map(({ file }) => ({ path: join(migrationsDir, file) })),
];

if (process.argv.includes('--list')) {
  for (const migration of migrations) {
    console.log(relative(rootDir, migration.path).replaceAll('\\', '/'));
  }
  process.exit(0);
}

const client = new Client({
  connectionString: databaseUrl(),
  ssl: process.env.DATABASE_SSL === '1'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_ALLOW_SELF_SIGNED !== '1' }
    : undefined,
});

let currentMigration = null;

try {
  await client.connect();
  console.log(`[db] Connected. Running ${migrations.length} migrations.`);

  for (const migration of migrations) {
    const label = relative(rootDir, migration.path).replaceAll('\\', '/');
    currentMigration = label;
    console.log(`[db] Running ${label}`);
    await client.query(readFileSync(migration.path, 'utf8'));
  }

  console.log('[db] Migrations complete.');
} catch (err) {
  console.error(`[db] Error${currentMigration ? ` in ${currentMigration}` : ''}:`, err.message);
  process.exit(1);
} finally {
  await client.end();
}
