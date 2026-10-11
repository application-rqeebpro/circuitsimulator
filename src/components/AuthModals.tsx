import React, { useState } from 'react';
import { X, Shield, User, Lock, Phone, GraduationCap, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface AuthModalsProps {
  loginOpen: boolean;
  registerOpen: boolean;
  ownerLoginOpen: boolean;
  redeemOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
  onSwitchToOwnerLogin: () => void;
}

const YEMENI_UNIVERSITIES = [
  'الجامعة الإماراتية الدولية',
  'جامعة العلوم الحديثة',
  'جامعة الرشيد',
  'جامعة العلوم والتكنولوجيا',
  'جامعة صنعاء',
  'جامعة آزال',
  'جامعة أخرى',
];

const STUDY_LEVELS = [
  'السنة الأولى',
  'السنة الثانية',
  'السنة الثالثة',
  'السنة الرابعة',
  'السنة الخامسة',
];

export const AuthModals: React.FC<AuthModalsProps> = ({
  loginOpen,
  registerOpen,
  ownerLoginOpen,
  redeemOpen,
  onClose,
  onAuthSuccess,
  onSwitchToRegister,
  onSwitchToLogin,
  onSwitchToOwnerLogin,
}) => {
  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('الجامعة الإماراتية الدولية');
  const [studyLevel, setStudyLevel] = useState('السنة الأولى');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [activationCodeInput, setActivationCodeInput] = useState('');

  // Subscription check state for Yemeni Mechatronics Academy (engaseel.online)
  const [isAcademySubscribed, setIsAcademySubscribed] = useState<'yes' | 'no' | null>(null);
  const [showSubscriptionRequestModal, setShowSubscriptionRequestModal] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetFields = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(false);
  };

  // Student Login Handler
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.login({ phone, password });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login Handler
  const handleQuickDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.login({ phone: '771234567', password: 'StudentPass123!' });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول التجريبي');
    } finally {
      setLoading(false);
    }
  };

  // Owner Login Handler
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.ownerLogin({ phone, password });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل التحقق من هوية المالك');
    } finally {
      setLoading(false);
    }
  };



  // Student Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isAcademySubscribed !== 'yes') {
      setErrorMsg('لا يمكنك إنشاء حساب في المختبر إلا إذا كنت مشتركًا في منصة أكاديمية الميكاترونكس اليمنية (engaseel.online)');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام لمتابعة التسجيل');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName,
        phone,
        university,
        studyLevel,
        password,
      });
      setSuccessMsg(res.message);
      setTimeout(() => {
        onAuthSuccess(res.user);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  // Redeem Code Handler
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.redeemCode(activationCodeInput);
      setSuccessMsg(res.message);
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تفعيل الرمز');
    } finally {
      setLoading(false);
    }
  };

  if (!loginOpen && !registerOpen && !ownerLoginOpen && !redeemOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Student Login Modal */}
        {loginOpen && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">تسجيل دخول الطالب</h3>
              <p className="text-xs text-slate-400 mt-1">مختبر الدوائر الكهربائية – أكاديمية الميكاترونكس</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">رقم الهاتف</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="مثال: 771234567"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 text-left placeholder:text-slate-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
              </button>

              {/* Demo button */}
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-emerald-400 text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>دخول سريع كطالب تجريبي (أحمد الكبسي - EIU)</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center flex flex-col gap-2">
              <p className="text-xs text-slate-400">
                ليس لديك حساب بعد؟{' '}
                <button
                  type="button"
                  onClick={() => { resetFields(); onSwitchToRegister(); }}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  إنشاء حساب طالب جديد
                </button>
              </p>

              <button
                type="button"
                onClick={() => { resetFields(); onSwitchToOwnerLogin(); }}
                className="text-xs text-amber-400/90 hover:text-amber-300 flex items-center justify-center gap-1 mt-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>دخول المشرف والمالك</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Owner Login Modal */}
        {ownerLoginOpen && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">بوابة دخول المالك</h3>
              <p className="text-xs text-amber-400/80 mt-1">إدارة أكاديمية الميكاترونكس والمختبر الافتراضي</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleOwnerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">رقم هاتف المالك</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="أدخل رقم الهاتف المسجل"
                    className="w-full bg-slate-800/80 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 text-left placeholder:text-slate-500"
                  />
                  <Phone className="w-4 h-4 text-amber-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">كلمة مرور المالك</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2"
              >
                {loading ? 'جارٍ المصادقة...' : 'دخول لوحة التحكم'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => { resetFields(); onSwitchToLogin(); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                العودة لدخول الطلاب
              </button>
            </div>
          </div>
        )}

        {/* 3. Student Registration Modal */}
        {registerOpen && (
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">إنشاء حساب طالب جديد</h3>
              <p className="text-xs text-slate-400">انضم لمختبر أكاديمية الميكاترونكس اليمنية</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Important Notice: Yemeni Mechatronics Academy Platform (engaseel.online) Check */}
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-amber-300">ملحوظة هامة: </span>
                  <span className="text-slate-200">
                    لا تستطيع الاشتراك في المختبر إلا إذا كنت مشتركًا في منصة أكاديمية الميكاترونكس اليمنية{' '}
                    <a 
                      href="https://engaseel.online" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-amber-400 font-bold underline hover:text-amber-300"
                    >
                      engaseel.online
                    </a>
                  </span>
                </div>
              </div>

              {/* Question: Are you subscribed? Yes or No */}
              <div className="pt-2 border-t border-amber-500/20">
                <p className="text-[11px] font-bold text-white mb-2">
                  هل أنت مشترك في منصة أكاديمية الميكاترونكس اليمنية (engaseel.online)؟
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAcademySubscribed('yes');
                      setErrorMsg('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isAcademySubscribed === 'yes'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>نعم، أنا مشترك</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAcademySubscribed('no');
                      setErrorMsg('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isAcademySubscribed === 'no'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>لا، لست مشتركًا</span>
                  </button>
                </div>
              </div>

              {/* Case 1: Yes -> Can request subscription to WhatsApp / phone 785502919 to get code */}
              {isAcademySubscribed === 'yes' && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ممتاز! بصفتك مشتركًا، يمكنك طلب كود الاشتراك:</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    أكمل ملء بياناتك وسجل حسابك، أو اطلب كود التفعيل المباشر عبر إرسال رسالة إلى الرقم{' '}
                    <strong className="text-white font-mono text-xs bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/30" dir="ltr">
                      785502919
                    </strong>{' '}
                    وسيتم إعطاؤك الكود لتسجيل الدخول إلى حسابك فورًا برقمك وكلمة سرك.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href="https://wa.me/967785502919?text=%D9%85%D8%B1%D8%AD%D8%A8%D9%8B%D8%A7%D8%8C%20%D8%A3%D9%86%D8%A7%20%D9%85%D8%B4%D8%AA%D8%B1%D9%83%20%D9%81%D9%8A%20%D9%85%D9%86%D8%B5%D8%A9%20%D8%A3%D9%83%D8%A7%D8%AF%D9%8A%D9%85%D9%8A%D8%A9%20%D8%A7%D9%84%D9%85%D9%8A%D9%83%D8%A7%D8%AA%D8% litigation%D9%83%D8%B3%20engaseel.online%20%D9%88%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%B7%D9%84%D8%A8%20%D9%83%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%20%D8%A7%D9%84%D8%AF%D9%88%D8%A7%D8%A6%D8%B1%20%D8%A7%D9%84%D9%83%D9%87%D8%B1%D8%A8%D8%A7%D8%A6%D9%8A%D8%A9."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>طلب كود الاشتراك عبر واتساب (785502919)</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Case 2: No -> Cannot request subscription */}
              {isAcademySubscribed === 'no' && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-[11px] space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-red-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>تنبيه: لا يمكنك طلب الاشتراك أو فتح حساب بالمختبر</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    بما أنك لست مشتركًا في منصة أكاديمية الميكاترونكس اليمنية (engaseel.online)، فلا تستطيع طلب الاشتراك أو الحصول على كود التفعيل حتى تشترك أولاً في المنصة الرئيسية.
                  </p>
                  <a
                    href="https://engaseel.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
                  >
                    <span>الذهاب للاشتراك في engaseel.online</span>
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="مثال: أحمد محمد الكبسي"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">رقم الهاتف (الرقم موحد للتسجيل)</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="77xxxxxxx"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 text-left placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">الجامعة</label>
                  <select
                    value={university}
                    onChange={e => setUniversity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {YEMENI_UNIVERSITIES.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">المستوى الدراسي</label>
                  <select
                    value={studyLevel}
                    onChange={e => setStudyLevel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {STUDY_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="6 خانات فأكثر"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="تأكيد الكلمة"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-slate-300 cursor-pointer">
                  أوافق على شروط الاستخدام وسياسة مختبر أكاديمية الميكاترونكس
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب الطالب'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => { resetFields(); onSwitchToLogin(); }}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 4. Redeem Activation Code Modal */}
        {redeemOpen && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">تفعيل اشتراك المختبر</h3>
              <p className="text-xs text-slate-400 mt-1">أدخل رمز التفعيل الممنوح لك من أكاديمية الميكاترونكس</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleRedeemCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">رمز التفعيل (Activation Code)</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={activationCodeInput}
                  onChange={e => setActivationCodeInput(e.target.value.toUpperCase())}
                  placeholder="مثال: EIU-MECH-2026"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono-numbers text-center tracking-wider text-emerald-400 focus:outline-none focus:border-emerald-500 uppercase placeholder:text-slate-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-400 leading-relaxed">
                رمز التفعيل يمنحك صلاحية استخدام المختبر الكامل وإجراء التجارب المعملية طوال فترة الفصل الدراسي. يمكن الحصول على الرمز من مشرف المادة أو إدارة الأكاديمية.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2"
              >
                {loading ? 'جارٍ التحقق والتفعيل...' : 'تفعيل الاشتراك الآن'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
