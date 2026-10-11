import React, { useState } from 'react';
import { Experiment, EXPERIMENTS_LIST } from '../data/experimentsData';
import { 
  BookOpen, 
  X, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  Wrench, 
  ListOrdered, 
  Sparkles,
  Layers
} from 'lucide-react';

interface ExperimentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeExperiment: Experiment | null;
  onSelectExperiment: (exp: Experiment) => void;
  onLoadExperimentCircuit: (exp: Experiment) => void;
  onOpenQuiz: (exp: Experiment) => void;
}

export const ExperimentDrawer: React.FC<ExperimentDrawerProps> = ({
  isOpen,
  onClose,
  activeExperiment,
  onSelectExperiment,
  onLoadExperimentCircuit,
  onOpenQuiz,
}) => {
  const [viewMode, setViewMode] = useState<'details' | 'list'>('details');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">دليل التجارب المعملية</h3>
            <p className="text-[11px] text-slate-400">مقرر الدوائر الكهربائية – ميكاترونكس</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode(v => v === 'details' ? 'list' : 'details')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            {viewMode === 'details' ? 'فهرس التجارب' : 'عرض التجربة'}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body: List Mode or Details Mode */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        
        {/* LIST MODE: Pick an experiment from 1 to 14 */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 mb-2">اختر إحدى التجارب المعملية الـ 14:</div>
            {EXPERIMENTS_LIST.map(exp => (
              <div
                key={exp.id}
                onClick={() => {
                  onSelectExperiment(exp);
                  setViewMode('details');
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  activeExperiment?.id === exp.id
                    ? 'bg-emerald-950/30 border-emerald-500/60 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono-numbers px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-emerald-400">
                      #{exp.number}
                    </span>
                    <span className="font-bold text-xs">{exp.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                    {exp.titleEn}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 rotate-180" />
              </div>
            ))}
          </div>
        )}

        {/* DETAILS MODE: Active Experiment Content */}
        {viewMode === 'details' && activeExperiment && (
          <div className="space-y-4">
            
            {/* Title & Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                  التجربة رقم {activeExperiment.number}
                </span>
                <span className="text-[11px] text-slate-400">{activeExperiment.category}</span>
              </div>

              <h2 className="text-base font-bold text-white mb-1">
                {activeExperiment.title}
              </h2>
              <div className="text-[11px] font-mono text-slate-400" dir="ltr">
                {activeExperiment.titleEn}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onLoadExperimentCircuit(activeExperiment)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>تحميل الدائرة في اللوحة</span>
              </button>

              <button
                onClick={() => onOpenQuiz(activeExperiment)}
                className="py-2.5 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>بدء الاختبار ({activeExperiment.quiz.length})</span>
              </button>
            </div>

            {/* 1. Objective */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>الهدف من التجربة:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activeExperiment.objective}
              </p>
            </div>

            {/* 2. Required Tools */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1.5">
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                <span>الأدوات والعناصر المطلوبة:</span>
              </div>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {activeExperiment.tools.map((tool, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Schematic Theory */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>مخطط الدائرة والمعادلات:</span>
              </div>
              <p className="text-slate-300 text-[11px] font-mono leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800" dir="ltr">
                {activeExperiment.schematicDescription}
              </p>
            </div>

            {/* 4. Step-by-Step Procedure */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-2">
                <ListOrdered className="w-3.5 h-3.5 text-emerald-400" />
                <span>خطوات العمل المخبري:</span>
              </div>
              <ol className="space-y-2 text-slate-300 text-[11px]">
                {activeExperiment.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-mono-numbers flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 5. Scientific Explanation */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>التفسير العلمي الهندسي:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activeExperiment.scientificExplanation}
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
