import { z } from 'zod';
import { emailSchema, passwordSchema } from '@shared/validators';

export const RegisterSchema = z.object({
  email: emailSchema,
});

export const LoginSchema = z.object({
  email: emailSchema,
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const OtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const VerifyRegisterOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const GoogleAuthSchema = z.object({
  idToken : z.string().nonempty(),
})

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
export type GoogleDTO = z.infer<typeof GoogleAuthSchema>;
export type OtpDto = z.infer<typeof OtpSchema>;
export type VerifyRegisterOtpDto = z.infer<typeof VerifyRegisterOtpSchema>;