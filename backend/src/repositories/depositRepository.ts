import { prisma } from '../app.js';

export interface CreateDepositData {
  memberId: string;
  amountCents: number;
  date: string; // ISO date string YYYY-MM-DD
  note?: string;
}

const depositInclude = {
  member: true,
} as const;

export const depositRepository = {
  async findAll() {
    return prisma.deposit.findMany({
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
