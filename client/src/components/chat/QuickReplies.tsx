import React from 'react';

interface QuickRepliesProps {
  options?: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export default function QuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  if (!options || !options.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 pt-1" role="group" aria-label="Quick replies">
      {options.slice(0, 4).map((option, index) => (
        <button
          key={`${option}-${index}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option)}
          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200/80 rounded-full px-3 py-1 font-medium transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-xs text-left"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
