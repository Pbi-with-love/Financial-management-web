import { prisma } from '../app.js';

export interface CreateExpenseData {
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  note?: string;
  totalCents: number;
  items: Array<{
    description: string;
    amountCents: number;
    category?: string;
    shares: Map<string, number>; // memberId -> amountCents
  }>;
}

const expenseInclude = {
  items: {
    include: {
      itemShares: true,
    },
  },
} as const;

export const expenseRepository = {
  async findAll(limit?: number) {
    return prisma.expense.findMany({
      include: expenseInclude,
      orderBy: { date: 'desc' },
      ...(limit !== undefined ? { take: limit } : {}),
    });
  },

  async findById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: expenseInclude,
    });
  },

  async createWithItemsAndShares(data: CreateExpenseData) {
    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          title: data.title,
          date: new Date(data.date),
          note: data.note,
          totalCents: data.totalCents,
        },
      });

      for (const item of data.items) {
        const createdItem = await tx.item.create({
          data: {
            expenseId: expense.id,
            description: item.description,
            amountCents: item.amountCents,
            category: item.category,
          },
        });

        for (const [memberId, amountCents] of item.shares) {
          await tx.itemShare.create({
            data: {
              itemId: createdItem.id,
              memberId,
              amountCents,
            },
          });
        }
      }

      // Return the fully-formed expense with nested data
      return tx.expense.findUniqueOrThrow({
        where: { id: expense.id },
        include: expenseInclude,
      });
    });
  },

  async void(id: string) {
    return prisma.expense.update({
      where: { id },
      data: { voided: true, voidedAt: new Date() },
      include: expenseInclude,
    });
  },
};
