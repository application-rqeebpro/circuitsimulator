import React, { useState } from 'react';
import { 
  FilePlus, 
  FolderOpen, 
  Save, 
  Printer, 
  Trash2, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause, 
  Square, 
  Gauge, 
  Activity, 
  Calculator, 
  Compass, 
  Sparkles,
  Grid,
  Zap,
  Eye,
  Sliders,
  CheckCircle2,
  BookOpen,
  Layers,
  MoreVertical,
  X
} from 'lucide-react';

interface CircuitWizardToolbarProps {
  onNewCircuit: () => void;
  onOpenSample: () => void;
  onSaveCircuit: () => void;
  onPrint: () => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoom100: () => void;
  onZoomFit: () => void;
  viewMode: 'schematic' | 'pcb' | 'breadboard';
  onChangeViewMode: (mode: 'schematic' | 'pcb' | 'breadboard') => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onStopSimulation: () => void;
  displayStyle: 'schematic' | 'realistic';
  onChangeDisplayStyle: (style: 'schematic' | 'realistic') => void;
  showCurrentFlow: boolean;
  onToggleCurrentFlow: () => void;
  showVoltageLevels: boolean;
  onToggleVoltageLevels: () => void;
  showLogicLevels: boolean;
  onToggleLogicLevels: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onOpenMultimeter: () => void;
  multimeterOpen: boolean;
  onOpenOscilloscope: () => void;
  onOpenAssistant: () => void;
  onOpenExperimentsDrawer: () => void;
  onOpenGallery?: () => void;
  isGalleryOpen?: boolean;
}

export const CircuitWizardToolbar: React.FC<CircuitWizardToolbarProps> = ({
  onNewCircuit,
  onOpenSample,
  onSaveCircuit,
  onPrint,
  onRotateSelected,
  onDeleteSelected,
  hasSelection,
  scale,
  onZoomIn,
  onZoomOut,
  onZoom100,
  onZoomFit,
  viewMode,
  onChangeViewMode,
  isSimulating,
  onToggleSimulation,
  onStopSimulation,
  displayStyle,
  onChangeDisplayStyle,
  showCurrentFlow,
  onToggleCurrentFlow,
  showVoltageLevels,
  onToggleVoltageLevels,
  showLogicLevels,
  onToggleLogicLevels,
  showGrid,
  onToggleGrid,
  onOpenMultimeter,
  multimeterOpen,
  onOpenOscilloscope,
  onOpenAssistant,
  onOpenExperimentsDrawer,
  onOpenGallery,
  isGalleryOpen = false,
}) => {
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  return (
    <>
      <div className="bg-slate-900/95 border-b border-slate-800 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 z-30 select-none shadow-sm overflow-x-auto scrollbar-none">
        
        {/* LEFT / CENTER: Simulation & View Tabs & Mobile Gallery Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* 1. Primary Simulation Controls */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={onToggleSimulation}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                isSimulating
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100'
              }`}
              title="تشغيل / إيقاف المحاكاة (Run/Pause - F9)"
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-white" />
                  <span>إيقاف</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  <span>تشغيل</span>
                </>
              )}
            </button>

            {isSimulating && (
              <button
                onClick={onStopSimulation}
                className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-950/50 transition-colors"
                title="إيقاف نهائي وإعادة ضبط (Stop - F10)"
              >
                <Square className="w-3.5 h-3.5 fill-red-400" />
              </button>
            )}
          </div>

          {/* 2. View Mode Tabs (Circuit Diagram, PCB, Breadboard) */}
          <div className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onChangeViewMode('schematic')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
                viewMode === 'schematic'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="مخطط الدائرة التخطيطي بالرموز القياسية (Circuit Diagram)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Circuit Diagram</span>
              <span className="sm:hidden text-[11px]">مخطط</span>
            </button>

            <button
              onClick={() => onChangeViewMode('pcb')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
                viewMode === 'pcb'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30 ring-1 ring-teal-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="تصميم اللوحة المطبوعة الخضراء (PCB Layout)"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-200" />
              <span className="hidden sm:inline">PCB Layout</span>
              <span className="sm:hidden text-[11px]">PCB</span>
            </button>

            <button
              onClick={() => onChangeViewMode('breadboard')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
                viewMode === 'breadboard'
                  ? 'bg-slate-700 text-white shadow-md ring-1 ring-slate-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="لوحة التجارب المخبرية الواقعية (Breadboard View)"
            >
              <div className="w-2.5 h-2.5 rounded-sm bg-white" />
              <span className="hidden sm:inline">Breadboard</span>
              <span className="sm:hidden text-[11px]">لوحة</span>
            </button>
          </div>

          {/* 3. Mobile Component Gallery Launch Button */}
          {onOpenGallery && (
            <button
              onClick={onOpenGallery}
              className={`lg:hidden px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                isGalleryOpen
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-300 font-extrabold'
                  : 'bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100'
              }`}
              title={isGalleryOpen ? 'إخفاء معرض المكونات' : 'عرض المكونات على يمين الشاشة واللوحة على اليسار'}
            >
              <Layers className="w-4 h-4" />
              <span>{isGalleryOpen ? 'المكونات (يمين)' : 'المكونات'}</span>
            </button>
          )}

          {/* Desktop File & Edit Quick Groups (Visible on md+) */}
          <div className="hidden lg:flex items-center gap-1">
            <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={onNewCircuit}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="دائرة جديدة (New Circuit - Ctrl+N)"
              >
                <FilePlus className="w-4 h-4 text-emerald-400" />
              </button>
              <button
                onClick={onOpenSample}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="فتح دائرة نموذجية (Open Sample - Ctrl+O)"
              >
                <FolderOpen className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                onClick={onSaveCircuit}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="حفظ الدائرة (Save Circuit - Ctrl+S)"
              >
                <Save className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={onRotateSelected}
                disabled={!hasSelection}
                className="p-1.5 rounded hover:bg-slate-800 text-teal-300 hover:text-teal-200 disabled:opacity-30 transition-colors"
                title="تدوير المكون 90° (Rotate - R)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={onDeleteSelected}
                disabled={!hasSelection}
                className="p-1.5 rounded hover:bg-red-950/50 text-red-400 hover:text-red-300 disabled:opacity-30 transition-colors"
                title="حذف المحدد (Delete - Del)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Zoom Group */}
            <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={onZoomIn}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="تكبير (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={onZoom100}
                className="px-1.5 py-1 text-[10px] font-mono-numbers text-slate-300 hover:text-white"
                title="الحجم الافتراضي 100%"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={onZoomOut}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="تصغير (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={onZoomFit}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="احتواء الشاشة (Fit)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT SECTION: Quick Tools & Mobile More Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Multimeter Launch Button */}
          <button
            onClick={onOpenMultimeter}
            className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors active:scale-95 ${
              multimeterOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="الملتيميتر الرقمي الأصفر (Digital Multimeter)"
          >
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">الملتيميتر</span>
          </button>

          {/* Desktop Assistant Button */}
          <button
            onClick={onOpenAssistant}
            className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold items-center gap-1.5 transition-all shadow-sm"
            title="المساعد الهندسي (Circuit Wizard Assistant)"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">المساعد</span>
          </button>

          {/* Mobile "More Tools" Toggle Button */}
          <button
            onClick={() => setMobileToolsOpen(o => !o)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1"
            title="المزيد من الأدوات الهندسية"
          >
            <MoreVertical className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">الأدوات</span>
          </button>

        </div>

      </div>

      {/* Mobile Tools Drawer Modal */}
      {mobileToolsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">الأدوات والخيارات الهندسية</h3>
              </div>
              <button
                onClick={() => setMobileToolsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => { onNewCircuit(); setMobileToolsOpen(false); }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-2 font-bold text-emerald-300"
              >
                <FilePlus className="w-4 h-4" />
                <span>مخطط جديد</span>
              </button>

              <button
                onClick={() => { onOpenSample(); setMobileToolsOpen(false); }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-2 font-bold text-cyan-300"
              >
                <FolderOpen className="w-4 h-4" />
                <span>فتح نموذج</span>
              </button>

              <button
                onClick={() => { onSaveCircuit(); setMobileToolsOpen(false); }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-2 font-bold text-amber-300"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الدائرة</span>
              </button>

              <button
                onClick={() => { onOpenOscilloscope(); setMobileToolsOpen(false); }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-2 font-bold text-teal-300"
              >
                <Activity className="w-4 h-4" />
                <span>راسم الإشارة</span>
              </button>

              <button
                onClick={() => { onRotateSelected(); setMobileToolsOpen(false); }}
                disabled={!hasSelection}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-2 font-bold text-slate-200 disabled:opacity-40"
              >
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span>تدوير المكون 90°</span>
              </button>

              <button
                onClick={() => { onDeleteSelected(); setMobileToolsOpen(false); }}
                disabled={!hasSelection}
                className="p-3 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/40 flex items-center gap-2 font-bold text-red-300 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المحدد</span>
              </button>

              <button
                onClick={() => { onZoomFit(); setMobileToolsOpen(false); }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-2 font-bold text-slate-200"
              >
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span>احتواء الشاشة</span>
              </button>

              <button
                onClick={() => { onOpenAssistant(); setMobileToolsOpen(false); }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-2 font-bold text-emerald-300"
              >
                <Compass className="w-4 h-4" />
                <span>مساعد الدوائر</span>
              </button>
            </div>

            {/* Display Toggles */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">خيارات العرض والمحاكاة:</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => onToggleCurrentFlow()}
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-bold ${
                    showCurrentFlow
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <span>تدفق التيار</span>
                  <Zap className={`w-3.5 h-3.5 ${showCurrentFlow ? 'text-cyan-400' : ''}`} />
                </button>

                <button
                  onClick={() => onToggleVoltageLevels()}
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-bold ${
                    showVoltageLevels
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <span>مستويات الجهد</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-green-500" />
                </button>

                <button
                  onClick={() => onToggleLogicLevels()}
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-bold ${
                    showLogicLevels
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <span>منطق 0 / 1</span>
                  <span className="font-mono text-xs">1/0</span>
                </button>

                <button
                  onClick={() => onToggleGrid()}
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-bold ${
                    showGrid
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <span>الشبكة الهندسية</span>
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setMobileToolsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700"
            >
              إغلاق والعودة للدائرة
            </button>

          </div>
        </div>
      )}
    </>
  );
};
