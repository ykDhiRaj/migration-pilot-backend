import { Router } from 'express';
import { requireAuth, validate } from '@shared/middleware';
import { ok } from '@core/http';
import { AppRequest } from '@shared/types';
import { UpdateProfileSchema } from './users.schema';
import { getProfile, updateProfile } from './users.service';

export const usersRouter = Router();

/**
 * All /users routes are protected — `requireAuth` runs first.
 * Controllers are intentionally thin: validate → call service → respond.
 */

// GET /api/v1/users/me
usersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as AppRequest).ctx.userId!;
    const user = await getProfile(userId);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/users/me
usersRouter.patch('/me', requireAuth, validate(UpdateProfileSchema), async (req, res, next) => {
  try {
    const userId = (req as AppRequest).ctx.userId!;
    const user = await updateProfile(userId, req.body);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
});
