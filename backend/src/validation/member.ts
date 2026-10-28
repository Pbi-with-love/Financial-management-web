import { z } from 'zod';

export const createMemberSchema = z.object({
  name: z.string().min(1),
});

export const updateMemberSchema = z.object({
  active: z.boolean(),
});
