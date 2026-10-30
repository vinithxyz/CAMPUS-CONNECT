import { useState, useEffect } from 'react';
import type { ChatLanguage } from '../types/chat';

const STORAGE_KEY = 'cc_chat_lang';

export const CHAT_LANGUAGES: { code: ChatLanguage; label: string }[] = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

export function useChatLanguage() {
  const [language, setLanguageState] = useState<ChatLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ChatLanguage;
    return saved && CHAT_LANGUAGES.some((l) => l.code === saved) ? saved : 'auto';
  });

  const setLanguage = (newLang: ChatLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setLanguageState(e.newValue as ChatLanguage);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { language, setLanguage, languages: CHAT_LANGUAGES };
}
