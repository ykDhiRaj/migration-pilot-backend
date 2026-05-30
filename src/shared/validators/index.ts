import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(200).default(20).optional(),
});
