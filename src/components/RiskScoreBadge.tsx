import React from 'react';
import { RiskCategory } from '../types/project';
import { AlertTriangle, CheckCircle2, AlertCircle, ShieldAlert, HelpCircle } from 'lucide-react';

interface RiskScoreBadgeProps {
  score?: number | null;
  category?: RiskCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({
  score,
  category = 'Insufficient Data',
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const getColors = () => {
    switch (category) {
      case 'Critical':
        return {
          text: 'text-rose-700 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/30',
          border: 'border-rose-200 dark:border-rose-900',
          dot: 'bg-rose-600',
          Icon: ShieldAlert,
        };
      case 'High':
        return {
          text: 'text-orange-700 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-900',
          dot: 'bg-orange-500',
          Icon: AlertTriangle,
        };
      case 'Moderate':
        return {
          text: 'text-amber-700 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-900',
          dot: 'bg-amber-500',
          Icon: AlertCircle,
        };
      case 'Low':
        return {
          text: 'text-emerald-700 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-900',
          dot: 'bg-emerald-500',
          Icon: CheckCircle2,
        };
      case 'Insufficient Data':
      default:
        return {
          text: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-100 dark:bg-slate-800/40',
          border: 'border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
          Icon: HelpCircle,
        };
    }
  };

  const { text, bg, border, Icon } = getColors();

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-sm border ${bg} ${border} ${text} ${className}`}
      >
        {showIcon && <Icon className="w-3 h-3" aria-hidden="true" />}
        <span>{category}</span>
        {score !== null && score !== undefined && (
          <span className="opacity-80 font-mono text-[11px]">({score})</span>
        )}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`flex items-center justify-between p-4 rounded-md border ${bg} ${border} ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${text} bg-white dark:bg-slate-900 shadow-xs border ${border}`}>
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
              Risk Evaluation
            </div>
            <div className={`text-lg font-bold ${text}`}>{category} Risk</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 dark:text-slate-400">Score</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {score !== null && score !== undefined ? `${score}/100` : 'N/A'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${bg} ${border} ${text} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      <span>{category}</span>
      {score !== null && score !== undefined ? (
        <span className="font-mono text-[11px] opacity-80">· {score}/100</span>
      ) : (
        <span className="text-[11px] opacity-75">· Insufficient Data</span>
      )}
    </span>
  );
};
