import { prisma } from '../app.js';

export interface CreateDepositData {
  memberId: string;
  amountCents: number;
  date: string; // ISO date string YYYY-MM-DD
  note?: string;
}

export interface DepositFilters {
  from?: string;     // ISO date
  to?: string;       // ISO date
  memberId?: string; // filter by member
}

const depositInclude = {
  member: true,
} as const;

export const depositRepository = {
  async findAll(filters: DepositFilters = {}) {
    const { from, to, memberId } = filters;

    // Build the where clause dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (from !== undefined) {
      where.date = { ...where.date, gte: new Date(from) };
    }

    if (to !== undefined) {
      where.date = { ...where.date, lte: new Date(to) };
    }

    if (memberId !== undefined) {
      where.memberId = memberId;
    }

    return prisma.deposit.findMany({
      where,
      include: depositInclude,
      orderBy: { date: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.deposit.findUnique({
      where: { id },
      include: depositInclude,
    });
  },

  async create(data: CreateDepositData) {
    return prisma.deposit.create({
      data: {
        memberId: data.memberId,
        amountCents: data.amountCents,
        date: new Date(data.date),
        note: data.note,
      },
      include: depositInclude,
    });
  },

  async update(id: string, data: { amountCents?: number; date?: string; note?: string }) {
    const updateData: Record<string, unknown> = {};
    if (data.amountCents !== undefined) updateData.amountCents = data.amountCents;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.note !== undefined) updateData.note = data.note;
    return prisma.deposit.update({
      where: { id },
      data: updateData,
      include: depositInclude,
    });
  },

  async delete(id: string) {
    return prisma.deposit.delete({ where: { id } });
  },
};
