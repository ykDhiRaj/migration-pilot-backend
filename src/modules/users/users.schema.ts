import { z } from 'zod';
import { emailSchema, passwordSchema } from '@shared/validators';

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: emailSchema.optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
