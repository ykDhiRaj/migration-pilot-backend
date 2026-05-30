import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@db/schema';
import { env, isTest } from '@core/config';
import { childLogger } from '@core/logger';

const log = childLogger('db');

export type Db = PostgresJsDatabase<typeof schema>;

let _db: Db | null = null;
let _sql: postgres.Sql | null = null;

export function getDb(): Db {
  if (!_db) {
    throw new Error('Database not initialised. Call initDb() first.');
  }
  return _db;
}

export async function initDb(): Promise<Db> {
  if (_db) return _db;

  _sql = postgres(env.DATABASE_URL, {
    max: isTest() ? 2 : 10,
    idle_timeout: 30,
    connect_timeout: 10,
    onnotice: (notice) => log.debug('PG notice', { notice }),
  });

  try {
    await _sql`SELECT 1`;
    log.info('Database connection established');
  } catch (err) {
    log.error('Failed to connect to the database', { err });
    process.exit(1);
  }

  _db = drizzle(_sql, { schema });
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = null;
    _db = null;
    log.info('Database connection closed');
  }
}

/**
 * Wraps a callback in a Drizzle transaction.
 * The `tx` argument has the same API as `getDb()` — pass it into any
 * repository function to enroll it in the transaction.
 *
 * Usage:
 *   const result = await withTransaction(async (tx) => {
 *     const user = await createUser(data, tx);
 *     return user;
 *   });
 */
export async function withTransaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  return getDb().transaction(fn);
}
