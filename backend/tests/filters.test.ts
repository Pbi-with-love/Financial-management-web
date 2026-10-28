/**
 * Integration tests for date/category/member filters on GET /expenses and GET /deposits.
 */
import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../src/app.js';

const app = createApp();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createTestMember(name: string) {
  return prisma.member.create({ data: { name, active: true } });
}

/**
 * Create an expense via the HTTP API so all validation and share-splitting
 * logic runs as normal. Returns the parsed response body.
 */
async function createExpense(
  title: string,
  date: string,
  items: Array<{ description: string; amountCents: number; category?: string; participantIds: string[] }>,
) {
  const res = await request(app)
    .post('/expenses')
    .send({ title, date, items });
  if (res.status !== 201) {
    throw new Error(`createExpense failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body as { id: string; title: string; voided: boolean };
}

async function createDeposit(memberId: string, amountCents: number, date: string) {
  const res = await request(app)
    .post('/deposits')
    .send({ memberId, amountCents, date });
  if (res.status !== 201) {
    throw new Error(`createDeposit failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body as { id: string };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await prisma.itemShare.deleteMany();
  await prisma.item.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.member.deleteMany();
});

afterAll(async () => {
  await prisma.itemShare.deleteMany();
  await prisma.item.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.member.deleteMany();
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Expense filter tests
// ---------------------------------------------------------------------------

describe('GET /expenses — date filters', () => {
  it('?from=2026-10-15 returns only expenses on or after that date', async () => {
    const alice = await createTestMember('Alice');

    await createExpense('Early', '2026-10-05', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await createExpense('Mid', '2026-10-15', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await createExpense('Late', '2026-10-20', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);

    const res = await request(app).get('/expenses?from=2026-10-15');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title).sort();
    expect(titles).toEqual(['Late', 'Mid']);
  });

  it('?to=2026-10-10 returns only expenses on or before that date', async () => {
    const alice = await createTestMember('Alice');

    await createExpense('Early', '2026-10-05', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await createExpense('Mid', '2026-10-15', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);

    const res = await request(app).get('/expenses?to=2026-10-10');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title);
    expect(titles).toEqual(['Early']);
  });

  it('?from=...&to=... returns expenses in date range (inclusive)', async () => {
    const alice = await createTestMember('Alice');

    await createExpense('Before', '2026-10-01', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await createExpense('Start', '2026-10-05', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await createExpense('Middle', '2026-10-10', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await createExpense('End', '2026-10-15', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await createExpense('After', '2026-10-20', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);

    const res = await request(app).get('/expenses?from=2026-10-05&to=2026-10-15');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title).sort();
    expect(titles).toEqual(['End', 'Middle', 'Start']);
  });
});

describe('GET /expenses — category filter', () => {
  it('?category=Food returns only expenses with at least one Food item', async () => {
    const alice = await createTestMember('Alice');

    await createExpense('Grocery run', '2026-10-01', [
      { description: 'Apples', amountCents: 500, category: 'Food', participantIds: [alice.id] },
    ]);
    await createExpense('Gas', '2026-10-02', [
      { description: 'Petrol', amountCents: 4000, category: 'Transport', participantIds: [alice.id] },
    ]);
    await createExpense('Mixed', '2026-10-03', [
      { description: 'Bread', amountCents: 300, category: 'Food', participantIds: [alice.id] },
      { description: 'Book', amountCents: 1200, category: 'Education', participantIds: [alice.id] },
    ]);

    const res = await request(app).get('/expenses?category=Food');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title).sort();
    expect(titles).toEqual(['Grocery run', 'Mixed']);
  });
});

describe('GET /expenses — memberId filter', () => {
  it('?memberId=<id> returns only expenses where that member has a share', async () => {
    const alice = await createTestMember('Alice');
    const bob = await createTestMember('Bob');

    // Only Alice
    await createExpense('Alice only', '2026-10-01', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    // Only Bob
    await createExpense('Bob only', '2026-10-02', [
      { description: 'Item', amountCents: 1000, participantIds: [bob.id] },
    ]);
    // Both
    await createExpense('Both', '2026-10-03', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id, bob.id] },
    ]);

    const resAlice = await request(app).get(`/expenses?memberId=${alice.id}`);
    expect(resAlice.status).toBe(200);
    const aliceTitles = resAlice.body.map((e: { title: string }) => e.title).sort();
    expect(aliceTitles).toEqual(['Alice only', 'Both']);

    const resBob = await request(app).get(`/expenses?memberId=${bob.id}`);
    expect(resBob.status).toBe(200);
    const bobTitles = resBob.body.map((e: { title: string }) => e.title).sort();
    expect(bobTitles).toEqual(['Bob only', 'Both']);
  });
});

describe('GET /expenses — includeVoided filter', () => {
  it('default (no includeVoided) excludes voided expenses', async () => {
    const alice = await createTestMember('Alice');

    const live = await createExpense('Live', '2026-10-01', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    const voided = await createExpense('Voided', '2026-10-02', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);

    // Void the second expense
    await request(app).post(`/expenses/${voided.id}/void`);

    const res = await request(app).get('/expenses');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title);
    expect(titles).toContain('Live');
    expect(titles).not.toContain('Voided');
    void live; // suppress unused variable
  });

  it('?includeVoided=true includes voided expenses', async () => {
    const alice = await createTestMember('Alice');

    await createExpense('Live', '2026-10-01', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    const voided = await createExpense('Voided', '2026-10-02', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await request(app).post(`/expenses/${voided.id}/void`);

    const res = await request(app).get('/expenses?includeVoided=true');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title);
    expect(titles).toContain('Live');
    expect(titles).toContain('Voided');
  });

  it('?includeVoided=false explicitly excludes voided expenses', async () => {
    const alice = await createTestMember('Alice');

    const voided = await createExpense('Voided', '2026-10-02', [
      { description: 'Item', amountCents: 1000, participantIds: [alice.id] },
    ]);
    await request(app).post(`/expenses/${voided.id}/void`);

    const res = await request(app).get('/expenses?includeVoided=false');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title);
    expect(titles).not.toContain('Voided');
  });

  it('?includeVoided with invalid value → 400', async () => {
    const res = await request(app).get('/expenses?includeVoided=yes');
    expect(res.status).toBe(400);
  });
});

describe('GET /expenses — combined filters (AND logic)', () => {
  it('?from=...&category=Food&memberId=<id> applies all filters as AND', async () => {
    const alice = await createTestMember('Alice');
    const bob = await createTestMember('Bob');

    // Matches all: date >= Oct 10, has Food, Alice has share
    await createExpense('Match', '2026-10-12', [
      { description: 'Pizza', amountCents: 2000, category: 'Food', participantIds: [alice.id] },
    ]);

    // Fails date filter (before Oct 10)
    await createExpense('Too early', '2026-10-01', [
      { description: 'Salad', amountCents: 800, category: 'Food', participantIds: [alice.id] },
    ]);

    // Fails category filter (Transport, not Food)
    await createExpense('Wrong category', '2026-10-15', [
      { description: 'Bus', amountCents: 300, category: 'Transport', participantIds: [alice.id] },
    ]);

    // Fails memberId filter (Bob, not Alice)
    await createExpense('Wrong member', '2026-10-15', [
      { description: 'Burger', amountCents: 1500, category: 'Food', participantIds: [bob.id] },
    ]);

    const res = await request(app).get(
      `/expenses?from=2026-10-10&category=Food&memberId=${alice.id}`,
    );
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title);
    expect(titles).toEqual(['Match']);
  });
});

// ---------------------------------------------------------------------------
// Deposit filter tests
// ---------------------------------------------------------------------------

describe('GET /deposits — date filters', () => {
  it('?from=...&to=... filters deposits by date range (inclusive)', async () => {
    const alice = await createTestMember('Alice');

    await createDeposit(alice.id, 1000, '2026-10-01');
    await createDeposit(alice.id, 2000, '2026-10-10');
    await createDeposit(alice.id, 3000, '2026-10-20');

    const res = await request(app).get('/deposits?from=2026-10-05&to=2026-10-15');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].amountCents).toBe(2000);
  });

  it('?from=... returns deposits on or after that date', async () => {
    const alice = await createTestMember('Alice');

    await createDeposit(alice.id, 1000, '2026-10-01');
    await createDeposit(alice.id, 2000, '2026-10-15');

    const res = await request(app).get('/deposits?from=2026-10-10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].amountCents).toBe(2000);
  });

  it('?to=... returns deposits on or before that date', async () => {
    const alice = await createTestMember('Alice');

    await createDeposit(alice.id, 1000, '2026-10-01');
    await createDeposit(alice.id, 2000, '2026-10-15');

    const res = await request(app).get('/deposits?to=2026-10-10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].amountCents).toBe(1000);
  });
});

describe('GET /deposits — memberId filter', () => {
  it('?memberId=<id> returns only deposits for that member', async () => {
    const alice = await createTestMember('Alice');
    const bob = await createTestMember('Bob');

    await createDeposit(alice.id, 5000, '2026-10-01');
    await createDeposit(bob.id, 3000, '2026-10-02');
    await createDeposit(alice.id, 2000, '2026-10-03');

    const res = await request(app).get(`/deposits?memberId=${alice.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const amounts = res.body
      .map((d: { amountCents: number }) => d.amountCents)
      .sort((a: number, b: number) => a - b);
    expect(amounts).toEqual([2000, 5000]);
  });
});

describe('GET /deposits — combined date + memberId filter', () => {
  it('?from=...&to=...&memberId=<id> applies AND logic', async () => {
    const alice = await createTestMember('Alice');
    const bob = await createTestMember('Bob');

    // Alice, in range
    await createDeposit(alice.id, 1000, '2026-10-10');
    // Alice, out of range
    await createDeposit(alice.id, 2000, '2026-10-25');
    // Bob, in range — excluded by memberId
    await createDeposit(bob.id, 3000, '2026-10-10');

    const res = await request(app).get(
      `/deposits?from=2026-10-05&to=2026-10-15&memberId=${alice.id}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].amountCents).toBe(1000);
  });
});
