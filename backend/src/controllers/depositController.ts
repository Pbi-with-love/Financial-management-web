import { Request, Response, NextFunction } from 'express';
import { depositService } from '../services/depositService.js';
import { createDepositSchema } from '../validation/deposit.js';
import { AppError } from '../errors/AppError.js';

export const depositController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const deposits = await depositService.getAllDeposits();
      res.json(deposits);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createDepositSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, parsed.error.issues.map((e: { message: string }) => e.message).join(', '));
      }
      const deposit = await depositService.createDeposit(parsed.data);
      res.status(201).json(deposit);
    } catch (err) {
      next(err);
    }
  },

  async void(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deposit = await depositService.voidDeposit(id);
      res.json(deposit);
    } catch (err) {
      next(err);
    }
  },
};
