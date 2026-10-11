import React, { useState } from 'react';
import { 
  Zap, 
  Cpu, 
  Activity, 
  Shield, 
  Award, 
  CheckCircle2, 
  Play, 
  Compass, 
  GraduationCap, 
  BookOpen, 
  ArrowLeft, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { EXPERIMENTS_LIST, Experiment } from '../data/experimentsData';
import { UserProfile } from '../types';

interface LandingPageProps {
  currentUser: UserProfile | null;
  onEnterLab: (experiment?: Experiment) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenOwnerLogin: () => void;
  onOpenVerificationTests: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onEnterLab,
  onOpenLogin,
  onOpenRegister,
  onOpenOwnerLogin,
  onOpenVerificationTests,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  const categories = ['الكل', 'أساسيات الدوائر', 'قوانين الدوائر', 'طرق التوصيل', 'القياس والحماية', 'الإلكترونيات'];

  const filteredExperiments = selectedCategory === 'الكل'
    ? EXPERIMENTS_LIST
    : EXPERIMENTS_LIST.filter(exp => exp.category === selectedCategory);

  const handleExperimentClick = (exp: Experiment) => {
    if (currentUser) {
      onEnterLab(exp);
    } else {
      onOpenLogin();
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-slate-950">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80 bg-circuit-pattern">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Academy & University Kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>أكاديمية الميكاترونكس اليمنية</span>
              <span className="text-slate-600">·</span>
              <span>الجامعة الإماراتية الدولية - صنعاء</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight mb-6">
              مختبر الدوائر الكهربائية{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                التفاعلي
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
              المنصة الهندسية المتكاملة لطلاب هندسة الميكاترونكس بالسنة الأولى. نفّذ التجارب المعملية، وصّل الدوائر باللمس والسحب، وتحقق من قوانين أوم وكيرشوف بمحرك حسابي فيزيائي دقيق 100%.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => currentUser ? onEnterLab() : onOpenRegister()}
                className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                <Compass className="w-5 h-5" />
                <span>{currentUser ? 'دخول لوحة المختبر' : 'ابدأ تجاربك الآن – حساب جديد'}</span>
              </button>

              <button
                onClick={onOpenVerificationTests}
                className="px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 text-emerald-400 border border-slate-700 font-medium text-sm transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>فحص الدقة الحسابية لقوانين الدوائر</span>
              </button>
            </div>

            {/* Key feature pills */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-numbers">14</div>
                <div className="text-xs text-slate-400 mt-1">تجربة معملية معتمدة</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono-numbers">100%</div>
                <div className="text-xs text-slate-400 mt-1">دقة معادلات MNA</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-numbers">V · I · P</div>
                <div className="text-xs text-slate-400 mt-1">قياسات جهد وتيار وقدرة</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono-numbers">Android</div>
                <div className="text-xs text-slate-400 mt-1">جاهز للهاتف واللمس</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Educational Objectives */}
      <section className="py-16 bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">أهداف التعلم لمهندسي الميكاترونكس</h2>
            <p className="text-sm text-slate-400 mt-2">
              صُمم المختبر خصيصًا لتغطية الخطة الدراسية لمقرر الدوائر الكهربائية والإلكترونية في السنة الأولى
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">استيعاب القوانين الفيزيائية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                التطبيق المباشر لقانون أوم (V = I × R)، وقانون كيرشوف للتيار (KCL) عند العقد، وقانون كيرشوف للجهد (KVL) في الحلقات المغلقة.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">إتقان القياسات الهندسية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                التدريب العملي على التوصيل السليم للأميتر على التوالي والفولتميتر على التوازي، والملتيميتر الشامل، واكتشاف أخطاء التوصيل.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">الأمان والحماية الكهربائية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                اكتشاف القصر الكهربائي (Short Circuit)، فهم عمل فيوز الحماية والحد من التيار لحماية الدايود المشع والدوائر الحساسة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 14 Experiments Showcase */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-1">
                المقرر العملي المعتمد
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                قائمة التجارب العملية (14 تجربة)
              </h2>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Experiment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExperiments.map(exp => (
              <div
                key={exp.id}
                onClick={() => handleExperimentClick(exp)}
                className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono-numbers px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-bold">
                      تجربة #{exp.number}
                    </span>
                    <span className="text-slate-400">{exp.category}</span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mb-1">
                    {exp.title}
                  </h3>

                  <div className="text-[11px] font-mono text-slate-500 mb-3" dir="ltr">
                    {exp.titleEn}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {exp.objective}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-teal-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{exp.quiz.length} أسئلة تقييمية</span>
                  </span>

                  <button className="px-3 py-1 rounded-lg bg-emerald-600/10 group-hover:bg-emerald-600 text-emerald-400 group-hover:text-white text-xs font-medium transition-colors flex items-center gap-1">
                    <span>تنفيذ</span>
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. How To Use Workflow */}
      <section className="py-16 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">كيف يعمل المختبر الافتراضي؟</h2>
            <p className="text-sm text-slate-400 mt-2">
              خطوات بسيطة ومرنة مصممة لتجربة تحاكي الواقع الهندسي على الحاسوب والهاتف
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono-numbers flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-white text-sm mb-1">اختر المكونات</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                اسحب مصادر الجهد، المقاومات، المصابيح، أو أجهزة القياس من مكتبة العناصر إلى لوحة العمل.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-cyan-500/20 text-cyan-400 font-bold font-mono-numbers flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-white text-sm mb-1">وصّل الأسلاك</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                انقر على طرف المكون الأول ثم طرف المكون الثاني لإنشاء سلك توصيل ملون ومحدد بدقة.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/20 text-amber-400 font-bold font-mono-numbers flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-white text-sm mb-1">شغّل المحاكاة</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                انقر زر التشغيل ليقوم محرك MNA بحساب التيارات وفروق الجهد والقدرة وإضاءة المصابيح فورًا.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-teal-500/20 text-teal-400 font-bold font-mono-numbers flex items-center justify-center mb-3">
                4
              </div>
              <h4 className="font-bold text-white text-sm mb-1">حل الاختبار التقييمي</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                أجب عن الأسئلة القصيرة واحصل على درجتك مع التفسير العلمي المفصل لكل سؤال.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="py-10 bg-slate-950 border-t border-slate-900 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-slate-200">أكاديمية الميكاترونكس اليمنية – مختبر الدوائر الكهربائية</span>
          </div>

          <div className="flex items-center gap-6">
            <span>الجامعة الإماراتية الدولية - صنعاء</span>
            <span>·</span>
            <button onClick={onOpenOwnerLogin} className="hover:text-amber-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>دخول المالك</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
