import { Request, Response, NextFunction } from 'express';
import { depositService } from '../services/depositService.js';
import { DepositFilters } from '../repositories/depositRepository.js';
import { createDepositSchema } from '../validation/deposit.js';
import { AppError } from '../errors/AppError.js';

/** Safely extract a scalar string from req.query (handles string | string[] | undefined) */
function queryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/** Validate ISO date string. Returns the string or throws AppError. */
function validateISODate(value: string, paramName: string): string {
  if (isNaN(Date.parse(value))) {
    throw new AppError(400, `${paramName} must be a valid ISO date (e.g. 2026-10-01)`);
  }
  return value;
}

export const depositController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: DepositFilters = {};

      // from / to (ISO date strings)
      const fromRaw = queryString(req.query.from);
      if (fromRaw !== undefined) {
        filters.from = validateISODate(fromRaw, 'from');
      }

      const toRaw = queryString(req.query.to);
      if (toRaw !== undefined) {
        filters.to = validateISODate(toRaw, 'to');
      }

      // memberId
      const memberIdRaw = queryString(req.query.memberId);
      if (memberIdRaw !== undefined) {
        filters.memberId = memberIdRaw;
      }

      const deposits = await depositService.getAllDeposits(filters);
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
