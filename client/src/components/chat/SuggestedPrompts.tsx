import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  onPick: (prompt: string) => void;
  disabled?: boolean;
}

const DEFAULT_PROMPTS = [
  'How do I report a campus issue?',
  'Check my complaint status.',
  'Show my pending complaints.',
  'I want to report a new issue.',
];

export default function SuggestedPrompts({ onPick, disabled }: SuggestedPromptsProps) {
  return (
    <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
        <Sparkles className="w-3 h-3 text-blue-500" />
        <span>Suggested questions:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPick(prompt)}
            className="text-[11px] text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50/60 border border-slate-200/90 rounded-full px-2.5 py-1 transition disabled:opacity-50 text-left active:scale-[0.98]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
