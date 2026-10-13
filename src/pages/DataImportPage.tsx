import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Project, VerificationStatus } from '../types/project';
import { api } from '../services/api';
import { BackButton } from '../components/BackButton';
import { VerificationStatusIndicator } from '../components/StatusBadge';
import { formatINR } from '../engine/fraudDetector';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  RefreshCw, 
  Database,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface DataImportPageProps {
  navigate: (route: string, params?: any) => void;
}

export const DataImportPage: React.FC<DataImportPageProps> = ({ navigate }) => {
  const [csvText, setCsvText] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('User Uploaded — Not Independently Verified');
  const [dataProvenance, setDataProvenance] = useState<string>('Uploaded Government Data Sheet (MoSPI / District Gazette)');
  
  const [parsedRows, setParsedRows] = useState<Partial<Project>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number; duplicates: string[] } | null>(null);

  // Sample CSV Template Generator
  const downloadTemplateCsv = () => {
    const headers = [
      'ProjectID',
      'Title',
      'Category',
      'State',
      'District',
      'Constituency',
      'MPName',
      'MPHouse',
      'SanctionedAmount',
      'ReleasedAmount',
      'RecordedExpenditure',
      'Status',
      'RecommendationDate',
      'SanctionDate',
      'CompletionDate',
      'ImplementingAgency',
      'LocationDetails',
      'SourceDocument',
    ].join(',');

    const sampleRow = [
      'MPLAD-2024-MH-0520',
      '"Construction of Multipurpose Community Hall at Nandgaon"',
      '"Community Hall"',
      '"Maharashtra"',
      '"Nashik"',
      '"Dindori Lok Sabha"',
      '"Hon. MP (Dindori)"',
      '"Lok Sabha"',
      '3000000',
      '3000000',
      '3450000',
      '"Completed"',
      '2023-05-10',
      '2023-08-20',
      '2024-04-15',
      '"Public Works Department (PWD) Division-1"',
      '"Nandgaon Taluka"',
      '"District Gazette File #DPO/MPLAD/2024/520"',
    ].join(',');

    const content = `${headers}\n${sampleRow}\n`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MPLADS_Official_Schema_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parsing function
  const parseCsvContent = (content: string) => {
    setParseErrors([]);
    setImportSuccess(null);
    const lines = content.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      setParseErrors(['CSV file must contain at least a header line and one data record.']);
      setParsedRows([]);
      return;
    }

    // Split CSV respecting quotes
    const splitLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result.map((s) => s.replace(/^"|"$/g, '').trim());
    };

    const header = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows: Partial<Project>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = splitLine(lines[i]);
      if (values.length < 2) continue;

      const rowMap: Record<string, string> = {};
      header.forEach((h, idx) => {
        rowMap[h] = values[idx] || '';
      });

      const projectId = rowMap['projectid'] || rowMap['id'] || rowMap['workid'] || `MPLAD-${Date.now().toString().slice(-6)}-${i}`;
      const title = rowMap['title'] || rowMap['workname'] || rowMap['projectname'] || rowMap['description'];
      const category = rowMap['category'] || rowMap['sector'] || 'General Civic Infrastructure';
      const state = rowMap['state'] || 'Unspecified State';
      const district = rowMap['district'] || 'Unspecified District';
      const sanctioned = parseFloat(rowMap['sanctionedamount'] || rowMap['sanctionamount'] || rowMap['cost'] || '0');
      const released = rowMap['releasedamount'] ? parseFloat(rowMap['releasedamount']) : undefined;
      const expenditure = rowMap['recordedexpenditure'] || rowMap['expenditure'] ? parseFloat(rowMap['recordedexpenditure'] || rowMap['expenditure']) : undefined;
      const status: any = rowMap['status'] || 'In Progress';

      if (!title || title.trim() === '') {
        errors.push(`Row ${i}: Missing Project Title or Work Name.`);
        continue;
      }

      if (isNaN(sanctioned) || sanctioned < 0) {
        errors.push(`Row ${i} (${projectId}): Invalid sanctioned amount.`);
      }

      rows.push({
        id: projectId,
        title,
        category,
        state,
        district,
        constituency: rowMap['constituency'] || '',
        mpName: rowMap['mpname'] || '',
        mpHouse: (rowMap['mphouse'] as any) || 'Lok Sabha',
        sanctionedAmount: isNaN(sanctioned) ? 0 : sanctioned,
        releasedAmount: released,
        recordedExpenditure: expenditure,
        currency: 'INR',
        status,
        recommendationDate: rowMap['recommendationdate'],
        sanctionDate: rowMap['sanctiondate'],
        completionDate: rowMap['completiondate'],
        implementingAgency: rowMap['implementingagency'] || rowMap['agency'] || '',
        locationDetails: rowMap['locationdetails'] || rowMap['location'] || '',
        sourceDocument: rowMap['sourcedocument'] || 'Uploaded CSV Record',
        verificationStatus,
        dataProvenance,
      });
    }

    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          setCsvText(csv);
          parseCsvContent(csv);
        } catch (err: any) {
          setParseErrors(['Failed to read Excel workbook: ' + (err.message || 'Corrupt format')]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        parseCsvContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvText(val);
    parseCsvContent(val);
  };

  const handleCommitImport = async () => {
    if (parsedRows.length === 0) return;

    try {
      setImporting(true);
      // Attach selected verification status and provenance
      const finalPayload = parsedRows.map((r) => ({
        ...r,
        verificationStatus,
        dataProvenance,
      }));

      const res = await api.createProjects(finalPayload);
      setImportSuccess({
        count: res.importedCount,
        duplicates: res.skippedDuplicates,
      });
      setParsedRows([]);
      setCsvText('');
    } catch (err: any) {
      setParseErrors([err.message || 'Import submission failed.']);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <BackButton onBack={() => navigate('dashboard')} label="Back to Dashboard" />
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Data Ingestion
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Import Official Project Records
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload or paste standardized MPLADS dataset exports from MoSPI, District Collectorates, or eSakshi.
            </p>
          </div>

          <button
            onClick={downloadTemplateCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Success Alert */}
        {importSuccess && (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import Successful: {importSuccess.count} Project(s) Ingested</span>
            </div>
            {importSuccess.duplicates.length > 0 && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Skipped {importSuccess.duplicates.length} duplicate project identifier(s): {importSuccess.duplicates.join(', ')}
              </div>
            )}
            <div className="pt-2">
              <button
                onClick={() => navigate('projects')}
                className="font-semibold underline cursor-pointer"
              >
                View in Project Repository →
              </button>
            </div>
          </div>
        )}

        {/* Provenance & Verification Selection Panel */}
        <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Data Provenance & Verification Classification
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every record must explicitly declare its authentic source status to prevent unverified data from being misrepresented as official government statistics.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Verification Status *
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="User Uploaded — Not Independently Verified">
                  User Uploaded — Not Independently Verified
                </option>
                <option value="Verified Against Official Source">
                  Verified Against Official Source
                </option>
                <option value="Partially Verified">
                  Partially Verified
                </option>
                <option value="Unverified">
                  Unverified
                </option>
                <option value="Source Unavailable">
                  Source Unavailable
                </option>
                <option value="Demonstration Data — Not Real Project Evidence">
                  Demonstration Data — Not Real Project Evidence
                </option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data Provenance / Source Citation *
              </label>
              <input
                type="text"
                value={dataProvenance}
                onChange={(e) => setDataProvenance(e.target.value)}
                placeholder="e.g., District Planning Office MPR Gazetted Report 2024"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Upload & Ingestion Input Card */}
        <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Upload CSV or Excel Spreadsheet (.xlsx, .xls)
          </h3>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select an official CSV or Excel data file
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Supports CSV, XLSX, and XLS exports matching official MoSPI Monthly Progress Report or eSakshi formats.
            </p>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 rounded-md cursor-pointer">
              <span>Browse Local File (.csv, .xlsx, .xls)</span>
              <input
                type="file"
                accept=".csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Or Paste CSV Content Here:
            </label>
            <textarea
              rows={5}
              value={csvText}
              onChange={handleTextChange}
              placeholder="ProjectID,Title,Category,State,District,SanctionedAmount,RecordedExpenditure,Status..."
              className="w-full font-mono text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Validation Errors */}
        {parseErrors.length > 0 && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Validation Warning: {parseErrors.length} issue(s) detected</span>
            </div>
            {parseErrors.map((err, i) => (
              <div key={i} className="text-[11px]">• {err}</div>
            ))}
          </div>
        )}

        {/* Ingestion Preview Table */}
        {parsedRows.length > 0 && (
          <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ingestion Preview ({parsedRows.length} valid records ready)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review parsed fields and confirm before committing to repository.
                </p>
              </div>

              <button
                onClick={handleCommitImport}
                disabled={importing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
                <span>{importing ? 'Importing Records...' : `Confirm & Save ${parsedRows.length} Projects`}</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Project ID</th>
                    <th className="py-2 px-3">Title</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3 text-right">Sanctioned</th>
                    <th className="py-2 px-3 text-right">Expenditure</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {parsedRows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-[11px]">{r.id}</td>
                      <td className="py-2 px-3 max-w-xs truncate">{r.title}</td>
                      <td className="py-2 px-3 text-slate-500">{r.district}, {r.state}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(r.sanctionedAmount)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(r.recordedExpenditure)}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 8 && (
                <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
                  + {parsedRows.length - 8} more records
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
