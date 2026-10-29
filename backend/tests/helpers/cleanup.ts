import { prisma } from '../../src/app.js';

async function doClean() {
  await prisma.itemShare.deleteMany();
  await prisma.item.deleteMany();
  await prisma.expense.updateMany({
    data: { replacesExpenseId: null, replacedByExpenseId: null },
  });
  await prisma.expense.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.member.deleteMany();
}

export async function cleanDatabase() {
  // Delete in FK-safe order. Retry on FK violations caused by stale in-flight
  // Prisma operations from previous HTTP requests that commit asynchronously
  // via the Neon/PgBouncer connection pool.
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await doClean();
      return;
    } catch {
      // Back off and retry — a concurrent operation is still in flight
      await new Promise((r) => setTimeout(r, 100 * attempt));
    }
  }
  // Final attempt without catch — let it throw if still failing
  await doClean();
}
