import React, { useState, useEffect } from 'react';
import { AnalysisReport } from '../types/project';
import { api } from '../services/api';
import { BackButton } from '../components/BackButton';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { VerificationStatusIndicator } from '../components/StatusBadge';
import { formatINR } from '../engine/fraudDetector';
import { generateProjectAuditPdf, downloadPdf } from '../services/pdfGenerator';
import { 
  FileText, 
  Download, 
  Mail, 
  ArrowRight, 
  Clock, 
  Search, 
  Send, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ReportsPageProps {
  navigate: (route: string, params?: any) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ navigate }) => {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Email modal state
  const [activeReportForEmail, setActiveReportForEmail] = useState<AnalysisReport | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailNotes, setEmailNotes] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReports();
      setReports(res.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (rep: AnalysisReport) => {
    const pdfRes = generateProjectAuditPdf(rep);
    downloadPdf(pdfRes);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportForEmail || !recipientEmail) return;

    try {
      setSendingEmail(true);
      setEmailFeedback(null);

      const pdfRes = generateProjectAuditPdf(activeReportForEmail);

      const res = await api.sendReportEmail(activeReportForEmail.id, {
        recipientEmail,
        pdfBase64: pdfRes.base64,
        customNotes: emailNotes,
      });

      setEmailFeedback({
        success: res.success,
        message: res.message || 'Audit report emailed successfully.',
      });
    } catch (err: any) {
      setEmailFeedback({
        success: false,
        message: err.message || 'Failed to dispatch email.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      r.projectNumber.toLowerCase().includes(q) ||
      r.projectTitle.toLowerCase().includes(q) ||
      (r.generatedByName && r.generatedByName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <BackButton onBack={() => navigate('dashboard')} label="Back to Dashboard" />
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Audit Dossiers
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Generated Forensic Reports
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permanent archive of evaluated MPLADS project audit analyses, downloadable in official PDF format.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
              Loading report archive...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Audit Reports Generated Yet
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Navigate to any project record and execute an audit to produce an official forensic dossier.
              </p>
              <button
                onClick={() => navigate('projects')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md cursor-pointer"
              >
                <span>Browse Project Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            filtered.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {rep.projectNumber}
                    </span>
                    <VerificationStatusIndicator status={rep.verificationStatus} />
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(rep.generatedAt).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {rep.projectTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <RiskScoreBadge score={rep.riskScore} category={rep.riskCategory} size="sm" />
                    <span>·</span>
                    <span>{rep.findings?.length || 0} findings recorded</span>
                    <span>·</span>
                    <span>Sanctioned: {formatINR(rep.financials?.sanctionedAmount)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleDownload(rep)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveReportForEmail(rep);
                      setEmailFeedback(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>

                  <button
                    onClick={() => navigate('analysis', { projectId: rep.projectId })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <span>View Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Modal */}
      {activeReportForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Dispatch PDF Audit Dossier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Send {activeReportForEmail.projectNumber} report via configured Gmail SMTP.
            </p>

            <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@authority.gov.in"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Custom Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  placeholder="Add executive audit summary notes..."
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
                  onClick={() => setActiveReportForEmail(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-md shadow-xs cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingEmail ? 'animate-spin' : ''}`} />
                  <span>{sendingEmail ? 'Transmitting...' : 'Send Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
