import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '@core/errors';
import { ApiError } from '@core/http/respond';
import { logger } from '@core/logger';
import { isDev } from '@core/config';

/**
 * Global Express error handler.
 * Must be registered LAST — after all routes.
 *
 * Handles:
 *  - AppError subclasses (BadRequestError, UnauthorizedError, etc.)
 *  - Zod ValidationError (field-level detail)
 *  - Unknown / unexpected errors (logged + masked in production)
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    const body: ApiError = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.fieldErrors,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof AppError) {
    const body: ApiError = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown error — log full details, hide from client in production
  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    err,
  });

  const body: ApiError = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev() && err instanceof Error ? err.message : 'Internal server error',
    },
  };

  res.status(500).json(body);
}
