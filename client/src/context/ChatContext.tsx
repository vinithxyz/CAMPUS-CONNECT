import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openChat: (seed?: string) => void;
  seedText?: string;
  clearSeed: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [seedText, setSeedText] = useState<string>();

  const openChat = (seed?: string) => {
    if (seed) setSeedText(seed);
    setIsOpen(true);
  };

  const clearSeed = () => setSeedText(undefined);

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, openChat, seedText, clearSeed }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return ctx;
}
