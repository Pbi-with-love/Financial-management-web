import { z } from 'zod';

export const createMemberSchema = z.object({
  name: z.string().min(1),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
}).refine(data => data.name !== undefined || data.active !== undefined, {
  message: 'At least one of name or active must be provided',
});
