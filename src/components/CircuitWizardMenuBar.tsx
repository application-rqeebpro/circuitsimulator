import React, { useState, useRef, useEffect } from 'react';
import { 
  FilePlus, 
  FolderOpen, 
  Save, 
  Printer, 
  Trash2, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause, 
  Square, 
  Gauge, 
  Activity, 
  HelpCircle, 
  Calculator, 
  Layers, 
  Cpu, 
  Zap, 
  Sparkles,
  Compass,
  CheckCircle2,
  ChevronDown,
  BookOpen
} from 'lucide-react';
import { CircuitElement } from '../engine/circuitSolver';

interface CircuitWizardMenuBarProps {
  onNewCircuit: () => void;
  onOpenSample: () => void;
  onSaveCircuit: () => void;
  onClearCanvas: () => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onStopSimulation: () => void;
  viewMode: 'schematic' | 'pcb' | 'breadboard';
  onChangeViewMode: (mode: 'schematic' | 'pcb' | 'breadboard') => void;
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
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoom100: () => void;
  onZoomFit: () => void;
  onOpenMultimeter: () => void;
  onOpenOscilloscope: () => void;
  onOpenColorCode: () => void;
  onOpenAssistant: () => void;
  onOpenTour: () => void;
  onOpenExperimentsGuide: () => void;
  onOpenVerificationTests: () => void;
  onInsertComponent: (type: string) => void;
  hasSelection: boolean;
}

export const CircuitWizardMenuBar: React.FC<CircuitWizardMenuBarProps> = ({
  onNewCircuit,
  onOpenSample,
  onSaveCircuit,
  onClearCanvas,
  onRotateSelected,
  onDeleteSelected,
  isSimulating,
  onToggleSimulation,
  onStopSimulation,
  viewMode,
  onChangeViewMode,
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
  onZoomIn,
  onZoomOut,
  onZoom100,
  onZoomFit,
  onOpenMultimeter,
  onOpenOscilloscope,
  onOpenColorCode,
  onOpenAssistant,
  onOpenTour,
  onOpenExperimentsGuide,
  onOpenVerificationTests,
  onInsertComponent,
  hasSelection,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggle = (menuName: string) => {
    setOpenMenu(prev => prev === menuName ? null : menuName);
  };

  const menuHover = (menuName: string) => {
    if (openMenu !== null) {
      setOpenMenu(menuName);
    }
  };

  return (
    <div ref={barRef} className="bg-slate-900 border-b border-slate-800 text-slate-200 text-xs select-none flex items-center justify-between px-2 py-0.5 z-40">
      
      {/* Menu items row */}
      <div className="flex items-center gap-0.5">
        
        {/* FILE MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('file')}
            onMouseEnter={() => menuHover('file')}
            className={`px-2.5 py-1 rounded transition-colors text-xs ${
              openMenu === 'file' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            File <span className="text-[10px] text-slate-400">(ملف)</span>
          </button>
          {openMenu === 'file' && (
            <div className="absolute top-full left-0 mt-0.5 w-60 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => { onNewCircuit(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>دائرة جديدة (New Circuit)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+N</span>
              </button>
              <button
                onClick={() => { onOpenSample(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>فتح دائرة نموذجية... (Open Sample)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+O</span>
              </button>
              <button
                onClick={() => { onSaveCircuit(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>حفظ الدائرة (Save Circuit)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+S</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => { window.print(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>طباعة المخطط (Print)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+P</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => { onClearCanvas(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-red-950/60 text-red-300 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>مسح كامل لوحة العمل (Clear All)</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('edit')}
            onMouseEnter={() => menuHover('edit')}
            className={`px-2.5 py-1 rounded transition-colors text-xs ${
              openMenu === 'edit' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            Edit <span className="text-[10px] text-slate-400">(تعديل)</span>
          </button>
          {openMenu === 'edit' && (
            <div className="absolute top-full left-0 mt-0.5 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => { if (hasSelection) onRotateSelected(); setOpenMenu(null); }}
                disabled={!hasSelection}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 disabled:opacity-40 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-teal-400" />
                  <span>تدوير المكون 90° (Rotate)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">R</span>
              </button>
              <button
                onClick={() => { if (hasSelection) onDeleteSelected(); setOpenMenu(null); }}
                disabled={!hasSelection}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-red-300 disabled:opacity-40 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>حذف المحدد (Delete)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Del</span>
              </button>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('view')}
            onMouseEnter={() => menuHover('view')}
            className={`px-2.5 py-1 rounded transition-colors text-xs ${
              openMenu === 'view' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            View <span className="text-[10px] text-slate-400">(عرض)</span>
          </button>
          {openMenu === 'view' && (
            <div className="absolute top-full left-0 mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                أوضاع التصميم (Views)
              </div>
              <button
                onClick={() => { onChangeViewMode('schematic'); setOpenMenu(null); }}
                className={`w-full text-right px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${viewMode === 'schematic' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-200'}`}
              >
                <span>⚡ مخطط الدائرة (Circuit Diagram)</span>
                {viewMode === 'schematic' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                onClick={() => { onChangeViewMode('pcb'); setOpenMenu(null); }}
                className={`w-full text-right px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${viewMode === 'pcb' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-200'}`}
              >
                <span>🟢 اللوحة المطبوعة (PCB Layout)</span>
                {viewMode === 'pcb' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                onClick={() => { onChangeViewMode('breadboard'); setOpenMenu(null); }}
                className={`w-full text-right px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${viewMode === 'breadboard' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-200'}`}
              >
                <span>⚪ لوحة التجارب (Breadboard)</span>
                {viewMode === 'breadboard' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <div className="my-1 border-t border-slate-800" />
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                مؤثرات المحاكاة الحية (Simulation Modes)
              </div>
              <button
                onClick={() => { onToggleCurrentFlow(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>تدفق التيار المتحرك (Current Flow)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${showCurrentFlow ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'}`}>
                  {showCurrentFlow ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                onClick={() => { onToggleVoltageLevels(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>مستويات الجهد بالألوان (Voltage Levels)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${showVoltageLevels ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500'}`}>
                  {showVoltageLevels ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                onClick={() => { onToggleLogicLevels(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>مستويات المنطق الرقمي (Logic Levels 1/0)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${showLogicLevels ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500'}`}>
                  {showLogicLevels ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                onClick={() => { onToggleGrid(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>شبكة النقاط الهندسية (Grid Snap 2.54mm)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${showGrid ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'}`}>
                  {showGrid ? 'ON' : 'OFF'}
                </span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <div className="flex items-center justify-around py-1">
                <button onClick={() => { onZoomIn(); setOpenMenu(null); }} className="p-1 hover:bg-slate-800 rounded text-slate-300" title="تكبير +">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { onZoomOut(); setOpenMenu(null); }} className="p-1 hover:bg-slate-800 rounded text-slate-300" title="تصغير -">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { onZoom100(); setOpenMenu(null); }} className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-[10px] font-mono text-slate-300" title="100%">
                  1:1
                </button>
                <button onClick={() => { onZoomFit(); setOpenMenu(null); }} className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-[10px] text-slate-300" title="احتواء الشاشة">
                  Fit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* INSERT MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('insert')}
            onMouseEnter={() => menuHover('insert')}
            className={`px-2.5 py-1 rounded transition-colors text-xs ${
              openMenu === 'insert' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            Insert <span className="text-[10px] text-slate-400">(إدراج)</span>
          </button>
          {openMenu === 'insert' && (
            <div className="absolute top-full left-0 mt-0.5 w-60 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => { onInsertComponent('src-rail-9v'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>⚡ بطارية / مصدر جهد (9V Battery)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('src-ground-0v'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>⏚ نقطة تأريض (0V Ground)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('res-1k'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>Ω مقاومة كربونية (1kΩ Resistor)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('sw-spst'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>🔘 مفتاح تشغيل (SPST Switch)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('load-led-red'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>💡 دايود مشع (Red LED)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('load-lamp-12v'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>🔦 مصباح إشارة (Signal Lamp)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('out-buzzer'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>🕪 طنان صوتي (Electronic Buzzer)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('out-motor'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>Ⓜ محرك تيار مستمر (DC Motor)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('semi-npn-bc547'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>🔲 ترانزستور (NPN BC548 / BC547)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('gate-and'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>🔣 بوابة منطقية (AND Gate 7408)</span>
              </button>
              <button
                onClick={() => { onInsertComponent('ic-timer-555'); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>⏱ دارة مؤقت (NE555 Timer IC)</span>
              </button>
            </div>
          )}
        </div>

        {/* CIRCUIT MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('circuit')}
            onMouseEnter={() => menuHover('circuit')}
            className={`px-2.5 py-1 rounded transition-colors text-xs ${
              openMenu === 'circuit' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            Circuit <span className="text-[10px] text-slate-400">(دائرة)</span>
          </button>
          {openMenu === 'circuit' && (
            <div className="absolute top-full left-0 mt-0.5 w-60 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => { onToggleSimulation(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {isSimulating ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />}
                  <span>{isSimulating ? 'إيقاف مؤقت (Pause)' : 'بدء المحاكاة (Run Simulation)'}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">F5</span>
              </button>
              <button
                onClick={() => { onStopSimulation(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Square className="w-3.5 h-3.5 text-rose-400" />
                  <span>إيقاف تام (Stop)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">F7</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => { onOpenVerificationTests(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-cyan-300 flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>فحص الدائرة بالحالات الهندسية الثلاث</span>
              </button>
            </div>
          )}
        </div>

        {/* TOOLS MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('tools')}
            onMouseEnter={() => menuHover('tools')}
            className={`px-2.5 py-1 rounded transition-colors text-xs ${
              openMenu === 'tools' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            Tools <span className="text-[10px] text-slate-400">(أدوات)</span>
          </button>
          {openMenu === 'tools' && (
            <div className="absolute top-full left-0 mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => { onOpenMultimeter(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>جهاز الملتيميتر الرقمي الأصفر (Digital Multimeter)</span>
              </button>
              <button
                onClick={() => { onOpenOscilloscope(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>راسم الإشارة الرقمي (Oscilloscope Display)</span>
              </button>
              <button
                onClick={() => { onOpenColorCode(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>حاسبة ألوان المقاومات (Resistor Color Bands)</span>
              </button>
              <button
                onClick={() => { onOpenExperimentsGuide(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>دليل التجارب المخبرية والتطبيقية</span>
              </button>
            </div>
          )}
        </div>

        {/* ASSISTANT & HELP MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('help')}
            onMouseEnter={() => menuHover('help')}
            className={`px-2.5 py-1 rounded transition-colors text-xs ${
              openMenu === 'help' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            Help <span className="text-[10px] text-slate-400">(مساعدة)</span>
          </button>
          {openMenu === 'help' && (
            <div className="absolute top-full left-0 mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => { onOpenAssistant(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-emerald-300 font-bold flex items-center gap-2"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>شاشة البداية والمساعد (Circuit Wizard Assistant)</span>
              </button>
              <button
                onClick={() => { onOpenTour(); setOpenMenu(null); }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>الجولة الإرشادية والتدريب السريع (Guided Tour)</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Right side: App title and quick status */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pr-2">
        <span className="hidden sm:inline text-slate-400">Circuit Wizard Professional 4.0</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[10px] text-slate-300 font-bold">
            {isSimulating ? 'SIMULATING' : 'STOPPED'}
          </span>
        </div>
      </div>

    </div>
  );
};
