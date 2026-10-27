import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, RotateCcw, ShieldAlert, Bot } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import MessageList from './MessageList';
import SuggestedPrompts from './SuggestedPrompts';
import ChatInput from './ChatInput';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { messages, sending, send, reset } = useChat();
  const navigate = useNavigate();

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        aria-label={open ? 'Close assistant' : 'Open campus assistant'}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-blue-500/30"
      >
        {open ? (
          <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
        ) : (
          <MessageCircle className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
        )}
      </button>

      {/* Floating Chat Panel */}
      {open && (
        <section
          role="dialog"
          aria-label="CampusConnect AI Assistant"
          className="fixed inset-x-2 bottom-20 lg:bottom-22 lg:inset-x-auto lg:right-6 z-40 flex h-[72vh] max-h-[640px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[390px] animate-scale-in overflow-hidden"
        >
          {/* Header */}
          <header className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                <Bot className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <h2 className="text-xs font-bold tracking-wide">CampusConnect AI</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-300">Campus Assistant</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                title="Start a new conversation"
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Emergency / Notice Banner */}
          <div className="bg-amber-50/90 border-b border-amber-100 px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-amber-800 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              For campus emergencies call <strong>+1 (555) 019-2834</strong>.
            </span>
          </div>

          {/* Messages Container */}
          <MessageList
            messages={messages}
            sending={sending}
            onAction={(action) => {
              if (action.type === 'prefill_report') {
                setOpen(false);
                navigate('/report', { state: { draft: action.draft } });
              }
            }}
          />

          {/* Suggested Prompts (visible if conversation is young) */}
          {messages.length <= 2 && (
            <SuggestedPrompts onPick={send} disabled={sending} />
          )}

          {/* Input Box */}
          <ChatInput onSend={send} disabled={sending} maxLength={1000} />

          {/* Privacy Note Footer */}
          <footer className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-center shrink-0">
            <p className="text-[9.5px] text-slate-400 leading-tight">
              Chats are retained for 30 days & processed by Anthropic AI.
            </p>
          </footer>
        </section>
      )}
    </>
  );
}
