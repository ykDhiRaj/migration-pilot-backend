import { BadRequestError, ConflictError, UnauthorizedError } from '@core/errors';
import { signAccessToken, signRefreshToken, verifyToken } from '@shared/utils/jwt';
import { hashPassword, verifyPassword } from '@shared/utils/hash';
import { CONSTANTS } from '@core/config';
import {
  findUserByEmail,
  createUser,
  stripPassword,
  PublicUser,
  googleCreatedUser,
} from '@modules/users/users.repository';
import { RegisterDto, LoginDto } from './auth.schema';
import { OAuth2Client } from 'google-auth-library';

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

export async function registerLocal(
  dto: RegisterDto
): Promise<AuthResult> {
  const existing = await findUserByEmail(dto.email);

  if (existing) {
    throw new ConflictError(
      'An account with this email already exists'
    );
  }

  const password = await hashPassword(dto.password);

  const user = await createUser({
    email: dto.email,
    password,
    authProvider: 'LOCAL',
  });

  const publicUser = stripPassword(user);

  return {
    user: publicUser,
    tokens: buildTokens(
      user.id,
      user.email
    ),
  };
}

export async function registerGoogle(idToken:string): Promise<AuthResult>{
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
    user: stripPassword(user),
    tokens: buildTokens(user.id, user.email),
  };
}

export async function googleAuthDev(): Promise<AuthResult> {
  const email = 'test@gmail.com';

  let user = await findUserByEmail(email);

  if (!user) {
    user = await googleCreatedUser({
      name: 'Google Test User',
      email,
      authProvider: 'GOOGLE',
      providerId: 'google-test-id',
      profileImage: "",
      isEmailVerified: true,
    });
  }

  return {
    user: stripPassword(user),
    tokens: buildTokens(user.id, user.email),
  };
}

// export async function login(dto: LoginDto): Promise<AuthResult> {
//   const user = await findUserByEmail(dto.email);

//   // Identical error message for wrong email & wrong password — avoids enumeration
//   if (!user) {
//     throw new BadRequestError('Invalid credentials');
//   }

//   const valid = await verifyPassword(dto.password, user.password);
//   if (!valid) {
//     throw new BadRequestError('Invalid credentials');
//   }

//   return {
//     user: stripPassword(user),
//     tokens: buildTokens(user.id, user.email),
//   };
// }

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

// ── Private ──────────────────────────────────────────────────────────────────

function buildTokens(userId: string, email: string): AuthTokens {
  return {
    accessToken: signAccessToken({ sub: userId, email }),
    refreshToken: signRefreshToken(userId),
  };
}
