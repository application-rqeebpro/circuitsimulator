import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallPromptProps {
  variant?: 'button' | 'banner' | 'compact';
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already running standalone or dismissed, do not render
  if (isInstalled || dismissed) {
    return null;
  }

  // 1. Android / Chrome / Edge Installation
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
          title="تثبيت مختبر الميكاترونكس كتطبيق مستقل على هاتفك"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>تثبيت التطبيق</span>
        </button>
      );
    }

    if (variant === 'banner') {
      return (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 px-3 py-2 text-xs flex items-center justify-between gap-3 shadow-md z-40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">ثبّت مختبر الميكاترونكس على هاتفك (Android)</div>
              <div className="text-[10px] text-slate-300">يعمل كتطبيق كامل وسريع بدون شريط المتصفح</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={install}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت الآن</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="إغلاق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
        title="تثبيت التطبيق على جهازك الأندرويد"
      >
        <Smartphone className="w-4 h-4" />
        <span>تثبيت على الأندرويد</span>
      </button>
    );
  }

  // 2. iOS Safari Flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
          title="تثبيت على آيفون / آيباد"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">إضافة للشاشة الرئيسية</span>
          <span className="sm:hidden">تثبيت PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4 text-center">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-white">تثبيت التطبيق على iOS Safari</h3>
              
              <div className="text-xs text-slate-300 space-y-2.5 text-right bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">1.</span>
                  <span>اضغط على زر المشاركة <Share2 className="w-3.5 h-3.5 inline text-cyan-400 mx-1" /> في شريط المتصفح السفلي.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">2.</span>
                  <span>مرر للأسفل واختر <strong className="text-white">"إضافة إلى الصفحة الرئيسية"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-amber-400 mx-1" />.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">3.</span>
                  <span>اضغط <strong className="text-emerald-400">إضافة (Add)</strong> في الزاوية العلوية ليظهر التطبيق في شاشتك كأيقونة مستقلة.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                حسنًا، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
