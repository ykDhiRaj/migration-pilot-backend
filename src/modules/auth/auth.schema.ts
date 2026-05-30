import { z } from 'zod';
import { emailSchema, passwordSchema } from '@shared/validators';

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
