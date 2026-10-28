import { Request, Response, NextFunction } from 'express';
import { expenseService } from '../services/expenseService.js';
import { createExpenseSchema } from '../validation/expense.js';
import { AppError } from '../errors/AppError.js';

export const expenseController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limitRaw = req.query.limit;
      let limit: number | undefined;
      if (limitRaw !== undefined) {
        const parsed = parseInt(String(limitRaw), 10);
        if (isNaN(parsed) || parsed < 1) {
          throw new AppError(400, 'limit must be a positive integer');
        }
        limit = parsed;
      }
      const expenses = await expenseService.getAllExpenses(limit);
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

  async void(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const expense = await expenseService.voidExpense(id);
      res.json(expense);
    } catch (err) {
      next(err);
    }
  },
};
