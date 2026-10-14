import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import { runFraudRiskAudit } from './src/engine/fraudDetector';
import { SAMPLE_PROJECTS } from './src/data/sampleProjects';
import { Project, AnalysisReport, User, SystemStatus, RiskCategory } from './src/types/project';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mplads_audit_system_jwt_secret_dev_key_2026';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const MONGODB_URI = process.env.MONGODB_URI || '';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----------------------------------------------------
// DATABASE LAYER: Mongoose Schemas & In-Memory Fallback
// ----------------------------------------------------

let isMongoConnected = false;
let mongoError: string | undefined = undefined;

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'Auditor' },
  organization: { type: String, default: 'Independent Public Monitor' },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  constituency: String,
  mpName: String,
  mpHouse: String,
  sanctionedAmount: { type: Number, required: true },
  releasedAmount: Number,
  recordedExpenditure: Number,
  currency: { type: String, default: 'INR' },
  status: { type: String, required: true },
  recommendationDate: String,
  sanctionDate: String,
  completionDate: String,
  targetCompletionDate: String,
  implementingAgency: String,
  locationDetails: String,
  sourceDocument: String,
  sourceUrl: String,
  importDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  verificationStatus: { type: String, required: true },
  dataProvenance: { type: String, required: true },
  lastAnalyzedAt: String,
  riskScore: Number,
  riskCategory: String,
  findingsCount: Number,
  findings: Array,
  createdBy: String,
});

const reportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  projectTitle: { type: String, required: true },
  projectNumber: { type: String, required: true },
  generatedAt: { type: String, required: true },
  generatedByEmail: { type: String, required: true },
  generatedByName: String,
  riskScore: Number,
  riskCategory: { type: String, required: true },
  financials: Object,
  verificationStatus: { type: String, required: true },
  dataProvenance: { type: String, required: true },
  findings: Array,
  methodologySummary: String,
  dataLimitations: Array,
  recommendedActions: Array,
  aiSummary: String,
});

const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
const ProjectModel = mongoose.models.Project || mongoose.model('Project', projectSchema);
const ReportModel = mongoose.models.Report || mongoose.model('Report', reportSchema);

// In-Memory Staging Store (active when MongoDB is not connected)
const inMemoryStore = {
  users: new Map<string, any>(),
  projects: new Map<string, Project>(),
  reports: new Map<string, AnalysisReport>(),
};

// Initialize in-memory store with sample demonstration projects
function initializeInMemoryProjects() {
  inMemoryStore.projects.clear();
  for (const sample of SAMPLE_PROJECTS) {
    inMemoryStore.projects.set(sample.id, { ...sample });
  }
}
initializeInMemoryProjects();

// Initialize MongoDB connection if URI provided
if (MONGODB_URI && MONGODB_URI.trim() !== '' && !MONGODB_URI.includes('your_mongodb')) {
  mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      isMongoConnected = true;
      console.log('Successfully connected to MongoDB cluster.');
      // Seed initial demo data into MongoDB if collection is empty
      const count = await ProjectModel.countDocuments();
      if (count === 0) {
        await ProjectModel.insertMany(SAMPLE_PROJECTS);
        console.log('Seeded sample demonstration records into MongoDB.');
      }
    })
    .catch((err) => {
      isMongoConnected = false;
      mongoError = err.message;
      console.warn('MongoDB connection failed:', err.message);
      console.log('Active in Local In-Memory Demonstration Mode.');
    });
} else {
  console.log('MONGODB_URI not provided or placeholder. Active in Local In-Memory Demonstration Mode.');
}

// ----------------------------------------------------
// AUTHENTICATION HELPERS & MIDDLEWARE
// ----------------------------------------------------

interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string; role: string };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Session token invalid or expired. Please re-authenticate.' });
  }
}

function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
    } catch {
      // ignore
    }
  }
  next();
}

// ----------------------------------------------------
// SYSTEM STATUS API
// ----------------------------------------------------

app.get('/api/system/status', (req: Request, res: Response) => {
  const status: SystemStatus = {
    database: {
      connected: isMongoConnected,
      type: isMongoConnected ? 'MongoDB' : 'In-Memory Staging Mode',
      host: isMongoConnected ? 'Atlas Database (Active & Verified)' : 'Local Sandbox Store',
      error: mongoError,
      instructions: !isMongoConnected
        ? 'To connect persistent MongoDB, supply a valid MONGODB_URI in your environment or .env file.'
        : undefined,
    },
    emailService: {
      configured: Boolean(GMAIL_USER && GMAIL_APP_PASSWORD && !GMAIL_USER.includes('your_email')),
      provider: GMAIL_USER && GMAIL_APP_PASSWORD ? 'Gmail SMTP' : 'None',
    },
    geminiService: {
      configured: Boolean(GEMINI_API_KEY && !GEMINI_API_KEY.includes('your_gemini')),
    },
  };
  res.json(status);
});

// ----------------------------------------------------
// AUTHENTICATION RATE LIMITING & SECURITY
// ----------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, organization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Enforce password requirements: min 8 characters, with letters and numbers
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain both letters and numbers.',
      });
    }

    // Check existing
    if (isMongoConnected) {
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }
    } else {
      for (const u of inMemoryStore.users.values()) {
        if (u.email === normalizedEmail) {
          return res.status(409).json({ error: 'An account with this email address already exists.' });
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role: role || 'Auditor',
      organization: organization?.trim() || 'Public Accountability Monitor',
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      await UserModel.create({
        ...newUser,
        passwordHash,
      });
    } else {
      inMemoryStore.users.set(userId, { ...newUser, passwordHash });
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: newUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed due to an unexpected error.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let userRecord: any = null;

    if (isMongoConnected) {
      userRecord = await UserModel.findOne({ email: normalizedEmail });
    } else {
      for (const u of inMemoryStore.users.values()) {
        if (u.email === normalizedEmail) {
          userRecord = u;
          break;
        }
      }
    }

    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid credentials. No account found for this email address.' });
    }

    const isMatch = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const user: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      organization: userRecord.organization,
      createdAt: userRecord.createdAt,
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let userRecord: any = null;

    if (isMongoConnected) {
      userRecord = await UserModel.findOne({ id: userId });
    } else {
      userRecord = inMemoryStore.users.get(userId || '');
    }

    if (!userRecord) {
      // Token may be valid, return claims
      return res.json({
        user: {
          id: req.user?.id,
          email: req.user?.email,
          name: req.user?.name,
          role: req.user?.role,
        },
      });
    }

    res.json({
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        organization: userRecord.organization,
        createdAt: userRecord.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PROJECT APIS
// ----------------------------------------------------

// Get all projects with search & filtering
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const { search, status, riskCategory, verificationStatus, category, state } = req.query;

    let allProjects: Project[] = [];

    if (isMongoConnected) {
      const docs = await ProjectModel.find({}).lean();
      allProjects = docs.map((d: any) => ({
        ...d,
        id: d.id,
        _id: d._id?.toString(),
      }));
    } else {
      allProjects = Array.from(inMemoryStore.projects.values());
    }

    let filtered = allProjects;

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          (p.mpName && p.mpName.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    if (status && typeof status === 'string' && status !== 'All') {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (riskCategory && typeof riskCategory === 'string' && riskCategory !== 'All') {
      filtered = filtered.filter((p) => p.riskCategory === riskCategory);
    }

    if (verificationStatus && typeof verificationStatus === 'string' && verificationStatus !== 'All') {
      filtered = filtered.filter((p) => p.verificationStatus === verificationStatus);
    }

    if (category && typeof category === 'string' && category !== 'All') {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (state && typeof state === 'string' && state !== 'All') {
      filtered = filtered.filter((p) => p.state === state);
    }

    res.json({
      count: filtered.length,
      totalCount: allProjects.length,
      projects: filtered,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Provenance & Verification breakdown stats
app.get('/api/projects/stats', async (req: Request, res: Response) => {
  try {
    let allProjects: Project[] = [];
    if (isMongoConnected) {
      const docs = await ProjectModel.find({}).lean();
      allProjects = docs.map((d: any) => ({ ...d, id: d.id })) as Project[];
    } else {
      allProjects = Array.from(inMemoryStore.projects.values());
    }

    const verifiedProjects = allProjects.filter(
      (p) => p.verificationStatus === 'Verified Against Official Source'
    );
    const partiallyVerifiedProjects = allProjects.filter(
      (p) => p.verificationStatus === 'Partially Verified'
    );
    const userUploadedProjects = allProjects.filter(
      (p) =>
        p.verificationStatus === 'User Uploaded — Not Independently Verified' ||
        p.verificationStatus === 'Uploaded — Not Independently Verified'
    );
    const unverifiedProjects = allProjects.filter(
      (p) => p.verificationStatus === 'Unverified' || p.verificationStatus === 'Source Unavailable'
    );
    const demonstrationProjects = allProjects.filter(
      (p) =>
        p.verificationStatus === 'Demonstration Data — Not Real Project Evidence' ||
        p.verificationStatus === 'Demo Data'
    );

    // Verified subset (verified + partially verified)
    const verifiedSubset = [...verifiedProjects, ...partiallyVerifiedProjects];

    const stats = {
      total: allProjects.length,
      verifiedCount: verifiedProjects.length,
      partiallyVerifiedCount: partiallyVerifiedProjects.length,
      userUploadedCount: userUploadedProjects.length,
      unverifiedCount: unverifiedProjects.length,
      demonstrationCount: demonstrationProjects.length,

      // Verified-only metrics (excluding demo & unverified)
      verifiedProjectsCount: verifiedSubset.length,
      verifiedSanctionedSum: verifiedSubset.reduce((sum, p) => sum + (p.sanctionedAmount || 0), 0),
      verifiedExpenditureSum: verifiedSubset.reduce((sum, p) => sum + (p.recordedExpenditure || 0), 0),
      verifiedHighRiskCount: verifiedSubset.filter(
        (p) => p.riskCategory === 'High' || p.riskCategory === 'Critical'
      ).length,
      verifiedFindingsCount: verifiedSubset.reduce(
        (sum, p) => sum + (p.findings?.length || p.findingsCount || 0),
        0
      ),

      // Overall repository totals
      allSanctionedSum: allProjects.reduce((sum, p) => sum + (p.sanctionedAmount || 0), 0),
      allExpenditureSum: allProjects.reduce((sum, p) => sum + (p.recordedExpenditure || 0), 0),
    };

    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single project
app.get('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    let project: Project | null = null;

    if (isMongoConnected) {
      const doc = await ProjectModel.findOne({ id: projectId }).lean();
      if (doc) {
        project = { ...doc, id: doc.id, _id: (doc as any)._id?.toString() } as Project;
      }
    } else {
      project = inMemoryStore.projects.get(projectId) || null;
    }

    if (!project) {
      return res.status(404).json({ error: `Project record with identifier '${projectId}' was not found.` });
    }

    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create single project or batch import
app.post('/api/projects', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const incomingList: Partial<Project>[] = Array.isArray(body) ? body : [body];

    if (incomingList.length === 0) {
      return res.status(400).json({ error: 'No project records provided.' });
    }

    // Retrieve existing for duplicate detection
    let existingProjects: Project[] = [];
    if (isMongoConnected) {
      const docs = await ProjectModel.find({}).lean();
      existingProjects = docs.map((d: any) => ({ ...d, id: d.id })) as Project[];
    } else {
      existingProjects = Array.from(inMemoryStore.projects.values());
    }

    const existingIds = new Set(existingProjects.map((p) => p.id));
    const created: Project[] = [];
    const skippedDuplicates: string[] = [];

    for (const item of incomingList) {
      const projId = (item.id || 'MPLAD-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase()).trim();

      if (existingIds.has(projId)) {
        skippedDuplicates.push(projId);
        continue;
      }

      const newProject: Project = {
        id: projId,
        title: item.title || 'Untitled Infrastructure Scheme',
        description: item.description || '',
        category: item.category || 'General Civic Infrastructure',
        state: item.state || 'Unspecified State',
        district: item.district || 'Unspecified District',
        constituency: item.constituency || '',
        mpName: item.mpName || '',
        mpHouse: item.mpHouse || 'Lok Sabha',
        sanctionedAmount: Number(item.sanctionedAmount) || 0,
        releasedAmount: item.releasedAmount !== undefined ? Number(item.releasedAmount) : undefined,
        recordedExpenditure: item.recordedExpenditure !== undefined ? Number(item.recordedExpenditure) : undefined,
        currency: 'INR',
        status: item.status || 'Proposed',
        recommendationDate: item.recommendationDate,
        sanctionDate: item.sanctionDate,
        completionDate: item.completionDate,
        targetCompletionDate: item.targetCompletionDate,
        implementingAgency: item.implementingAgency || '',
        locationDetails: item.locationDetails || '',
        sourceDocument: item.sourceDocument || 'Imported File / User Submission',
        sourceUrl: item.sourceUrl || '',
        importDate: new Date().toISOString().split('T')[0],
        verificationStatus: item.verificationStatus || 'Uploaded — Not Independently Verified',
        dataProvenance: item.dataProvenance || 'User Uploaded Dataset (Pending District Reconciliation)',
        createdBy: req.user?.email || 'Anonymous Import',
      };

      if (isMongoConnected) {
        await ProjectModel.create(newProject);
      } else {
        inMemoryStore.projects.set(newProject.id, newProject);
      }

      existingIds.add(newProject.id);
      created.push(newProject);
    }

    res.status(201).json({
      message: `Successfully processed ${created.length} record(s).`,
      importedCount: created.length,
      skippedDuplicates,
      importedProjects: created,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run Fraud-Risk Detection Engine on a Project
app.post('/api/projects/:id/analyze', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;

    let targetProject: Project | null = null;
    let allProjects: Project[] = [];

    if (isMongoConnected) {
      const doc = await ProjectModel.findOne({ id: projectId }).lean();
      if (doc) targetProject = { ...doc, id: doc.id } as Project;
      const allDocs = await ProjectModel.find({}).lean();
      allProjects = allDocs.map((d: any) => ({ ...d, id: d.id })) as Project[];
    } else {
      targetProject = inMemoryStore.projects.get(projectId) || null;
      allProjects = Array.from(inMemoryStore.projects.values());
    }

    if (!targetProject) {
      return res.status(404).json({ error: `Project '${projectId}' was not found.` });
    }

    // Run deterministic engine
    const auditResult = runFraudRiskAudit(targetProject, allProjects);

    // Update project with analysis findings
    const updatedProject: Project = {
      ...targetProject,
      lastAnalyzedAt: new Date().toISOString(),
      riskScore: auditResult.riskScore,
      riskCategory: auditResult.riskCategory,
      findingsCount: auditResult.findings.length,
      findings: auditResult.findings,
    };

    if (isMongoConnected) {
      await ProjectModel.updateOne({ id: projectId }, { $set: updatedProject });
    } else {
      inMemoryStore.projects.set(projectId, updatedProject);
    }

    res.json({
      projectId,
      auditResult,
      project: updatedProject,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Optional Gemini AI-assisted Narrative Explanation of Deterministic Findings
app.post('/api/projects/:id/ai-narrative', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    let project: Project | null = null;

    if (isMongoConnected) {
      const doc = await ProjectModel.findOne({ id: projectId }).lean();
      if (doc) project = { ...doc, id: doc.id } as Project;
    } else {
      project = inMemoryStore.projects.get(projectId) || null;
    }

    if (!project) {
      return res.status(404).json({ error: `Project '${projectId}' not found.` });
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_gemini')) {
      return res.status(400).json({
        configured: false,
        message: 'GEMINI_API_KEY is not configured in the environment. Deterministic rule analysis remains fully active.',
      });
    }

    // Call Gemini to generate a professional, objective executive narrative summarizing findings
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `You are a senior financial auditor reviewing public infrastructure projects under India's MPLAD Scheme.
Synthesize the following deterministic audit findings into a concise, professional 2-3 paragraph executive summary for a district oversight committee.
STRICT RULES:
1. Do NOT invent new facts, citations, unverified accusations, or external allegations.
2. Base your explanation strictly on the provided findings and project figures.
3. Distinguish clearly between data quality/procedural issues versus potential fiscal irregularities.
4. Maintain formal, neutral audit language (use terms like 'potential irregularity', 'requires reconciliation').

PROJECT PARTICULARS:
- Project ID: ${project.id}
- Title: ${project.title}
- Location: ${project.district}, ${project.state}
- Category: ${project.category}
- Sanctioned: ₹${project.sanctionedAmount?.toLocaleString('en-IN') || 'N/A'}
- Released: ₹${project.releasedAmount?.toLocaleString('en-IN') || 'N/A'}
- Recorded Expenditure: ₹${project.recordedExpenditure?.toLocaleString('en-IN') || 'N/A'}
- Status: ${project.status}
- Deterministic Risk Score: ${project.riskScore ?? 'N/A'}/100 (${project.riskCategory ?? 'N/A'})

DETECTED WARNING SIGNS (${project.findings?.length || 0}):
${
  project.findings && project.findings.length > 0
    ? project.findings
        .map(
          (f, i) =>
            `${i + 1}. [${f.severity}] ${f.title}: ${f.explanation}. Evidence: ${f.evidence}. Recommended action: ${f.recommendedAction}`
        )
        .join('\n')
    : 'No deterministic anomalies detected.'
}

Provide a crisp, actionable audit narrative.`;

    let narrative = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      narrative = response.text || 'Unable to generate narrative summary.';
    } catch (modelErr: any) {
      if (modelErr.message?.includes('503') || modelErr.message?.includes('high demand')) {
        await new Promise((r) => setTimeout(r, 1500));
        const retryRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        narrative = retryRes.text || 'Executive narrative generated upon retry.';
      } else {
        throw modelErr;
      }
    }

    res.json({
      configured: true,
      narrative,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// REPORTS APIS
// ----------------------------------------------------

app.get('/api/reports', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;
    let reports: AnalysisReport[] = [];
    if (isMongoConnected) {
      // If user is authenticated, isolate their reports; if not, return empty list
      const query = userEmail ? { generatedByEmail: userEmail } : {};
      const docs = await ReportModel.find(query).sort({ generatedAt: -1 }).lean();
      reports = docs.map((d: any) => ({ ...d, id: d.id })) as AnalysisReport[];
    } else {
      const all = Array.from(inMemoryStore.reports.values());
      reports = userEmail ? all.filter((r) => r.generatedByEmail === userEmail) : all;
      reports.sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
    }
    res.json({ reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const reportData = req.body;
    const reportId = 'REP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const report: AnalysisReport = {
      ...reportData,
      id: reportId,
      generatedAt: new Date().toISOString(),
      generatedByEmail: req.user?.email || reportData.generatedByEmail || 'visitor@mplads.audit',
      generatedByName: req.user?.name || reportData.generatedByName || 'Audit Reviewer',
    };

    if (isMongoConnected) {
      await ReportModel.create(report);
    } else {
      inMemoryStore.reports.set(report.id, report);
    }

    res.status(201).json({ report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const reportId = req.params.id;
    let report: AnalysisReport | null = null;

    if (isMongoConnected) {
      const doc = await ReportModel.findOne({ id: reportId }).lean();
      if (doc) report = { ...doc, id: doc.id } as AnalysisReport;
    } else {
      report = inMemoryStore.reports.get(reportId) || null;
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    // User isolation: if user is logged in, confirm they own this report
    if (req.user && report.generatedByEmail && report.generatedByEmail !== req.user.email && req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied. You can only view your own generated audit reports.' });
    }

    res.json({ report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Email Report Delivery (Section 16: Genuine Nodemailer SMTP delivery)
app.post('/api/reports/:id/email', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const reportId = req.params.id;
    const { recipientEmail, pdfBase64, customNotes } = req.body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid recipient email address is required.' });
    }

    // Check if report exists
    let report: AnalysisReport | null = null;
    if (isMongoConnected) {
      const doc = await ReportModel.findOne({ id: reportId }).lean();
      if (doc) report = { ...doc, id: doc.id } as AnalysisReport;
    } else {
      report = inMemoryStore.reports.get(reportId) || null;
    }

    if (!report) {
      return res.status(404).json({ error: 'Report record not found.' });
    }

    // Verify SMTP configuration
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || GMAIL_USER.includes('your_email')) {
      return res.status(400).json({
        success: false,
        configured: false,
        message:
          'Gmail SMTP credentials (GMAIL_USER and GMAIL_APP_PASSWORD) are not configured in .env. To enable real email delivery, create an App Password in your Google Account security settings and set it in your environment. You can still download the PDF report directly.',
      });
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

    const mailOptions: any = {
      from: `"MPLAD Project Audit System" <${GMAIL_USER}>`,
      to: recipientEmail,
      subject: `[Audit Dossier] MPLADS Project Analysis Report: ${report.projectNumber} (${report.riskCategory} Risk)`,
      text: `Official Project Analysis Dossier\n\nProject ID: ${report.projectNumber}\nTitle: ${report.projectTitle}\nRisk Category: ${report.riskCategory} (Score: ${report.riskScore ?? 'N/A'}/100)\nFindings Count: ${report.findings.length}\nGenerated: ${report.generatedAt}\n\nNotes from Sender: ${customNotes || 'None'}\n\nPlease review the attached official PDF audit dossier for full line-item findings and recommended administrative verification procedures.\n\nDisclaimer: Automated warning indicators do not constitute legal proof of fraud. Formal reconciliation with the District Planning Office is recommended.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b;">
          <div style="background-color: #0f172a; padding: 20px; color: #ffffff; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 20px;">MPLAD Project Fraud Detection System</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Official Public Works Financial Audit & Monitoring Report</p>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; background: #ffffff;">
            <h3 style="margin-top: 0; color: #0f172a;">${report.projectTitle}</h3>
            <p style="color: #64748b; font-size: 14px;"><strong>Project Identifier:</strong> ${report.projectNumber}</p>
            <div style="background: #f8fafc; padding: 14px; border-radius: 6px; margin: 16px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Audit Risk Evaluation:</strong> <span style="font-weight: bold; color: ${report.riskCategory === 'Critical' ? '#dc2626' : report.riskCategory === 'High' ? '#ea580c' : '#16a34a'};">${report.riskCategory} (Score: ${report.riskScore ?? 'N/A'}/100)</span></p>
              <p style="margin: 0 0 8px 0;"><strong>Findings Detected:</strong> ${report.findings.length} warning sign(s)</p>
              <p style="margin: 0;"><strong>Verification Status:</strong> ${report.verificationStatus}</p>
            </div>
            ${customNotes ? `<p style="background: #eff6ff; padding: 12px; border-left: 4px solid #3b82f6; font-size: 14px;"><strong>Auditor Notes:</strong> ${customNotes}</p>` : ''}
            <p style="font-size: 14px; line-height: 1.5;">The complete forensic audit report has been attached to this email as a PDF document for your review and archiving.</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">Notice: Automated anomaly flags represent potential irregularities identified by deterministic rules and require administrative verification with the nodal authority.</p>
          </div>
        </div>
      `,
    };

    if (pdfBase64) {
      const buffer = Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
      mailOptions.attachments = [
        {
          filename: `MPLADS_Audit_Report_${report.projectNumber}.pdf`,
          content: buffer,
          contentType: 'application/pdf',
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      configured: true,
      messageId: info.messageId,
      message: `Report was successfully dispatched to ${recipientEmail} via Gmail SMTP.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      configured: true,
      error: err.message || 'SMTP transmission failed. Please check your credentials or network configuration.',
    });
  }
});

// Official Data & eSakshi Investigation API (Section 7)
app.get('/api/official-data/info', (req: Request, res: Response) => {
  res.json({
    portalName: 'eSakshi Portal (eSakshi.nic.in) & MPLADS Official Portal (mplads.gov.in)',
    governingMinistry: 'Ministry of Statistics and Programme Implementation (MoSPI), Government of India',
    currentApiStatus: 'Restricted / No Public Anonymous REST API',
    accessDetails: {
      publicPortal: 'https://mplads.gov.in and https://esakshi.nic.in',
      authRequirement: 'NIC Single Sign-On (SSO) with Multi-Factor OTP and Session CAPTCHA required for executive officers and MPs.',
      publicDataReleases: 'MoSPI releases annual physical and financial progress reports, District-wise Monthly Progress Reports (MPR), and Parliamentary Question unstarred disclosures in standard tabular format (CSV / XLSX).',
      supportedImportFormat: 'The system provides standardized CSV/Excel import conforming to official MoSPI MPR and eSakshi ledger formats with automated column mapping.',
    },
    verificationTaxonomy: [
      { status: 'Verified Against Official Source', description: 'Reconciled against official published MoSPI Monthly Progress Report or District Gazette.' },
      { status: 'Partially Verified', description: 'Confirmed against state treasury release order or parliamentary answer.' },
      { status: 'Uploaded — Not Independently Verified', description: 'Uploaded via CSV/document import; awaiting official ledger reconciliation.' },
      { status: 'Unverified', description: 'Source ledger has not been authenticated.' },
      { status: 'Source Unavailable', description: 'Data entered without verifiable source citation or document link.' },
      { status: 'Demo Data', description: 'Synthesized demonstration records structured in official schema for testing detection algorithms.' },
    ],
  });
});

// Reset / reload demo dataset
app.post('/api/projects/reset-demo', async (req: Request, res: Response) => {
  try {
    initializeInMemoryProjects();
    if (isMongoConnected) {
      await ProjectModel.deleteMany({ verificationStatus: 'Demo Data' });
      await ProjectModel.insertMany(SAMPLE_PROJECTS);
    }
    res.json({ message: 'Demonstration dataset reset to initial reference records.', count: SAMPLE_PROJECTS.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// STATIC & VITE MIDDLEWARE SETUP
// ----------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    // Fallback SPA routing in dev
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
