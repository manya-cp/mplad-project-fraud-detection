import React from 'react';
import { ShieldCheck, ExternalLink, Scale, FileText, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>MPLAD Project Fraud Detection System</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              An evidence-based financial monitoring and irregularity detection prototype designed to examine Members of Parliament Local Area Development Scheme (MPLADS) infrastructure records, quantify risk indicators, and produce structured forensic audit dossiers.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
              <span>Standardised on MoSPI / eSakshi Data Schema</span>
              <span>·</span>
              <span>Deterministic Rule Engine</span>
              <span>·</span>
              <span>Cryptographic Token Auth</span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Core Modules
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => navigate('dashboard')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Audit Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('projects')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Project Repository
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('data-import')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  CSV Data Ingestion
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('reports')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Forensic Dossiers & PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Official References */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Official Portals
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a
                  href="https://mplads.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>MPLADS Official Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://esakshi.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>eSakshi Portal (NIC)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://mospi.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Ministry of Statistics & PI</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate('official-sources')}
                  className="hover:text-white transition-colors cursor-pointer text-blue-400"
                >
                  Data Access Investigation
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Audit Disclaimer - Mandatory Requirement */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="p-3 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-semibold">Statutory Audit Disclaimer: </span>
              Automated warning signs, statistical variance alerts, and anomaly scores produced by this system represent preliminary indicators for audit inquiry and do not independently constitute legal proof of fraud, misappropriation, or corruption. All flagged discrepancies require physical site verification, measurement book inspection, and administrative reconciliation with the District Nodal Authority.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-2">
            <div>
              Academic Demonstration Prototype · MPLAD Project Fraud Detection System
            </div>
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <button
                onClick={() => navigate('about')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Methodology
              </button>
              <span>·</span>
              <button
                onClick={() => navigate('official-sources')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Data Provenance
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
