import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { EXPERIMENTS_LIST, Experiment } from '../data/experimentsData';
import bundledDbJson from '../../data/db.json';

const { Pool } = pg;

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

// Phone normalization helper
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
  if (!password || !hash || !salt) return false;
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

// Writable storage directory for serverless environments (like Vercel /tmp)
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isServerless 
  ? path.resolve('/tmp', 'circuitsimulator-data')
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create DATA_DIR, using fallback:', e);
}

// Global PostgreSQL Pool (if DATABASE_URL is provided in Vercel or environment)
let pgPool: pg.Pool | null = null;
let pgInitialized = false;

function getPgPool(): pg.Pool | null {
  const connString = process.env.DATABASE_URL;
  if (!connString) return null;
  if (!pgPool) {
    const isLocal = connString.includes('localhost') || connString.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString: connString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 5,
    });
    pgPool.on('error', (err) => {
      console.warn('PostgreSQL pool error:', err?.message || err);
    });
  }
  return pgPool;
}

export class Database {
  private data: DatabaseSchema;
  private lastSyncTime = 0;
  private isSyncing = false;

  constructor() {
    this.data = this.loadInitial();
    // Eagerly initialize PostgreSQL if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      this.initPostgres().catch(err => {
        console.warn('PostgreSQL eager init notice:', err?.message || err);
      });
    }
  }

  private loadInitial(): DatabaseSchema {
    // 1. Try reading existing file in DATA_DIR (e.g. /tmp/circuitsimulator-data/db.json)
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          return this.sanitizeSchema(parsed);
        }
      } catch (err) {
        console.error('Error reading DB_FILE, falling back to bundled JSON:', err);
      }
    }

    // 2. Use statically bundled JSON (guaranteed present in Vercel bundle via ESM import)
    if (bundledDbJson && Array.isArray((bundledDbJson as any).users)) {
      const sanitized = this.sanitizeSchema(bundledDbJson as any);
      this.saveDirect(sanitized);
      return sanitized;
    }

    // 3. Fallback to basic structure
    const fallback = this.createDefaultSchema();
    this.saveDirect(fallback);
    return fallback;
  }

  private sanitizeSchema(raw: any): DatabaseSchema {
    return {
      users: Array.isArray(raw?.users) ? raw.users : [],
      activationCodes: Array.isArray(raw?.activationCodes) ? raw.activationCodes : [],
      experiments: Array.isArray(raw?.experiments) && raw.experiments.length > 0 
        ? raw.experiments 
        : EXPERIMENTS_LIST.map(e => ({ ...e, isPublished: true })),
      savedCircuits: Array.isArray(raw?.savedCircuits) ? raw.savedCircuits : [],
      quizAttempts: Array.isArray(raw?.quizAttempts) ? raw.quizAttempts : [],
      auditLogs: Array.isArray(raw?.auditLogs) ? raw.auditLogs : [],
      settings: raw?.settings || this.createDefaultSchema().settings,
      stats: {
        simulationRunsCount: raw?.stats?.simulationRunsCount || 0,
      },
    };
  }

  private createDefaultSchema(): DatabaseSchema {
    const ownerPass = process.env.OWNER_PASSWORD || '@Admin_aseel780#';
    const ownerPhone = process.env.OWNER_PHONE || '785502919';
    const ownerHashed = hashPassword(ownerPass);
    const now = new Date().toISOString();

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
      createdAt: now,
    };

    return {
      users: [initialOwner],
      activationCodes: [],
      experiments: EXPERIMENTS_LIST.map(e => ({ ...e, isPublished: true })),
      savedCircuits: [],
      quizAttempts: [],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          action: 'تهيئة النظام',
          performedBy: 'النظام الآلي',
          details: 'تمت تهيئة قاعدة بيانات المختبر بنجاح',
          timestamp: now,
        },
      ],
      settings: {
        academyName: 'أكاديمية الميكاترونكس اليمنية',
        labTitle: 'مختبر الدوائر الكهربائية التفاعلي',
        requireOwnerApprovalForRegistration: true,
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
      },
      stats: {
        simulationRunsCount: 0,
      },
    };
  }

  // Initialize PostgreSQL tables and migrate seed state if empty
  public async initPostgres(): Promise<void> {
    const pool = getPgPool();
    if (!pool || pgInitialized) return;

    try {
      // 1. Create table for full state sync
      await pool.query(`
        CREATE TABLE IF NOT EXISTS platform_state (
          key VARCHAR(50) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 2. Create normalized users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          full_name TEXT NOT NULL,
          phone VARCHAR(50) NOT NULL UNIQUE,
          university TEXT,
          study_level TEXT,
          role VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          subscription JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 3. Create normalized activation codes table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS activation_codes (
          id VARCHAR(100) PRIMARY KEY,
          code VARCHAR(100) NOT NULL UNIQUE,
          duration_days INT NOT NULL,
          plan_name TEXT NOT NULL,
          status VARCHAR(20) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          used_by_student_id VARCHAR(100),
          used_by_student_name TEXT,
          used_at TIMESTAMPTZ
        );
      `);

      // 4. Check if platform_state has 'db_state'
      const checkRes = await pool.query(`SELECT data FROM platform_state WHERE key = 'db_state' LIMIT 1;`);
      if (checkRes.rows.length > 0 && checkRes.rows[0].data) {
        // Load latest state from PostgreSQL
        this.data = this.sanitizeSchema(checkRes.rows[0].data);
        this.saveDirect(this.data);
      } else {
        // First run on new PostgreSQL database: seed with current state
        await pool.query(
          `INSERT INTO platform_state (key, data, updated_at) VALUES ('db_state', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = NOW();`,
          [JSON.stringify(this.data)]
        );

        // Seed users into normalized table
        for (const u of this.data.users) {
          try {
            await pool.query(
              `INSERT INTO users (id, full_name, phone, university, study_level, role, status, password_hash, salt, subscription, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (id) DO NOTHING;`,
              [u.id, u.fullName, u.phone, u.university, u.studyLevel, u.role, u.status, u.passwordHash, u.salt, JSON.stringify(u.subscription || {}), u.createdAt]
            );
          } catch (insertErr) {
            // Ignore duplicate phone conflict on initial seed
          }
        }

        // Seed activation codes into normalized table
        for (const c of this.data.activationCodes) {
          try {
            await pool.query(
              `INSERT INTO activation_codes (id, code, duration_days, plan_name, status, created_at, expires_at, used_by_student_id, used_by_student_name, used_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (id) DO NOTHING;`,
              [c.id, c.code, c.durationDays, c.planName, c.status, c.createdAt, c.expiresAt || null, c.usedByStudentId || null, c.usedByStudentName || null, c.usedAt || null]
            );
          } catch (codeErr) {
            // Ignore conflict
          }
        }
      }

      pgInitialized = true;
      this.lastSyncTime = Date.now();
      console.log('✅ PostgreSQL database connected and initialized successfully');
    } catch (err: any) {
      console.warn('⚠️ PostgreSQL connection failed, operating with local persistent storage:', err?.message || err);
    }
  }

  // Sync state from PostgreSQL if running in serverless environment
  public async sync(): Promise<void> {
    const pool = getPgPool();
    if (!pool) return;

    if (!pgInitialized) {
      await this.initPostgres();
      return;
    }

    const now = Date.now();
    // Throttle queries to once every 1000ms per serverless container
    if (this.isSyncing || now - this.lastSyncTime < 1000) return;

    this.isSyncing = true;
    try {
      const res = await pool.query(`SELECT data FROM platform_state WHERE key = 'db_state' LIMIT 1;`);
      if (res.rows.length > 0 && res.rows[0].data) {
        this.data = this.sanitizeSchema(res.rows[0].data);
        this.saveDirect(this.data);
        this.lastSyncTime = now;
      }
    } catch (err: any) {
      console.warn('Sync notice:', err?.message || err);
    } finally {
      this.isSyncing = false;
    }
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (err) {
      console.warn('Storage notice (persisting in memory):', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
    this.persistToPostgres().catch(err => {
      console.warn('PostgreSQL async persist notice:', err?.message || err);
    });
  }

  private async persistToPostgres(): Promise<void> {
    const pool = getPgPool();
    if (!pool) return;

    try {
      if (!pgInitialized) {
        await this.initPostgres();
      }
      await pool.query(
        `INSERT INTO platform_state (key, data, updated_at) VALUES ('db_state', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = NOW();`,
        [JSON.stringify(this.data)]
      );
    } catch (err: any) {
      console.warn('PostgreSQL persist failed:', err?.message || err);
    }
  }

  public logAudit(action: string, performedBy: string, details: string) {
    this.data.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      performedBy,
      details,
      timestamp: new Date().toISOString(),
    });
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

    // Async insert into PostgreSQL users table
    const pool = getPgPool();
    if (pool) {
      pool.query(
        `INSERT INTO users (id, full_name, phone, university, study_level, role, status, password_hash, salt, subscription, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET 
           full_name = EXCLUDED.full_name,
           status = EXCLUDED.status,
           subscription = EXCLUDED.subscription;`,
        [user.id, user.fullName, user.phone, user.university, user.studyLevel, user.role, user.status, user.passwordHash, user.salt, JSON.stringify(user.subscription || {}), user.createdAt]
      ).catch(e => console.warn('PostgreSQL user insert error:', e?.message));
    }

    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();

    const pool = getPgPool();
    if (pool) {
      const u = this.data.users[idx];
      pool.query(
        `UPDATE users SET status = $1, subscription = $2 WHERE id = $3;`,
        [u.status, JSON.stringify(u.subscription || {}), u.id]
      ).catch(e => console.warn('PostgreSQL user update error:', e?.message));
    }

    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.save();
      const pool = getPgPool();
      if (pool) {
        pool.query(`DELETE FROM users WHERE id = $1;`, [id]).catch(e => console.warn('PostgreSQL delete error:', e?.message));
      }
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

    const pool = getPgPool();
    if (pool) {
      pool.query(
        `INSERT INTO activation_codes (id, code, duration_days, plan_name, status, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING;`,
        [code.id, code.code, code.durationDays, code.planName, code.status, code.createdAt, code.expiresAt || null]
      ).catch(e => console.warn('PostgreSQL code insert error:', e?.message));
    }

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

    const pool = getPgPool();
    if (pool) {
      const c = this.data.activationCodes[idx];
      pool.query(
        `UPDATE activation_codes SET status = $1, used_by_student_id = $2, used_by_student_name = $3, used_at = $4 WHERE id = $5;`,
        [c.status, c.usedByStudentId || null, c.usedByStudentName || null, c.usedAt || null, c.id]
      ).catch(e => console.warn('PostgreSQL code update error:', e?.message));
    }

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
    const users = this.data.users || [];
    const students = users.filter(u => u.role === 'student');
    const activeStudents = students.filter(s => s.status === 'active');
    const suspendedStudents = students.filter(s => s.status === 'suspended');
    const pendingStudents = students.filter(s => s.status === 'pending');

    const now = new Date();
    const activeSubs = students.filter(s => {
      if (!s.subscription || s.subscription.status !== 'active') return false;
      return new Date(s.subscription.expiresAt) > now;
    });

    const codes = this.data.activationCodes || [];
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
      totalExperiments: this.data.experiments?.length || 0,
      simulationRunsCount: this.data.stats?.simulationRunsCount || 0,
      totalSavedCircuits: this.data.savedCircuits?.length || 0,
      totalQuizAttempts: this.data.quizAttempts?.length || 0,
    };
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs || [];
  }
}

export const db = new Database();
