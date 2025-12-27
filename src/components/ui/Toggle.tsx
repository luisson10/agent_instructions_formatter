import * as React from 'react';
import { cn } from './Button';

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export const Toggle = ({ checked, onCheckedChange, label, id }: ToggleProps) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
          checked ? "bg-indigo-600" : "bg-slate-700"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300 cursor-pointer select-none" onClick={() => onCheckedChange(!checked)}>
          {label}
        </label>
      )}
    </div>
  );
};

