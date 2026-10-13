import React, { useState, useEffect } from 'react';
import { Project } from '../types/project';
import { api } from '../services/api';
import { BackButton } from '../components/BackButton';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { ProjectStatusIndicator, VerificationStatusIndicator } from '../components/StatusBadge';
import { formatINR } from '../engine/fraudDetector';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Landmark, 
  User, 
  Play
} from 'lucide-react';

interface ProjectDetailsProps {
  projectId: string;
  navigate: (route: string, params?: any) => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsProps> = ({ projectId, navigate }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProject(projectId);
      setProject(res.project);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
        <div className="text-xs text-slate-500 animate-pulse">Loading project particulars...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <BackButton onBack={() => navigate('projects')} label="Back to Projects" />
          <div className="p-6 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs">
            {error || 'Project record could not be found.'}
          </div>
        </div>
      </div>
    );
  }

  const variance =
    project.recordedExpenditure !== undefined && project.sanctionedAmount
      ? project.recordedExpenditure - project.sanctionedAmount
      : undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <BackButton onBack={() => navigate('projects')} label="Back to Projects" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('analysis', { projectId: project.id })}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{project.lastAnalyzedAt ? 'Re-Analyse Project' : 'Analyse Project Now'}</span>
            </button>
          </div>
        </div>

        {/* Main Details Card */}
        <div className="p-6 sm:p-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          {/* Header Title Block */}
          <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {project.id}
              </span>
              <VerificationStatusIndicator status={project.verificationStatus} />
              <ProjectStatusIndicator status={project.status} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white leading-tight">
              {project.title}
            </h1>

            {project.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Audit Risk Evaluation Banner */}
          {project.riskScore !== undefined && project.riskScore !== null ? (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <RiskScoreBadge score={project.riskScore} category={project.riskCategory} size="md" />
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Last evaluated: {new Date(project.lastAnalyzedAt || '').toLocaleDateString('en-IN')}
                </div>
              </div>

              <button
                onClick={() => navigate('analysis', { projectId: project.id })}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Audit Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-4">
              <div className="text-xs text-blue-900 dark:text-blue-300">
                This project record has not yet been audited by the deterministic fraud-risk detection engine.
              </div>
              <button
                onClick={() => navigate('analysis', { projectId: project.id })}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md cursor-pointer whitespace-nowrap"
              >
                Run Audit Engine
              </button>
            </div>
          )}

          {/* Financial Breakdown Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Fiscal Ledger & Fund Accounting
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Sanctioned Amount</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatINR(project.sanctionedAmount)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Approved ceiling</div>
              </div>

              <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Released Amount</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatINR(project.releasedAmount)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Disbursed to agency</div>
              </div>

              <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Recorded Expenditure</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatINR(project.recordedExpenditure)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {variance !== undefined ? (
                    variance > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        + {formatINR(variance)} excess over budget
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatINR(Math.abs(variance))} unspent balance
                      </span>
                    )
                  ) : (
                    'Ledger entry'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata & Governance Particulars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Left: Administrative & MP */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-slate-400" />
                <span>Administrative Jurisdiction</span>
              </h4>

              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">State / District:</span>
                  <span className="font-medium">{project.district}, {project.state}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Parliamentary Constituency:</span>
                  <span className="font-medium">{project.constituency || 'Unavailable'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Member of Parliament:</span>
                  <span className="font-medium">{project.mpName || 'Unavailable'} ({project.mpHouse || 'Lok Sabha'})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Implementing Agency:</span>
                  <span className="font-medium">{project.implementingAgency || 'Unspecified'}</span>
                </div>
                {project.locationDetails && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Site Location:</span>
                    <span className="font-medium text-right">{project.locationDetails}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Milestones & Provenance */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Timeline & Provenance</span>
              </h4>

              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">MP Recommendation Date:</span>
                  <span className="font-mono">{project.recommendationDate || 'Not Recorded'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Administrative Sanction Date:</span>
                  <span className="font-mono">{project.sanctionDate || 'Not Recorded'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Completion Handover Date:</span>
                  <span className="font-mono">{project.completionDate || 'Incomplete / Active'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Source Document:</span>
                  <span className="font-medium text-right truncate max-w-xs">{project.sourceDocument || 'Unavailable'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Data Provenance:</span>
                  <span className="font-medium text-right">{project.dataProvenance}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
