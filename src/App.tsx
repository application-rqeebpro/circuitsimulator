import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CircuitElement, 
  Wire, 
  SimulationResult, 
  solveCircuit 
} from './engine/circuitSolver';
import { EXPERIMENTS_LIST, Experiment } from './data/experimentsData';
import { api } from './services/api';
import { UserProfile } from './types';

// Components
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CircuitCanvas } from './components/CircuitCanvas';
import { ComponentLibrary } from './components/ComponentLibrary';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExperimentDrawer } from './components/ExperimentDrawer';
import { QuizModal } from './components/QuizModal';
import { VerificationModal } from './components/VerificationModal';
import { SavedCircuitsModal } from './components/SavedCircuitsModal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { AuthModals } from './components/AuthModals';
import { ColorCodeModal } from './components/ColorCodeModal';
import { OscilloscopeModal } from './components/OscilloscopeModal';
import { InteractiveMultimeter, ProbeTarget } from './components/InteractiveMultimeter';
import { ApiNotificationToast } from './components/ApiNotificationToast';

// Icons
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  Compass,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Gauge,
  Award,
  Check,
  CheckSquare
} from 'lucide-react';

export default function App() {
  // Navigation & View
  const [activeView, setActiveView] = useState<'landing' | 'lab' | 'experiments' | 'owner'>('landing');

  // Authentication
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Modals
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [ownerLoginOpen, setOwnerLoginOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [savedCircuitsOpen, setSavedCircuitsOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizExperiment, setQuizExperiment] = useState<Experiment | null>(null);
  const [colorCodeModalOpen, setColorCodeModalOpen] = useState(false);
  const [oscilloscopeModalOpen, setOscilloscopeModalOpen] = useState(false);
  const [activeOscilloscopeElement, setActiveOscilloscopeElement] = useState<CircuitElement | null>(null);

  // Lab Drawers & Panels
  const [componentLibraryOpen, setComponentLibraryOpen] = useState(true);
  const [experimentDrawerOpen, setExperimentDrawerOpen] = useState(false);
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(EXPERIMENTS_LIST[2]); // Default Ohm's Law
  const [showExperimentBanner, setShowExperimentBanner] = useState(true);

  // Digital Multimeter & Probes State
  const [multimeterOpen, setMultimeterOpen] = useState(true);
  const [redProbe, setRedProbe] = useState<ProbeTarget | null>({
    compId: 'res-init',
    termId: 't1',
    compName: 'R1 (1kΩ)',
    termLabel: '1',
  });
  const [blackProbe, setBlackProbe] = useState<ProbeTarget | null>({
    compId: 'res-init',
    termId: 't2',
    compName: 'R1 (1kΩ)',
    termLabel: '2',
  });
  const [activeProbePlacing, setActiveProbePlacing] = useState<'red' | 'black' | null>(null);

  // Circuit Workspace State (Default with Ohm's law verification circuit: 9V + 1kΩ -> 9mA)
  const [elements, setElements] = useState<CircuitElement[]>([
    {
      id: 'bat-init',
      type: 'battery',
      name: 'بطارية 9V',
      x: 100,
      y: 180,
      rotation: 0,
      value: 9,
      unit: 'V',
      terminals: [
        { id: 't1', label: '+', relX: 45, relY: 10 },
        { id: 't2', label: '-', relX: 45, relY: 85 },
      ],
    },
    {
      id: 'amm-init',
      type: 'ammeter',
      name: 'أميتر (توالي)',
      x: 300,
      y: 100,
      rotation: 0,
      value: 0,
      unit: 'A',
      terminals: [
        { id: 't1', label: '+', relX: 15, relY: 45 },
        { id: 't2', label: '-', relX: 80, relY: 45 },
      ],
    },
    {
      id: 'res-init',
      type: 'resistor',
      name: 'R1 (1kΩ)',
      x: 500,
      y: 180,
      rotation: 0,
      value: 1000,
      unit: 'Ω',
      terminals: [
        { id: 't1', label: '1', relX: 15, relY: 40 },
        { id: 't2', label: '2', relX: 75, relY: 40 },
      ],
    },
  ]);

  const [wires, setWires] = useState<Wire[]>([
    { id: 'w1-init', fromCompId: 'bat-init', fromTermId: 't1', toCompId: 'amm-init', toTermId: 't1', color: '#ef4444' },
    { id: 'w2-init', fromCompId: 'amm-init', fromTermId: 't2', toCompId: 'res-init', toTermId: 't1', color: '#10b981' },
    { id: 'w3-init', fromCompId: 'res-init', fromTermId: 't2', toCompId: 'bat-init', toTermId: 't2', color: '#0284c7' },
  ]);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);

  // Initialize Auth
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(res => setCurrentUser(res.user))
        .catch(() => api.clearToken())
        .finally(() => setAuthInitialized(true));
    } else {
      setAuthInitialized(true);
    }
  }, []);

  // Solve circuit continuously whenever elements or wires change and simulation is active
  const simulationResult = useMemo<SimulationResult>(() => {
    if (!isSimulating) {
      return {
        nodeVoltages: {},
        elementCurrents: {},
        elementVoltages: {},
        elementPowers: {},
        totalCurrent: 0,
        totalPower: 0,
        shortCircuit: false,
        openCircuit: true,
        blownFuses: [],
        warnings: [],
        errors: [],
        meterReadings: { ammeters: {}, voltmeters: {}, multimeters: {}, oscilloscopes: {} },
      };
    }
    return solveCircuit(elements, wires);
  }, [elements, wires, isSimulating]);

  // Telemetry log for simulation runs
  useEffect(() => {
    if (isSimulating && simulationResult.totalCurrent > 1e-4) {
      api.logSimulationRun().catch(() => {});
    }
  }, [isSimulating]);

  // Selected element lookup
  const selectedElement = useMemo(() => {
    return elements.find(e => e.id === selectedElementId) || null;
  }, [elements, selectedElementId]);

  // Canvas Actions
  const handleUpdateElement = useCallback((id: string, updates: Partial<CircuitElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setWires(prev => prev.filter(w => w.fromCompId !== id && w.toCompId !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  }, [selectedElementId]);

  const handleAddWire = useCallback((newWire: Wire) => {
    setWires(prev => [...prev, newWire]);
  }, []);

  const handleDeleteWire = useCallback((wireId: string) => {
    setWires(prev => prev.filter(w => w.id !== wireId));
  }, []);

  const handleAddComponentFromLibrary = useCallback((item: Omit<CircuitElement, 'id' | 'x' | 'y'>) => {
    const newId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    // Place in visible area with slight offset
    const newElement: CircuitElement = {
      ...item,
      id: newId,
      x: 260 + (elements.length % 5) * 40,
      y: 160 + (elements.length % 4) * 30,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newId);
  }, [elements.length]);

  const handleDropComponentAt = useCallback((item: Omit<CircuitElement, 'id'>) => {
    const newId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newElement: CircuitElement = {
      ...item,
      id: newId,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newId);
  }, []);

  const handleResetCanvas = () => {
    if (confirm('هل تريد مسح جميع المكونات والأسلاك في اللوحة؟')) {
      setElements([]);
      setWires([]);
      setSelectedElementId(null);
    }
  };

  const handleLoadExperimentCircuit = (exp: Experiment) => {
    if (exp.defaultCircuit) {
      setElements(JSON.parse(JSON.stringify(exp.defaultCircuit.elements)));
      setWires(JSON.parse(JSON.stringify(exp.defaultCircuit.wires)));
      setSelectedElementId(null);
      setIsSimulating(true);
      setExperimentDrawerOpen(false);
      setActiveView('lab');
    }
  };

  const handleOpenExperimentFromLanding = (exp?: Experiment) => {
    if (exp) {
      setActiveExperiment(exp);
      handleLoadExperimentCircuit(exp);
    } else {
      setActiveView('lab');
    }
  };

  const handleLogout = () => {
    api.clearToken();
    setCurrentUser(null);
    setActiveView('landing');
  };

  // Subscription verification check
  const isStudentSubscribed = currentUser?.role === 'owner' || (currentUser?.subscription?.status === 'active' && new Date(currentUser.subscription.expiresAt) > new Date());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenRegister={() => setRegisterOpen(true)}
        onOpenOwnerLogin={() => setOwnerLoginOpen(true)}
        onOpenRedeemModal={() => setRedeemOpen(true)}
        onOpenSavedCircuits={() => setSavedCircuitsOpen(true)}
        onOpenVerificationTests={() => setVerificationOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Route / View */}
      <main className="flex-1 flex flex-col">
        
        {/* VIEW A: Landing Page */}
        {activeView === 'landing' && (
          <LandingPage
            currentUser={currentUser}
            onEnterLab={handleOpenExperimentFromLanding}
            onOpenLogin={() => setLoginOpen(true)}
            onOpenRegister={() => setRegisterOpen(true)}
            onOpenOwnerLogin={() => setOwnerLoginOpen(true)}
            onOpenVerificationTests={() => setVerificationOpen(true)}
          />
        )}

        {/* VIEW B: 14 Practical Experiments List */}
        {activeView === 'experiments' && (
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">دليل التجارب المعملية الـ 14 المعتمدة</h1>
                <p className="text-xs text-slate-400 mt-1">
                  مخصصة لطلاب السنة الأولى بهندسة الميكاترونكس – الجامعة الإماراتية الدولية وبقية الجامعات
                </p>
              </div>

              <button
                onClick={() => setActiveView('lab')}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Compass className="w-4 h-4" />
                <span>الذهاب للمختبر التفاعلي</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {EXPERIMENTS_LIST.map(exp => (
                <div
                  key={exp.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono-numbers px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold text-[11px]">
                        تجربة #{exp.number}
                      </span>
                      <span className="text-slate-400">{exp.category}</span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{exp.title}</h3>
                    <div className="text-[11px] font-mono text-slate-500 mb-2" dir="ltr">{exp.titleEn}</div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{exp.objective}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setLoginOpen(true);
                        } else {
                          setActiveExperiment(exp);
                          handleLoadExperimentCircuit(exp);
                        }
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>بدء التجربة باللوحة</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setLoginOpen(true);
                        } else {
                          setQuizExperiment(exp);
                          setQuizOpen(true);
                        }
                      }}
                      className="py-1.5 px-3 rounded-lg bg-teal-600/10 hover:bg-teal-600 text-teal-400 hover:text-white text-xs font-bold transition-colors"
                      title="حل الاختبار التقييمي"
                    >
                      الاختبار
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW C: The Interactive Circuit Laboratory */}
        {activeView === 'lab' && (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* Subscription Gate Check for Visitors or Expired Accounts */}
            {!currentUser ? (
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
                <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <Compass className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white">المختبر الافتراضي محمي</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    يرجى تسجيل الدخول أو إنشاء حساب طالب جديد للوصول إلى لوحة التجارب وأجهزة القياس ومحرك المحاكاة.
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => setLoginOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25"
                    >
                      تسجيل الدخول
                    </button>
                    <button
                      onClick={() => setRegisterOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs border border-slate-700"
                    >
                      إنشاء حساب جديد
                    </button>
                  </div>
                </div>
              </div>
            ) : !isStudentSubscribed ? (
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
                <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white">الاشتراك غير مفعّل أو بانتظار التجديد</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    حسابك مسجل بنجاح، لكن يتطلب الوصول إلى لوحة المختبر تفعيل اشتراك معتمد بواسطة رمز التفعيل أو مراجعة مشرف الأكاديمية.
                  </p>
                  <button
                    onClick={() => setRedeemOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>إدخال رمز تفعيل الاشتراك</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Simulation Top Control Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30">
                  
                  {/* Left: Telemetry Badges */}
                  <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none py-1">
                    {/* Voltage */}
                    <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">الجهد الكلي:</span>
                      <span className="font-mono-numbers font-bold text-emerald-400 text-sm">
                        {elements.filter(e => e.type === 'battery' || e.type === 'dc_power_supply').reduce((acc, s) => acc + (s.value || 0), 0)} V
                      </span>
                    </div>

                    {/* Current */}
                    <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">التيار الكلي:</span>
                      <span className="font-mono-numbers font-bold text-cyan-400 text-sm">
                        {simulationResult.totalCurrent >= 1 
                          ? `${simulationResult.totalCurrent.toFixed(3)} A` 
                          : `${(simulationResult.totalCurrent * 1000).toFixed(2)} mA`}
                      </span>
                    </div>

                    {/* Power */}
                    <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">القدرة الكلية:</span>
                      <span className="font-mono-numbers font-bold text-amber-400 text-sm">
                        {simulationResult.totalPower >= 1 
                          ? `${simulationResult.totalPower.toFixed(2)} W` 
                          : `${(simulationResult.totalPower * 1000).toFixed(1)} mW`}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {simulationResult.shortCircuit ? (
                        <span className="px-2.5 py-1 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-bold animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>قصر كهربائي!</span>
                        </span>
                      ) : simulationResult.openCircuit ? (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium">
                          دائرة مفتوحة (لا يمر تيار)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>دائرة مغلقة وسليمة</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Simulation & Experiment Controls */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {/* Start Experiment Button */}
                    <button
                      onClick={() => activeExperiment && handleLoadExperimentCircuit(activeExperiment)}
                      className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition-all"
                      title="بدء تشغيل وتوصيل التجربة المحددة في مساحة العمل"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>ابدأ التجربة</span>
                    </button>

                    {/* Reset Circuit Button */}
                    <button
                      onClick={handleResetCanvas}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                      title="إعادة ضبط ومسح الدائرة"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">إعادة ضبط الدائرة</span>
                    </button>

                    {/* Simulation Toggle */}
                    <button
                      onClick={() => setIsSimulating(s => !s)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                        isSimulating
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      <span>{isSimulating ? 'إيقاف مؤقت' : 'تشغيل'}</span>
                    </button>

                    {/* Yellow Multimeter Toggle Button */}
                    <button
                      onClick={() => setMultimeterOpen(o => !o)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                        multimeterOpen
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                      title="إظهار / إخفاء جهاز الملتيميتر الرقمي الأصفر"
                    >
                      <Gauge className="w-3.5 h-3.5 text-amber-400" />
                      <span>الملتيميتر الأصفر</span>
                    </button>

                    {/* Run 3 Test Cases Verification Button */}
                    <button
                      onClick={() => setVerificationOpen(true)}
                      className="py-1.5 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="فحص المحاكاة بالحالات الهندسية الثلاث"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden md:inline">فحص الحالات (3)</span>
                    </button>

                    {/* Save Circuit Button */}
                    <button
                      onClick={() => setSavedCircuitsOpen(true)}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium flex items-center gap-1 border border-slate-700 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">حفظ</span>
                    </button>

                    {/* Experiments Drawer Toggle */}
                    <button
                      onClick={() => setExperimentDrawerOpen(true)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>دليل التجارب</span>
                    </button>
                  </div>
                </div>

                {/* Educational Experiment Guidance Banner */}
                {activeExperiment && showExperimentBanner && (
                  <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs z-25">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            التجربة {activeExperiment.number}: {activeExperiment.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                            {activeExperiment.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-1">
                          <strong className="text-emerald-400">الهدف:</strong> {activeExperiment.objective}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleLoadExperimentCircuit(activeExperiment)}
                        className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>تحميل دائرة التجربة</span>
                      </button>

                      {activeExperiment.quiz && activeExperiment.quiz.length > 0 && (
                        <button
                          onClick={() => {
                            setQuizExperiment(activeExperiment);
                            setQuizOpen(true);
                          }}
                          className="py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>حل أسئلة التجربة</span>
                        </button>
                      )}

                      <button
                        onClick={() => setShowExperimentBanner(false)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="إخفاء شريط الشرح"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner if Short Circuit or Warnings exist */}
                {simulationResult.errors.length > 0 && (
                  <div className="bg-red-950/80 border-b border-red-500/40 px-4 py-2 text-xs text-red-200 flex items-center gap-2 z-20 animate-in fade-in">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-bold">{simulationResult.errors.join(' ')}</span>
                  </div>
                )}

                {/* Main Workspace Layout (Canvas + Components Library) */}
                <div className="flex-1 flex overflow-hidden relative">
                  
                  {/* Left: Component Library Sidebar */}
                  <ComponentLibrary
                    isOpen={componentLibraryOpen}
                    onToggle={() => setComponentLibraryOpen(o => !o)}
                    onAddComponent={handleAddComponentFromLibrary}
                    onOpenColorCodeCalculator={() => setColorCodeModalOpen(true)}
                  />

                  {/* Center: Circuit Breadboard Canvas */}
                  <div className="flex-1 relative overflow-hidden">
                    <CircuitCanvas
                      elements={elements}
                      wires={wires}
                      simulationResult={simulationResult}
                      selectedElementId={selectedElementId}
                      onSelectElement={setSelectedElementId}
                      onUpdateElement={handleUpdateElement}
                      onDeleteElement={handleDeleteElement}
                      onAddWire={handleAddWire}
                      onDeleteWire={handleDeleteWire}
                      isSimulating={isSimulating}
                      onDropComponentAt={handleDropComponentAt}
                      onOpenOscilloscope={(el) => {
                        setActiveOscilloscopeElement(el);
                        setOscilloscopeModalOpen(true);
                      }}
                      redProbe={redProbe}
                      blackProbe={blackProbe}
                      onSetRedProbe={setRedProbe}
                      onSetBlackProbe={setBlackProbe}
                      activeProbePlacing={activeProbePlacing}
                      onSetActiveProbePlacing={setActiveProbePlacing}
                      onOpenMultimeter={() => setMultimeterOpen(true)}
                    />

                    {/* Properties Panel for Selected Element */}
                    <PropertiesPanel
                      element={selectedElement}
                      simulationResult={simulationResult}
                      onUpdate={handleUpdateElement}
                      onDelete={handleDeleteElement}
                      onClose={() => setSelectedElementId(null)}
                      onOpenColorCodeCalculator={() => setColorCodeModalOpen(true)}
                      onOpenOscilloscope={(el) => {
                        setActiveOscilloscopeElement(el);
                        setOscilloscopeModalOpen(true);
                      }}
                    />

                    {/* Interactive Yellow Digital Multimeter */}
                    <InteractiveMultimeter
                      isOpen={multimeterOpen}
                      onClose={() => setMultimeterOpen(false)}
                      elements={elements}
                      wires={wires}
                      simulationResult={simulationResult}
                      redProbe={redProbe}
                      blackProbe={blackProbe}
                      onSetRedProbe={setRedProbe}
                      onSetBlackProbe={setBlackProbe}
                      activeProbePlacing={activeProbePlacing}
                      onSetActiveProbePlacing={setActiveProbePlacing}
                    />
                  </div>

                  {/* Right: Experiment Guide Drawer */}
                  <ExperimentDrawer
                    isOpen={experimentDrawerOpen}
                    onClose={() => setExperimentDrawerOpen(false)}
                    activeExperiment={activeExperiment}
                    onSelectExperiment={setActiveExperiment}
                    onLoadExperimentCircuit={handleLoadExperimentCircuit}
                    onOpenQuiz={(exp) => {
                      setQuizExperiment(exp);
                      setQuizOpen(true);
                    }}
                  />

                </div>
              </>
            )}

          </div>
        )}

        {/* VIEW D: Owner Dashboard */}
        {activeView === 'owner' && (
          currentUser?.role === 'owner' ? (
            <OwnerDashboard onBackToLab={() => setActiveView('lab')} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
              <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                <h2 className="text-xl font-bold text-white">غير مصرح بالدخول</h2>
                <p className="text-xs text-slate-400">
                  لوحة المالك مخصصة فقط للمشرف الأكاديمي المعتمد.
                </p>
                <button
                  onClick={() => setOwnerLoginOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  تسجيل دخول المالك
                </button>
              </div>
            </div>
          )
        )}

      </main>

      {/* Global Modals */}
      <AuthModals
        loginOpen={loginOpen}
        registerOpen={registerOpen}
        ownerLoginOpen={ownerLoginOpen}
        redeemOpen={redeemOpen}
        onClose={() => {
          setLoginOpen(false);
          setRegisterOpen(false);
          setOwnerLoginOpen(false);
          setRedeemOpen(false);
        }}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'owner') {
            setActiveView('owner');
          } else {
            setActiveView('lab');
          }
        }}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setOwnerLoginOpen(false);
          setRegisterOpen(true);
        }}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setOwnerLoginOpen(false);
          setLoginOpen(true);
        }}
        onSwitchToOwnerLogin={() => {
          setLoginOpen(false);
          setRegisterOpen(false);
          setOwnerLoginOpen(true);
        }}
      />

      <QuizModal
        experiment={quizExperiment}
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
      />

      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        onLoadTestCircuit={(els, ws) => {
          setElements(els);
          setWires(ws);
          setSelectedElementId(null);
          setIsSimulating(true);
          setActiveView('lab');
        }}
      />

      <SavedCircuitsModal
        isOpen={savedCircuitsOpen}
        onClose={() => setSavedCircuitsOpen(false)}
        currentElements={elements}
        currentWires={wires}
        onLoadCircuit={(els, ws) => {
          setElements(els);
          setWires(ws);
          setSelectedElementId(null);
          setIsSimulating(true);
        }}
      />

      <ColorCodeModal
        isOpen={colorCodeModalOpen}
        onClose={() => setColorCodeModalOpen(false)}
        onApplyValue={(res) => {
          if (selectedElementId) {
            handleUpdateElement(selectedElementId, { value: res });
          }
        }}
      />

      {/* 5. Oscilloscope Interactive Display Modal */}
      <OscilloscopeModal
        isOpen={oscilloscopeModalOpen}
        onClose={() => setOscilloscopeModalOpen(false)}
        element={activeOscilloscopeElement}
        simulationResult={simulationResult}
        isSimulating={isSimulating}
        onUpdateElement={handleUpdateElement}
      />

      {/* 6. Global Server/API Notifications */}
      <ApiNotificationToast />

    </div>
  );
}
