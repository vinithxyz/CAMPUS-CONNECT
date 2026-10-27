import { z } from 'zod';

const password = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/\d/, 'Include a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  rollNumber: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9/_-]+$/, 'Letters, numbers, / _ - only'),
  email: z.string().trim().toLowerCase().email(),
  password,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or roll number'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional(),
});

export const googleSchema = z.object({ credential: z.string().min(10) });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  rollNumber: z.string().trim().min(3).max(30).optional(),
});
