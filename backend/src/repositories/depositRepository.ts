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

  async void(id: string) {
    return prisma.deposit.update({
      where: { id },
      data: { voided: true, voidedAt: new Date() },
      include: depositInclude,
    });
  },
};
