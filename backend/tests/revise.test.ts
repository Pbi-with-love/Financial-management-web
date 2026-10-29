import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../src/app.js';
import { cleanDatabase } from './helpers/cleanup.js';

const app = createApp();

beforeEach(async () => { await cleanDatabase(); });
afterAll(async () => { await cleanDatabase(); await prisma.$disconnect(); });

async function createTestMember(name: string, active = true) {
  return prisma.member.create({ data: { name, active } });
}

async function createTestExpense(
  app: ReturnType<typeof createApp>,
  memberIds: string[],
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post('/expenses')
    .send({
      title: 'Original expense',
      date: '2026-10-01',
      note: 'Original note',
      items: [
        {
          description: 'Item A',
          amountCents: 3000,
          participantIds: memberIds,
        },
      ],
      ...overrides,
    });
  if (res.status !== 201) {
    throw new Error(`createTestExpense failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body as { id: string; voided: boolean; replacedByExpenseId: string | null; replacesExpenseId: string | null };
}

describe('PUT /expenses/:id/revise — happy path', () => {
  it('creates revision: old voided with replacedByExpenseId, new has replacesExpenseId and correct splits', async () => {
    const alice = await createTestMember('Alice');
    const bob = await createTestMember('Bob');

    const original = await createTestExpense(app, [alice.id, bob.id]);

    const reviseRes = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [
          {
            description: 'Revised Item',
            amountCents: 5000,
            participantIds: [alice.id, bob.id],
          },
        ],
      });

    expect(reviseRes.status).toBe(200);

    const newExpense = reviseRes.body;
    expect(newExpense.replacesExpenseId).toBe(original.id);
    expect(newExpense.totalCents).toBe(5000);
    expect(newExpense.items).toHaveLength(1);
    expect(newExpense.items[0].itemShares).toHaveLength(2);

    // Each share should be 2500
    const shareAmounts = newExpense.items[0].itemShares.map((s: { amountCents: number }) => s.amountCents);
    expect(shareAmounts.every((a: number) => a === 2500)).toBe(true);

    // Verify old expense is voided with replacedByExpenseId set
    const oldExpense = await prisma.expense.findUniqueOrThrow({ where: { id: original.id } });
    expect(oldExpense.voided).toBe(true);
    expect(oldExpense.voidedAt).not.toBeNull();
    expect(oldExpense.replacedByExpenseId).toBe(newExpense.id);
  });

  it('balances are updated: old expense shares excluded, new shares included', async () => {
    const alice = await createTestMember('Alice');

    // Give Alice a deposit
    await prisma.deposit.create({
      data: { memberId: alice.id, amountCents: 10000, date: new Date('2026-10-01') },
    });

    const original = await createTestExpense(app, [alice.id], {
      items: [{ description: 'Item', amountCents: 4000, participantIds: [alice.id] }],
    });

    // Balance before revise: 10000 - 4000 = 6000
    const balanceSql = `
      SELECT m.id,
        COALESCE(dep.total, 0) - COALESCE(sh.total, 0) AS "balanceCents"
      FROM members m
      LEFT JOIN (
        SELECT member_id, SUM(amount_cents) AS total
        FROM deposits WHERE voided = false GROUP BY member_id
      ) dep ON m.id = dep.member_id
      LEFT JOIN (
        SELECT s.member_id, SUM(s.amount_cents) AS total
        FROM item_shares s
        JOIN items i ON s.item_id = i.id
        JOIN expenses e ON i.expense_id = e.id
        WHERE e.voided = false
        GROUP BY s.member_id
      ) sh ON m.id = sh.member_id
      WHERE m.id = ${alice.id}
    `;

    const before = await prisma.$queryRaw<Array<{ id: string; balanceCents: bigint }>>`
      SELECT m.id,
        COALESCE(dep.total, 0) - COALESCE(sh.total, 0) AS "balanceCents"
      FROM members m
      LEFT JOIN (
        SELECT member_id, SUM(amount_cents) AS total
        FROM deposits WHERE voided = false GROUP BY member_id
      ) dep ON m.id = dep.member_id
      LEFT JOIN (
        SELECT s.member_id, SUM(s.amount_cents) AS total
        FROM item_shares s
        JOIN items i ON s.item_id = i.id
        JOIN expenses e ON i.expense_id = e.id
        WHERE e.voided = false
        GROUP BY s.member_id
      ) sh ON m.id = sh.member_id
      WHERE m.id = ${alice.id}
    `;
    expect(Number(before[0].balanceCents)).toBe(6000);

    // Revise with new amount 2000
    const reviseRes = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [{ description: 'Revised Item', amountCents: 2000, participantIds: [alice.id] }],
      });
    expect(reviseRes.status).toBe(200);

    // Balance after revise: 10000 - 2000 = 8000 (old is voided)
    const after = await prisma.$queryRaw<Array<{ id: string; balanceCents: bigint }>>`
      SELECT m.id,
        COALESCE(dep.total, 0) - COALESCE(sh.total, 0) AS "balanceCents"
      FROM members m
      LEFT JOIN (
        SELECT member_id, SUM(amount_cents) AS total
        FROM deposits WHERE voided = false GROUP BY member_id
      ) dep ON m.id = dep.member_id
      LEFT JOIN (
        SELECT s.member_id, SUM(s.amount_cents) AS total
        FROM item_shares s
        JOIN items i ON s.item_id = i.id
        JOIN expenses e ON i.expense_id = e.id
        WHERE e.voided = false
        GROUP BY s.member_id
      ) sh ON m.id = sh.member_id
      WHERE m.id = ${alice.id}
    `;
    expect(Number(after[0].balanceCents)).toBe(8000);
  });

  it('preserves title, date, and note from the original expense', async () => {
    const alice = await createTestMember('Alice');

    const createRes = await request(app)
      .post('/expenses')
      .send({
        title: 'Holiday trip',
        date: '2026-09-15',
        note: 'Summer vacation',
        items: [{ description: 'Hotel', amountCents: 10000, participantIds: [alice.id] }],
      });
    expect(createRes.status).toBe(201);
    const original = createRes.body;

    const reviseRes = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [{ description: 'Updated Hotel', amountCents: 12000, participantIds: [alice.id] }],
      });

    expect(reviseRes.status).toBe(200);
    expect(reviseRes.body.title).toBe('Holiday trip');
    expect(reviseRes.body.note).toBe('Summer vacation');
    // Date should match (compare YYYY-MM-DD part)
    expect(reviseRes.body.date.startsWith('2026-09-15')).toBe(true);
  });
});

describe('PUT /expenses/:id/revise — 409 on voided expense', () => {
  it('returns 409 when trying to revise a voided expense', async () => {
    const alice = await createTestMember('Alice');
    const original = await createTestExpense(app, [alice.id]);

    // Void it first
    await request(app).post(`/expenses/${original.id}/void`);

    const reviseRes = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [{ description: 'Item', amountCents: 1000, participantIds: [alice.id] }],
      });

    expect(reviseRes.status).toBe(409);
    expect(reviseRes.body.error).toMatch(/already been edited or voided/i);
  });
});

describe('PUT /expenses/:id/revise — 409 on already-replaced expense', () => {
  it('returns 409 when trying to revise an expense that was already revised', async () => {
    const alice = await createTestMember('Alice');
    const original = await createTestExpense(app, [alice.id]);

    // Revise once — this should succeed
    const firstRevise = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [{ description: 'First revision', amountCents: 2000, participantIds: [alice.id] }],
      });
    expect(firstRevise.status).toBe(200);

    // Try to revise the OLD expense again — should get 409
    const secondRevise = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [{ description: 'Second attempt on old', amountCents: 3000, participantIds: [alice.id] }],
      });
    expect(secondRevise.status).toBe(409);
    expect(secondRevise.body.error).toMatch(/already been edited or voided/i);
  });
});

describe('PUT /expenses/:id/revise — 404 on non-existent expense', () => {
  it('returns 404 for unknown expense ID', async () => {
    const alice = await createTestMember('Alice');

    const res = await request(app)
      .put('/expenses/00000000-0000-0000-0000-000000000000/revise')
      .send({
        items: [{ description: 'Item', amountCents: 1000, participantIds: [alice.id] }],
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /expenses/:id — nests replacedExpense', () => {
  it('returns replacedExpense nested with old expense data when replacesExpenseId is set', async () => {
    const alice = await createTestMember('Alice');
    const original = await createTestExpense(app, [alice.id]);

    const reviseRes = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [{ description: 'New Item', amountCents: 7000, participantIds: [alice.id] }],
      });
    expect(reviseRes.status).toBe(200);
    const newExpense = reviseRes.body;

    // GET the new expense — should have replacedExpense nested
    const getRes = await request(app).get(`/expenses/${newExpense.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(newExpense.id);
    expect(getRes.body.replacesExpenseId).toBe(original.id);
    expect(getRes.body.replacedExpense).toBeDefined();
    expect(getRes.body.replacedExpense.id).toBe(original.id);
    expect(getRes.body.replacedExpense.items).toBeDefined();
    expect(getRes.body.replacedExpense.items[0].itemShares).toBeDefined();
  });

  it('returns null replacedExpense for a regular expense with no replacesExpenseId', async () => {
    const alice = await createTestMember('Alice');
    const original = await createTestExpense(app, [alice.id]);

    const getRes = await request(app).get(`/expenses/${original.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(original.id);
    expect(getRes.body.replacesExpenseId).toBeNull();
    expect(getRes.body.replacedExpense).toBeNull();
  });

  it('returns 404 for non-existent expense', async () => {
    const getRes = await request(app).get('/expenses/00000000-0000-0000-0000-000000000000');
    expect(getRes.status).toBe(404);
  });
});

describe('PUT /expenses/:id/revise — validation failures', () => {
  it('returns 400 for empty items array', async () => {
    const alice = await createTestMember('Alice');
    const original = await createTestExpense(app, [alice.id]);

    const res = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({ items: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 for item with no participantIds', async () => {
    const alice = await createTestMember('Alice');
    const original = await createTestExpense(app, [alice.id]);

    const res = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [{ description: 'Item', amountCents: 1000, participantIds: [] }],
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 for non-existent participant', async () => {
    const alice = await createTestMember('Alice');
    const original = await createTestExpense(app, [alice.id]);

    const res = await request(app)
      .put(`/expenses/${original.id}/revise`)
      .send({
        items: [{
          description: 'Item',
          amountCents: 1000,
          participantIds: ['00000000-0000-0000-0000-000000000000'],
        }],
      });

    expect(res.status).toBe(400);
  });
});
