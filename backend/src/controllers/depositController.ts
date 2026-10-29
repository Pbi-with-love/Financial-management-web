import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { depositService } from '../services/depositService.js';
import { DepositFilters } from '../repositories/depositRepository.js';
import { createDepositSchema } from '../validation/deposit.js';
import { AppError } from '../errors/AppError.js';

function queryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function validateISODate(value: string, paramName: string): string {
  if (isNaN(Date.parse(value))) {
    throw new AppError(400, `${paramName} must be a valid ISO date (e.g. 2026-10-01)`);
  }
  return value;
}

const updateDepositSchema = z.object({
  amountCents: z.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().optional(),
}).refine(d => d.amountCents !== undefined || d.date !== undefined || d.note !== undefined, {
  message: 'At least one field must be provided',
});

export const depositController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: DepositFilters = {};
      const fromRaw = queryString(req.query.from);
      if (fromRaw !== undefined) filters.from = validateISODate(fromRaw, 'from');
      const toRaw = queryString(req.query.to);
      if (toRaw !== undefined) filters.to = validateISODate(toRaw, 'to');
      const memberIdRaw = queryString(req.query.memberId);
      if (memberIdRaw !== undefined) filters.memberId = memberIdRaw;
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

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const parsed = updateDepositSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, parsed.error.issues.map((e: { message: string }) => e.message).join(', '));
      }
      const deposit = await depositService.updateDeposit(id, parsed.data);
      res.json(deposit);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await depositService.deleteDeposit(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
