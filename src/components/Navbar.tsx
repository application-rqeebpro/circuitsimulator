import { Cpu, Shield, User, LogOut, KeyRound, Sparkles, CheckCircle2, AlertCircle, Bookmark, Compass, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeView: 'landing' | 'lab' | 'experiments' | 'owner';
  setActiveView: (view: 'landing' | 'lab' | 'experiments' | 'owner') => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenOwnerLogin: () => void;
  onOpenRedeemModal: () => void;
  onOpenSavedCircuits: () => void;
  onOpenVerificationTests: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  setActiveView,
  onOpenLogin,
  onOpenRegister,
  onOpenOwnerLogin,
  onOpenRedeemModal,
  onOpenSavedCircuits,
  onOpenVerificationTests,
  onLogout,
}) => {
  const isOwner = currentUser?.role === 'owner';
  const isSubscribed = currentUser?.subscription?.status === 'active';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Emblem */}
        <div 
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30 group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-wide">مختبر الدوائر الكهربائية</span>
              <span className="hidden md:inline-block text-[11px] font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Circuit Wizard Edition
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>أكاديمية الميكاترونكس اليمنية</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-medium hidden sm:inline">الجامعة الإماراتية الدولية</span>
            </div>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveView('landing')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'landing'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            الرئيسية
          </button>

          <button
            onClick={() => setActiveView('lab')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              activeView === 'lab'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>المختبر (Circuit Wizard)</span>
          </button>

          <button
            onClick={() => setActiveView('experiments')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'experiments'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            التجارب العملية (14)
          </button>

          <button
            onClick={onOpenVerificationTests}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50 transition-colors flex items-center gap-1"
            title="فحص التطابق مع قوانين أوم وكيرشوف"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>فحص الدقة الحسابية</span>
          </button>

          {currentUser && (
            <button
              onClick={onOpenSavedCircuits}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-1"
            >
              <Bookmark className="w-3.5 h-3.5 text-teal-400" />
              <span>دوائري</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => setActiveView('owner')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeView === 'owner'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-amber-400/90 hover:bg-amber-500/10'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>لوحة المالك</span>
            </button>
          )}
        </nav>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallPrompt variant="compact" />
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Subscription Status Tag */}
              {currentUser.role === 'student' && (
                <div 
                  onClick={onOpenRedeemModal}
                  className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 transition-colors"
                  title="انقر لتفعيل رمز اشتراك جديد"
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-300">{currentUser.subscription?.planName}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300">تفعيل اشتراك</span>
                    </>
                  )}
                </div>
              )}

              {/* User Dropdown / Info */}
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-slate-200 max-w-[120px] truncate">{currentUser.fullName}</span>
                {isOwner && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    المالك
                  </span>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                دخول الطالب
              </button>

              <button
                onClick={onOpenRegister}
                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-colors"
              >
                حساب جديد
              </button>

              {/* Prominent Owner Login Icon */}
              <button
                onClick={onOpenOwnerLogin}
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
                title="دخول المالك والمشرف الأكاديمي"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">دخول المالك</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around px-2 py-2 bg-slate-900 border-t border-slate-800 text-xs">
        <button
          onClick={() => setActiveView('landing')}
          className={`px-2 py-1 rounded ${activeView === 'landing' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          الرئيسية
        </button>
        <button
          onClick={() => setActiveView('lab')}
          className={`px-2.5 py-1 rounded ${activeView === 'lab' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
        >
          المختبر
        </button>
        <button
          onClick={() => setActiveView('experiments')}
          className={`px-2 py-1 rounded ${activeView === 'experiments' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          التجارب (14)
        </button>
        <div className="sm:hidden">
          <PWAInstallPrompt variant="compact" />
        </div>
        {isOwner && (
          <button
            onClick={() => setActiveView('owner')}
            className={`px-2 py-1 rounded ${activeView === 'owner' ? 'text-amber-400 font-bold' : 'text-amber-500/80'}`}
          >
            لوحة المالك
          </button>
        )}
      </div>
    </header>
  );
};
