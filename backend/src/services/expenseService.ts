import { prisma } from '../app.js';
import { AppError } from '../errors/AppError.js';
import { splitEvenly } from '../domain/split.js';
import { expenseRepository, ExpenseFilters } from '../repositories/expenseRepository.js';
import { CreateExpenseInput } from '../validation/expense.js';

export const expenseService = {
  async getAllExpenses(filters: ExpenseFilters = {}) {
    return expenseRepository.findAll(filters);
  },

  async createExpense(payload: CreateExpenseInput) {
    // Validate all participantIds across all items
    for (const item of payload.items) {
      // Check for duplicates within this item
      const seen = new Set<string>();
      for (const pid of item.participantIds) {
        if (seen.has(pid)) {
          throw new AppError(400, `Duplicate participantId "${pid}" in item "${item.description}"`);
        }
        seen.add(pid);
      }
    }

    // Gather all unique participant IDs to validate in one query
    const allParticipantIds = [
      ...new Set(payload.items.flatMap((item) => item.participantIds)),
    ];

    const members = await prisma.member.findMany({
      where: { id: { in: allParticipantIds } },
      select: { id: true, active: true },
    });

    const memberMap = new Map(members.map((m) => [m.id, m]));

    // Validate each participant ID
    for (const item of payload.items) {
      for (const pid of item.participantIds) {
        const member = memberMap.get(pid);
        if (!member) {
          throw new AppError(400, `Member "${pid}" does not exist`);
        }
        if (!member.active) {
          throw new AppError(400, `Member "${pid}" is inactive and cannot participate in expenses`);
        }
      }
    }

    // Compute totalCents from items (never trust client)
    const totalCents = payload.items.reduce((sum, item) => sum + item.amountCents, 0);

    // Compute shares for each item
    const itemsWithShares = payload.items.map((item) => ({
      description: item.description,
      amountCents: item.amountCents,
      category: item.category,
      shares: splitEvenly(item.amountCents, item.participantIds),
    }));

    return expenseRepository.createWithItemsAndShares({
      title: payload.title,
      date: payload.date,
      note: payload.note,
      totalCents,
      items: itemsWithShares,
    });
  },

  async voidExpense(id: string) {
    const expense = await expenseRepository.findById(id);
    if (!expense) {
      throw new AppError(404, 'Expense not found');
    }
    // Idempotent: if already voided, just return it
    if (expense.voided) {
      return expense;
    }
    return expenseRepository.void(id);
  },
};
