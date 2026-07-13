#!/usr/bin/env node
/**
 * Run every SQL migration in scripts/ in deterministic order.
 *
 * Order:
 *   1. migrate.sql
 *   2. migrate-###-*.sql sorted by number, then filename
 */
import { readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptsDir);

function migrationRank(file) {
  if (file === 'migrate.sql') return [0, file];
  const match = file.match(/^migrate-(\d+)-.*\.sql$/);
  if (!match) return null;
  return [Number(match[1]), file];
}

const migrations = readdirSync(scriptsDir)
  .map(file => ({ file, rank: migrationRank(file) }))
  .filter(item => item.rank)
  .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1].localeCompare(b.rank[1]));

if (!migrations.length) {
  console.error('[db] No migration files found.');
  process.exit(1);
}

if (process.argv.includes('--list')) {
  for (const { file } of migrations) {
    console.log(relative(rootDir, join(scriptsDir, file)).replaceAll('\\', '/'));
  }
  process.exit(0);
}

const client = new Client({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:Secure!123@127.0.0.1:5432/eac_tracker',
});

let currentMigration = null;

try {
  await client.connect();
  console.log(`[db] Connected. Running ${migrations.length} migrations.`);

  for (const { file } of migrations) {
    const fullPath = join(scriptsDir, file);
    const label = relative(rootDir, fullPath).replaceAll('\\', '/');
    currentMigration = label;
    console.log(`[db] Running ${label}`);
    await client.query(readFileSync(fullPath, 'utf8'));
  }

  console.log('[db] Migrations complete.');
} catch (err) {
  console.error(`[db] Error${currentMigration ? ` in ${currentMigration}` : ''}:`, err.message);
  process.exit(1);
} finally {
  await client.end();
}
