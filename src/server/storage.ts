import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EXPERIMENTS_LIST, Experiment } from '../data/experimentsData';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  university: string;
  studyLevel: string;
  role: 'owner' | 'student';
  status: 'active' | 'pending' | 'suspended';
  passwordHash: string;
  salt: string;
  createdAt: string;
  subscription?: {
    status: 'active' | 'expired' | 'none';
    startsAt: string;
    expiresAt: string;
    planName: string;
  };
}

export interface ActivationCode {
  id: string;
  code: string;
  durationDays: number;
  planName: string;
  createdAt: string;
  expiresAt?: string;
  status: 'available' | 'used' | 'revoked';
  usedByStudentId?: string;
  usedByStudentName?: string;
  usedAt?: string;
}

export interface SavedCircuit {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description?: string;
  elements: any[];
  wires: any[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  userName: string;
  experimentId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Record<string, number>;
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface LabSettings {
  academyName: string;
  labTitle: string;
  requireOwnerApprovalForRegistration: boolean;
  defaultTrialDays: number;
  subscriptionPlans: { id: string; name: string; durationDays: number; priceYMR: number }[];
  allowedUniversities: string[];
  allowedLevels: string[];
}

export interface DatabaseSchema {
  users: User[];
  activationCodes: ActivationCode[];
  experiments: Experiment[];
  savedCircuits: SavedCircuit[];
  quizAttempts: QuizAttempt[];
  auditLogs: AuditLog[];
  settings: LabSettings;
  stats: {
    simulationRunsCount: number;
  };
}

// Determine writable directory for serverless environments (like Vercel /tmp)
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isServerless 
  ? path.resolve('/tmp', 'circuitsimulator-data')
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BUNDLED_DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

// Ensure data folder exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create DATA_DIR, will use in-memory fallback:', e);
}

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let cleaned = String(raw).trim();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replaceAll(easternDigits[i], String(i));
  }
  // Remove formatting characters
  cleaned = cleaned.replace(/[\s\-\(\)\.]+/g, '');
  // Strip Yemeni prefixes (+967 or 00967)
  cleaned = cleaned.replace(/^(\+967|00967)/, '');
  // If 10 digits starting with 0 (e.g. 0777000000), strip leading 0
  if (/^0[7|1]/.test(cleaned) && cleaned.length === 10) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

// Password hashing helpers
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha256').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return result === hash;
}

// JWT-style signed token helpers
const JWT_SECRET = process.env.JWT_SECRET || 'yemen-mechatronics-secret-key-2026-super-secure';

export function createToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Initial DB seed
function getInitialDatabase(): DatabaseSchema {
  const ownerPass = process.env.OWNER_PASSWORD || '@Admin_aseel780#';
  const ownerPhone = process.env.OWNER_PHONE || '785502919';
  const ownerHashed = hashPassword(ownerPass);

  const studentPass = 'StudentPass123!';
  const studentHashed = hashPassword(studentPass);

  const now = new Date();
  const subExpires = new Date();
  subExpires.setDate(now.getDate() + 180);

  const initialOwner: User = {
    id: 'user-owner-1',
    fullName: 'المهندس المشرف (مالك المنصة)',
    phone: ownerPhone,
    university: 'الجامعة الإماراتية الدولية - صنعاء',
    studyLevel: 'الهيئة التدريسية',
    role: 'owner',
    status: 'active',
    passwordHash: ownerHashed.hash,
    salt: ownerHashed.salt,
    createdAt: now.toISOString(),
  };

  const demoStudent: User = {
    id: 'user-student-demo',
    fullName: 'أحمد محمد الكبسي',
    phone: '771234567',
    university: 'الجامعة الإماراتية الدولية',
    studyLevel: 'السنة الأولى',
    role: 'student',
    status: 'active',
    passwordHash: studentHashed.hash,
    salt: studentHashed.salt,
    createdAt: now.toISOString(),
    subscription: {
      status: 'active',
      startsAt: now.toISOString(),
      expiresAt: subExpires.toISOString(),
      planName: 'اشتراك فصلي (180 يوم)',
    },
  };

  const initialCodes: ActivationCode[] = [
    {
      id: 'code-1',
      code: 'EIU-MECH-2026',
      durationDays: 180,
      planName: 'اشتراك فصلي (الجامعة الإماراتية)',
      createdAt: now.toISOString(),
      status: 'available',
    },
    {
      id: 'code-2',
      code: 'YEMEN-LAB-YEAR1',
      durationDays: 365,
      planName: 'اشتراك سنوي كامل (365 يوم)',
      createdAt: now.toISOString(),
      status: 'available',
    },
    {
      id: 'code-3',
      code: 'CIRCUIT-TRIAL-30',
      durationDays: 30,
      planName: 'اشتراك تجريبي (30 يوم)',
      createdAt: now.toISOString(),
      status: 'available',
    },
  ];

  const defaultSettings: LabSettings = {
    academyName: 'أكاديمية الميكاترونكس اليمنية',
    labTitle: 'مختبر الدوائر الكهربائية التفاعلي',
    requireOwnerApprovalForRegistration: true, // Requires owner approval before student can use anything
    defaultTrialDays: 14,
    subscriptionPlans: [
      { id: 'plan-1', name: 'اشتراك تجريبي (14 يوم)', durationDays: 14, priceYMR: 0 },
      { id: 'plan-2', name: 'اشتراك فصلي (180 يوم)', durationDays: 180, priceYMR: 5000 },
      { id: 'plan-3', name: 'اشتراك سنوي (365 يوم)', durationDays: 365, priceYMR: 8000 },
    ],
    allowedUniversities: [
      'الجامعة الإماراتية الدولية',
      'جامعة العلوم الحديثة',
      'جامعة الرشيد',
      'جامعة العلوم والتكنولوجيا',
      'جامعة صنعاء',
      'جامعة آزال',
      'جامعة أخرى',
    ],
    allowedLevels: [
      'السنة الأولى',
      'السنة الثانية',
      'السنة الثالثة',
      'السنة الرابعة',
      'السنة الخامسة',
    ],
  };

  return {
    users: [initialOwner, demoStudent],
    activationCodes: initialCodes,
    experiments: EXPERIMENTS_LIST.map(e => ({ ...e, isPublished: true })),
    savedCircuits: [],
    quizAttempts: [],
    auditLogs: [
      {
        id: 'log-1',
        action: 'تهيئة النظام',
        performedBy: 'النظام الآلي',
        details: 'تمت تهيئة قاعدة البيانات وإنشاء حساب المالك الأول والرموز التجريبية بنجاح.',
        timestamp: now.toISOString(),
      },
    ],
    settings: defaultSettings,
    stats: {
      simulationRunsCount: 15,
    },
  };
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading DB_FILE, trying fallback:', err);
      }
    }

    // If running on serverless, copy initial bundled data/db.json if it exists
    if (fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.saveDirect(parsed);
        return parsed;
      } catch (err) {
        console.error('Error reading BUNDLED_DB_FILE, generating default:', err);
      }
    }

    const initial = getInitialDatabase();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (err) {
      console.warn('Storage notice (persisting in memory for serverless runtime):', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  public logAudit(action: string, performedBy: string, details: string) {
    this.data.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      performedBy,
      details,
      timestamp: new Date().toISOString(),
    });
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  // User management
  public ensureOwnerUser(): User {
    const existing = this.data.users.find(u => u.role === 'owner');
    if (existing) return existing;

    const ownerPass = process.env.OWNER_PASSWORD || '@Admin_aseel780#';
    const ownerPhone = process.env.OWNER_PHONE || '785502919';
    const ownerHashed = hashPassword(ownerPass);
    const newOwner: User = {
      id: 'user-owner-1',
      fullName: 'المهندس المشرف (مالك المنصة)',
      phone: ownerPhone,
      university: 'الجامعة الإماراتية الدولية - صنعاء',
      studyLevel: 'الهيئة التدريسية',
      role: 'owner',
      status: 'active',
      passwordHash: ownerHashed.hash,
      salt: ownerHashed.salt,
      createdAt: new Date().toISOString(),
    };
    this.data.users.unshift(newOwner);
    this.save();
    return newOwner;
  }

  public getOwnerUser(identifier?: string): User {
    if (identifier) {
      const clean = identifier.trim().toLowerCase();
      if (['owner', 'admin', 'مالك', 'المالك', 'مشرف', 'المشرف'].includes(clean)) {
        return this.ensureOwnerUser();
      }
      const norm = normalizePhone(identifier);
      const byPhone = this.data.users.find(
        u => (normalizePhone(u.phone) === norm || u.phone === norm || u.phone.includes(norm)) && u.role === 'owner'
      );
      if (byPhone) return byPhone;
    }
    return this.ensureOwnerUser();
  }

  public findUserByPhone(phone: string): User | undefined {
    if (!phone) return undefined;
    const clean = phone.trim().replace(/\s+/g, '');
    const norm = normalizePhone(phone);
    return this.data.users.find(u => {
      const uClean = u.phone.trim().replace(/\s+/g, '');
      const uNorm = normalizePhone(u.phone);
      return uClean === clean || (norm.length > 0 && uNorm === norm);
    });
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Activation Codes
  public getAllActivationCodes(): ActivationCode[] {
    return this.data.activationCodes;
  }

  public addActivationCode(code: ActivationCode): ActivationCode {
    this.data.activationCodes.unshift(code);
    this.save();
    return code;
  }

  public findActivationCode(codeStr: string): ActivationCode | undefined {
    const clean = codeStr.trim().toUpperCase();
    return this.data.activationCodes.find(c => c.code.trim().toUpperCase() === clean);
  }

  public updateActivationCode(id: string, updates: Partial<ActivationCode>): ActivationCode | null {
    const idx = this.data.activationCodes.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.activationCodes[idx] = { ...this.data.activationCodes[idx], ...updates };
    this.save();
    return this.data.activationCodes[idx];
  }

  // Experiments
  public getAllExperiments(): Experiment[] {
    return this.data.experiments;
  }

  public getPublishedExperiments(): Experiment[] {
    return this.data.experiments.filter(e => e.isPublished !== false);
  }

  public getExperimentById(id: string): Experiment | undefined {
    return this.data.experiments.find(e => e.id === id);
  }

  public saveExperiment(exp: Experiment): Experiment {
    const idx = this.data.experiments.findIndex(e => e.id === exp.id);
    if (idx !== -1) {
      this.data.experiments[idx] = exp;
    } else {
      this.data.experiments.push(exp);
    }
    this.save();
    return exp;
  }

  public deleteExperiment(id: string): boolean {
    const initialLen = this.data.experiments.length;
    this.data.experiments = this.data.experiments.filter(e => e.id !== id);
    if (this.data.experiments.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Saved Circuits
  public saveCircuit(circuit: SavedCircuit): SavedCircuit {
    const idx = this.data.savedCircuits.findIndex(c => c.id === circuit.id);
    if (idx !== -1) {
      this.data.savedCircuits[idx] = circuit;
    } else {
      this.data.savedCircuits.unshift(circuit);
    }
    this.save();
    return circuit;
  }

  public getUserCircuits(userId: string): SavedCircuit[] {
    return this.data.savedCircuits.filter(c => c.userId === userId);
  }

  public getCircuitById(id: string): SavedCircuit | undefined {
    return this.data.savedCircuits.find(c => c.id === id);
  }

  public deleteCircuit(id: string, userId: string): boolean {
    const initialLen = this.data.savedCircuits.length;
    this.data.savedCircuits = this.data.savedCircuits.filter(c => !(c.id === id && c.userId === userId));
    if (this.data.savedCircuits.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Quiz Attempts
  public recordQuizAttempt(attempt: QuizAttempt): QuizAttempt {
    this.data.quizAttempts.unshift(attempt);
    this.save();
    return attempt;
  }

  public getUserQuizAttempts(userId: string): QuizAttempt[] {
    return this.data.quizAttempts.filter(q => q.userId === userId);
  }

  // Settings & Stats
  public getSettings(): LabSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<LabSettings>): LabSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }

  public incrementSimulationRuns(): number {
    this.data.stats.simulationRunsCount = (this.data.stats.simulationRunsCount || 0) + 1;
    this.save();
    return this.data.stats.simulationRunsCount;
  }

  public getStats() {
    const users = this.data.users;
    const students = users.filter(u => u.role === 'student');
    const activeStudents = students.filter(s => s.status === 'active');
    const suspendedStudents = students.filter(s => s.status === 'suspended');
    const pendingStudents = students.filter(s => s.status === 'pending');

    const now = new Date();
    const activeSubs = students.filter(s => {
      if (!s.subscription || s.subscription.status !== 'active') return false;
      return new Date(s.subscription.expiresAt) > now;
    });

    const codes = this.data.activationCodes;
    const availableCodes = codes.filter(c => c.status === 'available');
    const usedCodes = codes.filter(c => c.status === 'used');

    return {
      totalUsers: users.length,
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      suspendedStudents: suspendedStudents.length,
      pendingStudents: pendingStudents.length,
      activeSubscriptions: activeSubs.length,
      totalActivationCodes: codes.length,
      availableActivationCodes: availableCodes.length,
      usedActivationCodes: usedCodes.length,
      publishedExperiments: this.getPublishedExperiments().length,
      totalExperiments: this.data.experiments.length,
      simulationRunsCount: this.data.stats.simulationRunsCount || 0,
      totalSavedCircuits: this.data.savedCircuits.length,
      totalQuizAttempts: this.data.quizAttempts.length,
    };
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }
}

export const db = new Database();
