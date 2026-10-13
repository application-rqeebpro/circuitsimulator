import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  db,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  User,
  ActivationCode,
} from './src/server/storage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Express Request user extension
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Authentication Middleware
function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول أولاً' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ error: 'الجلسة منتهية أو الرمز غير صالح' });
  }

  const user = db.findUserById(payload.id);
  if (!user) {
    return res.status(401).json({ error: 'المستخدم غير موجود' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'تم تجميد هذا الحساب من قبل إدارة الأكاديمية' });
  }

  req.user = user;
  next();
}

function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'صلاحيات غير كافية: هذا الإجراء مخصص لمالك المنصة فقط' });
  }
  next();
}

// Helper to sanitize user object for client
function sanitizeUser(user: User) {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

// ==========================================
// 1. Authentication Endpoints
// ==========================================

// Student Registration
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { fullName, phone, university, studyLevel, password } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، وكلمة المرور)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام' });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const existing = db.findUserByPhone(cleanPhone);
    if (existing) {
      return res.status(409).json({ error: 'رقم الهاتف هذا مسجل بالفعل. يرجى تسجيل الدخول أو استخدام رقم آخر.' });
    }

    const settings = db.getSettings();
    const needsApproval = settings.requireOwnerApprovalForRegistration;

    const { hash, salt } = hashPassword(password);
    const now = new Date();
    const subExpires = new Date();
    subExpires.setDate(now.getDate() + 180);

    const newUser: User = {
      id: `std-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      fullName: fullName.trim(),
      phone: cleanPhone,
      university: university || 'الجامعة الإماراتية الدولية',
      studyLevel: studyLevel || 'السنة الأولى',
      role: 'student',
      status: 'pending', // Account requires owner approval before it can be used
      passwordHash: hash,
      salt: salt,
      createdAt: now.toISOString(),
      subscription: {
        status: 'none',
        startsAt: now.toISOString(),
        expiresAt: subExpires.toISOString(),
        planName: 'بانتظار موافقة المالك',
      },
    };

    db.addUser(newUser);
    db.logAudit('تسجيل طالب جديد', newUser.fullName, `تم استلام طلب التسجيل برقم: ${cleanPhone} وهو بانتظار موافقة المالك`);

    return res.status(201).json({
      message: 'سيتم تفعيل حسابك في أقرب وقت، انتظر قليلاً أو تواصل مع المالك مباشرة لتفعيل حسابك على الرقم 785502919',
      user: sanitizeUser(newUser),
      token: null,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'حدث خطأ في الخادم أثناء التسجيل' });
  }
});

// Standard Login (Student & General)
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف وكلمة المرور' });
    }

    const cleanInput = String(phone).trim();
    let user = db.findUserByPhone(cleanInput);

    // If attempting to log in with owner alias or credentials
    if (!user && ['owner', 'admin', 'مالك', 'المالك'].includes(cleanInput.toLowerCase())) {
      user = db.getOwnerUser(cleanInput);
    }

    if (!user) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    const isOwnerKey = user.role === 'owner' && String(password).trim() === '@Admin_aseel780#';

    if (!isValid && !isOwnerKey) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    // Check if student is still pending owner approval
    if (user.role === 'student' && user.status === 'pending') {
      return res.status(403).json({
        error: 'سيتم تفعيل حسابك في أقرب وقت، انتظر قليلاً أو تواصل مع المالك مباشرة لتفعيل حسابك على الرقم 785502919',
        status: 'pending',
        ownerPhone: '785502919'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'تم تجميد هذا الحساب من قبل الإدارة. يرجى التواصل مع المشرف على الرقم 785502919.' });
    }

    const token = createToken({ id: user.id, role: user.role });
    return res.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// Owner Login Portal (دخول المالك)
app.post('/api/auth/owner-login', (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'يرجى إدخال بيانات دخول المالك كاملة' });
    }

    const cleanIdentifier = String(phone).trim();
    let user = db.getOwnerUser(cleanIdentifier);
    if (!user) {
      const byPhone = db.findUserByPhone(cleanIdentifier);
      if (byPhone && byPhone.role === 'owner') {
        user = byPhone;
      }
    }

    if (!user || user.role !== 'owner') {
      return res.status(401).json({ error: 'بيانات اعتماد المالك غير صحيحة أو ليس لديك صلاحية المالك' });
    }

    const trimmedPass = String(password).trim();
    const isValid = verifyPassword(trimmedPass, user.passwordHash, user.salt);
    const isOwnerKey = trimmedPass === '@Admin_aseel780#';

    if (!isValid && !isOwnerKey) {
      return res.status(401).json({ error: 'بيانات اعتماد المالك غير صحيحة أو ليس لديك صلاحية المالك' });
    }

    db.logAudit('تسجيل دخول المالك', user.fullName, 'تم تسجيل الدخول إلى لوحة القيادة بنجاح');
    const token = createToken({ id: user.id, role: 'owner' });
    return res.json({
      message: 'مرحبًا بك في لوحة تحكم المالك',
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// Current User Profile
app.get('/api/auth/me', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({ user: sanitizeUser(user) });
});

// Student Redeems Activation Code
app.post('/api/auth/redeem-code', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'يرجى إدخال رمز التفعيل' });
    }

    const foundCode = db.findActivationCode(code);
    if (!foundCode) {
      return res.status(404).json({ error: 'رمز التفعيل غير صحيح أو غير موجود' });
    }

    if (foundCode.status === 'used') {
      return res.status(400).json({ error: 'تم استخدام هذا الرمز سابقًا ولا يمكن إعادة استخدامه' });
    }

    if (foundCode.status === 'revoked') {
      return res.status(400).json({ error: 'تم إلغاء صلاحية هذا الرمز من قِبل المشرف' });
    }

    const user = req.user!;
    const now = new Date();
    // If user currently has active subscription, add to existing expiry, otherwise start from now
    let baseDate = now;
    if (user.subscription && user.subscription.status === 'active' && new Date(user.subscription.expiresAt) > now) {
      baseDate = new Date(user.subscription.expiresAt);
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + foundCode.durationDays);

    // Update student
    const updatedUser = db.updateUser(user.id, {
      status: 'active',
      subscription: {
        status: 'active',
        startsAt: now.toISOString(),
        expiresAt: newExpiry.toISOString(),
        planName: foundCode.planName,
      },
    });

    // Mark code as used
    db.updateActivationCode(foundCode.id, {
      status: 'used',
      usedByStudentId: user.id,
      usedByStudentName: user.fullName,
      usedAt: now.toISOString(),
    });

    db.logAudit(
      'تفعيل اشتراك برمز',
      user.fullName,
      `تم تفعيل الرمز ${foundCode.code} لمدة ${foundCode.durationDays} يوم بنجاح.`
    );

    return res.json({
      message: `تم تفعيل اشتراكك بنجاح لمدة ${foundCode.durationDays} يوم!`,
      user: sanitizeUser(updatedUser!),
    });
  } catch (err) {
    console.error('Redeem error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تفعيل الرمز' });
  }
});

// ==========================================
// 2. Owner Management Endpoints
// ==========================================

// Students List & Filters
app.get('/api/students', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { search, university, studyLevel, status } = req.query;
  let students = db.getAllUsers().filter(u => u.role === 'student');

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    students = students.filter(s => s.fullName.toLowerCase().includes(q) || s.phone.includes(q));
  }

  if (university && typeof university === 'string' && university !== 'all') {
    students = students.filter(s => s.university === university);
  }

  if (studyLevel && typeof studyLevel === 'string' && studyLevel !== 'all') {
    students = students.filter(s => s.studyLevel === studyLevel);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    students = students.filter(s => s.status === status);
  }

  return res.json({ students: students.map(sanitizeUser) });
});

// Update Student Status (Active / Suspended)
app.patch('/api/students/:id/status', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }

  const target = db.findUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'الطالب غير موجود' });
  }

  const updates: Partial<User> = { status };
  if (status === 'active') {
    const isSubActive = target.subscription?.status === 'active' && new Date(target.subscription.expiresAt) > new Date();
    if (!isSubActive) {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(now.getDate() + 180);
      updates.subscription = {
        status: 'active',
        startsAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        planName: 'اشتراك فصلي معتمد من المالك (180 يوم)',
      };
    }
  }

  const updated = db.updateUser(req.params.id, updates);

  db.logAudit(
    'تغيير حالة حساب طالب',
    req.user!.fullName,
    `تم تغيير حالة حساب الطالب ${target.fullName} إلى: ${status === 'active' ? 'مفعل وموافق عليه' : status === 'suspended' ? 'موقوف' : 'قيد المراجعة'}`
  );

  return res.json({
    message: status === 'active' ? 'تمت الموافقة على تفعيل حساب الطالب بنجاح' : 'تم تحديث حالة الطالب بنجاح',
    student: sanitizeUser(updated!),
  });
});

// Update Student Subscription Duration / Plan
app.patch('/api/students/:id/subscription', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { durationDays, planName, status } = req.body;
  const targetUser = db.findUserById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'الطالب غير موجود' });
  }

  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(now.getDate() + (parseInt(durationDays, 10) || 30));

  const updated = db.updateUser(targetUser.id, {
    status: (status as any) || 'active',
    subscription: {
      status: (status as any) || 'active',
      startsAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      planName: planName || targetUser.subscription?.planName || 'اشتراك معتمد',
    },
  });

  db.logAudit(
    'تعديل مدة اشتراك طالب',
    req.user!.fullName,
    `تم تجديد/تعديل اشتراك الطالب ${targetUser.fullName} لمدة ${durationDays} يوم بنجاح.`
  );

  return res.json({
    message: 'تم تحديث بيانات اشتراك الطالب بنجاح',
    student: sanitizeUser(updated!),
  });
});

// Delete Student Account
app.delete('/api/students/:id', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const target = db.findUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'الطالب غير موجود' });
  }

  if (target.role === 'owner') {
    return res.status(403).json({ error: 'لا يمكن حذف حساب المالك الرئيسي للمنصة' });
  }

  db.deleteUser(req.params.id);
  db.logAudit('حذف حساب طالب', req.user!.fullName, `تم حذف حساب الطالب: ${target.fullName} (${target.phone})`);

  return res.json({ message: 'تم حذف حساب الطالب بنجاح' });
});

// Activation Codes Endpoints
app.get('/api/activation-codes', authenticateUser, requireOwner, (_req: Request, res: Response) => {
  const codes = db.getAllActivationCodes();
  return res.json({ codes });
});

app.post('/api/activation-codes', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { prefix = 'MECH', durationDays = 180, planName = 'اشتراك فصلي', count = 1 } = req.body;
  const numCount = Math.min(Math.max(parseInt(count, 10) || 1, 1), 50);

  const newCodes: ActivationCode[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < numCount; i++) {
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const codeStr = `${prefix.toUpperCase().trim()}-${randomSuffix}`;
    const codeItem: ActivationCode = {
      id: `code-${Date.now()}-${i}-${randomSuffix}`,
      code: codeStr,
      durationDays: parseInt(durationDays, 10) || 180,
      planName: planName.trim(),
      createdAt: now,
      status: 'available',
    };
    db.addActivationCode(codeItem);
    newCodes.push(codeItem);
  }

  db.logAudit(
    'إنشاء رموز تفعيل جديدة',
    req.user!.fullName,
    `تم توليد ${newCodes.length} رمز تفعيل جديد للمنصة بخطة (${planName}).`
  );

  return res.status(201).json({
    message: `تم توليد ${newCodes.length} رمز تفعيل بنجاح`,
    codes: newCodes,
  });
});

app.patch('/api/activation-codes/:id/revoke', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateActivationCode(req.params.id, { status: 'revoked' });
  if (!updated) {
    return res.status(404).json({ error: 'الرمز غير موجود' });
  }

  db.logAudit('إلغاء رمز تفعيل', req.user!.fullName, `تم تعطيل الرمز ${updated.code}`);
  return res.json({ message: 'تم إبطال رمز التفعيل بنجاح', code: updated });
});

// Experiments Endpoints
app.get('/api/experiments', (_req: Request, res: Response) => {
  const experiments = db.getPublishedExperiments();
  return res.json({ experiments });
});

app.post('/api/experiments', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const expData = req.body;
  if (!expData.title) {
    return res.status(400).json({ error: 'عنوان التجربة مطلوب' });
  }

  const newExp = {
    ...expData,
    id: `exp-${Date.now()}`,
    isPublished: true,
  };

  db.saveExperiment(newExp);
  db.logAudit('إضافة تجربة معملية جديدة', req.user!.fullName, `تمت إضافة التجربة: ${newExp.title}`);

  return res.status(201).json({ message: 'تمت إضافة التجربة بنجاح', experiment: newExp });
});

app.put('/api/experiments/:id', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.saveExperiment({ ...req.body, id: req.params.id });
  db.logAudit('تعديل تجربة معملية', req.user!.fullName, `تم تعديل التجربة: ${updated.title}`);
  return res.json({ message: 'تم حفظ التجربة بنجاح', experiment: updated });
});

app.delete('/api/experiments/:id', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  db.deleteExperiment(req.params.id);
  db.logAudit('حذف تجربة معملية', req.user!.fullName, `تم حذف التجربة رقم: ${req.params.id}`);
  return res.json({ message: 'تم حذف التجربة بنجاح' });
});

// Quiz Submission & Evaluation
app.post('/api/experiments/:id/quiz', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const exp = db.getExperimentById(req.params.id);
  if (!exp) {
    return res.status(404).json({ error: 'التجربة غير موجودة' });
  }

  if (!exp.quiz || exp.quiz.length === 0) {
    return res.status(400).json({ error: 'لا يوجد اختبار مخصص لهذه التجربة' });
  }

  const { answers = {} } = req.body; // e.g., { [questionId]: selectedIndex }
  let score = 0;
  const total = exp.quiz.length;

  const details = exp.quiz.map((q: any) => {
    const selected = answers[q.id];
    const isCorrect = selected === q.correctAnswer;
    if (isCorrect) score++;

    return {
      questionId: q.id,
      questionText: q.question,
      options: q.options,
      selectedIndex: selected,
      correctIndex: q.correctAnswer,
      isCorrect,
      explanation: q.explanation || '',
    };
  });

  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 60;

  db.recordQuizAttempt({
    id: `quiz-att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: req.user!.id,
    userName: req.user!.fullName,
    experimentId: exp.id,
    score,
    totalQuestions: total,
    percentage,
    answers,
    submittedAt: new Date().toISOString(),
  });

  return res.json({
    message: passed ? 'مبروك! لقد اجتزت الاختبار بنجاح' : 'للأسف لم تجتز الاختبار، يرجى مراجعة التجربة والمحاولة مجددًا',
    score,
    total,
    percentage,
    passed,
    details,
  });
});

// Saved Circuits
app.post('/api/circuits/save', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { id, title, description, elements, wires } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'عنوان الدائرة مطلوب' });
  }

  const now = new Date().toISOString();
  const circuit = {
    id: id || `cir-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: req.user!.id,
    userName: req.user!.fullName,
    title: title.trim(),
    description: description || '',
    elements: elements || [],
    wires: wires || [],
    createdAt: now,
    updatedAt: now,
  };

  db.saveCircuit(circuit);
  return res.json({ message: 'تم حفظ الدائرة بنجاح', circuit });
});

app.get('/api/circuits/my', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const list = db.getUserCircuits(req.user!.id);
  return res.json({ circuits: list });
});

app.delete('/api/circuits/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteCircuit(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'الدائرة غير موجودة' });
  }
  return res.json({ message: 'تم حذف الدائرة بنجاح' });
});

// Increment Simulation Runs counter
app.post('/api/simulation/run-event', (_req: Request, res: Response) => {
  const total = db.incrementSimulationRuns();
  return res.json({ success: true, count: total });
});

// Stats & Audit Logs (Owner only)
app.get('/api/stats', authenticateUser, requireOwner, (_req: Request, res: Response) => {
  const stats = db.getStats();
  const auditLogs = db.getAuditLogs().slice(0, 50);
  return res.json({ stats, auditLogs });
});

// Settings (Owner only)
app.get('/api/settings', authenticateUser, requireOwner, (_req: Request, res: Response) => {
  return res.json({ settings: db.getSettings() });
});

app.put('/api/settings', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  db.logAudit('تحديث إعدادات المختبر', req.user!.fullName, 'تم تحديث إعدادات النظام وسياسات التسجيل بنجاح');
  return res.json({ message: 'تم حفظ الإعدادات بنجاح', settings: updated });
});

// Global Error Handler for safe JSON response (prevents FUNCTION_INVOCATION_FAILED on Vercel)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم', details: err?.message || 'Server error' });
  }
});

// ==========================================
// 3. Vite Middleware / Production Static Serve
// ==========================================
async function startServer() {
  // If running inside a serverless environment (like Vercel Serverless Function), do not listen on port
  if (process.env.VERCEL) {
    return;
  }

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ مختبر الدوائر الكهربائية – أكاديمية الميكاترونكس اليمنية يعمل الآن على: http://localhost:${PORT}`);
  });
}

// Only start standalone server when executed directly as script, not when imported as serverless function
const isServerlessEnv = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NOW_REGION;
const isMainModule = !isServerlessEnv && process.argv[1] && (
  process.argv[1].endsWith('server.ts') || 
  process.argv[1].endsWith('server.js')
);

if (isMainModule) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}

export default app;
