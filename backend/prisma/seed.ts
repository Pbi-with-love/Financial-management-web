import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { splitEvenly } from '../src/domain/split';

const prisma = new PrismaClient();

async function main() {
  // 1. Clear existing data in FK order
  await prisma.itemShare.deleteMany();
  await prisma.item.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.member.deleteMany();

  // 2. Create 3 members
  const alice = await prisma.member.create({ data: { name: 'Alice' } });
  const bob = await prisma.member.create({ data: { name: 'Bob' } });
  const charlie = await prisma.member.create({ data: { name: 'Charlie' } });

  console.log('Created members:', alice.name, bob.name, charlie.name);

  // 3. Create deposits
  await prisma.deposit.create({
    data: {
      memberId: alice.id,
      amountCents: 10000,
      date: new Date('2026-10-01'),
      note: 'Initial deposit',
    },
  });
  await prisma.deposit.create({
    data: {
      memberId: bob.id,
      amountCents: 5000,
      date: new Date('2026-10-01'),
      note: 'Initial deposit',
    },
  });
  await prisma.deposit.create({
    data: {
      memberId: charlie.id,
      amountCents: 7500,
      date: new Date('2026-10-01'),
      note: 'Initial deposit',
    },
  });

  console.log('Created deposits: Alice €100, Bob €50, Charlie €75');

  // 4. Expense 1: "Grocery run" — shared by all 3
  await prisma.$transaction(async (tx) => {
    // Item: "Pasta and sauce" — €15.00, participants: Alice, Bob, Charlie → split 500 each
    const pastaShares = splitEvenly(1500, [alice.id, bob.id, charlie.id]);

    // Item: "Bread" — €4.00, participants: Alice, Bob, Charlie → split 134, 133, 133
    const breadShares = splitEvenly(400, [alice.id, bob.id, charlie.id]);

    const expense1Total = 1500 + 400; // 1900

    const expense1 = await tx.expense.create({
      data: {
        title: 'Grocery run',
        date: new Date('2026-10-10'),
        totalCents: expense1Total,
      },
    });

    const pasta = await tx.item.create({
      data: {
        expenseId: expense1.id,
        description: 'Pasta and sauce',
        amountCents: 1500,
        category: 'Food',
      },
    });

    await tx.itemShare.createMany({
      data: [...pastaShares.entries()].map(([memberId, amountCents]) => ({
        itemId: pasta.id,
        memberId,
        amountCents,
      })),
    });

    const bread = await tx.item.create({
      data: {
        expenseId: expense1.id,
        description: 'Bread',
        amountCents: 400,
        category: 'Food',
      },
    });

    await tx.itemShare.createMany({
      data: [...breadShares.entries()].map(([memberId, amountCents]) => ({
        itemId: bread.id,
        memberId,
        amountCents,
      })),
    });
  });

  console.log('Created expense 1: Grocery run');

  // 5. Expense 2: "Friday dinner" — mixed participants
  await prisma.$transaction(async (tx) => {
    // Item: "Pizza" — €24.00, participants: Alice, Bob, Charlie → split 800 each
    const pizzaShares = splitEvenly(2400, [alice.id, bob.id, charlie.id]);

    // Item: "Wine" — €18.00, participants: Alice, Bob → split 900 each
    const wineShares = splitEvenly(1800, [alice.id, bob.id]);

    // Item: "Dessert" — €9.00, participants: Bob, Charlie → split 450 each
    const dessertShares = splitEvenly(900, [bob.id, charlie.id]);

    const expense2Total = 2400 + 1800 + 900; // 5100

    const expense2 = await tx.expense.create({
      data: {
        title: 'Friday dinner',
        date: new Date('2026-10-18'),
        totalCents: expense2Total,
      },
    });

    const pizza = await tx.item.create({
      data: {
        expenseId: expense2.id,
        description: 'Pizza',
        amountCents: 2400,
        category: 'Food',
      },
    });

    await tx.itemShare.createMany({
      data: [...pizzaShares.entries()].map(([memberId, amountCents]) => ({
        itemId: pizza.id,
        memberId,
        amountCents,
      })),
    });

    const wine = await tx.item.create({
      data: {
        expenseId: expense2.id,
        description: 'Wine',
        amountCents: 1800,
        category: 'Drinks',
      },
    });

    await tx.itemShare.createMany({
      data: [...wineShares.entries()].map(([memberId, amountCents]) => ({
        itemId: wine.id,
        memberId,
        amountCents,
      })),
    });

    const dessert = await tx.item.create({
      data: {
        expenseId: expense2.id,
        description: 'Dessert',
        amountCents: 900,
        category: 'Food',
      },
    });

    await tx.itemShare.createMany({
      data: [...dessertShares.entries()].map(([memberId, amountCents]) => ({
        itemId: dessert.id,
        memberId,
        amountCents,
      })),
    });
  });

  console.log('Created expense 2: Friday dinner');

  // 6. Log expected balances
  // Alice:   deposits 10000 - shares (500 + 134 + 800 + 900) = 10000 - 2334 = 7666
  // Bob:     deposits 5000  - shares (500 + 133 + 800 + 900 + 450) = 5000 - 2783 = 2217
  // Charlie: deposits 7500  - shares (500 + 133 + 800 + 450) = 7500 - 1883 = 5617
  console.log('\nExpected balances after seeding:');
  console.log('  Alice:   10000 - (500 + 134 + 800 + 900) = 10000 - 2334 = 7666 cents (€76.66)');
  console.log('  Bob:     5000  - (500 + 133 + 800 + 900 + 450) = 5000 - 2783 = 2217 cents (€22.17)');
  console.log('  Charlie: 7500  - (500 + 133 + 800 + 450) = 7500 - 1883 = 5617 cents (€56.17)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
