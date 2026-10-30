import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadImages } from '../middleware/upload.js';
import { chatSchema, confirmSchema } from '../validators/chatSchemas.js';
import {
  streamChat,
  confirmAction,
  cancelAction,
  currentConversation,
  deleteConversation,
} from '../controllers/chatController.js';
import { uploadAttachments } from '../services/chat/attachments.js';

const r = Router();

const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id ?? req.ip),
  message: { error: { message: 'You are sending messages too quickly. Please wait a moment.' } },
});

const actionLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id ?? req.ip),
});

r.use(requireAuth);

r.post('/stream', chatLimiter, validate(chatSchema), streamChat);
r.post(
  '/uploads',
  rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user?._id ?? req.ip),
  }),
  requireRole('student'),
  uploadImages,
  uploadAttachments
);
r.post('/actions/:id/confirm', actionLimiter, validate(confirmSchema), confirmAction);
r.post('/actions/:id/cancel', actionLimiter, cancelAction);
r.get('/current', currentConversation);
r.delete('/:conversationId', deleteConversation);

export default r;
