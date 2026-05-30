import { Router, Request, Response } from 'express';
import { getDb } from '@core/db';

export const healthRouter = Router();

/**
 * GET /api/v1/health
 * Returns app status and DB connectivity check.
 * Useful for load-balancer health probes and uptime monitors.
 */
healthRouter.get('/', async (_req: Request, res: Response) => {
  let dbStatus: 'ok' | 'error' = 'ok';

  try {
    await getDb()`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 200 : 503;

  res.status(status).json({
    success: status === 200,
    data: {
      status: status === 200 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
      },
    },
  });
});
