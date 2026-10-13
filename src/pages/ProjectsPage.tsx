import React, { useState, useEffect } from 'react';
import { Project } from '../types/project';
import { api } from '../services/api';
import { BackButton } from '../components/BackButton';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { ProjectStatusIndicator, VerificationStatusIndicator } from '../components/StatusBadge';
import { formatINR } from '../engine/fraudDetector';
import { Search, Filter, Plus, ArrowRight, ShieldCheck, MapPin, Tag } from 'lucide-react';

interface ProjectsPageProps {
  navigate: (route: string, params?: any) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ navigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [verifFilter, setVerifFilter] = useState('All');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.getProjects();
      setProjects(res.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));

  const filtered = projects.filter((p) => {
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
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (riskFilter !== 'All' && p.riskCategory !== riskFilter) return false;
    if (verifFilter !== 'All' && p.verificationStatus !== verifFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <BackButton onBack={() => navigate('dashboard')} label="Back to Dashboard" />
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Scheme Works
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Project Repository
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete index of recorded MPLADS developmental assets across parliamentary constituencies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('data-import')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Official Records</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Project ID, title, MP name, or location..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Sanctioned">Sanctioned</option>
                <option value="Proposed">Proposed</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="All">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={verifFilter}
                onChange={(e) => setVerifFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="All">All Provenance</option>
                <option value="Demo Data">Demo Data</option>
                <option value="Verified Against Official Source">Verified Official</option>
                <option value="Uploaded — Not Independently Verified">Uploaded Unverified</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Showing {filtered.length} of {projects.length} recorded schemes
            </span>
            {(search || categoryFilter !== 'All' || statusFilter !== 'All' || riskFilter !== 'All' || verifFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('All');
                  setStatusFilter('All');
                  setRiskFilter('All');
                  setVerifFilter('All');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              No projects found matching the current search criteria.
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-3">
                  {/* Top line: ID and Risk Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {p.id}
                    </span>
                    {p.riskCategory ? (
                      <RiskScoreBadge score={p.riskScore} category={p.riskCategory} size="sm" />
                    ) : (
                      <span className="text-[11px] text-slate-400">Not Audited</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {p.title}
                  </h3>

                  {/* Location & Category metadata */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-1">{p.district}, {p.state} {p.constituency ? `(${p.constituency})` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>{p.category}</span>
                    </div>
                  </div>

                  {/* Financial ledger box */}
                  <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Sanctioned</div>
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">
                        {formatINR(p.sanctionedAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Expenditure</div>
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">
                        {formatINR(p.recordedExpenditure)}
                      </div>
                    </div>
                  </div>

                  {/* Status & Provenance */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <ProjectStatusIndicator status={p.status} />
                    <VerificationStatusIndicator status={p.verificationStatus} />
                  </div>
                </div>

                {/* Card Action buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate('project-details', { projectId: p.id })}
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    View Record
                  </button>
                  <button
                    onClick={() => navigate('analysis', { projectId: p.id })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors cursor-pointer"
                  >
                    <span>Analyse Project</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
