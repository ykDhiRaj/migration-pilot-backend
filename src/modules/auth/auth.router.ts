import { Router } from 'express';
import { validate } from '@shared/middleware';
import { ok, created } from '@core/http';
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.schema';
import { register, login, refreshTokens } from './auth.service';

export const authRouter = Router();

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password }
 * Returns: { user, tokens }
 */
authRouter.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const result = await register(req.body);
    created(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Returns: { user, tokens }
 */
authRouter.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body);
    ok(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 * Returns: { accessToken }
 */
authRouter.post('/refresh', validate(RefreshSchema), async (req, res, next) => {
  try {
    const result = await refreshTokens(req.body.refreshToken);
    ok(res, result);
  } catch (err) {
    next(err);
  }
});
