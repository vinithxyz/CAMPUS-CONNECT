import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Role } from '../../types';

interface SuggestedPromptsProps {
  role?: Role;
  onPick: (prompt: string) => void;
  disabled?: boolean;
}

export default function SuggestedPrompts({
  role = 'student',
  onPick,
  disabled,
}: SuggestedPromptsProps) {
  let prompts: string[] = ['Report a problem', 'Check my complaint', 'Campus info'];

  if (role === 'admin') {
    prompts = ['Overdue and critical reports', 'Open reports by building', 'Recurring problems'];
  } else if (role === 'staff') {
    prompts = ['Show my assigned reports', 'Overdue reports', 'Campus info'];
  }

  return (
    <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
        <Sparkles className="w-3 h-3 text-blue-500" />
        <span>Suggested:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((prompt) => (
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
