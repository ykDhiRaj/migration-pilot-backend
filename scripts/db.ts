#!/usr/bin/env tsx
/**
 * scripts/db.ts — Liquibase runner via Docker.
 *
 * Reads DATABASE_URL from .env — no Java or local Liquibase install needed.
 * Requires Docker to be running.
 *
 * Called by npm scripts:
 *   npm run db:migrate        → liquibase update
 *   npm run db:rollback       → liquibase rollbackCount 1
 *   npm run db:status         → liquibase status
 *
 * Or directly with any Liquibase command:
 *   tsx scripts/db.ts rollbackCount 3
 *   tsx scripts/db.ts tag v1.0
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import path from 'path';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('\n❌  DATABASE_URL is not set. Check your .env file.\n');
  process.exit(1);
}

let jdbcUrl: string;
let username: string;
let password: string;

try {
  const parsed = new URL(rawUrl);
  username = parsed.username;
  password = parsed.password;
  const host = `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`;
  jdbcUrl = `jdbc:postgresql://${host}${parsed.pathname}`;
} catch {
  console.error('\n❌  DATABASE_URL is not a valid URL:', rawUrl, '\n');
  process.exit(1);
}

const changelogDir = path.resolve(process.cwd(), 'db/changelog');
const liquibaseArgs = process.argv.slice(2).join(' ') || 'update';

const cmd = [
  'liquibase',
  `--url="${jdbcUrl}"`,
  `--username="${username}"`,
  `--password="${password}"`,
  `--searchPath="${changelogDir}"`,
  `--changeLogFile="master.xml"`,
  liquibaseArgs,
].join(' \\\n  ');

console.log(`\n🔄  Liquibase: ${liquibaseArgs}\n`);

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('\n✅  Done.\n');
} catch {
  process.exit(1);
}
