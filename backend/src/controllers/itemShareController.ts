import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { itemShareService } from '../services/itemShareService.js';
import { AppError } from '../errors/AppError.js';

const updateShareSchema = z.object({
  amountCents: z.number().int().positive(),
});

export const itemShareController = {
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const parsed = updateShareSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, parsed.error.issues.map((e: { message: string }) => e.message).join(', '));
      }
      const share = await itemShareService.updateShare(id, parsed.data.amountCents);
      res.json(share);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await itemShareService.deleteShare(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
