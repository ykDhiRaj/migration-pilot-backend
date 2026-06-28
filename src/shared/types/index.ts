import { NotFoundError } from '@core/errors';
import {
  findUserById,
  updateUserById,
  // stripPassword,
  PublicUser,
  deleteUserById,
} from '../../modules/users/users.repository';
import { UpdateProfileDto } from '../../modules/users/users.schema';
import { Request, Response, NextFunction } from 'express';


/**
 * Users service — orchestrates business logic.
 * Calls repository for DB access, applies domain rules, returns plain objects.
 */

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) throw new NotFoundError('User');
  return {id:user.id,name:user.name,email:user.email}
}

export async function updateProfile(
  userId: string,
  dto: UpdateProfileDto,
): Promise<PublicUser> {
  const updated = await updateUserById(userId, dto);
  return {id:updated.id,name:updated.name,email:updated.email};
}

export async function deleteUser(
  userId: string,
): Promise<void> {
  const user = await findUserById(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  await deleteUserById(userId);
}

export interface AppRequest<
  TBody = unknown,
  TQuery = Record<string, string>,
  TParams = Record<string, string>,
> extends Request<TParams, unknown, TBody, TQuery> {
  /** Set by `requireAuth` middleware after JWT verification */
  ctx: {
    userId?: string;
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

// export function toPublicUser(user: import('@db/schema').User): PublicUser {
//   return {
//     id: user.id,
//     name: user.name,
//     email: user.email,
//   };
// }