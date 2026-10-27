import { useCallback, useState } from 'react';
import { chatService } from '../services/chatService';
import { getErrorMessage } from '../services/api';
import type { ChatMessage } from '../types/chat';

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm the CampusConnect assistant. I can answer questions about campus policies, check your complaint status, look for duplicate reports, or help you draft a new report.",
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [conversationId, setConversationId] = useState<string>();
  const [sending, setSending] = useState(false);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: trimmed }]);
      setSending(true);

      try {
        const res = await chatService.send(trimmed, conversationId);
        setConversationId(res.conversationId);
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: res.reply,
            action: res.action,
          },
        ]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: getErrorMessage(e),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [conversationId, sending]
  );

  const reset = useCallback(() => {
    if (conversationId) {
      chatService.clear(conversationId).catch(() => {});
    }
    setConversationId(undefined);
    setMessages([WELCOME]);
  }, [conversationId]);

  return { messages, sending, send, reset, conversationId };
}
