import React from 'react';
import { CircuitElement, SimulationResult } from '../engine/circuitSolver';
import { Sliders, RotateCw, Trash2, X, Zap, Activity, Sun, Thermometer, ShieldAlert, Sparkles, Layers } from 'lucide-react';
import { RealisticComponentGraphic } from './RealisticComponentGraphics';
import { COMPONENT_CATALOG } from '../data/componentCatalog';

interface PropertiesPanelProps {
  element: CircuitElement | null;
  simulationResult: SimulationResult;
  onUpdate: (id: string, updates: Partial<CircuitElement>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onOpenColorCodeCalculator?: () => void;
  onOpenOscilloscope?: (el: CircuitElement) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  simulationResult,
  onUpdate,
  onDelete,
  onClose,
  onOpenColorCodeCalculator,
  onOpenOscilloscope,
}) => {
  if (!element) return null;

  const voltDrop = simulationResult.elementVoltages[element.id] || 0;
  const currentA = simulationResult.elementCurrents[element.id] || 0;
  const currentMA = currentA * 1000;
  const powerW = simulationResult.elementPowers[element.id] || 0;

  // Catalog item specs
  const catalogItem = COMPONENT_CATALOG.find(c => c.subType === element.subType || c.type === element.type);

  return (
    <div className="absolute bottom-4 right-4 z-30 w-88 max-w-[calc(100vw-32px)] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur text-slate-100 animate-in slide-in-from-bottom-3 duration-200 max-h-[85vh] overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">خصائص العنصر الهندسي</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Component Visual & Schematic Banner */}
      <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
        <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 p-1">
          <RealisticComponentGraphic element={element} width={48} height={48} />
        </div>
        <div className="flex-1 min-w-0 text-xs">
          <div className="font-bold text-white truncate">{element.name}</div>
          <div className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">{element.nameEn || catalogItem?.nameEn}</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
            الرمز القياسي: {catalogItem?.schematicSymbol || '—[ ]—'}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-3 text-xs">
        
        {/* Name input */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">تسمية العنصر في اللوحة</label>
          <input
            type="text"
            value={element.name}
            onChange={(e) => onUpdate(element.id, { name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Primary Value input (Voltage / Resistance / Capacitance) */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>
              {element.type === 'battery' || element.type === 'dc_power_supply' || element.type === 'ac_power_supply'
                ? 'الجهد الاسمي (Voltage)'
                : element.type === 'resistor' || element.type === 'potentiometer'
                ? 'قيمة المقاومة'
                : element.type === 'capacitor'
                ? 'سعة المكثف (Capacitance)'
                : element.type === 'fuse'
                ? 'تيار الفصل المقنن'
                : 'القيمة الاساسية'}
            </span>
            <span className="font-mono text-emerald-400 font-bold">{element.unit}</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.001"
              step={element.type === 'fuse' ? '0.1' : element.unit === 'V' ? '0.5' : '1'}
              value={element.value}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdate(element.id, { value: Math.max(val, 0.001) });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Subtype Specific Interactive Sliders */}
        {/* A. Battery Internal Resistance */}
        {(element.type === 'battery' || element.type === 'dc_power_supply') && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>المقاومة الداخلية (Internal Resistance R_int)</span>
              <span className="font-mono-numbers text-amber-400">{element.internalResistance || 0} Ω</span>
            </div>
            <input
              type="number"
              min="0"
              step="0.05"
              value={element.internalResistance || 0}
              onChange={e => onUpdate(element.id, { internalResistance: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-numbers"
            />
          </div>
        )}

        {/* B. LDR Light Level Slider */}
        {element.subType === 'resistor_ldr' && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5" />
                <span>شدة الإضاءة المحيطة (Lux)</span>
              </span>
              <span className="font-mono-numbers">{element.state?.ambientLightLux ?? 500} Lux</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={element.state?.ambientLightLux ?? 500}
              onChange={e => {
                onUpdate(element.id, {
                  state: { ...element.state, ambientLightLux: parseInt(e.target.value, 10) }
                });
              }}
              className="w-full h-1.5 bg-slate-700 rounded cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>ظلام دامس (1MΩ)</span>
              <span>ضوء ساطع (100Ω)</span>
            </div>
          </div>
        )}

        {/* C. NTC / PTC Temperature Slider */}
        {(element.subType === 'resistor_ntc' || element.subType === 'resistor_ptc') && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5" />
                <span>درجة الحرارة (°C)</span>
              </span>
              <span className="font-mono-numbers">{element.state?.temperatureC ?? 25} °C</span>
            </div>
            <input
              type="range"
              min="-20"
              max="120"
              step="5"
              value={element.state?.temperatureC ?? 25}
              onChange={e => {
                onUpdate(element.id, {
                  state: { ...element.state, temperatureC: parseInt(e.target.value, 10) }
                });
              }}
              className="w-full h-1.5 bg-slate-700 rounded cursor-pointer accent-rose-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-20°C (بارد)</span>
              <span>25°C (قياسي)</span>
              <span>120°C (ساخن)</span>
            </div>
          </div>
        )}

        {/* D. Resistor Tolerance & Color Code Shortcut */}
        {element.type === 'resistor' && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-400">
              القدرة المقننة: <strong className="text-slate-200">{element.ratedPower || 0.25}W</strong>
            </span>
            {onOpenColorCodeCalculator && (
              <button
                type="button"
                onClick={onOpenColorCodeCalculator}
                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>حاسبة الحلقات</span>
              </button>
            )}
          </div>
        )}

        {/* E. Capacitor Specs */}
        {element.type === 'capacitor' && (
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>الجهد الاسمي الأقصى:</span>
              <span className="text-slate-200 font-mono-numbers">{element.ratedVoltage || 50} V</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>القطبية:</span>
              <span className={element.isPolarized ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                {element.isPolarized ? 'مكثف قطبي (+ / -)' : 'غير قطبي'}
              </span>
            </div>
            {element.dielectricType && (
              <div className="flex justify-between text-slate-400">
                <span>نوع العازل:</span>
                <span className="text-slate-300">{element.dielectricType}</span>
              </div>
            )}
          </div>
        )}

        {/* F. Oscilloscope Launch Button */}
        {element.type === 'oscilloscope' && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
            <div className="text-[11px] font-bold text-emerald-300">
              راسم الإشارة الرقمي (Digital Oscilloscope)
            </div>
            <p className="text-[10px] text-slate-300">
              اعرض تمثيل الجهد مع الزمن V(t)، الإشارات الجيبية، وقيم V_pp و V_rms مع معايرة الزمن والجهد لكل مربع.
            </p>
            {onOpenOscilloscope && (
              <button
                type="button"
                onClick={() => onOpenOscilloscope(element)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-colors"
              >
                <Activity className="w-4 h-4 animate-pulse" />
                <span>فتح شاشة راسم الإشارة (DSO Screen)</span>
              </button>
            )}
          </div>
        )}

        {/* Real-time Telemetry Measurements */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>القياسات الفيزيائية اللحظية (MNA):</span>
          </div>

          <div className="flex items-center justify-between font-mono-numbers text-[11px]">
            <span className="text-slate-400">هبوط الجهد (ΔV):</span>
            <span className="text-emerald-300 font-bold">{voltDrop.toFixed(2)} V</span>
          </div>

          <div className="flex items-center justify-between font-mono-numbers text-[11px]">
            <span className="text-slate-400">شدة التيار المار (I):</span>
            <span className="text-cyan-300 font-bold">
              {currentMA >= 1000 ? `${(currentMA / 1000).toFixed(3)} A` : `${currentMA.toFixed(2)} mA`}
            </span>
          </div>

          <div className="flex items-center justify-between font-mono-numbers text-[11px]">
            <span className="text-slate-400">القدرة المستهلكة (P = V×I):</span>
            <span className="text-amber-300 font-bold">
              {powerW < 1 ? `${(powerW * 1000).toFixed(1)} mW` : `${powerW.toFixed(2)} W`}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onUpdate(element.id, { rotation: (element.rotation + 90) % 360 })}
            className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>تدوير 90°</span>
          </button>

          <button
            onClick={() => onDelete(element.id)}
            className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف</span>
          </button>
        </div>

      </div>
    </div>
  );
};
