import React, { useState, useEffect } from 'react';
import { Project, AnalysisReport, AnomalyFinding } from '../types/project';
import { api } from '../services/api';
import { BackButton } from '../components/BackButton';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { VerificationStatusIndicator } from '../components/StatusBadge';
import { formatINR } from '../engine/fraudDetector';
import { generateProjectAuditPdf, downloadPdf } from '../services/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Download, 
  Mail, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Scale, 
  FileText, 
  ArrowLeft, 
  Check, 
  Send, 
  Info,
  Clock
} from 'lucide-react';

interface AnalysisPageProps {
  projectId: string;
  navigate: (route: string, params?: any) => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ projectId, navigate }) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Gemini AI Executive Narrative
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Saved Report
  const [savedReport, setSavedReport] = useState<AnalysisReport | null>(null);

  // Email Dialog State
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>(user?.email || '');
  const [emailNotes, setEmailNotes] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [emailFeedback, setEmailFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // Load project on mount
  useEffect(() => {
    loadAndAnalyze();
  }, [projectId]);

  const loadAndAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProject(projectId);
      setProject(res.project);

      // Trigger audit
      setAnalyzing(true);
      const auditRes = await api.analyzeProject(projectId);
      setAuditResult(auditRes.auditResult);
      setProject(auditRes.project);

      // Auto-save initial report record
      const reportPayload: Partial<AnalysisReport> = {
        projectId: auditRes.project.id,
        projectTitle: auditRes.project.title,
        projectNumber: auditRes.project.id,
        riskScore: auditRes.auditResult.riskScore,
        riskCategory: auditRes.auditResult.riskCategory,
        financials: {
          sanctionedAmount: auditRes.project.sanctionedAmount,
          releasedAmount: auditRes.project.releasedAmount,
          recordedExpenditure: auditRes.project.recordedExpenditure,
        },
        verificationStatus: auditRes.project.verificationStatus,
        dataProvenance: auditRes.project.dataProvenance,
        findings: auditRes.auditResult.findings,
        methodologySummary: 'Evaluated against 8 deterministic forensic rules under MoSPI / MPLADS fiscal norms.',
        dataLimitations: auditRes.auditResult.dataLimitations,
        recommendedActions: auditRes.auditResult.recommendedActions,
      };

      const saved = await api.saveReport(reportPayload);
      setSavedReport(saved.report);
    } catch (err: any) {
      setError(err.message || 'Audit execution failed.');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  // Generate Gemini AI Narrative Summary
  const handleGenerateAiNarrative = async () => {
    try {
      setGeneratingAi(true);
      setAiError(null);
      const res = await api.generateAiNarrative(projectId);
      if (res.configured && res.narrative) {
        setAiNarrative(res.narrative);
        if (savedReport) {
          savedReport.aiSummary = res.narrative;
        }
      } else {
        setAiError(res.message || 'Gemini API is not configured in this environment.');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
        setAiError('The Gemini model is currently experiencing temporary high server demand from Google. Please try again in a few moments, or review the deterministic audit findings below.');
      } else {
        setAiError(err.message || 'Failed to generate AI executive synthesis.');
      }
    } finally {
      setGeneratingAi(false);
    }
  };

  // Download PDF Report
  const handleDownloadPdf = () => {
    if (!savedReport || !project) return;
    const reportToPrint: AnalysisReport = {
      ...savedReport,
      aiSummary: aiNarrative || savedReport.aiSummary,
    };
    const pdfRes = generateProjectAuditPdf(reportToPrint, project);
    downloadPdf(pdfRes);
  };

  // Send Email with PDF
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savedReport || !project || !emailRecipient) return;

    try {
      setSendingEmail(true);
      setEmailFeedback(null);

      const reportToPrint: AnalysisReport = {
        ...savedReport,
        aiSummary: aiNarrative || savedReport.aiSummary,
      };
      const pdfRes = generateProjectAuditPdf(reportToPrint, project);

      const res = await api.sendReportEmail(savedReport.id, {
        recipientEmail: emailRecipient,
        pdfBase64: pdfRes.base64,
        customNotes: emailNotes,
      });

      setEmailFeedback({
        success: res.success,
        message: res.message || 'Email dispatched successfully.',
      });
    } catch (err: any) {
      setEmailFeedback({
        success: false,
        message: err.message || 'Email delivery failed.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs text-slate-500 font-medium">
          Executing deterministic fraud-risk audit rules against project records...
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <BackButton onBack={() => navigate('project-details', { projectId })} label="Back to Project" />
          <div className="p-6 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs">
            {error || 'Unable to load project for audit.'}
          </div>
        </div>
      </div>
    );
  }

  const findings: AnomalyFinding[] = auditResult?.findings || [];
  const riskScore = auditResult?.riskScore;
  const riskCategory = auditResult?.riskCategory;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <BackButton onBack={() => navigate('project-details', { projectId: project.id })} label="Back to Project Details" />

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Report</span>
            </button>

            <button
              onClick={() => {
                setShowEmailModal(true);
                setEmailFeedback(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Report</span>
            </button>
          </div>
        </div>

        {/* Project Audit Banner Card */}
        <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {project.id}
              </span>
              <VerificationStatusIndicator status={project.verificationStatus} />
              <span className="text-xs text-slate-500">
                {project.district}, {project.state}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white leading-tight">
              Audit Analysis Dossier: {project.title}
            </h1>
          </div>

          {/* Large Risk Score Summary Banner */}
          <RiskScoreBadge score={riskScore} category={riskCategory} size="lg" />

          {/* Financial Metrics Summary Table */}
          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Sanctioned Allocation</div>
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-1">
                {formatINR(project.sanctionedAmount)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Funds Released</div>
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-1">
                {formatINR(project.releasedAmount)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Recorded Expenditure</div>
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-1">
                {formatINR(project.recordedExpenditure)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Budget Variance</div>
              <div className="font-mono font-bold text-sm mt-1">
                {project.recordedExpenditure && project.sanctionedAmount ? (
                  project.recordedExpenditure > project.sanctionedAmount ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      +{formatINR(project.recordedExpenditure - project.sanctionedAmount)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      -{formatINR(project.sanctionedAmount - project.recordedExpenditure)}
                    </span>
                  )
                ) : (
                  'N/A'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Executive Summary Panel (Optional Gemini Assistance) */}
        <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Executive Narrative Synthesis (AI-Assisted)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Translates deterministic ledger findings into a crisp, objective narrative for oversight committees.
              </p>
            </div>

            <button
              onClick={handleGenerateAiNarrative}
              disabled={generatingAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin' : ''}`} />
              <span>{generatingAi ? 'Synthesizing...' : aiNarrative ? 'Regenerate Narrative' : 'Generate Narrative'}</span>
            </button>
          </div>

          {aiError && (
            <div className="p-3 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-md">
              {aiError}
            </div>
          )}

          {aiNarrative ? (
            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {aiNarrative}
            </div>
          ) : (
            <div className="p-4 rounded-md bg-slate-50/60 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
              Click &quot;Generate Narrative&quot; to compile an AI synthesis summarizing the deterministic findings below.
            </div>
          )}
        </div>

        {/* Individual Findings & Evidence Section */}
        <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Deterministic Audit Findings ({findings.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every finding corresponds to an explicit, mathematically testable audit rule under MPLADS guidelines.
            </p>
          </div>

          {findings.length === 0 ? (
            <div className="p-8 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                No Warning Anomalies Detected
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                Expenditure records, release disbursements, and project timeline sequences appear compliant with standard scheme parameters.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {findings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  {/* Finding Title & Severity */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {f.ruleId}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {f.title}
                      </h4>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-sm border ${
                        f.severity === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
                          : f.severity === 'High'
                          ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900'
                          : f.severity === 'Moderate'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {f.severity} Severity
                    </span>
                  </div>

                  {/* Explanation */}
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {f.explanation}
                  </p>

                  {/* Values Compared (if present) */}
                  {f.comparedValues && (
                    <div className="p-3 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">{f.comparedValues.labelA}</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {f.comparedValues.valueA}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">{f.comparedValues.labelB}</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {f.comparedValues.valueB}
                        </span>
                      </div>
                      {f.comparedValues.difference && (
                        <div>
                          <span className="text-slate-400 text-[11px] block">Discrepancy</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            {f.comparedValues.difference}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evidence & Action Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Supporting Evidence:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                        {f.evidence}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Recommended Administrative Verification:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded border border-blue-100 dark:border-blue-900/50">
                        {f.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Limitation footnote */}
                  {f.dataLimitations && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                      Data limitation: {f.dataLimitations}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Procedural Methodology & Limitations */}
        <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Audit Methodology & Administrative Verification Steps
          </h3>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              Under MoSPI guidelines, all potential irregularities highlighted above should be referred to the District Nodal Officer (District Collector / Deputy Commissioner). Recommended formal steps:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Request certified copy of the Physical Completion Certificate (PCC) and Handing Over Note.</li>
              <li>Reconcile Contractor Measurement Book (MB) recordings against the approved Schedule of Rates (SoR).</li>
              <li>Examine Utilization Certificate (UC) Form MPLADS-II submitted by the executing department.</li>
              <li>Verify geotagged site photographs uploaded on the official eSakshi portal mobile application.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* EMAIL REPORT DELIVERY MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Email Forensic Audit Dossier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Sends an official PDF audit dossier as an attachment via Gmail SMTP.
            </p>

            <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="auditor@district.gov.in"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Auditor Remarks / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  placeholder="Forwarding for formal reconciliation with Nodal Collectorate..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {emailFeedback && (
                <div
                  className={`p-3 rounded-md text-xs ${
                    emailFeedback.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                  }`}
                >
                  {emailFeedback.message}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-md shadow-xs cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingEmail ? 'animate-spin' : ''}`} />
                  <span>{sendingEmail ? 'Sending Email...' : 'Send Audit Dossier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
