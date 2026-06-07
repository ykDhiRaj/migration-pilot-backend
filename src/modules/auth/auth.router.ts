import { Router } from 'express';
import { requireAuth, validate } from '@shared/middleware';
import { ok, created } from '@core/http';
import { RegisterSchema, LoginSchema, RefreshSchema, GoogleAuthSchema, OtpSchema, VerifyRegisterOtpSchema } from './auth.schema';
import { registerLocal, login, refreshTokens, registerGoogle, verifyLoginOtp, verifyRegistrationOtp } from './auth.service';
import { AppRequest } from '@shared/types';
import { UnauthorizedError } from '@core/errors';

export const authRouter = Router();

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password }
 * Returns: { user, tokens }
 */
authRouter.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const result = await registerLocal(req.body);
    created(res, result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/google',validate(GoogleAuthSchema),async(req,res,next)=>{
  try{
    const result = await registerGoogle(req.body.idToken);
    ok(res, result);
  }catch(err){
    next(err);
  }
})

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

authRouter.post('/verify-register-otp', validate(VerifyRegisterOtpSchema), async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyRegistrationOtp(email, otp);
    created(res, result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/verify-login-otp', requireAuth, validate(OtpSchema), async (req, res, next) => {
  try {
    const appReq = req as AppRequest;
    const email = appReq.ctx?.userEmail;
    if (!email) return next(new UnauthorizedError('Missing authenticated email'));

    const { otp } = req.body;
    const result = await verifyLoginOtp(email, otp);
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
