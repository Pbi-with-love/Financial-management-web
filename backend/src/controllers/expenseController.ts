import { Request, Response, NextFunction } from 'express';
import { expenseService } from '../services/expenseService.js';
import { ExpenseFilters } from '../repositories/expenseRepository.js';
import { createExpenseSchema, reviseExpenseSchema } from '../validation/expense.js';
import { AppError } from '../errors/AppError.js';

/** Safely extract a scalar string from req.query (handles string | string[] | undefined) */
function queryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/** Validate ISO date string (YYYY-MM-DD or full ISO-8601). Returns the string or throws AppError. */
function validateISODate(value: string, paramName: string): string {
  if (isNaN(Date.parse(value))) {
    throw new AppError(400, `${paramName} must be a valid ISO date (e.g. 2026-10-01)`);
  }
  return value;
}

export const expenseController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: ExpenseFilters = {};

      // limit
      const limitRaw = queryString(req.query.limit);
      if (limitRaw !== undefined) {
        const parsed = parseInt(limitRaw, 10);
        if (isNaN(parsed) || parsed < 1) {
          throw new AppError(400, 'limit must be a positive integer');
        }
        filters.limit = parsed;
      }

      // from / to (ISO date strings)
      const fromRaw = queryString(req.query.from);
      if (fromRaw !== undefined) {
        filters.from = validateISODate(fromRaw, 'from');
      }

      const toRaw = queryString(req.query.to);
      if (toRaw !== undefined) {
        filters.to = validateISODate(toRaw, 'to');
      }

      // category
      const categoryRaw = queryString(req.query.category);
      if (categoryRaw !== undefined) {
        filters.category = categoryRaw;
      }

      // memberId
      const memberIdRaw = queryString(req.query.memberId);
      if (memberIdRaw !== undefined) {
        filters.memberId = memberIdRaw;
      }

      // includeVoided — parse "true"/"false" string
      const includeVoidedRaw = queryString(req.query.includeVoided);
      if (includeVoidedRaw !== undefined) {
        if (includeVoidedRaw === 'true') {
          filters.includeVoided = true;
        } else if (includeVoidedRaw === 'false') {
          filters.includeVoided = false;
        } else {
          throw new AppError(400, 'includeVoided must be "true" or "false"');
        }
      }

      const expenses = await expenseService.getAllExpenses(filters);
      res.json(expenses);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, parsed.error.issues.map((e: { message: string }) => e.message).join(', '));
      }
      const expense = await expenseService.createExpense(parsed.data);
      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const expense = await expenseService.getExpenseById(id);
      // Map Prisma relation name to API field name
      const { replacesExpense, ...rest } = expense as typeof expense & { replacesExpense?: unknown };
      res.json({ ...rest, replacedExpense: replacesExpense ?? null });
    } catch (err) {
      next(err);
    }
  },

  async void(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const expense = await expenseService.voidExpense(id);
      res.json(expense);
    } catch (err) {
      next(err);
    }
  },

  async revise(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const parsed = reviseExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, parsed.error.issues.map((e: { message: string }) => e.message).join(', '));
      }
      const expense = await expenseService.reviseExpense(id, parsed.data);
      res.json(expense);
    } catch (err) {
      next(err);
    }
  },
};
