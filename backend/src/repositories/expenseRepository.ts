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

export interface ExpenseFilters {
  limit?: number;
  from?: string;      // ISO date
  to?: string;        // ISO date
  category?: string;  // item category
  memberId?: string;  // member with a share
  includeVoided?: boolean; // default false
}

const expenseInclude = {
  items: {
    include: {
      itemShares: true,
    },
  },
} as const;

export const expenseRepository = {
  async findAll(filters: ExpenseFilters = {}) {
    const { limit, from, to, category, memberId, includeVoided = false } = filters;

    // Build the where clause dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (!includeVoided) {
      where.voided = false;
      where.replacedByExpenseId = null;
    }

    if (from !== undefined) {
      where.date = { ...where.date, gte: new Date(from) };
    }

    if (to !== undefined) {
      where.date = { ...where.date, lte: new Date(to) };
    }

    if (category !== undefined) {
      where.items = {
        ...where.items,
        some: { ...(where.items?.some ?? {}), category: category },
      };
    }

    if (memberId !== undefined) {
      // Merge with any existing items.some clause using AND if category is also set
      if (where.items?.some) {
        // Both category and memberId: use AND on items.some conditions
        where.items = {
          some: {
            AND: [
              { category: category },
              { itemShares: { some: { memberId: memberId } } },
            ],
          },
        };
      } else {
        where.items = { some: { itemShares: { some: { memberId: memberId } } } };
      }
    }

    return prisma.expense.findMany({
      where,
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
