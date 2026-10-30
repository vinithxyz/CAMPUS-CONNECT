import React from 'react';
import { Languages } from 'lucide-react';
import { useChatLanguage } from '../../hooks/useChatLanguage';
import type { ChatLanguage } from '../../types/chat';

export default function LanguageSelect() {
  const { language, setLanguage, languages } = useChatLanguage();

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-300">
      <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as ChatLanguage)}
        aria-label="Select Assistant Language"
        className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
