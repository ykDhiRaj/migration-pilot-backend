import { BadRequestError, ConflictError, UnauthorizedError } from '@core/errors';
import { signAccessToken, signRefreshToken, verifyToken } from '@shared/utils/jwt';
import { CONSTANTS } from '@core/config';
import {
  findUserByEmail,
  PublicUser,
  googleCreatedUser,
  findRegisteringUserByEmail,
  createUser,
  updateEmailVerificationByEmail,
  deleteEmailVerificationByEmail,
  createNewRegisterUser,
} from '@modules/users/users.repository';
import { RegisterDto, LoginDto } from './auth.schema';
import { OAuth2Client } from 'google-auth-library';
import { generateOtp } from '@shared/utils/otpGenerator';
import { sendEmail } from '@shared/utils/email';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

/**
 * Auth service.
 *
 * Register → hash password → insert user → issue tokens
 * Login    → find user → verify password → issue tokens
 * Refresh  → verify refresh token → issue new access token
 */

export async function registerLocal(dto: RegisterDto) {
  const existingOtp = await findRegisteringUserByEmail(dto.email);
  const existingUser = await findUserByEmail(dto.email);

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  if (existingOtp) {
    await updateEmailVerificationByEmail(dto.email, {
      otp,
      expiresAt,
    });

    await sendEmail(dto.email, otp);

    return {
      message: 'OTP sent successfully',
    };
  }

  await createNewRegisterUser({
    email: dto.email,
    otp,
    expiresAt,
  });

  await sendEmail(dto.email, otp);

  return {
    message: 'OTP sent successfully',
  };
}

export async function registerGoogle(idToken:string){
    const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new Error('Unable to retrieve Google account email');
  }

  const email = payload.email;
  const name = payload.name ?? '';
  const providerId= payload.sub;
  const profileImage = payload.picture;
  const isEmailVerified = payload.email_verified ?? false;

  let user = await findUserByEmail(email);

  if (!user) {
    user = await googleCreatedUser({
      name,
      email,
      authProvider: 'GOOGLE',
      providerId,
      profileImage,
      isEmailVerified,
    });
  }

  return {
    tokens: buildTokens(user.id, user.email),
  };
}

export async function login(dto: LoginDto) {
  const user = await findUserByEmail(dto.email);

  if (!user) {
    throw new BadRequestError(
      'No account found with this email'
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  const existingOtp = await findRegisteringUserByEmail(dto.email);

  if (existingOtp) {
    await updateEmailVerificationByEmail(
      dto.email,
      {
        otp,
        expiresAt,
      }
    );
  } else {
    await createNewRegisterUser({
      email: dto.email,
      otp,
      expiresAt,
    });
  }

  await sendEmail(dto.email, otp);

  return {
    token: buildTokens(user.id, user.email),
    message: 'OTP sent successfully',
  };
}

export async function refreshTokens(rawRefreshToken: string): Promise<{ accessToken: string }> {
  let payload: ReturnType<typeof verifyToken>;

  try {
    payload = verifyToken(rawRefreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  if (payload.version !== CONSTANTS.JWT_VERSION) {
    throw new UnauthorizedError('Refresh token has been invalidated');
  }

  const accessToken = signAccessToken({ sub: payload.sub, email: payload.email });
  return { accessToken };
}

export async function verifyRegistrationOtp(email: string, otp: string) {

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const record = await findRegisteringUserByEmail(email);

  if (!record) {
    throw new BadRequestError('No OTP request found for this email');
  }

  if (record.otp !== otp) {
    throw new BadRequestError('Invalid OTP');
  }

  if (record.expiresAt < new Date()) {
    throw new BadRequestError('OTP has expired');
  }

  const user = await createUser({
    email,
    authProvider: 'LOCAL',
    isEmailVerified: true
  });

  await deleteEmailVerificationByEmail(email);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    tokens: buildTokens(user.id, user.email),
    message: 'Registration successful',
  };
}

export async function verifyLoginOtp(email: string, otp: string) {
  const record = await findRegisteringUserByEmail(email);

  if (!record) {
    throw new BadRequestError('No OTP request found for this email');
  }

  if (record.otp !== otp) {
    throw new BadRequestError('Invalid OTP');
  }

  if (record.expiresAt < new Date()) {
    throw new BadRequestError('OTP has expired');
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new BadRequestError('No account found with this email');
  }

  await deleteEmailVerificationByEmail(email);

  return {
    tokens: buildTokens(user.id, user.email),
    message: 'Login successful',
  };
}

// ── Private ──────────────────────────────────────────────────────────────────

function buildTokens(userId: string, email: string): AuthTokens {
  return {
    accessToken: signAccessToken({ sub: userId, email }),
    refreshToken: signRefreshToken(userId),
  };
}
