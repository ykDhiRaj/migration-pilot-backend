import { Response } from 'express';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Send a successful JSON response.
 *
 * Usage:
 *   return ok(res, { user });
 *   return ok(res, { users, total }, 200, { page: 1, limit: 20 });
 */
export function ok<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: ApiSuccess<T> = { success: true, data, ...(meta && { meta }) };
  return res.status(status).json(body);
}

export const created = <T>(res: Response, data: T) => ok(res, data, 201);

export const noContent = (res: Response) => res.status(204).send();
