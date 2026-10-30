import { useState, useCallback, useRef, useEffect } from 'react';
import { streamChat, chatService } from '../services/chatService';
import { useChatLanguage } from './useChatLanguage';
import type { ChatMessage, ActionCardData, Attachment } from '../types/chat';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [toolLabel, setToolLabel] = useState<string>();
  const abort = useRef<AbortController>();
  const { language } = useChatLanguage();

  const patchLast = (fn: (m: ChatMessage) => ChatMessage) =>
    setMessages((ms) => ms.map((m, i) => (i === ms.length - 1 ? fn(m) : m)));

  const send = useCallback(
    async (text: string, attachments: Attachment[] = []) => {
      const message = text.trim();
      if (!message || busy) return;
      setBusy(true);
      setToolLabel(undefined);
      const ac = (abort.current = new AbortController());
      setMessages((ms) => [
        ...ms.map((m) => ({ ...m, replies: undefined })), // old quick replies disappear
        { id: crypto.randomUUID(), role: 'user', content: message, cards: [], attachments },
        { id: crypto.randomUUID(), role: 'assistant', content: '', cards: [], streaming: true },
      ]);
      try {
        await streamChat(
          {
            message,
            conversationId,
            attachmentIds: attachments.map((a) => a.id),
            language,
          },
          {
            onDelta: (t) => patchLast((m) => ({ ...m, content: m.content + t })),
            onTool: setToolLabel,
            onCard: (c) => patchLast((m) => ({ ...m, cards: [...m.cards, c] })),
            onReplies: (o) => patchLast((m) => ({ ...m, replies: o })),
            onDone: setConversationId,
          },
          ac.signal
        );
      } catch (e: any) {
        if (!ac.signal.aborted) {
          patchLast((m) => ({ ...m, content: m.content || e.message, error: true }));
        }
      } finally {
        patchLast((m) => ({ ...m, streaming: false }));
        setBusy(false);
        setToolLabel(undefined);
      }
    },
    [busy, conversationId, language]
  );

  const stop = () => abort.current?.abort();

  const reset = () => {
    abort.current?.abort();
    if (conversationId) chatService.clear(conversationId).catch(() => {});
    setConversationId(undefined);
    setMessages([]);
  };

  const updateCard = (actionId: string, patch: Partial<ActionCardData>) =>
    setMessages((ms) =>
      ms.map((m) => ({
        ...m,
        cards: m.cards.map((c) => (c.actionId === actionId ? { ...c, ...patch } : c)),
      }))
    );

  // Restore on mount / widget open
  useEffect(() => {
    let cancelled = false;
    chatService
      .current()
      .then((data) => {
        if (!cancelled && data) {
          setConversationId(data.conversationId);
          setMessages(
            (data.messages || []).map((m: any) => ({
              id: m.id || crypto.randomUUID(),
              role: m.role,
              content: m.content,
              cards: m.cards || [],
              replies: undefined,
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return { messages, busy, toolLabel, send, stop, reset, updateCard };
}
