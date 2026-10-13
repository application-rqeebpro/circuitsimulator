import React from 'react';
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
  BookOpen
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
}) => {
  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-30 select-none shadow-sm">
      
      {/* LEFT SECTION: CAD Standard Icons & Tools */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        
        {/* File Group */}
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
          <button
            onClick={onPrint}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors hidden sm:block"
            title="طباعة (Print)"
          >
            <Printer className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Edit & Transform Group */}
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

        {/* Zoom Group */}
        <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="تكبير (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoom100}
            className="px-1.5 py-1 text-[10px] font-mono-numbers text-slate-300 hover:text-white rounded hover:bg-slate-800"
            title="الحجم الافتراضي 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="تصغير (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomFit}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="احتواء الشاشة (Fit)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Tabs (CIRCUIT WIZARD ICONIC TABS!) */}
        <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onChangeViewMode('schematic')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'schematic'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
            title="مخطط الدائرة التخطيطي بالرموز القياسية (Circuit Diagram)"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Circuit Diagram</span>
          </button>

          <button
            onClick={() => onChangeViewMode('pcb')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'pcb'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30 ring-1 ring-teal-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
            title="تصميم اللوحة المطبوعة الخضراء (PCB Layout)"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-200" />
            <span>PCB Layout</span>
          </button>

          <button
            onClick={() => onChangeViewMode('breadboard')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'breadboard'
                ? 'bg-slate-700 text-white shadow-md ring-1 ring-slate-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
            title="لوحة التجارب المخبرية الواقعية (Breadboard View)"
          >
            <div className="w-2.5 h-2.5 rounded-sm bg-white" />
            <span>Breadboard</span>
          </button>
        </div>

      </div>

      {/* RIGHT SECTION: Simulation Controls & Visual Mode Toggles */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        
        {/* Simulation Controls: Run, Pause, Stop (Circuit Wizard colors) */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={onToggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isSimulating
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-300'
            }`}
            title={isSimulating ? 'المحاكاة قيد التشغيل (F5)' : 'بدء تشغيل المحاكاة (F5)'}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-pulse' : ''}`} />
            <span>{isSimulating ? 'Running' : 'Run'}</span>
          </button>

          <button
            onClick={onToggleSimulation}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              !isSimulating
                ? 'bg-amber-600 text-white'
                : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="إيقاف مؤقت (Pause - F6)"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onStopSimulation}
            className="p-1.5 rounded-lg text-xs font-bold hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
            title="إيقاف تام للمحاكاة (Stop - F7)"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Display Style Toggle (Schematic / Real-world) */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onChangeDisplayStyle('schematic')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              displayStyle === 'schematic'
                ? 'bg-slate-800 text-emerald-300 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="عرض الرموز التخطيطية الهندسية"
          >
            Normal
          </button>
          <button
            onClick={() => onChangeDisplayStyle('realistic')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              displayStyle === 'realistic'
                ? 'bg-slate-800 text-emerald-300 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="عرض المكونات الواقعية المصورة"
          >
            Real World
          </button>
        </div>

        {/* Visual Simulation Effects (Current Flow, Voltage Levels, Logic Levels, Grid) */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
          {/* Current Flow animated dots */}
          <button
            onClick={onToggleCurrentFlow}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              showCurrentFlow
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="حركة الإلكترونات وتدفق التيار المتحرك (Current Flow)"
          >
            <Zap className={`w-3 h-3 ${showCurrentFlow ? 'text-cyan-400 animate-bounce' : ''}`} />
            <span className="hidden md:inline">Current Flow</span>
          </button>

          {/* Voltage Levels colored wires */}
          <button
            onClick={onToggleVoltageLevels}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              showVoltageLevels
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="تلوين الأسلاك حسب فرق الجهد (Voltage Levels)"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500" />
            <span className="hidden md:inline">Voltage Levels</span>
          </button>

          {/* Grid Snap toggle */}
          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded-lg text-[11px] transition-colors ${
              showGrid
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-500 hover:text-white'
            }`}
            title="شبكة النقاط الهندسية (Grid)"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Instruments Docks */}
        <button
          onClick={onOpenMultimeter}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
            multimeterOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
          }`}
          title="الملتيميتر الرقمي الأصفر (Digital Multimeter)"
        >
          <Gauge className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">الملتيميتر</span>
        </button>

        <button
          onClick={onOpenAssistant}
          className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          title="شاشة المساعد والبداية (Circuit Wizard Assistant)"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>المساعد (Assistant)</span>
        </button>

      </div>

    </div>
  );
};
