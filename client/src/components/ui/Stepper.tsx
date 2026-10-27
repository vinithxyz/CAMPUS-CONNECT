import { Check } from 'lucide-react';

interface Props {
  steps: string[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center justify-between max-w-xl mx-auto mb-6 sm:mb-8 px-2 sm:px-4">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isDone = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
                  isDone
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : stepNum}
              </div>
              <span
                className={`text-xs sm:text-sm font-medium ${
                  isCurrent ? 'text-slate-900 font-bold' : 'text-slate-400 hidden sm:inline'
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                  stepNum < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
