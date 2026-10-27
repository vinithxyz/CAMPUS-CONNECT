import { api } from './api';
import type { ChatAction } from '../types/chat';

export const chatService = {
  send: (message: string, conversationId?: string) =>
    api
      .post<{ data: { conversationId: string; reply: string; action?: ChatAction } }>('/chat', {
        message,
        conversationId,
      })
      .then((r) => r.data.data),
  clear: (conversationId: string) => api.delete(`/chat/${conversationId}`),
  get: (conversationId: string) =>
    api
      .get<{ data: { conversationId: string; messages: Array<{ role: 'user' | 'assistant'; content: string }> } }>(
        `/chat/${conversationId}`
      )
      .then((r) => r.data.data),
};
