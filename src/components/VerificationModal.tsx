import React, { useState } from 'react';
import { runEngineeringVerificationTests, CircuitElement, Wire } from '../engine/circuitSolver';
import { X, CheckCircle2, AlertCircle, Play, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTestCircuit: (elements: CircuitElement[], wires: Wire[]) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onLoadTestCircuit,
}) => {
  const [testResults, setTestResults] = useState(runEngineeringVerificationTests());

  if (!isOpen) return null;

  const handleRerun = () => {
    setTestResults(runEngineeringVerificationTests());
  };

  // Helper circuits for loading into canvas
  const loadTest1 = () => {
    const els: CircuitElement[] = [
      {
        id: 'bat1',
        type: 'battery',
        name: 'بطارية 9V',
        x: 120,
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
        id: 'amm1',
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
        id: 'r1',
        type: 'resistor',
        name: 'R1 (1kΩ)',
        x: 480,
        y: 180,
        rotation: 0,
        value: 1000,
        unit: 'Ω',
        terminals: [
          { id: 't1', label: '1', relX: 15, relY: 40 },
          { id: 't2', label: '2', relX: 75, relY: 40 },
        ],
      },
    ];
    const ws: Wire[] = [
      { id: 'w1', fromCompId: 'bat1', fromTermId: 't1', toCompId: 'amm1', toTermId: 't1', color: '#ef4444' },
      { id: 'w2', fromCompId: 'amm1', fromTermId: 't2', toCompId: 'r1', toTermId: 't1', color: '#10b981' },
      { id: 'w3', fromCompId: 'r1', fromTermId: 't2', toCompId: 'bat1', toTermId: 't2', color: '#0284c7' },
    ];
    onLoadTestCircuit(els, ws);
    onClose();
  };

  const loadTest2 = () => {
    const els: CircuitElement[] = [
      {
        id: 'ps2',
        type: 'dc_power_supply',
        name: 'مصدر DC (12V)',
        x: 100,
        y: 180,
        rotation: 0,
        value: 12,
        unit: 'V',
        terminals: [
          { id: 't1', label: '+', relX: 45, relY: 10 },
          { id: 't2', label: '-', relX: 45, relY: 85 },
        ],
      },
      {
        id: 'amm2',
        type: 'ammeter',
        name: 'أميتر (توالي)',
        x: 260,
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
        id: 'r2_1',
        type: 'resistor',
        name: 'R1 (1kΩ)',
        x: 420,
        y: 100,
        rotation: 0,
        value: 1000,
        unit: 'Ω',
        terminals: [
          { id: 't1', label: '1', relX: 15, relY: 40 },
          { id: 't2', label: '2', relX: 75, relY: 40 },
        ],
      },
      {
        id: 'r2_2',
        type: 'resistor',
        name: 'R2 (1kΩ)',
        x: 580,
        y: 180,
        rotation: 0,
        value: 1000,
        unit: 'Ω',
        terminals: [
          { id: 't1', label: '1', relX: 15, relY: 40 },
          { id: 't2', label: '2', relX: 75, relY: 40 },
        ],
      },
    ];
    const ws: Wire[] = [
      { id: 'w1', fromCompId: 'ps2', fromTermId: 't1', toCompId: 'amm2', toTermId: 't1', color: '#ef4444' },
      { id: 'w2', fromCompId: 'amm2', fromTermId: 't2', toCompId: 'r2_1', toTermId: 't1', color: '#10b981' },
      { id: 'w3', fromCompId: 'r2_1', fromTermId: 't2', toCompId: 'r2_2', toTermId: 't1', color: '#10b981' },
      { id: 'w4', fromCompId: 'r2_2', fromTermId: 't2', toCompId: 'ps2', toTermId: 't2', color: '#0284c7' },
    ];
    onLoadTestCircuit(els, ws);
    onClose();
  };

  const loadTest3 = () => {
    const els: CircuitElement[] = [
      {
        id: 'ps3',
        type: 'dc_power_supply',
        name: 'مصدر DC (12V)',
        x: 100,
        y: 200,
        rotation: 0,
        value: 12,
        unit: 'V',
        terminals: [
          { id: 't1', label: '+', relX: 45, relY: 10 },
          { id: 't2', label: '-', relX: 45, relY: 85 },
        ],
      },
      {
        id: 'r3_1',
        type: 'resistor',
        name: 'R1 توازي (1kΩ)',
        x: 360,
        y: 120,
        rotation: 0,
        value: 1000,
        unit: 'Ω',
        terminals: [
          { id: 't1', label: '1', relX: 15, relY: 40 },
          { id: 't2', label: '2', relX: 75, relY: 40 },
        ],
      },
      {
        id: 'r3_2',
        type: 'resistor',
        name: 'R2 توازي (1kΩ)',
        x: 360,
        y: 280,
        rotation: 0,
        value: 1000,
        unit: 'Ω',
        terminals: [
          { id: 't1', label: '1', relX: 15, relY: 40 },
          { id: 't2', label: '2', relX: 75, relY: 40 },
        ],
      },
    ];
    const ws: Wire[] = [
      { id: 'w1', fromCompId: 'ps3', fromTermId: 't1', toCompId: 'r3_1', toTermId: 't1', color: '#ef4444' },
      { id: 'w2', fromCompId: 'ps3', fromTermId: 't1', toCompId: 'r3_2', toTermId: 't1', color: '#ef4444' },
      { id: 'w3', fromCompId: 'r3_1', fromTermId: 't2', toCompId: 'ps3', toTermId: 't2', color: '#0284c7' },
      { id: 'w4', fromCompId: 'r3_2', fromTermId: 't2', toCompId: 'ps3', toTermId: 't2', color: '#0284c7' },
    ];
    onLoadTestCircuit(els, ws);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>اختبارات القبول الإلزامية – القسم الخامس عشر</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            فحص الدقة الحسابية لمحرك محاكاة الدوائر الكهربائية (MNA)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            يتم فحص مطابقة المحرك بدقة مع قوانين أوم وكيرشوف وفق الاختبارات الثلاثة المحددة رسميًا
          </p>
        </div>

        {/* 3 Benchmark Cards */}
        <div className="space-y-4 text-xs">
          
          {/* Test 1 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
                  الاختبار الأول
                </span>
                <span className="font-bold text-slate-200">مصدر 9V مع مقاومة 1kΩ</span>
              </div>
              {testResults.test1.passed ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ناجح (Passed)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400 font-bold text-[11px]">
                  <AlertCircle className="w-4 h-4" />
                  <span>فشل</span>
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono-numbers text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>القيمة النظرية للتيار (I = 9V / 1000Ω):</span>
                <span className="text-slate-200 font-bold">9.00 mA</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>النتيجة المحسوبة بمحرك MNA:</span>
                <span className="font-bold">{testResults.test1.calculatedCurrentMA.toFixed(2)} mA</span>
              </div>
            </div>

            <button
              onClick={loadTest1}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>تحميل هذه الدائرة في اللوحة التفاعلية للقياس</span>
            </button>
          </div>

          {/* Test 2 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
                  الاختبار الثاني
                </span>
                <span className="font-bold text-slate-200">مصدر 12V مع مقاومتين 1kΩ على التوالي</span>
              </div>
              {testResults.test2.passed ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ناجح (Passed)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400 font-bold text-[11px]">
                  <AlertCircle className="w-4 h-4" />
                  <span>فشل</span>
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono-numbers text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>التيار الكلي النظري (Req = 2kΩ):</span>
                <span className="text-slate-200 font-bold">6.00 mA</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>الجهد النظري على كل مقاومة (V1, V2):</span>
                <span className="text-slate-200 font-bold">6.00 V / 6.00 V</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>النتائج الفعلية المحسوبة بالمحرك:</span>
                <span className="font-bold">
                  I = {testResults.test2.totalCurrentMA.toFixed(2)} mA | V1 = {testResults.test2.vR1.toFixed(2)}V | V2 = {testResults.test2.vR2.toFixed(2)}V
                </span>
              </div>
            </div>

            <button
              onClick={loadTest2}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>تحميل دائرة التوالي في اللوحة التفاعلية للقياس</span>
            </button>
          </div>

          {/* Test 3 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
                  الاختبار الثالث
                </span>
                <span className="font-bold text-slate-200">مصدر 12V مع مقاومتين 1kΩ على التوازي</span>
              </div>
              {testResults.test3.passed ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ناجح (Passed)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400 font-bold text-[11px]">
                  <AlertCircle className="w-4 h-4" />
                  <span>فشل</span>
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono-numbers text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>التيار الكلي النظري (Req = 500Ω):</span>
                <span className="text-slate-200 font-bold">24.00 mA</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>التيار في كل فرع توازي (I1, I2):</span>
                <span className="text-slate-200 font-bold">12.00 mA / 12.00 mA</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>النتائج الفعلية المحسوبة بالمحرك:</span>
                <span className="font-bold">
                  Total = {testResults.test3.totalCurrentMA.toFixed(2)} mA | Branch1 = {testResults.test3.branch1MA.toFixed(2)} mA | Branch2 = {testResults.test3.branch2MA.toFixed(2)} mA
                </span>
              </div>
            </div>

            <button
              onClick={loadTest3}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>تحميل دائرة التوازي في اللوحة التفاعلية للقياس</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleRerun}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة تشغيل الفحص</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
