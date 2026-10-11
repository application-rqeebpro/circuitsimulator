import React, { useState } from 'react';
import { X, Sparkles, Plus, Calculator, ArrowRightLeft } from 'lucide-react';
import { RESISTOR_COLORS, calculateFrom4Bands, get4BandColors } from '../engine/colorCodeCalculator';

interface ColorCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyValue: (resistance: number) => void;
}

export const ColorCodeModal: React.FC<ColorCodeModalProps> = ({
  isOpen,
  onClose,
  onApplyValue,
}) => {
  const [band1, setBand1] = useState('brown');
  const [band2, setBand2] = useState('black');
  const [multiplier, setMultiplier] = useState('red');
  const [tolerance, setTolerance] = useState('gold');

  // Input for direct value to colors
  const [directValueInput, setDirectValueInput] = useState('1000');

  if (!isOpen) return null;

  const currentResult = calculateFrom4Bands(band1, band2, multiplier, tolerance);

  // Set from direct value
  const handleApplyDirectInput = (valStr: string) => {
    setDirectValueInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const colors = get4BandColors(num);
      // find color keys by hex
      const keys = Object.keys(RESISTOR_COLORS);
      const b1 = keys.find(k => RESISTOR_COLORS[k].hex === colors[0]) || 'brown';
      const b2 = keys.find(k => RESISTOR_COLORS[k].hex === colors[1]) || 'black';
      const b3 = keys.find(k => RESISTOR_COLORS[k].hex === colors[2]) || 'red';
      const b4 = keys.find(k => RESISTOR_COLORS[k].hex === colors[3]) || 'gold';
      setBand1(b1);
      setBand2(b2);
      setMultiplier(b3);
      setTolerance(b4);
    }
  };

  const formatResistance = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)} MΩ`;
    if (val >= 1000) return `${(val / 1000).toFixed(2)} kΩ`;
    return `${val} Ω`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">حاسبة الحلقات اللونية للمقاومات</h2>
            <p className="text-xs text-slate-400">Resistor 4-Band Color Code Decoder</p>
          </div>
        </div>

        {/* Visual Resistor Display */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center mb-6">
          <svg width="240" height="70" viewBox="0 0 200 60" className="drop-shadow-lg">
            {/* Leads */}
            <line x1={10} y1={30} x2={45} y2={30} stroke="#94a3b8" strokeWidth={5} strokeLinecap="round" />
            <line x1={155} y1={30} x2={190} y2={30} stroke="#94a3b8" strokeWidth={5} strokeLinecap="round" />
            {/* Resistor Body */}
            <rect x={40} y={15} width={120} height={30} rx={12} fill="#fed7aa" stroke="#d97706" strokeWidth={1.5} />
            {/* Bands */}
            <rect x={60} y={15} width={9} height={30} fill={RESISTOR_COLORS[band1].hex} />
            <rect x={82} y={15} width={9} height={30} fill={RESISTOR_COLORS[band2].hex} />
            <rect x={104} y={15} width={9} height={30} fill={RESISTOR_COLORS[multiplier].hex} />
            <rect x={132} y={15} width={9} height={30} fill={RESISTOR_COLORS[tolerance].hex} />
          </svg>

          {/* Current Decoded Value */}
          <div className="text-center mt-3">
            <div className="text-xl font-bold font-mono-numbers text-emerald-400">
              {formatResistance(currentResult.resistance)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              نسبة السماحية: ±{currentResult.tolerancePct}% ({RESISTOR_COLORS[tolerance].nameAr})
            </div>
          </div>
        </div>

        {/* Direct Input Converter */}
        <div className="mb-5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3 text-xs">
          <div className="shrink-0 text-slate-300 font-bold flex items-center gap-1">
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>إدخال قيمة مباشرة:</span>
          </div>
          <input
            type="number"
            value={directValueInput}
            onChange={(e) => handleApplyDirectInput(e.target.value)}
            placeholder="مثال: 4700"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono-numbers focus:outline-none focus:border-cyan-500"
          />
          <span className="text-slate-400 font-mono">Ω</span>
        </div>

        {/* 4 Band Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
          {/* Band 1 */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-bold">الحلقة 1 (الرقم 1)</label>
            <div className="space-y-1">
              {['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'].map(k => (
                <button
                  key={k}
                  onClick={() => setBand1(k)}
                  className={`w-full px-2 py-1 rounded text-right flex items-center justify-between text-[11px] transition-colors ${
                    band1 === k ? 'ring-2 ring-emerald-400 font-bold bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: RESISTOR_COLORS[k].hex }} />
                  <span>{RESISTOR_COLORS[k].nameAr} ({RESISTOR_COLORS[k].digit})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Band 2 */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-bold">الحلقة 2 (الرقم 2)</label>
            <div className="space-y-1">
              {['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'].map(k => (
                <button
                  key={k}
                  onClick={() => setBand2(k)}
                  className={`w-full px-2 py-1 rounded text-right flex items-center justify-between text-[11px] transition-colors ${
                    band2 === k ? 'ring-2 ring-emerald-400 font-bold bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: RESISTOR_COLORS[k].hex }} />
                  <span>{RESISTOR_COLORS[k].nameAr} ({RESISTOR_COLORS[k].digit})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Multiplier */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-bold">المضاعف (Multiplier)</label>
            <div className="space-y-1">
              {['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'gold', 'silver'].map(k => (
                <button
                  key={k}
                  onClick={() => setMultiplier(k)}
                  className={`w-full px-2 py-1 rounded text-right flex items-center justify-between text-[11px] transition-colors ${
                    multiplier === k ? 'ring-2 ring-emerald-400 font-bold bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: RESISTOR_COLORS[k].hex }} />
                  <span className="font-mono text-[10px]">×{RESISTOR_COLORS[k].multiplier}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tolerance */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-bold">السماحية (Tolerance)</label>
            <div className="space-y-1">
              {['gold', 'silver', 'brown', 'red'].map(k => (
                <button
                  key={k}
                  onClick={() => setTolerance(k)}
                  className={`w-full px-2 py-1 rounded text-right flex items-center justify-between text-[11px] transition-colors ${
                    tolerance === k ? 'ring-2 ring-emerald-400 font-bold bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: RESISTOR_COLORS[k].hex }} />
                  <span>±{RESISTOR_COLORS[k].tolerance}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            إغلاق
          </button>
          <button
            onClick={() => {
              onApplyValue(currentResult.resistance);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مقاومة بهذه القيمة إلى لوحة العمل</span>
          </button>
        </div>

      </div>
    </div>
  );
};
