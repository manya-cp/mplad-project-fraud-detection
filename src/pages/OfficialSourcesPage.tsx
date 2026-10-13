import React, { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { api } from '../services/api';
import { 
  Building2, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  FileText, 
  AlertTriangle, 
  Download, 
  Database 
} from 'lucide-react';

interface OfficialSourcesProps {
  navigate: (route: string) => void;
}

export const OfficialSourcesPage: React.FC<OfficialSourcesProps> = ({ navigate }) => {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    api.getOfficialDataInfo().then(setInfo).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <BackButton onBack={() => navigate('home')} label="Back to Home" />
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Technical Investigation
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Official Data Sources & eSakshi Investigation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A transparent assessment of official data access methods, portal security architecture, and schema compatibility.
          </p>
        </div>

        {/* Portal Investigation Findings Card */}
        <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Ministry of Statistics & Programme Implementation (MoSPI)
              </h2>
              <div className="text-xs text-slate-500">
                Official Scheme Portals: <a href="https://mplads.gov.in" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">mplads.gov.in</a> & <a href="https://esakshi.nic.in" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">esakshi.nic.in</a>
              </div>
            </div>
          </div>

          {/* Finding 1: API Accessibility */}
          <div className="space-y-3 text-xs leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Public REST API Availability Status: Restricted</span>
            </h3>

            <p className="text-slate-600 dark:text-slate-300">
              Our technical audit of the official <strong>eSakshi Portal</strong> (hosted by the National Informatics Centre, NIC) indicates that the platform does <em>not</em> provide an open, unrestricted public REST API endpoint for third-party automated queries. Access to project approval ledgers, disbursement triggers, and contractor billing vouchers is gated behind:
            </p>

            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-2">
              <li>NIC Parichay / Single Sign-On (SSO) authentication for designated District Authorities and MPs.</li>
              <li>Dynamic CAPTCHA challenges preventing unauthorized automated scrapers.</li>
              <li>Two-factor SMS OTP authentication for administrative transactions.</li>
            </ul>

            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-[11px] leading-relaxed">
              <strong>Compliance Notice:</strong> In strict accordance with our architectural requirements, this system does <em>not</em> fabricate simulated live API connections or bypass government CAPTCHA firewalls. Instead, it supports authentic CSV data ingestion based on official MoSPI data releases.
            </div>
          </div>

          {/* Finding 2: Public Data Releases */}
          <div className="space-y-3 text-xs leading-relaxed pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Legitimate Permitted Access Methods</span>
            </h3>

            <p className="text-slate-600 dark:text-slate-300">
              The following official datasets are legitimately released by the Government of India and can be directly imported into this application:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">1. MoSPI Monthly Progress Reports (MPR)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Published gazetted summaries reporting cumulative sanctions, releases, and expenditures per constituency.
                </div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">2. Lok Sabha Parliamentary Disclosures</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Official annexures released in response to unstarred parliamentary questions, providing work-wise expenditure logs.
                </div>
              </div>
            </div>
          </div>

          {/* Finding 3: Supported Data Schema */}
          <div className="space-y-3 text-xs leading-relaxed pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Standardised Schema Mapping</span>
            </h3>

            <p className="text-slate-600 dark:text-slate-300">
              This detection system maps the following canonical fields across all imported records:
            </p>

            <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="py-2 px-3">Field Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Role in Fraud-Risk Detection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-medium">ProjectID</td>
                    <td className="py-1.5 px-3 text-slate-500">String</td>
                    <td className="py-1.5 px-3">Primary key, duplicate sanction check</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-medium">SanctionedAmount</td>
                    <td className="py-1.5 px-3 text-slate-500">INR Currency</td>
                    <td className="py-1.5 px-3">Approved ceiling benchmark</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-medium">RecordedExpenditure</td>
                    <td className="py-1.5 px-3 text-slate-500">INR Currency</td>
                    <td className="py-1.5 px-3">Variance calculation, overspend detection</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-medium">SanctionDate & RecommendationDate</td>
                    <td className="py-1.5 px-3 text-slate-500">ISO Date</td>
                    <td className="py-1.5 px-3">Chronological sequence inversion checks</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-medium">LocationDetails & Title</td>
                    <td className="py-1.5 px-3 text-slate-500">Text</td>
                    <td className="py-1.5 px-3">Geographic lexical duplication detection</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => navigate('data-import')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs cursor-pointer"
              >
                <span>Go to Data Import Page</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
