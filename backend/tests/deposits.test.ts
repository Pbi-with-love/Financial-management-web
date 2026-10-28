import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../src/app.js';

const app = createApp();

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

describe('POST /deposits — create deposit', () => {
  it('creates a deposit with valid data → 201', async () => {
    const alice = await createTestMember('Alice');

    const res = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 5000,
      date: '2026-10-01',
      note: 'Monthly contribution',
    });

    expect(res.status).toBe(201);
    expect(res.body.memberId).toBe(alice.id);
    expect(res.body.amountCents).toBe(5000);
    expect(res.body.voided).toBe(false);
    expect(res.body.member).toBeDefined();
    expect(res.body.member.name).toBe('Alice');
  });

  it('creates a deposit without an optional note', async () => {
    const alice = await createTestMember('Alice');

    const res = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 3000,
      date: '2026-10-01',
    });

    expect(res.status).toBe(201);
    expect(res.body.amountCents).toBe(3000);
  });
});

describe('POST /deposits — validation failures → 400', () => {
  it('rejects amountCents of 0', async () => {
    const alice = await createTestMember('Alice');

    const res = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 0,
      date: '2026-10-01',
    });

    expect(res.status).toBe(400);
  });

  it('rejects negative amountCents', async () => {
    const alice = await createTestMember('Alice');

    const res = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: -100,
      date: '2026-10-01',
    });

    expect(res.status).toBe(400);
  });

  it('rejects non-integer amountCents', async () => {
    const alice = await createTestMember('Alice');

    const res = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 10.5,
      date: '2026-10-01',
    });

    expect(res.status).toBe(400);
  });

  it('rejects invalid date format', async () => {
    const alice = await createTestMember('Alice');

    const res = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 1000,
      date: '01-10-2026',
    });

    expect(res.status).toBe(400);
  });

  it('rejects invalid memberId (not a UUID)', async () => {
    const res = await request(app).post('/deposits').send({
      memberId: 'not-a-uuid',
      amountCents: 1000,
      date: '2026-10-01',
    });

    expect(res.status).toBe(400);
  });

  it('rejects non-existent memberId → 400', async () => {
    const res = await request(app).post('/deposits').send({
      memberId: '00000000-0000-0000-0000-000000000000',
      amountCents: 1000,
      date: '2026-10-01',
    });

    expect(res.status).toBe(400);

    const count = await prisma.deposit.count();
    expect(count).toBe(0);
  });
});

describe('GET /deposits', () => {
  it('returns an empty array when there are no deposits', async () => {
    const res = await request(app).get('/deposits');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns deposits sorted by date descending', async () => {
    const alice = await createTestMember('Alice');

    await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 1000,
      date: '2026-09-01',
    });

    await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 2000,
      date: '2026-10-01',
    });

    const res = await request(app).get('/deposits');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].amountCents).toBe(2000); // newer first
    expect(res.body[1].amountCents).toBe(1000);
  });

  it('includes the member relation in each deposit', async () => {
    const alice = await createTestMember('Alice');

    await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 5000,
      date: '2026-10-01',
    });

    const res = await request(app).get('/deposits');
    expect(res.status).toBe(200);
    expect(res.body[0].member).toBeDefined();
    expect(res.body[0].member.name).toBe('Alice');
  });
});

describe('POST /deposits/:id/void', () => {
  it('voids a deposit → voided=true', async () => {
    const alice = await createTestMember('Alice');

    const createRes = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 5000,
      date: '2026-10-01',
    });
    const depositId = createRes.body.id;

    const voidRes = await request(app).post(`/deposits/${depositId}/void`);
    expect(voidRes.status).toBe(200);
    expect(voidRes.body.voided).toBe(true);
    expect(voidRes.body.voidedAt).toBeDefined();
  });

  it('voiding twice is idempotent — same result, no error', async () => {
    const alice = await createTestMember('Alice');

    const createRes = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 5000,
      date: '2026-10-01',
    });
    const depositId = createRes.body.id;

    const void1 = await request(app).post(`/deposits/${depositId}/void`);
    const void2 = await request(app).post(`/deposits/${depositId}/void`);

    expect(void1.status).toBe(200);
    expect(void2.status).toBe(200);
    expect(void1.body.voided).toBe(true);
    expect(void2.body.voided).toBe(true);
    // voidedAt should be the same (not updated on second void)
    expect(void1.body.voidedAt).toBe(void2.body.voidedAt);
  });

  it('returns 404 for a non-existent deposit', async () => {
    const res = await request(app).post(
      '/deposits/00000000-0000-0000-0000-000000000000/void',
    );
    expect(res.status).toBe(404);
  });
});

describe('Balance: deposit increases balance, void reverts it', () => {
  it('creates member → balance=0 → deposit → balance increases → void → balance back to 0', async () => {
    const alice = await createTestMember('Alice');

    async function getBalance(memberId: string): Promise<number> {
      const rows = await prisma.$queryRaw<Array<{ balanceCents: bigint }>>`
        SELECT
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
        WHERE m.id = ${memberId}
      `;
      return Number(rows[0].balanceCents);
    }

    // Initial balance = 0
    expect(await getBalance(alice.id)).toBe(0);

    // Create a deposit of 10000 cents
    const createRes = await request(app).post('/deposits').send({
      memberId: alice.id,
      amountCents: 10000,
      date: '2026-10-01',
    });
    expect(createRes.status).toBe(201);
    const depositId = createRes.body.id;

    // Balance should now be 10000
    expect(await getBalance(alice.id)).toBe(10000);

    // Void the deposit
    const voidRes = await request(app).post(`/deposits/${depositId}/void`);
    expect(voidRes.status).toBe(200);

    // Balance should revert to 0
    expect(await getBalance(alice.id)).toBe(0);
  });
});
