import React from 'react';
import { MessageCircle, X, RotateCcw, Bot, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChatContext } from '../../context/ChatContext';
import { useChat } from '../../hooks/useChat';
import MessageList from './MessageList';
import SuggestedPrompts from './SuggestedPrompts';
import ChatInput from './ChatInput';
import LanguageSelect from './LanguageSelect';

const EMERGENCY_NOTE =
  import.meta.env.VITE_EMERGENCY_NOTE ??
  'For immediate emergencies (fire, electrical hazard, medical), call Campus Security at +1 (555) 019-2834.';

export default function ChatWidget() {
  const { user } = useAuth();
  const { isOpen, setIsOpen, seedText, clearSeed } = useChatContext();
  const { messages, busy, toolLabel, send, stop, reset, updateCard } = useChat();

  const handleSelectPrompt = (prompt: string) => {
    send(prompt);
  };

  const handleSelectReply = (reply: string) => {
    send(reply);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        aria-label={isOpen ? 'Close assistant' : 'Open campus assistant'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 group focus:outline-hidden focus:ring-4 focus:ring-blue-500/30"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
        ) : (
          <MessageCircle className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
        )}
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <section
          role="dialog"
          aria-label="CampusConnect AI Assistant"
          className="fixed inset-x-2 bottom-20 lg:bottom-22 lg:inset-x-auto lg:right-6 z-40 flex h-[76vh] max-h-[660px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[410px] animate-scale-in overflow-hidden"
        >
          {/* Header */}
          <header className="flex items-center justify-between bg-slate-900 px-3.5 py-3 text-white shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                <Bot className="w-4 h-4 text-blue-300" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold tracking-wide truncate">
                  {user?.role === 'admin'
                    ? 'Admin Operations Assistant'
                    : user?.role === 'staff'
                    ? 'Staff Field Assistant'
                    : 'CampusConnect Assistant'}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-300">Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <LanguageSelect />

              <button
                type="button"
                onClick={reset}
                title="New conversation"
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </header>

          {/* Welcome banner if no messages */}
          {messages.length === 0 && (
            <div className="p-4 bg-linear-to-b from-blue-50/60 to-transparent text-slate-700 text-xs shrink-0">
              <p className="font-semibold text-slate-800 mb-1">
                Hi {user?.name ? user.name.split(' ')[0] : 'there'}! 👋
              </p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {user?.role === 'admin'
                  ? 'I can summarize open complaints by building, identify recurring clusters, suggest assignees, and draft status notes.'
                  : user?.role === 'staff'
                  ? 'I can list your assigned tasks, review report histories, and draft updates for review.'
                  : 'I can help you report maintenance issues, check status of your complaints, and answer questions about campus timings and policies.'}
              </p>
            </div>
          )}

          {/* Messages Area */}
          <MessageList
            messages={messages}
            busy={busy}
            toolLabel={toolLabel}
            updateCard={updateCard}
            onSelectReply={handleSelectReply}
            onStop={stop}
          />

          {/* Suggested Prompts if conversation is fresh */}
          {messages.length === 0 && (
            <SuggestedPrompts
              role={user?.role}
              onPick={handleSelectPrompt}
              disabled={busy}
            />
          )}

          {/* Input Bar */}
          <ChatInput
            onSend={(text) => send(text)}
            disabled={busy}
            initialValue={seedText}
            onClearInitialValue={clearSeed}
          />

          {/* Footer note */}
          <footer className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex flex-col gap-0.5 shrink-0">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-slate-400" />
              <span>Actions require confirmation. Photos processed by AI provider.</span>
            </div>
            <p className="text-[9.5px] text-slate-400 truncate" title={EMERGENCY_NOTE}>
              {EMERGENCY_NOTE}
            </p>
          </footer>
        </section>
      )}
    </>
  );
}
