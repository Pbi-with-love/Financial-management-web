import { z } from 'zod';

export const createExpenseSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        amountCents: z.number().int().positive(),
        category: z.string().optional(),
        participantIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .min(1),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const reviseExpenseSchema = z.object({
  items: z.array(z.object({
    description: z.string().min(1),
    amountCents: z.number().int().positive(),
    category: z.string().optional(),
    participantIds: z.array(z.string().uuid()).min(1),
  })).min(1),
});

export type ReviseExpenseInput = z.infer<typeof reviseExpenseSchema>;
