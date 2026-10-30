import React, { useEffect, useRef } from 'react';
import { Square, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import type { ChatMessage, ActionCardData } from '../../types/chat';

interface MessageListProps {
  messages: ChatMessage[];
  busy: boolean;
  toolLabel?: string;
  updateCard: (actionId: string, patch: Partial<ActionCardData>) => void;
  onSelectReply: (reply: string) => void;
  onStop: () => void;
}

export default function MessageList({
  messages,
  busy,
  toolLabel,
  updateCard,
  onSelectReply,
  onStop,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy, toolLabel]);

  return (
    <div
      aria-live="polite"
      className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 relative"
    >
      {messages.map((m, idx) => (
        <MessageBubble
          key={m.id}
          message={m}
          updateCard={updateCard}
          onSelectReply={onSelectReply}
          isLast={idx === messages.length - 1}
        />
      ))}

      {/* Tool running indicator */}
      {toolLabel && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/90 border border-slate-200/80 rounded-full px-3 py-1.5 w-fit shadow-xs animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
          <span>{toolLabel}</span>
        </div>
      )}

      {/* Stop Streaming Button floating when busy */}
      {busy && (
        <div className="sticky bottom-2 flex justify-center z-10">
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-medium rounded-full shadow-md backdrop-blur-xs transition active:scale-95"
          >
            <Square className="w-3 h-3 fill-current text-red-400" />
            <span>Stop generating</span>
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
