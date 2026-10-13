export type VerificationStatus =
  | 'Verified Against Official Source'
  | 'Partially Verified'
  | 'User Uploaded — Not Independently Verified'
  | 'Uploaded — Not Independently Verified'
  | 'Unverified'
  | 'Source Unavailable'
  | 'Demonstration Data — Not Real Project Evidence'
  | 'Demo Data';

export type ProjectStatus =
  | 'Proposed'
  | 'Sanctioned'
  | 'In Progress'
  | 'Completed'
  | 'Stalled'
  | 'Cancelled';

export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Critical' | 'Insufficient Data';

export type AnomalySeverity = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface AnomalyFinding {
  ruleId: string;
  title: string;
  severity: AnomalySeverity;
  category: 'Expenditure' | 'Timeline' | 'Data Integrity' | 'Cost Deviation' | 'Duplication' | 'Status Mismatch';
  explanation: string;
  comparedValues?: {
    labelA: string;
    valueA: string | number;
    labelB: string;
    valueB: string | number;
    difference?: string | number;
  };
  evidence: string;
  sourceReference: string;
  dataLimitations: string;
  recommendedAction: string;
}

export interface Project {
  _id?: string;
  id: string; // Project identifier (e.g. MPLAD-2024-UP-0842)
  title: string;
  description?: string;
  category: string; // e.g., 'Drinking Water', 'Rural Roads', 'Education & Schools', 'Community Hall', 'Health Infrastructure', 'Irrigation'
  state: string;
  district: string;
  constituency?: string;
  mpName?: string;
  mpHouse?: 'Lok Sabha' | 'Rajya Sabha' | 'Nominated';
  sanctionedAmount: number; // in INR
  releasedAmount?: number; // in INR
  recordedExpenditure?: number; // in INR
  currency: 'INR';
  status: ProjectStatus;
  recommendationDate?: string; // YYYY-MM-DD
  sanctionDate?: string; // YYYY-MM-DD
  completionDate?: string; // YYYY-MM-DD
  targetCompletionDate?: string; // YYYY-MM-DD
  implementingAgency?: string;
  locationDetails?: string;
  sourceDocument?: string;
  sourceUrl?: string;
  importDate: string;
  verificationStatus: VerificationStatus;
  dataProvenance: string;
  lastAnalyzedAt?: string;
  riskScore?: number | null;
  riskCategory?: RiskCategory;
  findingsCount?: number;
  findings?: AnomalyFinding[];
  createdBy?: string;
}

export interface AnalysisReport {
  id: string;
  projectId: string;
  projectTitle: string;
  projectNumber: string;
  generatedAt: string;
  generatedByEmail: string;
  generatedByName?: string;
  riskScore: number | null;
  riskCategory: RiskCategory;
  financials: {
    sanctionedAmount: number;
    releasedAmount?: number;
    recordedExpenditure?: number;
    variance?: number;
  };
  verificationStatus: VerificationStatus;
  dataProvenance: string;
  findings: AnomalyFinding[];
  methodologySummary: string;
  dataLimitations: string[];
  recommendedActions: string[];
  aiSummary?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Auditor' | 'Citizen Monitor' | 'District Officer' | 'Student Researcher' | 'Administrator';
  organization?: string;
  createdAt: string;
}

export interface SystemStatus {
  database: {
    connected: boolean;
    type: 'MongoDB' | 'In-Memory Staging Mode';
    host?: string;
    error?: string;
    instructions?: string;
  };
  emailService: {
    configured: boolean;
    provider: 'Gmail SMTP' | 'None';
  };
  geminiService: {
    configured: boolean;
  };
}
