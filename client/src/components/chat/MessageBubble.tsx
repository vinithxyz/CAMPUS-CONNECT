import React from 'react';
import { Bot, User } from 'lucide-react';
import ActionCard from './ActionCard';
import QuickReplies from './QuickReplies';
import type { ChatMessage, ActionCardData } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  updateCard: (actionId: string, patch: Partial<ActionCardData>) => void;
  onSelectReply?: (option: string) => void;
  isLast?: boolean;
}

export default function MessageBubble({
  message,
  updateCard,
  onSelectReply,
  isLast,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Icon */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-xs ${
          isUser ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble Container */}
      <div className="flex-1 max-w-[85%] sm:max-w-[82%]">
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs transition-all ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-xs'
              : message.error
              ? 'bg-red-50 text-red-900 border border-red-200 rounded-tl-xs'
              : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
          }`}
        >
          {/* User Attachments */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {message.attachments.map((att) => (
                <img
                  key={att.id}
                  src={att.url}
                  alt="Attached photo"
                  className="w-14 h-14 object-cover rounded border border-white/20"
                />
              ))}
            </div>
          )}

          {/* Text Content (Plain Text Only, Never dangerouslySetInnerHTML) */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {message.streaming && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-current animate-pulse align-middle" />
            )}
          </div>
        </div>

        {/* Cards rendered under assistant text */}
        {!isUser && message.cards && message.cards.length > 0 && (
          <div className="space-y-2 mt-1">
            {message.cards.map((card) => (
              <ActionCard key={card.actionId} card={card} updateCard={updateCard} />
            ))}
          </div>
        )}

        {/* Quick Replies under the last assistant message */}
        {!isUser && isLast && message.replies && onSelectReply && (
          <QuickReplies options={message.replies} onSelect={onSelectReply} />
        )}
      </div>
    </div>
  );
}
