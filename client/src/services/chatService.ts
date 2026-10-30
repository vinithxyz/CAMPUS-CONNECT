import { api, getErrorMessage } from './api';
import type { ActionCardData, Attachment, ChatLanguage } from '../types/chat';

const API = import.meta.env.VITE_API_URL ?? '/api';

export interface StreamHandlers {
  onDelta: (t: string) => void;
  onTool: (label: string) => void;
  onCard: (c: ActionCardData) => void;
  onReplies: (o: string[]) => void;
  onDone: (conversationId: string) => void;
}

export async function streamChat(
  body: {
    message: string;
    conversationId?: string;
    attachmentIds?: string[];
    language: ChatLanguage;
  },
  h: StreamHandlers,
  signal: AbortSignal
) {
  const res = await fetch(`${API}/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error?.message ?? 'The assistant is unavailable right now.');
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';

  const dispatch = (raw: string) => {
    let event = 'message';
    let data = '';
    for (const line of raw.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7);
      else if (line.startsWith('data: ')) data += line.slice(6);
    }
    if (!data) return;
    try {
      const d = JSON.parse(data);
      if (event === 'delta') h.onDelta(d.text);
      else if (event === 'tool') h.onTool(d.label);
      else if (event === 'card') h.onCard(d);
      else if (event === 'replies') h.onReplies(d.options);
      else if (event === 'done') h.onDone(d.conversationId);
      else if (event === 'error') throw new Error(d.message);
    } catch (parseErr) {
      if (event === 'error') throw parseErr;
      console.warn('Failed to parse SSE data chunk:', data, parseErr);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      dispatch(buf.slice(0, i));
      buf = buf.slice(i + 2);
    }
  }
}

export const chatService = {
  upload: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    return api.post<{ data: Attachment[] }>('/chat/uploads', fd).then((r) => r.data.data);
  },
  confirm: (id: string, overrides?: Record<string, unknown>) =>
    api
      .post<{ data: { message: string; reportId?: string; link?: string } }>(
        `/chat/actions/${id}/confirm`,
        { overrides }
      )
      .then((r) => r.data.data),
  cancel: (id: string) => api.post(`/chat/actions/${id}/cancel`),
  current: () =>
    api
      .get<{ data: { conversationId: string; messages: any[] } | null }>('/chat/current')
      .then((r) => r.data.data),
  clear: (id: string) => api.delete(`/chat/${id}`),
  errorMessage: getErrorMessage,
};
