import React from 'react';
import { ShieldCheck, ArrowRight, FileCheck, Search, AlertTriangle, Download, Database, CheckCircle2, ChevronRight, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  navigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('dashboard');
    } else {
      navigate('register');
    }
  };

  const handleExploreFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('about');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span>MPLAD Scheme Financial Audit Platform</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15]">
                Transparent Monitoring of Development Projects
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Review project records, identify potential financial irregularities, and investigate evidence-backed findings to support accountable public infrastructure development.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md shadow-sm transition-all cursor-pointer"
                >
                  <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleExploreFeatures}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  <span>Explore Features</span>
                </button>
              </div>

              {/* Trust & Provenance Notice */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Deterministic Rules</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">8 verifiable audit checks</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">eSakshi & MoSPI Schema</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Standardized CSV ingestion</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Forensic Dossiers</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Exportable PDF & email</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Photograph */}
            <div className="lg:col-span-5">
              <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
                <img
src="/images/hero_infrastructure_1791899332798.jpg"
alt="Rural road and bridge public infrastructure development connecting villages in India"
className="w-full h-80 sm:h-96 object-cover"
/>

                <div className="p-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Public Works Monitoring Demonstration
                    </span>
                    <span>MoSPI Format Baseline</span>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Photograph depicts public civil infrastructure in India for representative demonstration purposes.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE CORE FEATURES SECTION */}
      <section id="features-section" className="py-16 md:py-24 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">
              Core Capabilities
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tracking-tight mt-1">
              Purpose-Built for Public Infrastructure Accountability
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Designed for auditors, parliamentary monitors, and researchers to verify physical works against financial ledger entries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 space-y-4">
              <div className="w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                1. Project Monitoring
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Centralized registry of MPLADS works across states, districts, and parliamentary constituencies. Track sanction limits, disbursement milestones, implementing agencies, and physical progress stages.
              </p>
              <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>• Lok Sabha & Rajya Sabha constituency filters</div>
                <div>• Explicit provenance & verification tagging</div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 space-y-4">
              <div className="w-10 h-10 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                2. Financial Anomaly Detection
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Deterministic detection algorithms testable against official guidelines: flags expenditure exceeding sanctioned caps, chronological timeline inversions, cost outliers relative to peer medians, and duplicate project scopes.
              </p>
              <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>• Zero black-box scoring: mathematically explainable</div>
                <div>• Distinguishes data limitations from fiscal risk</div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 space-y-4">
              <div className="w-10 h-10 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                3. Evidence-Based Reporting
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate comprehensive, printable PDF forensic audit dossiers complete with comparative value breakdowns, ledger citations, and recommended administrative inquiries with District Nodal Officers.
              </p>
              <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>• Instant multi-page PDF generation via jsPDF</div>
                <div>• Direct SMTP email delivery when configured</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">
              Audit Workflow
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tracking-tight mt-1">
              How the System Operates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Four structured steps from raw data ingestion to action-oriented audit reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">STEP 01</div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Import Records</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload official MoSPI/eSakshi CSV files or review pre-loaded demonstration records. Validate columns and preview data.
              </p>
            </div>

            <div className="p-5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">STEP 02</div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Analyse Financials</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Execute the deterministic audit engine. Compares sanctioned allocations, treasury disbursements, and recorded contractor expenditure.
              </p>
            </div>

            <div className="p-5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">STEP 03</div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Review Evidence</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Examine individual findings. Each flagged item displays rule code, severity, difference calculations, and limitations.
              </p>
            </div>

            <div className="p-5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">STEP 04</div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Generate Report</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Export an official PDF forensic report or dispatch it via email for formal submission to the district nodal authority.
              </p>
            </div>
          </div>

          {/* Civic Infrastructure Inset Showcase */}
          <div className="mt-12 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center gap-6">
            <img
              src="/src/assets/images/public_works_project_1791899332336.jpg"
              alt="Public community center and solar utility installation"
              referrerPolicy="no-referrer"
              className="w-full md:w-64 h-40 object-cover rounded-md border border-slate-200 dark:border-slate-800 shrink-0"
            />
            <div className="space-y-2">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Public Accountability in Practice
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Ensuring Public Assets Deliver Measurable Civic Value
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every rupee sanctioned under MPLADS is intended for durable community assets—drinking water facilities, village link roads, primary health centers, and schools. Systematic scrutiny protects public resources from misallocation or duplicate invoicing.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('projects')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Browse Sample Projects Registry</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATUTORY DISCLAIMER SECTION */}
      <section className="py-12 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-5 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-sm">
              <Scale className="w-4 h-4" />
              <span>Responsible Audit Notice</span>
            </div>
            <p className="leading-relaxed">
              Automated warning signs, cost deviation outliers, and calculated risk scores do not independently prove fraud, criminal malfeasance, or intentional corruption. Administrative procedures such as revised sanctions, multi-year installment disbursements, or clerical transcription errors in district records may explain observed discrepancies. Independent on-site inquiry with the District Collectorate is required.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
