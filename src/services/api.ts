import { Project, AnalysisReport, User, SystemStatus } from '../types/project';

const TOKEN_KEY = 'mplads_auth_token';

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // System status
  getSystemStatus: () => request<SystemStatus>('/api/system/status'),

  // Auth
  register: (payload: { name: string; email: string; password: string; role?: string; organization?: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => request<{ user: User }>('/api/auth/me'),

  // Projects
  getProjects: (params?: {
    search?: string;
    status?: string;
    riskCategory?: string;
    verificationStatus?: string;
    category?: string;
    state?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'All') query.append(k, v);
      });
    }
    const qStr = query.toString();
    return request<{ count: number; totalCount: number; projects: Project[] }>(`/api/projects${qStr ? `?${qStr}` : ''}`);
  },

  getProjectStats: () =>
    request<{
      stats: {
        total: number;
        verifiedCount: number;
        partiallyVerifiedCount: number;
        userUploadedCount: number;
        unverifiedCount: number;
        demonstrationCount: number;
        verifiedProjectsCount: number;
        verifiedSanctionedSum: number;
        verifiedExpenditureSum: number;
        verifiedHighRiskCount: number;
        verifiedFindingsCount: number;
        allSanctionedSum: number;
        allExpenditureSum: number;
      };
    }>('/api/projects/stats'),

  getProject: (id: string) => request<{ project: Project }>(`/api/projects/${encodeURIComponent(id)}`),

  createProjects: (projects: Partial<Project> | Partial<Project>[]) =>
    request<{ message: string; importedCount: number; skippedDuplicates: string[]; importedProjects: Project[] }>(
      '/api/projects',
      {
        method: 'POST',
        body: JSON.stringify(projects),
      }
    ),

  analyzeProject: (id: string) =>
    request<{ projectId: string; auditResult: any; project: Project }>(`/api/projects/${encodeURIComponent(id)}/analyze`, {
      method: 'POST',
    }),

  generateAiNarrative: (id: string) =>
    request<{ configured: boolean; narrative?: string; message?: string }>(`/api/projects/${encodeURIComponent(id)}/ai-narrative`, {
      method: 'POST',
    }),

  resetDemoData: () => request<{ message: string; count: number }>('/api/projects/reset-demo', { method: 'POST' }),

  // Reports
  getReports: () => request<{ reports: AnalysisReport[] }>('/api/reports'),

  getReport: (id: string) => request<{ report: AnalysisReport }>(`/api/reports/${encodeURIComponent(id)}`),

  saveReport: (report: Partial<AnalysisReport>) =>
    request<{ report: AnalysisReport }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    }),

  sendReportEmail: (reportId: string, payload: { recipientEmail: string; pdfBase64?: string; customNotes?: string }) =>
    request<{ success: boolean; configured: boolean; message?: string; messageId?: string; error?: string }>(
      `/api/reports/${encodeURIComponent(reportId)}/email`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Official data info
  getOfficialDataInfo: () => request<any>('/api/official-data/info'),
};
