export { getDb, initDb, closeDb, withTransaction } from './client';
export type { Db } from './client';
// migrate.ts removed — migrations are handled by Liquibase (npm run db:migrate)
