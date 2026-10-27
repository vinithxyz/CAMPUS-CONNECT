import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or roll number'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional(),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  rollNumber: z
    .string()
    .trim()
    .min(3, 'Enter your roll number')
    .regex(/^[A-Za-z0-9/_-]+$/, 'Letters, numbers, / _ - only'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/\d/, 'Include a number'),
});
export type RegisterForm = z.infer<typeof registerSchema>;
