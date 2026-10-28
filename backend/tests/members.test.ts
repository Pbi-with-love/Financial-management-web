import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../src/app.js';

const app = createApp();

let createdMemberId: string;

beforeAll(async () => {
  // Clean up any test data that might exist
  await prisma.itemShare.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.member.deleteMany({});
});

afterAll(async () => {
  await prisma.itemShare.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.$disconnect();
});

describe('POST /members', () => {
  it('creates a member and returns 201 with id and name', async () => {
    const res = await request(app)
      .post('/members')
      .send({ name: 'Test' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'Test');
    expect(res.body).toHaveProperty('active', true);

    createdMemberId = res.body.id;
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/members')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when name is empty string', async () => {
    const res = await request(app)
      .post('/members')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /members', () => {
  it('returns 200 with an array and balanceCents on each member', async () => {
    const res = await request(app).get('/members');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    for (const member of res.body) {
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('active');
      expect(member).toHaveProperty('balanceCents');
      expect(typeof member.balanceCents).toBe('number');
    }
  });

  it('new member has balanceCents of 0', async () => {
    const res = await request(app).get('/members');

    expect(res.status).toBe(200);
    const testMember = res.body.find((m: { id: string }) => m.id === createdMemberId);
    expect(testMember).toBeDefined();
    expect(testMember.balanceCents).toBe(0);
  });
});

describe('GET /members/:id', () => {
  it('returns 200 with member data including deposits and itemShares', async () => {
    const res = await request(app).get(`/members/${createdMemberId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', createdMemberId);
    expect(res.body).toHaveProperty('name', 'Test');
    expect(res.body).toHaveProperty('deposits');
    expect(res.body).toHaveProperty('itemShares');
    expect(Array.isArray(res.body.deposits)).toBe(true);
    expect(Array.isArray(res.body.itemShares)).toBe(true);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/members/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /members/:id', () => {
  it('deactivates a member and returns 200', async () => {
    const res = await request(app)
      .patch(`/members/${createdMemberId}`)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', createdMemberId);
    expect(res.body).toHaveProperty('active', false);
  });

  it('returns 400 for invalid body', async () => {
    const res = await request(app)
      .patch(`/members/${createdMemberId}`)
      .send({ active: 'yes' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for unknown member', async () => {
    const res = await request(app)
      .patch('/members/00000000-0000-0000-0000-000000000000')
      .send({ active: false });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
