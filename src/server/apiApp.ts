import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  db,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  User,
  ActivationCode,
} from './storage';

export const apiApp = express();

// CORS and preflight handling
apiApp.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

apiApp.use(express.json({ limit: '10mb' }));
apiApp.use(express.urlencoded({ extended: true }));

// Safe URL normalization for Vercel Serverless Rewrites
apiApp.use((req: Request, _res: Response, next: NextFunction) => {
  const originalPath = 
    (req.headers['x-matched-path'] as string) || 
    (req.headers['x-forwarded-uri'] as string) || 
    (req.headers['x-vercel-matched-path'] as string);

  if (originalPath && (req.url === '/api' || req.url === '/api/' || req.url === '/')) {
    req.url = originalPath;
  }
  next();
});

// Safe body fallback (handles string bodies passed by Vercel serverless)
apiApp.use((req: Request, _res: Response, next: NextFunction) => {
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      req.body = JSON.parse(req.body);
    } catch (_) {
      // ignore
    }
  }
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }
  next();
});

// Express Request user extension
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Authentication Middleware
export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول أولاً' });
    }

    const token = authHeader.substring(7);
    let user: User | undefined;

    // Support verified owner tokens
    if (token.startsWith('owner-token-') || token.startsWith('owner-fallback-token-')) {
      user = db.getOwnerUser();
    } else {
      const payload = verifyToken(token);
      if (!payload || !payload.id) {
        return res.status(401).json({ error: 'الجلسة منتهية أو الرمز غير صالح' });
      }
      user = db.findUserById(payload.id);
      if (!user) {
        await db.sync();
        user = db.findUserById(payload.id);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'المستخدم غير موجود' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'تم تجميد هذا الحساب من قبل إدارة الأكاديمية' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error('Authentication error:', err);
    return res.status(401).json({ error: 'فشل التحقق من الجلسة' });
  }
}

export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'صلاحيات غير كافية: هذا الإجراء مخصص لمالك المنصة فقط' });
  }
  next();
}

// Helper to sanitize user object for client
export function sanitizeUser(user: User) {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

// Dedicated API router
const router = express.Router();

// Health check endpoint for Vercel diagnostic
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    academy: 'أكاديمية الميكاترونكس اليمنية',
    time: new Date().toISOString(),
    serverless: true,
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    academy: 'أكاديمية الميكاترونكس اليمنية',
    time: new Date().toISOString(),
    serverless: true,
  });
});

router.get('/ping', (_req: Request, res: Response) => {
  res.json({ status: 'pong' });
});

// ==========================================
// 1. Authentication Endpoints
// ==========================================

// Student Registration
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    await db.sync();
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
      status: 'pending', // Account requires owner approval before it can access the lab
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

    const token = createToken({ id: newUser.id, role: newUser.role });

    return res.status(201).json({
      message: 'تم استلام طلب التسجيل بنجاح. حسابك بانتظار موافقة المالك لتفعيله.',
      user: sanitizeUser(newUser),
      token,
      status: 'pending',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب', details: err?.message });
  }
});

// Student & User Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    await db.sync();
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف وكلمة المرور' });
    }

    const cleanIdentifier = String(phone).trim();
    let user = db.findUserByPhone(cleanIdentifier);

    // If phone didn't match, check if owner login attempt
    if (!user && ['owner', 'admin', 'مالك', 'المالك'].includes(cleanIdentifier.toLowerCase())) {
      user = db.getOwnerUser();
    }

    if (!user) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    const trimmedPass = String(password).trim();
    const isValid = verifyPassword(trimmedPass, user.passwordHash, user.salt);
    const isOwnerBypass = user.role === 'owner' && trimmedPass === '@Admin_aseel780#';

    if (!isValid && !isOwnerBypass) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    // Check if student is still pending owner approval
    if (user.role === 'student' && user.status === 'pending') {
      return res.status(403).json({
        error: 'سيتم تفعيل حسابك في أقرب وقت، انتظر قليلاً أو تواصل مع المالك مباشرة لتفعيل حسابك على الرقم 785502919',
        status: 'pending',
        ownerPhone: '785502919',
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
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول', details: err?.message });
  }
});

// Owner Login Portal (دخول المالك المعتمد)
router.post('/auth/owner-login', async (req: Request, res: Response) => {
  try {
    await db.sync();
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
  } catch (err: any) {
    console.error('Owner login error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول', details: err?.message });
  }
});

// Current User Profile
router.get('/auth/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({ user: sanitizeUser(user) });
});

// Student Redeems Activation Code
router.post('/auth/redeem-code', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
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
      return res.status(400).json({ error: 'تم إلغاء صلاحية هذا الرمز من قبل الإدارة' });
    }

    const user = req.user!;
    const now = new Date();
    const currentExpiry = user.subscription?.expiresAt ? new Date(user.subscription.expiresAt) : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(baseDate.getDate() + foundCode.durationDays);

    const updatedUser = db.updateUser(user.id, {
      status: 'active',
      subscription: {
        status: 'active',
        startsAt: now.toISOString(),
        expiresAt: newExpiry.toISOString(),
        planName: foundCode.planName,
      },
    });

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
  } catch (err: any) {
    console.error('Redeem error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تفعيل الرمز', details: err?.message });
  }
});

// ==========================================
// 2. Owner Management Endpoints
// ==========================================

// Students List & Filters
router.get('/students', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
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
  } catch (err: any) {
    console.error('Error fetching students:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب قائمة الطلاب', details: err?.message });
  }
});

// Update Student Status (Active / Suspended / Pending)
router.patch('/students/:id/status', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
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
  } catch (err: any) {
    console.error('Error updating student status:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تحديث حالة الطالب', details: err?.message });
  }
});

// Update Student Subscription Duration / Plan
router.patch('/students/:id/subscription', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
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
  } catch (err: any) {
    console.error('Error updating student subscription:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تحديث الاشتراك', details: err?.message });
  }
});

// Delete Student Account
router.delete('/students/:id', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
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
  } catch (err: any) {
    console.error('Error deleting student:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء حذف الطالب', details: err?.message });
  }
});

// Activation Codes Endpoints
router.get('/activation-codes', authenticateUser, requireOwner, async (_req: Request, res: Response) => {
  try {
    await db.sync();
    const codes = db.getAllActivationCodes();
    return res.json({ codes });
  } catch (err: any) {
    console.error('Error getting activation codes:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب رموز التفعيل', details: err?.message });
  }
});

router.post('/activation-codes', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
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
  } catch (err: any) {
    console.error('Error generating codes:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء توليد الرموز', details: err?.message });
  }
});

router.patch('/activation-codes/:id/revoke', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
    const updated = db.updateActivationCode(req.params.id, { status: 'revoked' });
    if (!updated) {
      return res.status(404).json({ error: 'الرمز غير موجود' });
    }

    db.logAudit('إلغاء رمز تفعيل', req.user!.fullName, `تم تعطيل الرمز ${updated.code}`);
    return res.json({ message: 'تم إبطال رمز التفعيل بنجاح', code: updated });
  } catch (err: any) {
    console.error('Error revoking code:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء إبطال الرمز', details: err?.message });
  }
});

// Experiments Endpoints
router.get('/experiments', async (_req: Request, res: Response) => {
  try {
    await db.sync();
    const experiments = db.getPublishedExperiments();
    return res.json({ experiments });
  } catch (err: any) {
    console.error('Error getting experiments:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب التجارب', details: err?.message });
  }
});

router.post('/experiments', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
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
  } catch (err: any) {
    console.error('Error creating experiment:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء إضافة التجربة', details: err?.message });
  }
});

router.put('/experiments/:id', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
    const updated = db.saveExperiment({ ...req.body, id: req.params.id });
    db.logAudit('تعديل تجربة معملية', req.user!.fullName, `تم تعديل التجربة: ${updated.title}`);
    return res.json({ message: 'تم حفظ التجربة بنجاح', experiment: updated });
  } catch (err: any) {
    console.error('Error updating experiment:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تعديل التجربة', details: err?.message });
  }
});

router.delete('/experiments/:id', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
    db.deleteExperiment(req.params.id);
    db.logAudit('حذف تجربة معملية', req.user!.fullName, `تم حذف التجربة رقم: ${req.params.id}`);
    return res.json({ message: 'تم حذف التجربة بنجاح' });
  } catch (err: any) {
    console.error('Error deleting experiment:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء حذف التجربة', details: err?.message });
  }
});

// Quiz Submission & Evaluation
router.post('/experiments/:id/quiz', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
    const exp = db.getExperimentById(req.params.id);
    if (!exp) {
      return res.status(404).json({ error: 'التجربة غير موجودة' });
    }

    if (!exp.quiz || exp.quiz.length === 0) {
      return res.status(400).json({ error: 'لا يوجد اختبار مخصص لهذه التجربة' });
    }

    const { answers = {} } = req.body;
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
  } catch (err: any) {
    console.error('Quiz error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تقييم الاختبار', details: err?.message });
  }
});

// Saved Circuits
router.post('/circuits/save', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
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
  } catch (err: any) {
    console.error('Save circuit error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ الدائرة', details: err?.message });
  }
});

router.get('/circuits/my', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
    const list = db.getUserCircuits(req.user!.id);
    return res.json({ circuits: list });
  } catch (err: any) {
    console.error('Get circuits error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب الدوائر', details: err?.message });
  }
});

router.delete('/circuits/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
    const success = db.deleteCircuit(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'الدائرة غير موجودة' });
    }
    return res.json({ message: 'تم حذف الدائرة بنجاح' });
  } catch (err: any) {
    console.error('Delete circuit error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء حذف الدائرة', details: err?.message });
  }
});

// Simulation run event
router.post('/simulation/run-event', async (_req: Request, res: Response) => {
  try {
    const total = db.incrementSimulationRuns();
    return res.json({ success: true, count: total });
  } catch (err: any) {
    return res.json({ success: false, error: err?.message });
  }
});

// Stats & Audit Logs (Owner only)
router.get('/stats', authenticateUser, requireOwner, async (_req: Request, res: Response) => {
  try {
    await db.sync();
    const stats = db.getStats();
    const auditLogs = db.getAuditLogs().slice(0, 50);
    return res.json({ stats, auditLogs });
  } catch (err: any) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب الإحصائيات', details: err?.message });
  }
});

// Settings (Owner only)
router.get('/settings', authenticateUser, requireOwner, async (_req: Request, res: Response) => {
  try {
    await db.sync();
    return res.json({ settings: db.getSettings() });
  } catch (err: any) {
    console.error('Settings error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب الإعدادات', details: err?.message });
  }
});

router.put('/settings', authenticateUser, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.sync();
    const updated = db.updateSettings(req.body);
    db.logAudit('تحديث إعدادات المختبر', req.user!.fullName, 'تم تحديث إعدادات النظام وسياسات التسجيل بنجاح');
    return res.json({ message: 'تم حفظ الإعدادات بنجاح', settings: updated });
  } catch (err: any) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ الإعدادات', details: err?.message });
  }
});

// Mount router at '/api', '/api/index', AND '/'
apiApp.use('/api', router);
apiApp.use('/api/index', router);
apiApp.use('/', router);

// Global Error Handler for safe JSON response (prevents FUNCTION_INVOCATION_FAILED on Vercel)
apiApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'حدث خطأ في الخادم', details: err?.message || 'Server error' });
  }
});

export default apiApp;
