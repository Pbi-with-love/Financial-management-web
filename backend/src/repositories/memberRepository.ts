import { prisma } from '../app.js';

export interface MemberWithBalance {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  balanceCents: bigint | number;
}

export const memberRepository = {
  async findAll() {
    return prisma.member.findMany({ orderBy: { createdAt: 'asc' } });
  },

  async findAllWithBalances(): Promise<MemberWithBalance[]> {
    const rows = await prisma.$queryRaw<MemberWithBalance[]>`
      SELECT m.id, m.name, m.active, m.created_at as "createdAt",
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
      ORDER BY m.created_at ASC
    `;
    return rows;
  },

  async findById(id: string) {
    return prisma.member.findUnique({ where: { id } });
  },

  async findByIdWithDetails(id: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        deposits: { orderBy: { date: 'desc' } },
        itemShares: {
          include: {
            item: {
              include: {
                expense: { select: { id: true, title: true, date: true } },
              },
            },
          },
        },
      },
    });
    if (!member) return null;

    // Compute balance
    const balanceRows = await prisma.$queryRaw<{ balanceCents: bigint }[]>`
      SELECT COALESCE(dep.total, 0) - COALESCE(sh.total, 0) AS "balanceCents"
      FROM members m
      LEFT JOIN (
        SELECT member_id, SUM(amount_cents) AS total
        FROM deposits WHERE voided = false AND member_id = ${id} GROUP BY member_id
      ) dep ON m.id = dep.member_id
      LEFT JOIN (
        SELECT s.member_id, SUM(s.amount_cents) AS total
        FROM item_shares s
        JOIN items i ON s.item_id = i.id
        JOIN expenses e ON i.expense_id = e.id
        WHERE e.voided = false AND s.member_id = ${id}
        GROUP BY s.member_id
      ) sh ON m.id = sh.member_id
      WHERE m.id = ${id}
    `;

    return {
      ...member,
      balanceCents: Number(balanceRows[0]?.balanceCents ?? 0),
    };
  },

  async create(data: { name: string }) {
    return prisma.member.create({ data });
  },

  async update(id: string, data: { active?: boolean }) {
    return prisma.member.update({ where: { id }, data });
  },
};
