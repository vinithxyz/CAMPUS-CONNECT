import { z } from 'zod';
import { LANGUAGES } from '../languages.js';

const oid = z.string().regex(/^[a-f\d]{24}$/i);

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  conversationId: oid.optional(),
  attachmentIds: z.array(oid).max(5).optional(),
  language: z.enum(['auto', ...Object.keys(LANGUAGES)]).default('auto'),
});

export const confirmSchema = z.object({
  overrides: z.record(z.any()).optional(),
});
