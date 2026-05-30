import { describe, it, expect, beforeEach } from 'vitest';
import { agent, createTestUser, authHeader } from '../helpers';
import { cleanDb } from '../setup';

beforeEach(cleanDb);

describe('GET /api/v1/users/me', () => {
  it('returns the authenticated user profile', async () => {
    const { user, accessToken } = await createTestUser();

    const res = await agent()
      .get('/api/v1/users/me')
      .set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 401 without a token', async () => {
    const res = await agent().get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await agent()
      .get('/api/v1/users/me')
      .set({ Authorization: 'Bearer bad.token.here' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/users/me', () => {
  it('updates the user name', async () => {
    const { accessToken } = await createTestUser();

    const res = await agent()
      .patch('/api/v1/users/me')
      .set(authHeader(accessToken))
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
  });

  it('returns 422 for an invalid email format in update', async () => {
    const { accessToken } = await createTestUser();

    const res = await agent()
      .patch('/api/v1/users/me')
      .set(authHeader(accessToken))
      .send({ email: 'not-valid' });

    expect(res.status).toBe(422);
  });

  it('returns 401 without auth', async () => {
    const res = await agent().patch('/api/v1/users/me').send({ name: 'Ghost' });
    expect(res.status).toBe(401);
  });
});
