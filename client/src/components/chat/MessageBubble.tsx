import React from 'react';
import { Bot, User, ArrowRight } from 'lucide-react';
import type { ChatMessage, ChatAction } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
}

export default function MessageBubble({ message, onAction }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Icon */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-white shadow-sm'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble Content */}
      <div
        className={`max-w-[82%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-sm transition-all ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
        }`}
      >
        {/* Render text as plain text - React escapes HTML automatically to prevent XSS */}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* Action Button: Review and Submit if prefill action present */}
        {message.action?.type === 'prefill_report' && onAction && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              Ready to submit: {message.action.draft.title || 'Complaint Draft'}
            </span>
            <button
              type="button"
              onClick={() => onAction(message.action!)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm transition active:scale-[0.98]"
            >
              <span>Review and Submit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
