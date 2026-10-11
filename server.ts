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

const app = express();
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
    subExpires.setDate(now.getDate() + (settings.defaultTrialDays || 14));

    const newUser: User = {
      id: `std-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      fullName: fullName.trim(),
      phone: cleanPhone,
      university: university || 'الجامعة الإماراتية الدولية',
      studyLevel: studyLevel || 'السنة الأولى',
      role: 'student',
      status: needsApproval ? 'pending' : 'active',
      passwordHash: hash,
      salt: salt,
      createdAt: now.toISOString(),
      subscription: {
        status: needsApproval ? 'none' : 'active',
        startsAt: now.toISOString(),
        expiresAt: subExpires.toISOString(),
        planName: `فترة تجريبية (${settings.defaultTrialDays || 14} يوم)`,
      },
    };

    db.addUser(newUser);
    db.logAudit('تسجيل طالب جديد', newUser.fullName, `تم تسجيل الطالب بنجاح برقم: ${cleanPhone}`);

    const token = createToken({ id: newUser.id, role: newUser.role });
    return res.status(201).json({
      message: needsApproval ? 'تم إنشاء الحساب بنجاح وهو بانتظار موافقة المشرف' : 'تم إنشاء الحساب وتفعيله بنجاح',
      user: sanitizeUser(newUser),
      token,
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

    const user = db.findUserByPhone(phone);
    if (!user) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'تم تجميد هذا الحساب من قبل الإدارة. يرجى التواصل مع المشرف.' });
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

    const user = db.findUserByPhone(phone);
    if (!user || user.role !== 'owner') {
      return res.status(401).json({ error: 'بيانات اعتماد المالك غير صحيحة أو ليس لديك صلاحية المالك' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'بيانات اعتماد المالك غير صحيحة' });
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

// Update Student Status (Activate / Suspend)
app.patch('/api/students/:id/status', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }

  const updated = db.updateUser(id, { status });
  if (!updated) {
    return res.status(404).json({ error: 'الطالب غير موجود' });
  }

  db.logAudit('تعديل حالة طالب', req.user!.fullName, `تم تغيير حالة الطالب ${updated.fullName} إلى: ${status}`);
  return res.json({ message: 'تم تحديث حالة الطالب بنجاح', student: sanitizeUser(updated) });
});

// Modify Student Subscription
app.patch('/api/students/:id/subscription', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { durationDays, planName, status } = req.body;

  const student = db.findUserById(id);
  if (!student) {
    return res.status(404).json({ error: 'الطالب غير موجود' });
  }

  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(now.getDate() + (parseInt(durationDays, 10) || 30));

  const updated = db.updateUser(id, {
    status: 'active',
    subscription: {
      status: status || 'active',
      startsAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      planName: planName || `اشتراك يدوي (${durationDays} يوم)`,
    },
  });

  db.logAudit(
    'تعديل اشتراك طالب',
    req.user!.fullName,
    `تم تحديث اشتراك الطالب ${student.fullName} لمدة ${durationDays} يوم بنجاح.`
  );

  return res.json({ message: 'تم تحديث الاشتراك بنجاح', student: sanitizeUser(updated!) });
});

// Delete Student
app.delete('/api/students/:id', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const student = db.findUserById(id);
  if (!student) {
    return res.status(404).json({ error: 'الطالب غير موجود' });
  }

  if (student.role === 'owner') {
    return res.status(400).json({ error: 'لا يمكن حذف حساب المالك' });
  }

  db.deleteUser(id);
  db.logAudit('حذف حساب طالب', req.user!.fullName, `تم حذف حساب الطالب: ${student.fullName} (${student.phone})`);
  return res.json({ message: 'تم حذف حساب الطالب بنجاح' });
});

// Activation Codes (List & Create & Revoke)
app.get('/api/activation-codes', authenticateUser, requireOwner, (_req: Request, res: Response) => {
  return res.json({ codes: db.getAllActivationCodes() });
});

app.post('/api/activation-codes', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { prefix = 'MECH', durationDays = 180, planName = 'اشتراك فصلي', count = 1 } = req.body;

  const generatedList: ActivationCode[] = [];
  const qty = Math.min(Math.max(parseInt(count, 10) || 1, 1), 20);

  for (let i = 0; i < qty; i++) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const codeStr = `${prefix.trim().toUpperCase()}-${randomHex}-${randomNum}`;

    const newCode: ActivationCode = {
      id: `code-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
      code: codeStr,
      durationDays: parseInt(durationDays, 10) || 180,
      planName: planName || 'اشتراك ميكاترونكس',
      createdAt: new Date().toISOString(),
      status: 'available',
    };

    db.addActivationCode(newCode);
    generatedList.push(newCode);
  }

  db.logAudit(
    'إنشاء رموز تفعيل',
    req.user!.fullName,
    `تم توليد ${qty} رمز تفعيل جديد بنجاح (مدة: ${durationDays} يوم).`
  );

  return res.status(201).json({ message: `تم توليد ${qty} رمز تفعيل بنجاح`, codes: generatedList });
});

app.patch('/api/activation-codes/:id/revoke', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateActivationCode(id, { status: 'revoked' });
  if (!updated) {
    return res.status(404).json({ error: 'الرمز غير موجود' });
  }

  db.logAudit('إلغاء رمز تفعيل', req.user!.fullName, `تم إلغاء الرمز: ${updated.code}`);
  return res.json({ message: 'تم إلغاء الرمز بنجاح', code: updated });
});

// Experiments Management
app.get('/api/experiments', (req: Request, res: Response) => {
  // Check if owner token is present
  const authHeader = req.headers.authorization;
  let isOwnerUser = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload && payload.role === 'owner') {
      isOwnerUser = true;
    }
  }

  const list = isOwnerUser ? db.getAllExperiments() : db.getPublishedExperiments();
  return res.json({ experiments: list });
});

app.post('/api/experiments', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const expData = req.body;
  if (!expData.title || !expData.objective) {
    return res.status(400).json({ error: 'بيانات التجربة غير مكتملة' });
  }

  const newExp = {
    ...expData,
    id: `exp-${Date.now()}`,
    number: db.getAllExperiments().length + 1,
    isPublished: expData.isPublished !== false,
  };

  db.saveExperiment(newExp);
  db.logAudit('إضافة تجربة جديدة', req.user!.fullName, `تمت إضافة التجربة: ${newExp.title}`);
  return res.status(201).json({ message: 'تمت إضافة التجربة بنجاح', experiment: newExp });
});

app.put('/api/experiments/:id', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getExperimentById(id);
  if (!existing) {
    return res.status(404).json({ error: 'التجربة غير موجودة' });
  }

  const updatedExp = { ...existing, ...req.body, id };
  db.saveExperiment(updatedExp);
  db.logAudit('تعديل تجربة', req.user!.fullName, `تم تعديل التجربة: ${updatedExp.title}`);
  return res.json({ message: 'تم تحديث التجربة بنجاح', experiment: updatedExp });
});

app.delete('/api/experiments/:id', authenticateUser, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getExperimentById(id);
  if (!existing) {
    return res.status(404).json({ error: 'التجربة غير موجودة' });
  }

  db.deleteExperiment(id);
  db.logAudit('حذف تجربة', req.user!.fullName, `تم حذف التجربة: ${existing.title}`);
  return res.json({ message: 'تم حذف التجربة بنجاح' });
});

// Quiz Submission with Server-Side Validation
app.post('/api/experiments/:id/quiz', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // map of { [questionId]: selectedOptionIndex }

    const exp = db.getExperimentById(id);
    if (!exp) {
      return res.status(404).json({ error: 'التجربة غير موجودة' });
    }

    if (!exp.quiz || exp.quiz.length === 0) {
      return res.status(400).json({ error: 'لا يوجد اختبار مخصص لهذه التجربة' });
    }

    let score = 0;
    const results = exp.quiz.map(q => {
      const selected = answers ? answers[q.id] : undefined;
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) score++;

      return {
        questionId: q.id,
        questionText: q.question,
        options: q.options,
        selectedIndex: selected,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const total = exp.quiz.length;
    const percentage = Math.round((score / total) * 100);

    const attempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user!.id,
      userName: req.user!.fullName,
      experimentId: id,
      score,
      totalQuestions: total,
      percentage,
      answers: answers || {},
      submittedAt: new Date().toISOString(),
    };

    db.recordQuizAttempt(attempt);

    return res.json({
      message: 'تم تصحيح الاختبار بنجاح',
      score,
      total,
      percentage,
      passed: percentage >= 60,
      details: results,
    });
  } catch (err) {
    return res.status(500).json({ error: 'حدث خطأ أثناء تصحيح الاختبار' });
  }
});

// Saved Circuits Management
app.post('/api/circuits/save', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { id, title, description, elements, wires } = req.body;
  if (!title || !elements) {
    return res.status(400).json({ error: 'بيانات الدائرة غير مكتملة' });
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

// ==========================================
// 3. Vite Middleware / Production Static Serve
// ==========================================
async function startServer() {
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

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
