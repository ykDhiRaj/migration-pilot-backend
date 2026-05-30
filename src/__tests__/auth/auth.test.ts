import { describe, it, expect, beforeEach } from 'vitest';
import { agent, createTestUser, authHeader } from '../helpers';
import { cleanDb } from '../setup';

beforeEach(cleanDb);

describe('POST /api/v1/auth/register', () => {
  const endpoint = '/api/v1/auth/register';

  it('creates a user and returns tokens', async () => {
    const res = await agent().post(endpoint).send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'securepassword',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(typeof res.body.data.tokens.accessToken).toBe('string');
    expect(typeof res.body.data.tokens.refreshToken).toBe('string');
  });

  it('returns 409 when email is already registered', async () => {
    await createTestUser({ email: 'dup@example.com' });

    const res = await agent().post(endpoint).send({
      name: 'Dup',
      email: 'dup@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for missing required fields', async () => {
    const res = await agent().post(endpoint).send({ email: 'bad@example.com' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('returns 422 for invalid email format', async () => {
    const res = await agent().post(endpoint).send({
      name: 'Test',
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(422);
  });

  it('returns 422 for short password', async () => {
    const res = await agent().post(endpoint).send({
      name: 'Test',
      email: 'test@example.com',
      password: 'short',
    });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/login', () => {
  const endpoint = '/api/v1/auth/login';

  it('returns tokens for valid credentials', async () => {
    await createTestUser({ email: 'login@example.com', password: 'correctpassword' });

    const res = await agent().post(endpoint).send({
      email: 'login@example.com',
      password: 'correctpassword',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.tokens.accessToken).toBe('string');
  });

  it('returns 400 for wrong password', async () => {
    await createTestUser({ email: 'pass@example.com', password: 'correctpassword' });

    const res = await agent().post(endpoint).send({
      email: 'pass@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  it('returns 400 for non-existent email', async () => {
    const res = await agent().post(endpoint).send({
      email: 'ghost@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    // Same message as wrong password — avoids user enumeration
    expect(res.body.error.message).toBe('Invalid credentials');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  const endpoint = '/api/v1/auth/refresh';

  it('returns a new access token for a valid refresh token', async () => {
    const loginRes = await agent().post('/api/v1/auth/login').send({
      email: (await createTestUser()).user.email,
      password: 'password123',
    });

    const { refreshToken } = loginRes.body.data.tokens;

    const res = await agent().post(endpoint).send({ refreshToken });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  it('returns 401 for a forged token', async () => {
    const res = await agent().post(endpoint).send({ refreshToken: 'totally.forged.token' });
    expect(res.status).toBe(401);
  });
});
