import { Request, Response, NextFunction } from 'express';

/**
 * Augmented Express Request.
 * `ctx` carries anything injected by middleware (current user, pagination, etc.)
 * so we don't pollute the top-level Request namespace.
 */
export interface AppRequest<
  TBody = unknown,
  TQuery = Record<string, string>,
  TParams = Record<string, string>,
> extends Request<TParams, unknown, TBody, TQuery> {
  /** Set by `requireAuth` middleware after JWT verification */
  ctx: {
    userId?: number;
    userEmail?: string;
    pagination?: Pagination;
  };
  /** Validated + typed request body (set by `validate` middleware) */
  body: TBody;
}

export interface AppResponse extends Response {}

export type AppNext = NextFunction;

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** JWT access token payload */
export interface TokenPayload {
  sub: string;       // user id
  email: string;
  version: string;   // JWT_VERSION — bump to invalidate all sessions
  iat?: number;
  exp?: number;
}
