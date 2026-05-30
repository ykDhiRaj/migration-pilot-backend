import jwt from 'jsonwebtoken';
import { env } from '@core/config';
import { CONSTANTS } from '@core/config';
import { TokenPayload } from '@shared/types';

const secret = () => `${env.JWT_SECRET}_${CONSTANTS.JWT_VERSION}`;

export function signAccessToken(payload: Omit<TokenPayload, 'version' | 'iat' | 'exp'>): string {
  return jwt.sign({ ...payload, version: CONSTANTS.JWT_VERSION }, secret(), {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ sub: userId, version: CONSTANTS.JWT_VERSION }, secret(), {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, secret()) as TokenPayload;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}
