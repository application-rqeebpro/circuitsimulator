import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserProfile, ActivationCodeItem, LabStats, AuditLogItem, Experiment } from '../types';
import { 
  Users, 
  KeyRound, 
  Shield, 
  BarChart3, 
  Settings, 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  RefreshCw,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  Phone
} from 'lucide-react';

interface OwnerDashboardProps {
  onBackToLab: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onBackToLab }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'subscriptions' | 'codes' | 'experiments' | 'stats' | 'settings'>('students');

  // Data states
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [codes, setCodes] = useState<ActivationCodeItem[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [stats, setStats] = useState<LabStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Loading & status
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals for editing / generating
  const [generateCodeModal, setGenerateCodeModal] = useState(false);
  const [codePrefix, setCodePrefix] = useState('MECH-EIU');
  const [codeDuration, setCodeDuration] = useState(180);
  const [codePlanName, setCodePlanName] = useState('اشتراك فصلي (180 يوم)');
  const [codeCount, setCodeCount] = useState(5);

  // Subscription modal for a student
  const [subModalStudent, setSubModalStudent] = useState<UserProfile | null>(null);
  const [subDurationInput, setSubDurationInput] = useState(180);
  const [subPlanNameInput, setSubPlanNameInput] = useState('اشتراك فصلي معتمد');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stdRes, codeRes, expRes, statsRes, setRes] = await Promise.all([
        api.getStudents(),
        api.getActivationCodes(),
        api.getExperiments(),
        api.getStats(),
        api.getSettings(),
      ]);
      setStudents(stdRes.students || []);
      setCodes(codeRes.codes || []);
      setExperiments(expRes.experiments || []);
      setStats(statsRes.stats);
      setAuditLogs(statsRes.auditLogs || []);
      setSettings(setRes.settings);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'فشل تحميل بيانات لوحة التحكم' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudentStatus = async (id: string, newStatus: 'active' | 'suspended') => {
    try {
      await api.updateStudentStatus(id, newStatus);
      setMessage({ type: 'success', text: `تم تحديث حالة الطالب إلى: ${newStatus === 'active' ? 'مفعل' : 'موقوف'}` });
      loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'فشل تحديث الحالة' });
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد تمامًا من حذف حساب الطالب «${name}»؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await api.deleteStudent(id);
      setMessage({ type: 'success', text: `تم حذف حساب الطالب ${name} بنجاح` });
      loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'فشل حذف الحساب' });
    }
  };

  const handleSaveStudentSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subModalStudent) return;
    try {
      await api.updateStudentSubscription(subModalStudent.id, {
        durationDays: subDurationInput,
        planName: subPlanNameInput,
        status: 'active',
      });
      setMessage({ type: 'success', text: `تم تحديث اشتراك الطالب ${subModalStudent.fullName} بنجاح` });
      setSubModalStudent(null);
      loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'فشل تحديث الاشتراك' });
    }
  };

  // Quick activate by registered phone
  const handleQuickActivateByPhone = async (std: UserProfile) => {
    try {
      await api.updateStudentSubscription(std.id, {
        durationDays: 180,
        planName: 'اشتراك فصلي مفعل برقم الهاتف (180 يوم)',
        status: 'active',
      });
      setMessage({ 
        type: 'success', 
        text: `تم تفعيل حساب الطالب «${std.fullName}» بنجاح عبر رقمه المسجل (${std.phone}) ومنحه اشتراكًا فصليًا كاملًا.` 
      });
      loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'فشل تفعيل الحساب بالرقم' });
    }
  };

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.generateActivationCodes({
        prefix: codePrefix,
        durationDays: codeDuration,
        planName: codePlanName,
        count: codeCount,
      });
      setMessage({ type: 'success', text: res.message });
      setGenerateCodeModal(false);
      loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'فشل توليد الرموز' });
    }
  };

  const handleRevokeCode = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء صلاحية هذا الرمز؟')) return;
    try {
      await api.revokeActivationCode(id);
      setMessage({ type: 'success', text: 'تم إلغاء الرمز بنجاح' });
      loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'فشل إلغاء الرمز' });
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setMessage({ type: 'success', text: 'تم حفظ إعدادات المختبر بنجاح' });
      loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'فشل حفظ الإعدادات' });
    }
  };

  // Filtered students
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.phone.includes(searchQuery);
    const matchesUni = universityFilter === 'all' || s.university === universityFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesUni && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-amber-400">لوحة الإدارة والتحكم العليا</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              لوحة تحكم مالك المنصة – أكاديمية الميكاترونكس
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              إدارة حسابات الطلاب، رموز التفعيل، الاشتراكات، التجارب، ومتابعة سجل العمليات
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onBackToLab}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors"
            >
              الذهاب إلى المختبر التفاعلي
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {message && (
          <div className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة الطلاب ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'codes'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>رموز التفعيل ({codes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('experiments')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'experiments'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>التجارب ({experiments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات والسجل</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات المختبر</span>
          </button>
        </div>

        {/* TAB 1: Students Management */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            
            {/* Search and Filters Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم أو رقم الهاتف..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={universityFilter}
                  onChange={e => setUniversityFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="all">كل الجامعات</option>
                  <option value="الجامعة الإماراتية الدولية">الجامعة الإماراتية الدولية</option>
                  <option value="جامعة العلوم الحديثة">جامعة العلوم الحديثة</option>
                  <option value="جامعة الرشيد">جامعة الرشيد</option>
                  <option value="جامعة العلوم والتكنولوجيا">جامعة العلوم والتكنولوجيا</option>
                  <option value="جامعة صنعاء">جامعة صنعاء</option>
                  <option value="جامعة آزال">جامعة آزال</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">مفعل</option>
                  <option value="suspended">موقوف</option>
                  <option value="pending">بانتظار التفعيل</option>
                </select>
              </div>
            </div>

            {/* Pending Students Notification Banner */}
            {students.filter(s => s.status === 'pending').length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      يوجد {students.filter(s => s.status === 'pending').length} طلب تسجيل جديد بانتظار موافقتك!
                    </h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      لا يمكن لهؤلاء الطلاب استخدام المختبر أو التجارب إلا بعد موافقتك وتفعيل حساباتهم.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStatusFilter('pending')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-md shadow-amber-500/20"
                >
                  عرض الطلبات المعلقة فقط
                </button>
              </div>
            )}

            {/* Quick Activate by Phone Box (خاصية تفعيل الحساب عبر الرقم المسجل) */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">تفعيل الحساب والاشتراك عبر الرقم المسجل</h4>
                  <p className="text-[11px] text-slate-300">
                    يستطيع المالك تفعيل أي حساب مباشرة عبر رقم هاتف الطالب المسجل بنقرة زر واحدة أو بالبحث عن الرقم أدناه.
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-amber-300 font-mono font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/20 whitespace-nowrap">
                رقم الاستقبال المعتمد: 785502919
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">الاسم الكامل</th>
                    <th className="p-3.5">الهاتف</th>
                    <th className="p-3.5">الجامعة والمستوى</th>
                    <th className="p-3.5">حالة الحساب</th>
                    <th className="p-3.5">الاشتراك</th>
                    <th className="p-3.5">تاريخ التسجيل</th>
                    <th className="p-3.5 text-center">إجراءات المالك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        لا توجد حسابات مطابقة للبحث
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(std => {
                      const isSubActive = std.subscription?.status === 'active' && new Date(std.subscription.expiresAt) > new Date();

                      return (
                        <tr key={std.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-3.5 font-bold text-white">{std.fullName}</td>
                          <td className="p-3.5 font-mono text-slate-300" dir="ltr">{std.phone}</td>
                          <td className="p-3.5 text-slate-300">
                            <div>{std.university}</div>
                            <div className="text-[10px] text-slate-500">{std.studyLevel}</div>
                          </td>
                          <td className="p-3.5">
                            {std.status === 'active' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                مفعل
                              </span>
                            ) : std.status === 'suspended' ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                                موقوف
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                قيد المراجعة
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {isSubActive ? (
                              <div>
                                <span className="text-emerald-400 font-bold">{std.subscription?.planName}</span>
                                <div className="text-[10px] text-slate-400 font-mono-numbers">
                                  حتى {new Date(std.subscription!.expiresAt).toLocaleDateString('ar-YE')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-red-400 text-[11px]">منتهي / غير مشترك</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px] font-mono-numbers">
                            {new Date(std.createdAt).toLocaleDateString('ar-YE')}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {std.status === 'pending' ? (
                                <button
                                  onClick={() => handleUpdateStudentStatus(std.id, 'active')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all active:scale-95"
                                  title="الموافقة على تفعيل الحساب فوراً"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>قبول وتفعيل</span>
                                </button>
                              ) : std.status === 'active' ? (
                                <button
                                  onClick={() => handleUpdateStudentStatus(std.id, 'suspended')}
                                  className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] border border-red-500/30 transition-colors"
                                  title="تجميد الحساب ومنع الوصول"
                                >
                                  إيقاف
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStudentStatus(std.id, 'active')}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] border border-emerald-500/30 transition-colors"
                                  title="إعادة التفعيل"
                                >
                                  تفعيل
                                </button>
                              )}

                              <button
                                onClick={() => handleQuickActivateByPhone(std)}
                                className="px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] border border-teal-500/30 flex items-center gap-1 transition-colors"
                                title={`تفعيل فوري للحساب عبر الرقم المسجل (${std.phone})`}
                              >
                                <Phone className="w-3 h-3 text-teal-400" />
                                <span>تفعيل بالرقم</span>
                              </button>

                              <button
                                onClick={() => setSubModalStudent(std)}
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] border border-amber-500/30 transition-colors"
                                title="منح أو تعديل مدة الاشتراك"
                              >
                                مدة مخصصة
                              </button>

                              <button
                                onClick={() => handleDeleteStudent(std.id, std.fullName)}
                                className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                                title="حذف الحساب نهائيًا"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: Activation Codes */}
        {activeTab === 'codes' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">رموز التفعيل المعتمدة (Activation Codes)</h3>
                <p className="text-xs text-slate-400">توليد رموز فريدة عشوائية يصعب تخمينها لمنح الطلاب اشتراكات معتمدة</p>
              </div>

              <button
                onClick={() => setGenerateCodeModal(true)}
                className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>توليد رموز جديدة</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">الرمز (Code)</th>
                    <th className="p-3.5">خطة الاشتراك</th>
                    <th className="p-3.5">المدة (أيام)</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">مستخدم بواسطة</th>
                    <th className="p-3.5">تاريخ التوليد</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {codes.map(c => (
                    <tr key={c.id} className="hover:bg-slate-850/50">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-numbers font-bold text-emerald-400 tracking-wider text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800" dir="ltr">
                            {c.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(c.id, c.code)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="نسخ الرمز"
                          >
                            {copiedCodeId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-200">{c.planName}</td>
                      <td className="p-3.5 font-mono-numbers text-slate-300">{c.durationDays} يوم</td>
                      <td className="p-3.5">
                        {c.status === 'available' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            متاح
                          </span>
                        ) : c.status === 'used' ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                            مستخدم
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                            ملغى
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {c.usedByStudentName ? (
                          <div>
                            <span className="text-white font-medium">{c.usedByStudentName}</span>
                            <div className="text-[10px] text-slate-500 font-mono-numbers">
                              {c.usedAt ? new Date(c.usedAt).toLocaleDateString('ar-YE') : ''}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px] font-mono-numbers">
                        {new Date(c.createdAt).toLocaleDateString('ar-YE')}
                      </td>
                      <td className="p-3.5 text-center">
                        {c.status === 'available' && (
                          <button
                            onClick={() => handleRevokeCode(c.id)}
                            className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] border border-red-500/30"
                          >
                            إلغاء
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: Experiments Management */}
        {activeTab === 'experiments' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">إدارة التجارب المعملية الـ 14</h3>
              <p className="text-xs text-slate-400">التحكم في نشر وإخفاء التجارب ومراجعة محتواها</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {experiments.map(exp => (
                <div key={exp.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono-numbers px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold text-[11px]">
                        تجربة #{exp.number}
                      </span>
                      <span className="text-slate-400">{exp.category}</span>
                    </div>

                    <h4 className="font-bold text-white text-sm mb-1">{exp.title}</h4>
                    <p className="text-slate-400 text-xs mb-3 line-clamp-2">{exp.objective}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">{exp.quiz.length} أسئلة اختبار</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px]">
                      منشورة ونشطة
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Stats & Audit Logs */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            
            {/* Stats Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">إجمالي الطلاب</div>
                <div className="text-2xl font-black text-white font-mono-numbers">{stats.totalStudents}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">الاشتراكات السارية</div>
                <div className="text-2xl font-black text-emerald-400 font-mono-numbers">{stats.activeSubscriptions}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">رموز التفعيل المتاحة</div>
                <div className="text-2xl font-black text-amber-400 font-mono-numbers">{stats.availableActivationCodes}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">مرات تشغيل المحاكاة</div>
                <div className="text-2xl font-black text-cyan-400 font-mono-numbers">{stats.simulationRunsCount}</div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">سجل العمليات الإدارية (Audit Trail)</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">العملية</th>
                      <th className="p-3">المنفذ</th>
                      <th className="p-3">التفاصيل</th>
                      <th className="p-3">الوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-850/50">
                        <td className="p-3 font-bold text-amber-400">{log.action}</td>
                        <td className="p-3 text-slate-200">{log.performedBy}</td>
                        <td className="p-3 text-slate-300">{log.details}</td>
                        <td className="p-3 text-slate-400 font-mono-numbers text-[11px]">
                          {new Date(log.timestamp).toLocaleString('ar-YE')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: Lab Settings */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white mb-3">إعدادات وسياسات المنصة</h3>

            <div>
              <label className="block text-slate-300 mb-1">اسم الأكاديمية</label>
              <input
                type="text"
                value={settings.academyName}
                onChange={e => setSettings({ ...settings, academyName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">عنوان المختبر</label>
              <input
                type="text"
                value={settings.labTitle}
                onChange={e => setSettings({ ...settings, labTitle: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="requireApproval"
                checked={settings.requireOwnerApprovalForRegistration}
                onChange={e => setSettings({ ...settings, requireOwnerApprovalForRegistration: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
              />
              <label htmlFor="requireApproval" className="text-slate-300 cursor-pointer">
                اشتراط موافقة المالك اليدوية قبل تفعيل حساب الطالب الجديد
              </label>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">عدد أيام الفترة التجريبية الافتراضية للطلاب</label>
              <input
                type="number"
                value={settings.defaultTrialDays}
                onChange={e => setSettings({ ...settings, defaultTrialDays: parseInt(e.target.value, 10) || 14 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-numbers focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-colors"
            >
              حفظ الإعدادات
            </button>
          </form>
        )}

      </div>

      {/* Modal: Generate Codes */}
      {generateCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-xs space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">توليد رموز تفعيل جديدة</h3>
            <form onSubmit={handleGenerateCodes} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">بادئة الرمز (Prefix)</label>
                <input
                  type="text"
                  required
                  value={codePrefix}
                  onChange={e => setCodePrefix(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">اسم الخطة</label>
                <input
                  type="text"
                  required
                  value={codePlanName}
                  onChange={e => setCodePlanName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">المدة (أيام)</label>
                  <input
                    type="number"
                    min="1"
                    value={codeDuration}
                    onChange={e => setCodeDuration(parseInt(e.target.value, 10) || 180)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">العدد المطلوب</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={codeCount}
                    onChange={e => setCodeCount(parseInt(e.target.value, 10) || 5)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-numbers"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setGenerateCodeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  توليد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Grant Student Subscription */}
      {subModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-xs space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">تعديل اشتراك الطالب: {subModalStudent.fullName}</h3>
            <form onSubmit={handleSaveStudentSubscription} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">اسم الخطة / المسمى</label>
                <input
                  type="text"
                  required
                  value={subPlanNameInput}
                  onChange={e => setSubPlanNameInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">المدة بالأيام (من تاريخ اليوم)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={subDurationInput}
                  onChange={e => setSubDurationInput(parseInt(e.target.value, 10) || 180)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-numbers"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSubModalStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  حفظ وتفعيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
