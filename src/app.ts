import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env, isDev } from '@core/config';
import { errorHandler, notFoundHandler } from '@shared/middleware';
import { logger } from '@core/logger';

// ── Feature routers ──────────────────────────────────────────────────────────
import { healthRouter } from '@modules/health/health.router';
import { authRouter } from '@modules/auth/auth.router';
import { usersRouter } from '@modules/users/users.router';

/**
 * Creates and configures the Express app.
 *
 * Separated from main.ts so it can be imported by tests without
 * actually binding a port.
 */
export function buildApp(): express.Application {
  const app = express();

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins = env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [];
  app.use(
    cors({
      origin: isDev() ? true : allowedOrigins,
      credentials: true,
    }),
  );

  // ── Compression ────────────────────────────────────────────────────────────
  app.use(compression());

  // ── HTTP request logging ───────────────────────────────────────────────────
  app.use(
    morgan(isDev() ? 'dev' : 'combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (_req, res) => res.statusCode < 400 && !isDev(),
    }),
  );

  // ── Body parsers ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Routes ─────────────────────────────────────────────────────────────────
  const prefix = env.API_PREFIX;

  app.use(`${prefix}/health`, healthRouter);
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/users`, usersRouter);

  // ── 404 & error handling ───────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
