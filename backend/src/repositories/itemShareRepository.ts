import { prisma } from '../app.js';

export const itemShareRepository = {
  async findById(id: string) {
    return prisma.itemShare.findUnique({
      where: { id },
      include: { item: { include: { expense: true } } },
    });
  },

  async update(id: string, amountCents: number) {
    return prisma.itemShare.update({
      where: { id },
      data: { amountCents },
      include: { item: { include: { expense: true } } },
    });
  },

  async delete(id: string) {
    return prisma.itemShare.delete({ where: { id } });
  },

  async recalcExpenseTotal(expenseId: string) {
    const items = await prisma.item.findMany({
      where: { expenseId },
      select: { amountCents: true },
    });
    const total = items.reduce((sum, i) => sum + i.amountCents, 0);
    await prisma.expense.update({
      where: { id: expenseId },
      data: { totalCents: total },
    });
  },
};
