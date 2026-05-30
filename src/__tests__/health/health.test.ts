import { describe, it, expect } from 'vitest';
import { agent } from '../helpers';

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok when DB is reachable', async () => {
    const res = await agent().get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.services.database).toBe('ok');
    expect(typeof res.body.data.uptime).toBe('number');
    expect(typeof res.body.data.timestamp).toBe('string');
  });
});
