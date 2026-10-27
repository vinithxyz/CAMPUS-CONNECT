import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Bot } from 'lucide-react';
import type { ChatMessage, ChatAction } from '../../types/chat';

interface MessageListProps {
  messages: ChatMessage[];
  sending: boolean;
  onAction?: (action: ChatAction) => void;
}

export default function MessageList({ messages, sending, onAction }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  return (
    <div
      aria-live="polite"
      className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40"
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} onAction={onAction} />
      ))}

      {/* Typing indicator */}
      {sending && (
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
