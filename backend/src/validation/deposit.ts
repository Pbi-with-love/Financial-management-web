import { z } from 'zod';

export const createDepositSchema = z.object({
  memberId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  note: z.string().optional(),
});

export type CreateDepositInput = z.infer<typeof createDepositSchema>;
