import React from 'react';
import { BackButton } from '../components/BackButton';
import { Scale, ShieldCheck, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  navigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <BackButton onBack={() => navigate('home')} label="Back to Home" />
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Audit Transparency
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Methodology & Audit Constitution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mathematical rules, transparent scoring thresholds, and data governance standards.
          </p>
        </div>

        {/* 8 Core Rules Card */}
        <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Deterministic Rules Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              To guarantee explainability and zero black-box bias, every project assessment is computed via deterministic, testable algorithms before any optional AI narrative synthesis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">RULE-EXP-01:</span>
                <span>Expenditure Exceeds Sanction</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Flags records where cumulative recorded contractor expenditure exceeds the administrative sanction ceiling. Calculates exact excess in INR and percentage.
              </p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">RULE-EXP-02:</span>
                <span>Disbursed Funds Exceed Sanction</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Identifies instances where total treasury installments released to the implementing department exceed the formally approved budget cap.
              </p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">RULE-FIN-01:</span>
                <span>Invalid Negative Ledgers</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Detects negative expenditure or release figures, indicative of accounting corruption or improper reversing entries in the district database.
              </p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">RULE-FIN-02:</span>
                <span>Expenditure Exceeds Cash Release</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Flags implementing agencies claiming expenditures higher than total funds formally disbursed from the Nodal District Treasury.
              </p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">RULE-STA-01:</span>
                <span>Completed with Zero Expenditure</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Detects civil assets recorded as physically completed where zero financial expenditure has been booked against the sanctioned allocation.
              </p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">RULE-TIME-01/02:</span>
                <span>Chronological Inversions</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Checks for impossible milestone sequences (e.g., sanction issued prior to MP recommendation, or completion handover marked before sanction).
              </p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">RULE-DUP-01:</span>
                <span>Duplicate Project Scope</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Identifies overlapping civil works within the same constituency and district sharing lexical and category similarities across separate sanction orders.
              </p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">RULE-DEV-01:</span>
                <span>Unusual Cost Outlier</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Evaluates project budget against category peer medians (when sample size ≥ 3) and flags projects exceeding 2.5x peer median.
              </p>
            </div>
          </div>

          {/* Scoring Thresholds */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Risk Scoring Scale (0 - 100)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                <div className="font-bold">Low Risk (0 - 24)</div>
                <div className="text-[11px] opacity-80 mt-1">Minor metadata omissions or routine compliance.</div>
              </div>
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                <div className="font-bold">Moderate (25 - 54)</div>
                <div className="text-[11px] opacity-80 mt-1">Cost outlier or administrative reconciliation gap.</div>
              </div>
              <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 text-orange-800 dark:text-orange-300">
                <div className="font-bold">High Risk (55 - 79)</div>
                <div className="text-[11px] opacity-80 mt-1">Expenditure over budget or duplicate scope.</div>
              </div>
              <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                <div className="font-bold">Critical (80 - 100)</div>
                <div className="text-[11px] opacity-80 mt-1">Multiple acute anomalies requiring immediate audit.</div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed flex items-start gap-2">
            <Scale className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong>Academic Integrity Notice:</strong> This platform does not claim definitive proof of criminality or official misconduct. In financial accounting, ledger discrepancies can arise from retroactive revised sanctions or clerical delays in milestone reporting. Independent verification with the District Planning Cell is always mandatory.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
