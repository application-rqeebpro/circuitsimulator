import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Zap, 
  Layers, 
  Gauge, 
  Play, 
  Activity, 
  HelpCircle,
  Sparkles,
  Compass
} from 'lucide-react';

interface CircuitWizardTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  titleAr: string;
  titleEn: string;
  icon: React.ReactNode;
  contentAr: string;
  tipAr: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    titleAr: 'مرحباً بك في سيركت ويزارد (Circuit Wizard)',
    titleEn: 'Welcome & Workspace Tour',
    icon: <Compass className="w-6 h-6 text-emerald-400" />,
    contentAr: 'سيركت ويزارد هو بيئة هندسية رائدة تدمج تصميم الدوائر الكهربائية، محاكاة سريان التيار، تصميم اللوحات المطبوعة PCB، ولوحة التجارب Breadboard في بيئة تفاعلية موحدة.',
    tipAr: 'يمكنك استخدام شريط القوائم العلوي (File, Edit, View, Insert, Circuit, Tools) للوصول لكافة الوظائف كما في البرامج الهندسية الاحترافية.',
  },
  {
    titleAr: 'أوضاع العرض الثلاثة (Signature Views)',
    titleEn: 'Circuit Diagram, PCB Layout & Breadboard',
    icon: <Layers className="w-6 h-6 text-teal-400" />,
    contentAr: 'يمكنك التبديل فوراً بضغطة زر واحدة بين:\n1. [Circuit Diagram]: المخطط التخطيطي بالرموز الهندسية القياسية (IEEE / IEC).\n2. [PCB Layout]: اللوحة المطبوعة الخضراء مع مسارات النحاس ونقاط اللحام.\n3. [Breadboard]: لوحة التجارب المخبرية الواقعية لتوصيل المكونات الحقيقية.',
    tipAr: 'انقر على أزرار التبويب في شريط الأدوات العلوي للتبديل الفوري بين الأوضاع الثلاثة لأي دائرة.',
  },
  {
    titleAr: 'معرض المكونات (Component Gallery)',
    titleEn: 'Right Gallery & Previews',
    icon: <Sparkles className="w-6 h-6 text-amber-400" />,
    contentAr: 'يقع معرض المكونات في الجانب الأيمن من الشاشة، ومقسّم إلى مجلدات تصنيفية:\n• مصادر الطاقة والتأريض (Power Supplies & 0V Ground)\n• المقاومات والمكثفات (Passive Components)\n• الثنائيات والـ LEDs والترانزستورات (Semiconductors)\n• بوابات المنطق الرقمي (Logic Gates)\n• الدارات المتكاملة (NE555 Timer & LM741 Op-Amp)\n• مكونات الخرج (طنان صوتي، محرك، لمبة، ريليه).',
    tipAr: 'يعرض المعرض في أسفله معاينة مزدوجة للرمز التخطيطي والصورة الواقعية للمكون قبل إضافته أو سحبه للوحة.',
  },
  {
    titleAr: 'رسم وتوصيل الأسلاك (Wiring & Interaction)',
    titleEn: 'Drawing Wires & Switching',
    icon: <Zap className="w-6 h-6 text-cyan-400" />,
    contentAr: 'لتوصيل أي سلك:\n1. انقر على طرف المكون الأول (يتحول لمؤشر نابض).\n2. انقر على طرف المكون الثاني لإنشاء السلك فورياً.\n3. يمكنك اختيار لون السلك (أحمر، أسود، أزرق، أخضر، أصفر).\n4. انقر على المفاتيح (Switches) في أي وقت لتشغيلها وفصلها وسماع صوت النقرة الفيزيائي.',
    tipAr: 'انقر على أي سلك لحذفه أو تغييره، ويمكنك تدوير المكونات بزاوية 90 درجة بالضغط على حرف R.',
  },
  {
    titleAr: 'مؤثرات المحاكاة الحية (Live Simulation Effects)',
    titleEn: 'Current Flow & Voltage Levels',
    icon: <Play className="w-6 h-6 text-emerald-400" />,
    contentAr: 'يوفر البرنامج أشهر ميزات سيركت ويزارد:\n• تدفق التيار المتحرك (Current Flow ⚡): حركة نقاط إلكترونية مضيئة بطول الأسلاك تعبّر عن اتجاه وسرعة التيار الفعلي.\n• مستويات الجهد بالألوان (Voltage Levels 🌈): تلوين الأسلاك باللون الأحمر للموجب العالي، والأخضر للأرضي (0V)، والأصفر للجهود المتوسطة.\n• مستويات المنطق الرقمي (Logic Levels 1/0): مؤشرات رقمية تضيء بالأحمر (1) والأزرق (0) على أطراف بوابات المنطق.',
    tipAr: 'تحكّم بأزرار التشغيل والإيقاف المؤقت (Run ▶ / Pause ❚❚ / Stop ■) في شريط الأدوات العلوي.',
  },
  {
    titleAr: 'الأجهزة الافتراضية (Virtual Instruments)',
    titleEn: 'Digital Multimeter & Oscilloscope',
    icon: <Gauge className="w-6 h-6 text-amber-400" />,
    contentAr: '• الملتيميتر الرقمي الأصفر (Digital Multimeter): جهاز قياس كامل بمجسّات حقيقية حمراء وسوداء لقياس الجهد المستمر DCV، التيار DCA، والمقاومة Ω بدقة هندسية عالية.\n• راسم الإشارة الرقمي (Oscilloscope): عرض منحنيات الجهد مع الزمن (V vs t)، وقياس التردد Hz والجهد القمي Vp-p.\n• حاسبة ألوان المقاومات (Resistor Color Code): حساب المقاومة ونسبة التفاوت بدقة.',
    tipAr: 'انقر على زر "الملتيميتر" في شريط الأدوات لإظهاره وتثبيت المجسات على أي نقطتين في الدائرة.',
  },
];

export const CircuitWizardTourModal: React.FC<CircuitWizardTourModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(i => i - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              {currentStep.icon}
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                الجولة الإرشادية • خطوة {currentStepIndex + 1} من {TOUR_STEPS.length}
              </div>
              <h3 className="text-base font-bold text-white">
                {currentStep.titleAr}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="text-[11px] font-mono text-slate-400" dir="ltr">
            {currentStep.titleEn}
          </div>

          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {currentStep.contentAr}
          </div>

          {/* Practical Tip Card */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="text-emerald-300 font-bold">تلميح هندسي: </strong>
              {currentStep.tipAr}
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5"
          >
            <span>{isLast ? 'إنهاء الجولة وبدء العمل' : 'التالي'}</span>
            {!isLast ? <ChevronLeft className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};
