import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../src/app.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /health', () => {
  it('responds with a valid shape (200 ok or 500 error depending on DB)', async () => {
    const res = await request(app).get('/health');

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body).toEqual({ status: 'ok', database: 'connected' });
    } else {
      expect(res.body).toMatchObject({ status: 'error', database: 'disconnected' });
    }
  });

  it('always returns JSON with a status field', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
  });
});
