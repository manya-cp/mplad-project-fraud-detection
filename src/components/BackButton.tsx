import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onBack?: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onBack,
  label = 'Back',
  className = '',
}) => {
  const handleClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Go back - ${label}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};
