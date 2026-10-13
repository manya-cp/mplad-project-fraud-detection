import React, { useState, useEffect } from 'react';
import { Project, RiskCategory } from '../types/project';
import { api } from '../services/api';
import { BackButton } from '../components/BackButton';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { ProjectStatusIndicator, VerificationStatusIndicator } from '../components/StatusBadge';
import { formatINR } from '../engine/fraudDetector';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart';
import { ProjectStatusChart } from '../components/charts/ProjectStatusChart';
import { FinancialOverviewChart } from '../components/charts/FinancialOverviewChart';
import { AnomalyCategoryChart } from '../components/charts/AnomalyCategoryChart';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  ArrowUpRight, 
  RefreshCw, 
  Play,
  RotateCcw
} from 'lucide-react';

interface DashboardProps {
  navigate: (route: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ navigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [verifFilter, setVerifFilter] = useState<string>('All');

  const [dataScope, setDataScope] = useState<'all' | 'verifiedOnly'>('all');
  const [stats, setStats] = useState<any>(null);

  const [analyzingAll, setAnalyzingAll] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, statsRes] = await Promise.all([
        api.getProjects(),
        api.getProjectStats().catch(() => ({ stats: null })),
      ]);
      setProjects(res.projects);
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Filter based on dataScope
  const activeProjects = dataScope === 'verifiedOnly'
    ? projects.filter(
        (p) =>
          p.verificationStatus === 'Verified Against Official Source' ||
          p.verificationStatus === 'Partially Verified'
      )
    : projects;

  // Compute actual summary metrics from active scoped records
  const totalProjects = activeProjects.length;
  const analyzedProjects = activeProjects.filter(
    (p) => p.lastAnalyzedAt || (p.riskScore !== undefined && p.riskScore !== null)
  ).length;
  const highRiskProjects = activeProjects.filter(
    (p) => p.riskCategory === 'High' || p.riskCategory === 'Critical'
  ).length;

  let totalAnomaliesCount = 0;
  activeProjects.forEach((p) => {
    if (p.findings && Array.isArray(p.findings)) {
      totalAnomaliesCount += p.findings.length;
    }
  });

  const hasDemoRecords = projects.some(
    (p) =>
      p.verificationStatus === 'Demo Data' ||
      p.verificationStatus === 'Demonstration Data — Not Real Project Evidence'
  );

  // Filter projects for table
  const filteredProjects = activeProjects.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        (p.mpName && p.mpName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (riskFilter !== 'All') {
      if (riskFilter === 'Not Evaluated' && p.riskCategory) return false;
      if (riskFilter !== 'Not Evaluated' && p.riskCategory !== riskFilter) return false;
    }
    if (verifFilter !== 'All' && p.verificationStatus !== verifFilter) return false;
    return true;
  });

  // Batch analyze unanalyzed projects
  const handleAnalyzeAll = async () => {
    try {
      setAnalyzingAll(true);
      setFeedbackMsg('Running deterministic fraud-risk audit on all records...');
      for (const p of activeProjects) {
        await api.analyzeProject(p.id);
      }
      await loadProjects();
      setFeedbackMsg('Completed audit assessment across active project records.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setError('Error during batch analysis: ' + err.message);
    } finally {
      setAnalyzingAll(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setLoading(true);
      await api.resetDemoData();
      await loadProjects();
      setFeedbackMsg('Reloaded baseline demonstration dataset.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <BackButton onBack={() => navigate('home')} label="Back to Home" />
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Auditor Workspace
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Audit Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of registered MPLADS projects, financial variance evaluations, and flagged potential irregularities.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzingAll || projects.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${analyzingAll ? 'animate-spin' : ''}`} />
              <span>{analyzingAll ? 'Auditing Records...' : 'Run Audit on All'}</span>
            </button>

            <button
              onClick={() => navigate('data-import')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import CSV Data</span>
            </button>

            <button
              onClick={handleResetDemo}
              title="Reset sample demonstration records"
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="p-3 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-md flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Provenance Classification Breakdown Bar */}
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Data Provenance Classification & Evidence Breakdown
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Independent accounting breakdown of stored records by verification status
              </div>
            </div>

            {/* Scope Filter Tabs */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDataScope('all')}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  dataScope === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Records ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setDataScope('verifiedOnly')}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  dataScope === 'verifiedOnly'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Verified Official Only ({(stats?.verifiedCount || 0) + (stats?.partiallyVerifiedCount || 0)})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Verified Official</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {stats?.verifiedCount ?? 0}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold">Partially Verified</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {stats?.partiallyVerifiedCount ?? 0}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">User Uploaded</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {stats?.userUploadedCount ?? 0}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Unverified</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {stats?.unverifiedCount ?? 0}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">Demonstration</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {stats?.demonstrationCount ?? (hasDemoRecords ? projects.length : 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Empty state when verifiedOnly is selected and 0 verified records exist */}
        {dataScope === 'verifiedOnly' && activeProjects.length === 0 && (
          <div className="p-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Independently Verified Official Records Stored Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              All currently stored baseline records are classified as <em>Demonstration Data</em>. In accordance with audit standards, demonstration records are excluded from verified-data statistics.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('data-import')}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs cursor-pointer"
              >
                Import Official MoSPI / eSakshi Data
              </button>
              <button
                type="button"
                onClick={() => setDataScope('all')}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md cursor-pointer"
              >
                Inspect Demonstration Records ({projects.length})
              </button>
            </div>
          </div>
        )}

        {/* 4 SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Projects */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Projects</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
              {totalProjects}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {projects.length > 0 ? 'Active repository records' : 'No records stored'}
            </div>
          </div>

          {/* Card 2: Projects Analysed */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Projects Analysed</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
              {analyzedProjects}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {totalProjects > 0 ? `${((analyzedProjects / totalProjects) * 100).toFixed(0)}% audit coverage` : '0%'}
            </div>
          </div>

          {/* Card 3: Potential Irregularities */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Potential Irregularities</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
              {totalAnomaliesCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Detected rule discrepancies
            </div>
          </div>

          {/* Card 4: High-Risk Projects */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">High & Critical Risk</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
              {highRiskProjects}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Require priority inspection
            </div>
          </div>
        </div>

        {/* 4 CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Risk Distribution */}
          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Risk Category Distribution
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Projects classified by evaluated deterministic risk threshold
                </p>
              </div>
            </div>
            <RiskDistributionChart projects={projects} />
          </div>

          {/* Chart 2: Project Status Distribution */}
          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Project Execution Status
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Current physical lifecycle distribution across repository
                </p>
              </div>
            </div>
            <ProjectStatusChart projects={projects} />
          </div>

          {/* Chart 3: Financial Overview */}
          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sanctioned vs Recorded Expenditure
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Fiscal comparison for projects with complete ledger figures (in ₹ Lakhs)
                </p>
              </div>
            </div>
            <FinancialOverviewChart projects={projects} />
          </div>

          {/* Chart 4: Anomaly Categories */}
          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detected Warning Categories
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Frequency of flagged warning signs across active projects
                </p>
              </div>
            </div>
            <AnomalyCategoryChart projects={projects} />
          </div>
        </div>

        {/* RECENT PROJECTS REPOSITORY TABLE */}
        <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Project Ledger Records
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filter, search, and inspect individual project accounts.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, title, district..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Filter className="w-3 h-3" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Sanctioned">Sanctioned</option>
              <option value="Proposed">Proposed</option>
            </select>

            {/* Risk Category Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              <option value="All">All Risk Levels</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk</option>
              <option value="Not Evaluated">Not Evaluated</option>
            </select>

            {/* Verification Status Filter */}
            <select
              value={verifFilter}
              onChange={(e) => setVerifFilter(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              <option value="All">All Provenance</option>
              <option value="Demo Data">Demo Data</option>
              <option value="Verified Against Official Source">Verified Official</option>
              <option value="Uploaded — Not Independently Verified">Uploaded Unverified</option>
            </select>

            {(search || statusFilter !== 'All' || riskFilter !== 'All' || verifFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setRiskFilter('All');
                  setVerifFilter('All');
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline ml-auto cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Project ID</th>
                  <th className="py-2.5 px-3">Project Title & Location</th>
                  <th className="py-2.5 px-3 text-right">Sanctioned</th>
                  <th className="py-2.5 px-3 text-right">Expenditure</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Risk Score</th>
                  <th className="py-2.5 px-3">Provenance</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No project records match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {p.id}
                      </td>

                      {/* Title & Location */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-medium text-slate-900 dark:text-white line-clamp-1">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {p.district}, {p.state} {p.constituency ? `· ${p.constituency}` : ''}
                        </div>
                      </td>

                      {/* Sanctioned */}
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatINR(p.sanctionedAmount)}
                      </td>

                      {/* Expenditure */}
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                        <span
                          className={
                            p.recordedExpenditure && p.recordedExpenditure > p.sanctionedAmount
                              ? 'text-rose-600 dark:text-rose-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {formatINR(p.recordedExpenditure)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <ProjectStatusIndicator status={p.status} />
                      </td>

                      {/* Risk Score */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {p.riskScore !== undefined && p.riskScore !== null ? (
                          <RiskScoreBadge
                            score={p.riskScore}
                            category={p.riskCategory}
                            size="sm"
                          />
                        ) : (
                          <button
                            onClick={() => navigate('analysis', { projectId: p.id })}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Run Audit
                          </button>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <VerificationStatusIndicator status={p.verificationStatus} />
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate('project-details', { projectId: p.id })}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <span>Details</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
