import 'dotenv/config';
import { beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { initDb, closeDb, getDb } from '@core/db';

// We skip migrations here — tests target a DB that already has migrations
// applied. Run `npm run db:migrate` before running the test suite.

beforeAll(async () => {
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

/**
 * Truncates tables between tests to ensure isolation.
 * Import and call `cleanDb()` inside `beforeEach` in any test file
 * that writes to the database.
 */
export async function cleanDb() {
  const db = getDb();
  await db.execute(sql`TRUNCATE users RESTART IDENTITY CASCADE`);
}
