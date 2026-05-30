/**
 * Application entry point.
 *
 * Boot order:
 *   1. Load .env (dotenv)
 *   2. Parse & validate all env vars (crashes fast on misconfiguration)
 *   3. Connect to the database
 *   4. Run pending migrations
 *   5. Build Express app
 *   6. Start HTTP server
 *   7. Register graceful shutdown hooks
 */

import 'dotenv/config';
// env is loaded as a side-effect of importing — fails fast here if invalid
import { env } from '@core/config';
import { initDb, closeDb } from '@core/db';
import { logger } from '@core/logger';
import { buildApp } from './app';

async function main() {
  // 1. DB
  await initDb();

  // 2. App
  // Note: schema migrations are handled by Liquibase — run `npm run db:migrate` before starting.
  const app = buildApp();

  // 4. Server
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`   Environment : ${env.NODE_ENV}`);
  });

  // 5. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await closeDb();
      logger.info('Server closed');
      process.exit(0);
    });

    // Force-kill after 10 s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { err });
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
