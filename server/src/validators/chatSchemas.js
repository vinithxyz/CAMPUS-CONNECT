import { z } from 'zod';

export const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(1000, 'Message cannot exceed 1000 characters'),
  conversationId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid conversation ID').optional(),
});
