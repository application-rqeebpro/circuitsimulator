import React, { useState } from 'react';
import { FilePlus, FolderOpen, Compass, X, Check, BookOpen, Sparkles, Cpu, Lightbulb, Play } from 'lucide-react';
import { Experiment, EXPERIMENTS_LIST } from '../data/experimentsData';

interface CircuitWizardWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewCircuit: () => void;
  onLoadExperiment: (exp: Experiment) => void;
  onStartTour: () => void;
}

export const CircuitWizardWelcomeModal: React.FC<CircuitWizardWelcomeModalProps> = ({
  isOpen,
  onClose,
  onNewCircuit,
  onLoadExperiment,
  onStartTour,
}) => {
  const [selectedAction, setSelectedAction] = useState<'new' | 'sample' | 'tour'>('new');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(2); // Default Ohm's Law
  const [showAtStartup, setShowAtStartup] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedAction === 'new') {
      onNewCircuit();
    } else if (selectedAction === 'sample') {
      const exp = EXPERIMENTS_LIST[selectedSampleIndex] || EXPERIMENTS_LIST[0];
      onLoadExperiment(exp);
    } else if (selectedAction === 'tour') {
      onStartTour();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Top Header Banner matching Circuit Wizard Assistant */}
        <div className="relative h-36 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 overflow-hidden flex items-center px-6">
          {/* Subtle circuit grid and decorative SVG */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/40">
                New Wave Concepts • Assistant
              </span>
              <span className="text-xs text-slate-400 font-mono">v4.0 Professional</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Welcome to Circuit Wizard</span>
            </h2>
            <p className="text-xs text-emerald-200/80 mt-1 font-sans">
              المختبر الهندسي المتقدم لتصميم ومحاكاة الدوائر الكهربائية والإلكترونية
            </p>
          </div>

          {/* Decorative Breadboard & Multimeter Graphic */}
          <div className="relative z-10 shrink-0 hidden sm:block">
            <div className="w-24 h-24 rounded-2xl bg-slate-950/70 border border-emerald-500/40 p-2 shadow-inner flex flex-col items-center justify-center text-center">
              <div className="w-10 h-7 rounded bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-1">
                <span className="font-mono text-[9px] font-bold text-amber-300">9.00V</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] text-slate-300 font-bold">جاهز للعمل</span>
              </div>
            </div>
          </div>

          {/* Close X */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-200">
            ماذا تريد أن تفعل؟ (What would you like to do?)
          </p>

          {/* 3 Main Action Cards */}
          <div className="space-y-2.5">
            {/* 1. New Circuit */}
            <div
              onClick={() => setSelectedAction('new')}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                selectedAction === 'new'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                selectedAction === 'new' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-300'
              }`}>
                <FilePlus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">إنشاء مخطط دائرة جديد (New Circuit Diagram)</h4>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedAction === 'new' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
                  }`}>
                    {selectedAction === 'new' && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  افتح لوحة عمل فارغة لبناء دائرة جديدة وسحب المكونات من المعرض (Gallery) وتوصيل الأسلاك يدوياً.
                </p>
              </div>
            </div>

            {/* 2. Open Sample Circuit */}
            <div
              onClick={() => setSelectedAction('sample')}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                selectedAction === 'sample'
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedAction === 'sample' ? 'bg-cyan-500 text-white shadow-md' : 'bg-slate-800 text-slate-300'
                }`}>
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">فتح دائرة نموذجية جاهزة (Open a Sample Circuit)</h4>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedAction === 'sample' ? 'border-cyan-400 bg-cyan-500' : 'border-slate-600'
                    }`}>
                      {selectedAction === 'sample' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    اختر تجربة نموذجية مسبقة الإعداد (قانون أوم، مجزئ الجهد، مؤقت 555، بوابات منطقية، مكبر LM741).
                  </p>
                </div>
              </div>

              {/* Sample Selector Dropdown if Sample is selected */}
              {selectedAction === 'sample' && (
                <div className="pt-2 border-t border-slate-700/60 pr-12">
                  <label className="text-[11px] text-cyan-300 font-bold block mb-1">
                    اختر التجربة النموذجية:
                  </label>
                  <select
                    value={selectedSampleIndex}
                    onChange={(e) => setSelectedSampleIndex(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                  >
                    {EXPERIMENTS_LIST.map((exp, idx) => (
                      <option key={exp.id} value={idx}>
                        تجربة #{exp.number}: {exp.title} ({exp.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 3. Guided Tour */}
            <div
              onClick={() => setSelectedAction('tour')}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                selectedAction === 'tour'
                  ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                selectedAction === 'tour' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-800 text-slate-300'
              }`}>
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">جولة إرشادية سريعة (Guided Tour)</h4>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedAction === 'tour' ? 'border-amber-400 bg-amber-500' : 'border-slate-600'
                  }`}>
                    {selectedAction === 'tour' && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  تعلم كيفية استخدام شريط الأدوات، رسم الأسلاك، تشغيل المحاكاة، واستخدام أجهزة القياس الافتراضية.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Checkbox */}
          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              id="showStartup"
              checked={showAtStartup}
              onChange={(e) => setShowAtStartup(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="showStartup" className="cursor-pointer">
              إظهار هذا المساعد دائماً عند بدء التشغيل (Show this dialog at startup)
            </label>
          </div>
        </div>

        {/* Footer Buttons matching Windows CAD style */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            إلغاء (Cancel)
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>موافق (OK)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
