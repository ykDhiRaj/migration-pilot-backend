import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@shared/utils/jwt';
import { UnauthorizedError } from '@core/errors';
import { AppRequest } from '@shared/types';

/**
 * Guards a route: extracts + verifies the Bearer token from the Authorization
 * header and injects `req.ctx.userId` and `req.ctx.userEmail` for downstream
 * handlers.
 *
 * Usage:
 *   router.get('/me', requireAuth, getProfile)
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = header.slice(7);

  try {
    const payload = verifyToken(token);
    (req as AppRequest).ctx = {
      userId: payload.sub,
      userEmail: payload.email,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
