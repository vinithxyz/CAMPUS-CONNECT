import Chat from '../models/Chat.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { handleMessage } from '../services/chatService.js';

export const postMessage = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;
  res.json({ data: await handleMessage(req.user, message, conversationId) });
});

export const getConversation = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.conversationId, user: req.user._id }).lean();
  if (!chat) throw new ApiError(404, 'Conversation not found');
  res.json({ data: { conversationId: String(chat._id), messages: chat.messages } });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  await Chat.deleteOne({ _id: req.params.conversationId, user: req.user._id });
  res.status(204).end();
});
