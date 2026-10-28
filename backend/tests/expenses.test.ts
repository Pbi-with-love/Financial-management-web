import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../src/app.js';

const app = createApp();

// Clean up all expense-related and member data before each test to isolate tests
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

async function createTestMember(name: string, active = true) {
  return prisma.member.create({ data: { name, active } });
}

describe('POST /expenses — create expense with splits', () => {
  it('creates a multi-item expense with correct splits', async () => {
    const alice = await createTestMember('Alice');
    const bob = await createTestMember('Bob');
    const charlie = await createTestMember('Charlie');

    const res = await request(app)
      .post('/expenses')
      .send({
        title: 'Weekly shop',
        date: '2026-10-01',
        note: 'Supermarket run',
        items: [
          {
            description: 'Groceries',
            amountCents: 4000,
            participantIds: [alice.id, bob.id, charlie.id],
          },
          {
            description: 'Beer',
            amountCents: 3000,
            participantIds: [alice.id, bob.id],
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.totalCents).toBe(7000);
    expect(res.body.title).toBe('Weekly shop');
    expect(res.body.items).toHaveLength(2);

    // Find groceries item
    const groceries = res.body.items.find(
      (i: { description: string }) => i.description === 'Groceries',
    );
    expect(groceries).toBeDefined();
    expect(groceries.amountCents).toBe(4000);
    expect(groceries.itemShares).toHaveLength(3);

    const groceryShareAmounts = groceries.itemShares
      .map((s: { amountCents: number }) => s.amountCents)
      .sort((a: number, b: number) => b - a);
    // 4000 / 3 = 1333 remainder 1 → first (by sorted ID) gets 1334, rest 1333
    expect(groceryShareAmounts[0]).toBe(1334);
    expect(groceryShareAmounts[1]).toBe(1333);
    expect(groceryShareAmounts[2]).toBe(1333);
    expect(groceryShareAmounts[0] + groceryShareAmounts[1] + groceryShareAmounts[2]).toBe(4000);

    // Find beer item
    const beer = res.body.items.find(
      (i: { description: string }) => i.description === 'Beer',
    );
    expect(beer).toBeDefined();
    expect(beer.amountCents).toBe(3000);
    expect(beer.itemShares).toHaveLength(2);

    const beerShareAmounts = beer.itemShares.map(
      (s: { amountCents: number }) => s.amountCents,
    );
    expect(beerShareAmounts.every((a: number) => a === 1500)).toBe(true);
    expect(beerShareAmounts[0] + beerShareAmounts[1]).toBe(3000);
  });
});

describe('POST /expenses — validation failures → 400, nothing written', () => {
  it('rejects empty items array', async () => {
    const res = await request(app)
      .post('/expenses')
      .send({ title: 'Test', date: '2026-10-01', items: [] });

    expect(res.status).toBe(400);

    const count = await prisma.expense.count();
    expect(count).toBe(0);
  });

  it('rejects item with no participantIds', async () => {
    const res = await request(app)
      .post('/expenses')
      .send({
        title: 'Test',
        date: '2026-10-01',
        items: [
          { description: 'Food', amountCents: 1000, participantIds: [] },
        ],
      });

    expect(res.status).toBe(400);

    const count = await prisma.expense.count();
    expect(count).toBe(0);
  });

  it('rejects item with duplicate participantIds', async () => {
    const alice = await createTestMember('Alice');

    const res = await request(app)
      .post('/expenses')
      .send({
        title: 'Test',
        date: '2026-10-01',
        items: [
          {
            description: 'Food',
            amountCents: 1000,
            participantIds: [alice.id, alice.id],
          },
        ],
      });

    expect(res.status).toBe(400);

    const count = await prisma.expense.count();
    expect(count).toBe(0);
  });

  it('rejects item with inactive member as participant', async () => {
    const inactive = await createTestMember('Inactive', false);

    const res = await request(app)
      .post('/expenses')
      .send({
        title: 'Test',
        date: '2026-10-01',
        items: [
          {
            description: 'Food',
            amountCents: 1000,
            participantIds: [inactive.id],
          },
        ],
      });

    expect(res.status).toBe(400);

    const count = await prisma.expense.count();
    expect(count).toBe(0);
  });

  it('rejects item with non-existent member ID', async () => {
    const res = await request(app)
      .post('/expenses')
      .send({
        title: 'Test',
        date: '2026-10-01',
        items: [
          {
            description: 'Food',
            amountCents: 1000,
            participantIds: ['00000000-0000-0000-0000-000000000000'],
          },
        ],
      });

    expect(res.status).toBe(400);

    const count = await prisma.expense.count();
    expect(count).toBe(0);
  });
});

describe('GET /expenses', () => {
  it('returns created expenses with items and shares', async () => {
    const alice = await createTestMember('Alice');
    const bob = await createTestMember('Bob');

    await request(app)
      .post('/expenses')
      .send({
        title: 'Dinner',
        date: '2026-10-01',
        items: [
          { description: 'Pizza', amountCents: 2000, participantIds: [alice.id, bob.id] },
        ],
      });

    const res = await request(app).get('/expenses');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Dinner');
    expect(res.body[0].items).toHaveLength(1);
    expect(res.body[0].items[0].itemShares).toHaveLength(2);
  });

  it('returns expenses ordered by date descending', async () => {
    const alice = await createTestMember('Alice');

    await request(app)
      .post('/expenses')
      .send({
        title: 'First',
        date: '2026-09-01',
        items: [{ description: 'Item', amountCents: 1000, participantIds: [alice.id] }],
      });

    await request(app)
      .post('/expenses')
      .send({
        title: 'Second',
        date: '2026-10-01',
        items: [{ description: 'Item', amountCents: 1000, participantIds: [alice.id] }],
      });

    const res = await request(app).get('/expenses');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Second');
    expect(res.body[1].title).toBe('First');
  });
});

describe('GET /expenses?limit=N', () => {
  it('returns only N most recent expenses', async () => {
    const alice = await createTestMember('Alice');

    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post('/expenses')
        .send({
          title: `Expense ${i}`,
          date: `2026-10-0${i}`,
          items: [{ description: 'Item', amountCents: 1000, participantIds: [alice.id] }],
        });
    }

    const res = await request(app).get('/expenses?limit=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Expense 3');
  });
});

describe('POST /expenses/:id/void', () => {
  it('voids an expense', async () => {
    const alice = await createTestMember('Alice');

    const createRes = await request(app)
      .post('/expenses')
      .send({
        title: 'Lunch',
        date: '2026-10-01',
        items: [{ description: 'Sandwich', amountCents: 500, participantIds: [alice.id] }],
      });
    const expenseId = createRes.body.id;

    const voidRes = await request(app).post(`/expenses/${expenseId}/void`);
    expect(voidRes.status).toBe(200);
    expect(voidRes.body.voided).toBe(true);
    expect(voidRes.body.voidedAt).toBeDefined();
  });

  it('voiding twice is idempotent — same result, no error', async () => {
    const alice = await createTestMember('Alice');

    const createRes = await request(app)
      .post('/expenses')
      .send({
        title: 'Lunch',
        date: '2026-10-01',
        items: [{ description: 'Sandwich', amountCents: 500, participantIds: [alice.id] }],
      });
    const expenseId = createRes.body.id;

    const void1 = await request(app).post(`/expenses/${expenseId}/void`);
    const void2 = await request(app).post(`/expenses/${expenseId}/void`);

    expect(void1.status).toBe(200);
    expect(void2.status).toBe(200);
    expect(void1.body.voided).toBe(true);
    expect(void2.body.voided).toBe(true);
    // voidedAt should be the same (not updated on second void)
    expect(void1.body.voidedAt).toBe(void2.body.voidedAt);
  });

  it('returns 404 for a non-existent expense', async () => {
    const res = await request(app).post(
      '/expenses/00000000-0000-0000-0000-000000000000/void',
    );
    expect(res.status).toBe(404);
  });
});

describe('Voiding excludes expense from member balances', () => {
  it('voided expense shares do not reduce member balance', async () => {
    const alice = await createTestMember('Alice');

    // Give Alice a deposit of 10000 cents
    await prisma.deposit.create({
      data: {
        memberId: alice.id,
        amountCents: 10000,
        date: new Date('2026-10-01'),
      },
    });

    // Create an expense of 4000 cents charged to Alice
    const createRes = await request(app)
      .post('/expenses')
      .send({
        title: 'Groceries',
        date: '2026-10-01',
        items: [
          { description: 'Food', amountCents: 4000, participantIds: [alice.id] },
        ],
      });
    const expenseId = createRes.body.id;

    // Check balance before void: 10000 - 4000 = 6000
    const membersBeforeVoid = await prisma.$queryRaw<
      Array<{ id: string; balanceCents: bigint }>
    >`
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
    expect(Number(membersBeforeVoid[0].balanceCents)).toBe(6000);

    // Void the expense
    await request(app).post(`/expenses/${expenseId}/void`);

    // Check balance after void: 10000 - 0 = 10000
    const membersAfterVoid = await prisma.$queryRaw<
      Array<{ id: string; balanceCents: bigint }>
    >`
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
    expect(Number(membersAfterVoid[0].balanceCents)).toBe(10000);
  });
});

describe('Transaction rollback on invalid participant', () => {
  it('creates no records when one item has an invalid participant', async () => {
    const alice = await createTestMember('Alice');
    const fakeId = '00000000-0000-0000-0000-000000000001';

    const res = await request(app)
      .post('/expenses')
      .send({
        title: 'Bad Expense',
        date: '2026-10-01',
        items: [
          {
            description: 'Valid item',
            amountCents: 1000,
            participantIds: [alice.id],
          },
          {
            description: 'Invalid item',
            amountCents: 500,
            participantIds: [fakeId],
          },
        ],
      });

    expect(res.status).toBe(400);

    const expenseCount = await prisma.expense.count();
    const itemCount = await prisma.item.count();
    const shareCount = await prisma.itemShare.count();

    expect(expenseCount).toBe(0);
    expect(itemCount).toBe(0);
    expect(shareCount).toBe(0);
  });
});
