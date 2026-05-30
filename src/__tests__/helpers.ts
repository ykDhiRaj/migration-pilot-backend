/**
 * Test helpers — shared across all test files.
 */

import supertest from 'supertest';
import { buildApp } from '../../src/app';
import { createUser } from '@modules/users/users.repository';
import { hashPassword } from '@shared/utils/hash';
import { signAccessToken } from '@shared/utils/jwt';

/** Lazily built app instance shared across test files. */
let _app: ReturnType<typeof buildApp>;

export function getTestApp() {
  if (!_app) _app = buildApp();
  return _app;
}

export function agent() {
  return supertest(getTestApp());
}

/** Create a user in the DB and return it with a valid access token. */
export async function createTestUser(overrides: Partial<{
  name: string;
  email: string;
  password: string;
}> = {}) {
  const email = overrides.email ?? `test-${Date.now()}@example.com`;
  const name = overrides.name ?? 'Test User';
  const password = overrides.password ?? 'password123';

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  return { user, accessToken, password };
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
