import bcrypt from 'bcryptjs';
import { CONSTANTS } from '@core/config';

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, CONSTANTS.BCRYPT_ROUNDS);

export const verifyPassword = (plain: string, hashed: string): Promise<boolean> =>
  bcrypt.compare(plain, hashed);
