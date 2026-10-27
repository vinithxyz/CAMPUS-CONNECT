import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatSchema } from '../validators/chatSchemas.js';
import * as c from '../controllers/chatController.js';

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id ?? req.ip),
  message: { error: { message: 'You are sending messages too quickly. Please wait a moment.' } },
});

const r = Router();

r.post('/', requireAuth, chatLimiter, validate(chatSchema), c.postMessage);
r.get('/:conversationId', requireAuth, c.getConversation);
r.delete('/:conversationId', requireAuth, c.deleteConversation);

export default r;
