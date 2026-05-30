import { BadRequestError, ConflictError, UnauthorizedError } from '@core/errors';
import { signAccessToken, signRefreshToken, verifyToken } from '@shared/utils/jwt';
import { hashPassword, verifyPassword } from '@shared/utils/hash';
import { CONSTANTS } from '@core/config';
import {
  findUserByEmail,
  createUser,
  stripPassword,
  PublicUser,
} from '@modules/users/users.repository';
import { RegisterDto, LoginDto } from './auth.schema';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

/**
 * Auth service.
 *
 * Register → hash password → insert user → issue tokens
 * Login    → find user → verify password → issue tokens
 * Refresh  → verify refresh token → issue new access token
 */

export async function register(dto: RegisterDto): Promise<AuthResult> {
  const existing = await findUserByEmail(dto.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await hashPassword(dto.password);
  const user = await createUser({ name: dto.name, email: dto.email, passwordHash });
  const publicUser = stripPassword(user);

  return {
    user: publicUser,
    tokens: buildTokens(user.id, user.email),
  };
}

export async function login(dto: LoginDto): Promise<AuthResult> {
  const user = await findUserByEmail(dto.email);

  // Identical error message for wrong email & wrong password — avoids enumeration
  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }

  const valid = await verifyPassword(dto.password, user.passwordHash);
  if (!valid) {
    throw new BadRequestError('Invalid credentials');
  }

  return {
    user: stripPassword(user),
    tokens: buildTokens(user.id, user.email),
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

// ── Private ──────────────────────────────────────────────────────────────────

function buildTokens(userId: number, email: string): AuthTokens {
  return {
    accessToken: signAccessToken({ sub: userId, email }),
    refreshToken: signRefreshToken(userId),
  };
}
