import React from 'react';
import { ProjectStatus, VerificationStatus } from '../types/project';

interface ProjectStatusProps {
  status: ProjectStatus;
  className?: string;
}

export const ProjectStatusIndicator: React.FC<ProjectStatusProps> = ({ status, className = '' }) => {
  const getDotColor = () => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'Sanctioned':
        return 'bg-indigo-500';
      case 'Proposed':
        return 'bg-slate-400';
      case 'Stalled':
        return 'bg-amber-500';
      case 'Cancelled':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};

interface VerificationStatusProps {
  status: VerificationStatus;
  className?: string;
}

export const VerificationStatusIndicator: React.FC<VerificationStatusProps> = ({ status, className = '' }) => {
  const getStyle = () => {
    switch (status) {
      case 'Verified Against Official Source':
        return 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20';
      case 'Partially Verified':
        return 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20';
      case 'User Uploaded — Not Independently Verified':
      case 'Uploaded — Not Independently Verified':
        return 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20';
      case 'Demonstration Data — Not Real Project Evidence':
      case 'Demo Data':
        return 'text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20';
      case 'Unverified':
      case 'Source Unavailable':
      default:
        return 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40';
    }
  };

  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 border rounded-sm transition-colors ${getStyle()} ${className}`}
      title={`Data Provenance: ${status}`}
    >
      {status}
    </span>
  );
};
