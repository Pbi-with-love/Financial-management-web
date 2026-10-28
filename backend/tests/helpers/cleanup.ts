import { prisma } from '../../src/app.js';

export async function cleanDatabase() {
  await prisma.itemShare.deleteMany();
  await prisma.item.deleteMany();
  await prisma.expense.updateMany({
    data: { replacesExpenseId: null, replacedByExpenseId: null },
  });
  await prisma.expense.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.member.deleteMany();
}
