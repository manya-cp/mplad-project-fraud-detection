import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, X, ExternalLink, Copy, Check } from 'lucide-react';
import { SystemStatus } from '../types/project';

interface DbStatusBannerProps {
  status: SystemStatus | null;
}

export const DbStatusBanner: React.FC<DbStatusBannerProps> = ({ status }) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isConnected = status?.database?.connected;
  const isDemoMode = status?.database?.type === 'In-Memory Staging Mode';

  const envSample = `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mplads_fraud_db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_gemini_api_key
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
PORT=3000`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Database:</span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MongoDB Connected ({status?.database?.host || 'Active Cluster'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Local Staging Mode (MONGODB_URI not configured)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">
              {isConnected
                ? 'Persistent records active'
                : 'All audit rules, PDF exports & CSV imports fully functional'}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px] cursor-pointer"
            >
              {isConnected ? 'View DB Details' : 'MongoDB Setup Guide'}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  MongoDB Configuration Status
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data Persistence & Database Architecture
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Current Engine:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {isConnected ? 'MongoDB Cluster (Mongoose)' : 'Local In-Memory Staging Mode'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Connection Status:</span>
                  <span className={isConnected ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {isConnected ? 'Online & Verified' : 'Unconnected (Fallback active)'}
                  </span>
                </div>
                {status?.database?.error && (
                  <div className="text-rose-600 dark:text-rose-400 text-[11px] pt-1">
                    Error: {status.database.error}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1.5">
                  How to Connect to MongoDB:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Create a free MongoDB database cluster on <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">MongoDB Atlas</a> or run local MongoDB.</li>
                  <li>Obtain your connection string URI (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">mongodb+srv://...</code>).</li>
                  <li>Add <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">MONGODB_URI</code> to your <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">.env</code> file.</li>
                  <li>Restart the application server to connect immediately.</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Sample .env Configuration:</span>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-md bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  {envSample}
                </pre>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
