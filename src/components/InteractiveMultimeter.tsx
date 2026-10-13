import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RotateCcw, 
  Activity, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Sliders, 
  Move, 
  Pin, 
  ChevronDown,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  CircuitElement, 
  Wire, 
  SimulationResult, 
  calculateTheveninResistance, 
  getTerminalNodeIndex 
} from '../engine/circuitSolver';

export type DMMFunction = 
  | 'OFF'
  | 'DCV_200m'
  | 'DCV_2'
  | 'DCV_20'
  | 'DCV_200'
  | 'DCV_1000'
  | 'ACV_200'
  | 'ACV_750'
  | 'DCA_200u'
  | 'DCA_2000u'
  | 'DCA_20m'
  | 'DCA_200m'
  | 'DCA_10A'
  | 'OHM_200'
  | 'OHM_2k'
  | 'OHM_20k'
  | 'OHM_200k'
  | 'OHM_2M'
  | 'CONTINUITY';

export interface ProbeTarget {
  compId: string;
  termId: string;
  compName: string;
  termLabel: string;
  x?: number;
  y?: number;
}

interface InteractiveMultimeterProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CircuitElement[];
  wires: Wire[];
  simulationResult: SimulationResult;
  redProbe: ProbeTarget | null;
  blackProbe: ProbeTarget | null;
  onSetRedProbe: (probe: ProbeTarget | null) => void;
  onSetBlackProbe: (probe: ProbeTarget | null) => void;
  activeProbePlacing: 'red' | 'black' | null;
  onSetActiveProbePlacing: (mode: 'red' | 'black' | null) => void;
}

export const InteractiveMultimeter: React.FC<InteractiveMultimeterProps> = ({
  isOpen,
  onClose,
  elements,
  wires,
  simulationResult,
  redProbe,
  blackProbe,
  onSetRedProbe,
  onSetBlackProbe,
  activeProbePlacing,
  onSetActiveProbePlacing,
}) => {
  // Multimeter states
  const [selectedFunc, setSelectedFunc] = useState<DMMFunction>('DCV_20');
  const [redLeadJack, setRedLeadJack] = useState<'V_OMEGA_mA' | '10A'>('V_OMEGA_mA');
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isBeeping, setIsBeeping] = useState(false);

  // Audio Context for continuity buzzer
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBuzzerBeep = () => {
    if (!buzzerEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.13);
    } catch {
      // Audio not permitted or unsupported
    }
  };

  // Measurement Computation
  let displayValue = '0.00';
  let unitDisplay = 'V';
  let isOverload = false;
  let statusText = '';

  if (selectedFunc === 'OFF') {
    displayValue = '';
    unitDisplay = '';
  } else {
    // 1. Voltage Measurements (DCV / ACV)
    if (selectedFunc.startsWith('DCV') || selectedFunc.startsWith('ACV')) {
      const isAc = selectedFunc.startsWith('ACV');
      unitDisplay = selectedFunc === 'DCV_200m' ? 'mV' : 'V';

      if (!redProbe || !blackProbe) {
        // Floating probes: small electrostatic noise / 0.00 (in video: 0.01V)
        displayValue = redProbe || blackProbe ? '0.01' : '0.00';
      } else {
        const nodeRed = getTerminalNodeIndex(elements, wires, redProbe.compId, redProbe.termId);
        const nodeBlack = getTerminalNodeIndex(elements, wires, blackProbe.compId, blackProbe.termId);

        if (nodeRed === null || nodeBlack === null) {
          displayValue = '0.00';
        } else {
          const vRed = simulationResult.nodeVoltages[nodeRed] ?? 0;
          const vBlack = simulationResult.nodeVoltages[nodeBlack] ?? 0;
          let diff = vRed - vBlack;

          if (isAc) {
            diff = Math.abs(diff); // AC RMS approximation
          }

          if (selectedFunc === 'DCV_200m') {
            const mv = diff * 1000;
            if (Math.abs(mv) > 199.9) {
              isOverload = true;
              displayValue = '1. ';
            } else {
              displayValue = mv.toFixed(1);
            }
          } else if (selectedFunc === 'DCV_2') {
            if (Math.abs(diff) > 1.999) {
              isOverload = true;
              displayValue = '1. ';
            } else {
              displayValue = diff.toFixed(3);
            }
          } else if (selectedFunc === 'DCV_20') {
            if (Math.abs(diff) > 19.99) {
              isOverload = true;
              displayValue = '1. ';
            } else {
              displayValue = diff.toFixed(2);
            }
          } else if (selectedFunc === 'DCV_200') {
            if (Math.abs(diff) > 199.9) {
              isOverload = true;
              displayValue = '1. ';
            } else {
              displayValue = diff.toFixed(1);
            }
          } else {
            // 1000V DC or 750V AC
            displayValue = diff.toFixed(0);
          }
        }
      }
    }

    // 2. Resistance Measurements (Ω)
    else if (selectedFunc.startsWith('OHM')) {
      unitDisplay = selectedFunc.includes('k') ? 'kΩ' : selectedFunc.includes('M') ? 'MΩ' : 'Ω';

      if (!redProbe || !blackProbe) {
        // Open probes
        displayValue = '1. '; // Standard DMM Open Loop indicator as seen in video (00:01)
        isOverload = true;
      } else {
        const req = calculateTheveninResistance(
          elements,
          wires,
          redProbe.compId,
          redProbe.termId,
          blackProbe.compId,
          blackProbe.termId
        );

        if (req === Infinity || req > 2e7) {
          displayValue = '1. ';
          isOverload = true;
        } else if (selectedFunc === 'OHM_200') {
          if (req > 199.9) {
            displayValue = '1. ';
            isOverload = true;
          } else {
            displayValue = req.toFixed(1);
          }
        } else if (selectedFunc === 'OHM_2k') {
          const k = req / 1000;
          if (k > 1.999) {
            displayValue = '1. ';
            isOverload = true;
          } else {
            displayValue = k.toFixed(3);
          }
        } else if (selectedFunc === 'OHM_20k') {
          const k = req / 1000;
          if (k > 19.99) {
            displayValue = '1. ';
            isOverload = true;
          } else {
            displayValue = k.toFixed(2);
          }
        } else if (selectedFunc === 'OHM_200k') {
          const k = req / 1000;
          if (k > 199.9) {
            displayValue = '1. ';
            isOverload = true;
          } else {
            displayValue = k.toFixed(1);
          }
        } else if (selectedFunc === 'OHM_2M') {
          const m = req / 1e6;
          if (m > 1.999) {
            displayValue = '1. ';
            isOverload = true;
          } else {
            displayValue = m.toFixed(3);
          }
        }
      }
    }

    // 3. Continuity / Diode buzzer (•))))
    else if (selectedFunc === 'CONTINUITY') {
      unitDisplay = 'Ω';

      if (!redProbe || !blackProbe) {
        displayValue = '1. ';
        isOverload = true;
      } else {
        const req = calculateTheveninResistance(
          elements,
          wires,
          redProbe.compId,
          redProbe.termId,
          blackProbe.compId,
          blackProbe.termId
        );

        if (req === Infinity || req > 200) {
          displayValue = '1. ';
          isOverload = true;
        } else {
          // If low resistance (continuity beep!), shows small resistance e.g. "008" as in video 00:02 & 00:08!
          const intVal = Math.round(req);
          displayValue = intVal < 10 ? `00${intVal}` : intVal < 100 ? `0${intVal}` : `${intVal}`;
          if (req < 30) {
            statusText = '•))) رنين مستمر (توصيل سليم)';
          }
        }
      }
    }

    // 4. Current Measurements (DCA)
    else if (selectedFunc.startsWith('DCA')) {
      unitDisplay = selectedFunc === 'DCA_10A' ? 'A' : selectedFunc.includes('u') ? 'µA' : 'mA';

      if (redLeadJack !== '10A' && selectedFunc === 'DCA_10A') {
        statusText = 'تنبيه: يجب توصيل السلك الأحمر بمدخل 10A لقياس التيارات العالية';
      }

      if (!redProbe || !blackProbe) {
        displayValue = '0.00';
      } else {
        // Ammeters must be in series in the loop.
        // If connected between two ends of a circuit path or across resistor:
        const nodeRed = getTerminalNodeIndex(elements, wires, redProbe.compId, redProbe.termId);
        const nodeBlack = getTerminalNodeIndex(elements, wires, blackProbe.compId, blackProbe.termId);

        if (nodeRed !== null && nodeBlack !== null) {
          const vDiff = Math.abs((simulationResult.nodeVoltages[nodeRed] ?? 0) - (simulationResult.nodeVoltages[nodeBlack] ?? 0));
          // If probes bridge a resistor, the current is vDiff / R
          const req = calculateTheveninResistance(
            elements,
            wires,
            redProbe.compId,
            redProbe.termId,
            blackProbe.compId,
            blackProbe.termId
          );
          const iAmps = req > 0 && req !== Infinity ? vDiff / req : simulationResult.totalCurrent;

          if (selectedFunc === 'DCA_200u') {
            const ua = iAmps * 1e6;
            displayValue = ua > 199.9 ? '1. ' : ua.toFixed(1);
          } else if (selectedFunc === 'DCA_20m') {
            const ma = iAmps * 1000;
            displayValue = ma > 19.99 ? '1. ' : ma.toFixed(2);
          } else if (selectedFunc === 'DCA_200m') {
            const ma = iAmps * 1000;
            displayValue = ma > 199.9 ? '1. ' : ma.toFixed(1);
          } else {
            // 10A
            displayValue = iAmps.toFixed(2);
          }
        }
      }
    }
  }

  // Trigger audio buzzer when in continuity mode and resistance < 30 ohms
  useEffect(() => {
    if (selectedFunc === 'CONTINUITY' && redProbe && blackProbe) {
      const req = calculateTheveninResistance(
        elements,
        wires,
        redProbe.compId,
        redProbe.termId,
        blackProbe.compId,
        blackProbe.termId
      );
      if (req < 30) {
        setIsBeeping(true);
        playBuzzerBeep();
      } else {
        setIsBeeping(false);
      }
    } else {
      setIsBeeping(false);
    }
  }, [selectedFunc, redProbe, blackProbe, simulationResult]);

  if (!isOpen) return null;

  // Knob rotation angle calculation based on selectedFunc
  const funcAngles: Record<DMMFunction, number> = {
    OFF: 0,
    DCV_200m: 25,
    DCV_2: 45,
    DCV_20: 65,
    DCV_200: 85,
    DCV_1000: 105,
    ACV_750: 130,
    ACV_200: 150,
    DCA_10A: 180,
    DCA_200m: 205,
    DCA_20m: 225,
    DCA_2000u: 245,
    DCA_200u: 265,
    CONTINUITY: 290,
    OHM_200: 310,
    OHM_2k: 325,
    OHM_20k: 340,
    OHM_200k: 355,
    OHM_2M: 370,
  };

  const dialAngle = funcAngles[selectedFunc] || 0;

  return (
    <div className="fixed bottom-3 right-2 sm:right-4 z-40 select-none animate-in fade-in zoom-in-95 duration-200 max-w-[calc(100vw-16px)]">
      <div className={`relative bg-amber-400 border-4 border-amber-500 rounded-3xl shadow-2xl transition-all duration-300 max-w-full ${
        isMinimized ? 'w-60 sm:w-64 p-2.5 sm:p-3' : 'w-[calc(100vw-24px)] sm:w-80 p-3 sm:p-4 max-h-[85vh] overflow-y-auto'
      }`}>
        
        {/* Top Header / Actions */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs">
              DMM
            </div>
            <div className="text-xs font-bold text-slate-950">
              ملتيميتر رقمي (DT-830D)
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setBuzzerEnabled(b => !b)}
              className="p-1 rounded-lg text-slate-800 hover:bg-amber-300"
              title={buzzerEnabled ? 'كتم صوت الطنان' : 'تفعيل صوت الطنان'}
            >
              {buzzerEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
            <button
              onClick={() => setIsMinimized(m => !m)}
              className="p-1 rounded-lg text-slate-800 hover:bg-amber-300"
              title="تصغير / تكبير"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-800 hover:bg-amber-300"
              title="إغلاق جهاز الملتيميتر"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. Large 7-Segment LCD Display */}
        <div className="relative w-full bg-slate-950 border-4 border-slate-900 rounded-2xl p-3 shadow-inner mb-3">
          {/* LCD Bezel */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 px-1">
            <div className="flex items-center gap-1.5">
              {isBeeping && (
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 animate-pulse">
                  <Volume2 className="w-3 h-3" />
                  <span>BEEP</span>
                </span>
              )}
              {selectedFunc.startsWith('DC') && <span>DC ⎓</span>}
              {selectedFunc.startsWith('AC') && <span>AC ~</span>}
            </div>
            <div className="font-bold text-amber-300">
              {unitDisplay}
            </div>
          </div>

          {/* LCD Digits */}
          <div className="h-14 bg-[#23351f] border border-[#2d4628] rounded-xl flex items-center justify-end px-3 shadow-inner">
            <div className="font-mono-numbers text-3xl sm:text-4xl font-black tracking-widest text-[#a8f38d] drop-shadow-[0_0_8px_rgba(168,243,141,0.5)]">
              {selectedFunc === 'OFF' ? (
                <span className="opacity-0">OFF</span>
              ) : isOverload ? (
                <span>1.</span>
              ) : (
                <span>{displayValue}</span>
              )}
            </div>
          </div>

          {statusText && (
            <div className="mt-1 text-[9px] text-amber-300 text-center font-medium">
              {statusText}
            </div>
          )}
        </div>

        {!isMinimized && (
          <>
            {/* 2. Rotary Dial & Range Selector */}
            <div className="relative w-52 h-52 mx-auto my-2 flex items-center justify-center">
              
              {/* Range Markings Ring around Dial */}
              {/* Top: OFF */}
              <button
                onClick={() => setSelectedFunc('OFF')}
                className={`absolute top-1 text-[9px] font-bold px-1 rounded transition-colors ${
                  selectedFunc === 'OFF' ? 'bg-slate-900 text-amber-300 ring-2 ring-slate-900' : 'text-slate-900 hover:text-black'
                }`}
              >
                OFF
              </button>

              {/* Right: DC Voltage (V⎓) */}
              <div className="absolute right-0 top-6 text-right space-y-0.5 text-[8.5px] font-mono font-bold text-slate-950">
                <div className="text-[7.5px] text-emerald-950 uppercase font-extrabold">V ⎓ DC</div>
                <button onClick={() => setSelectedFunc('DCV_1000')} className={selectedFunc === 'DCV_1000' ? 'text-white bg-slate-900 px-1 rounded' : ''}>1000</button><br />
                <button onClick={() => setSelectedFunc('DCV_200')} className={selectedFunc === 'DCV_200' ? 'text-white bg-slate-900 px-1 rounded' : ''}>200</button><br />
                <button onClick={() => setSelectedFunc('DCV_20')} className={selectedFunc === 'DCV_20' ? 'text-white bg-slate-900 px-1 rounded font-black' : ''}>20V</button><br />
                <button onClick={() => setSelectedFunc('DCV_2')} className={selectedFunc === 'DCV_2' ? 'text-white bg-slate-900 px-1 rounded' : ''}>2000m</button><br />
                <button onClick={() => setSelectedFunc('DCV_200m')} className={selectedFunc === 'DCV_200m' ? 'text-white bg-slate-900 px-1 rounded' : ''}>200m</button>
              </div>

              {/* Bottom Right: AC Voltage (V~) */}
              <div className="absolute right-3 bottom-4 text-right space-y-0.5 text-[8.5px] font-mono font-bold text-slate-950">
                <div className="text-[7.5px] text-cyan-950 uppercase font-extrabold">V ~ AC</div>
                <button onClick={() => setSelectedFunc('ACV_750')} className={selectedFunc === 'ACV_750' ? 'text-white bg-slate-900 px-1 rounded' : ''}>750</button><br />
                <button onClick={() => setSelectedFunc('ACV_200')} className={selectedFunc === 'ACV_200' ? 'text-white bg-slate-900 px-1 rounded' : ''}>200</button>
              </div>

              {/* Bottom Left: DC Current (A⎓) */}
              <div className="absolute left-1 bottom-4 text-left space-y-0.5 text-[8.5px] font-mono font-bold text-slate-950">
                <div className="text-[7.5px] text-rose-950 uppercase font-extrabold">A ⎓ DCA</div>
                <button onClick={() => setSelectedFunc('DCA_10A')} className={selectedFunc === 'DCA_10A' ? 'text-white bg-rose-900 px-1 rounded font-black' : 'text-rose-950 font-bold'}>10A</button><br />
                <button onClick={() => setSelectedFunc('DCA_200m')} className={selectedFunc === 'DCA_200m' ? 'text-white bg-slate-900 px-1 rounded' : ''}>200m</button><br />
                <button onClick={() => setSelectedFunc('DCA_20m')} className={selectedFunc === 'DCA_20m' ? 'text-white bg-slate-900 px-1 rounded' : ''}>20m</button>
              </div>

              {/* Left: Resistance (Ω) & Continuity */}
              <div className="absolute left-0 top-6 text-left space-y-0.5 text-[8.5px] font-mono font-bold text-slate-950">
                <div className="text-[7.5px] text-amber-950 uppercase font-extrabold">Ω OHM</div>
                <button onClick={() => setSelectedFunc('OHM_2M')} className={selectedFunc === 'OHM_2M' ? 'text-white bg-slate-900 px-1 rounded' : ''}>2000k</button><br />
                <button onClick={() => setSelectedFunc('OHM_200k')} className={selectedFunc === 'OHM_200k' ? 'text-white bg-slate-900 px-1 rounded' : ''}>200k</button><br />
                <button onClick={() => setSelectedFunc('OHM_20k')} className={selectedFunc === 'OHM_20k' ? 'text-white bg-slate-900 px-1 rounded font-black' : ''}>20k</button><br />
                <button onClick={() => setSelectedFunc('OHM_2k')} className={selectedFunc === 'OHM_2k' ? 'text-white bg-slate-900 px-1 rounded' : ''}>2000</button><br />
                <button onClick={() => setSelectedFunc('OHM_200')} className={selectedFunc === 'OHM_200' ? 'text-white bg-slate-900 px-1 rounded' : ''}>200</button><br />
                <button onClick={() => setSelectedFunc('CONTINUITY')} className={`font-black ${selectedFunc === 'CONTINUITY' ? 'text-white bg-emerald-800 px-1 rounded' : 'text-emerald-950'}`}>•))) ▷|</button>
              </div>

              {/* Center Knob Base */}
              <div className="w-28 h-28 rounded-full bg-slate-900 border-4 border-slate-800 shadow-xl flex items-center justify-center relative">
                {/* Rotating Knob Head */}
                <div 
                  className="w-22 h-22 rounded-full bg-slate-800 border-2 border-slate-700 shadow-lg flex items-center justify-center transition-transform duration-200 cursor-pointer"
                  style={{ transform: `rotate(${dialAngle}deg)` }}
                >
                  {/* Indicator Pointer Line */}
                  <div className="absolute top-1 w-1.5 h-7 bg-amber-400 rounded-full shadow-[0_0_6px_#facc15]" />
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[7px] text-slate-400 font-bold">
                    SELECT
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Input Jacks Panel (10A, COM, VΩmA) */}
            <div className="mt-3 pt-3 border-t border-amber-500/50 flex items-center justify-around text-center">
              {/* Jack 1: 10A DC */}
              <button
                onClick={() => setRedLeadJack('10A')}
                className={`flex flex-col items-center gap-1 group ${redLeadJack === '10A' ? 'scale-105' : 'opacity-85'}`}
              >
                <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center shadow ${
                  redLeadJack === '10A'
                    ? 'bg-red-600 border-white ring-2 ring-red-500'
                    : 'bg-red-950 border-red-700 text-red-300'
                }`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-red-400" />
                </div>
                <span className="text-[9px] font-bold text-red-950">10A DC</span>
                <span className="text-[7px] text-red-900">MAX 10A</span>
              </button>

              {/* Jack 2: COM (Black Common Ground) */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-slate-950 border-3 border-white ring-2 ring-slate-800 flex items-center justify-center shadow">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600" />
                </div>
                <span className="text-[9px] font-black text-slate-950">COM</span>
                <span className="text-[7px] text-slate-800">الأرضي المشترك</span>
              </div>

              {/* Jack 3: VΩmA (Red Positive) */}
              <button
                onClick={() => setRedLeadJack('V_OMEGA_mA')}
                className={`flex flex-col items-center gap-1 group ${redLeadJack === 'V_OMEGA_mA' ? 'scale-105' : 'opacity-85'}`}
              >
                <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center shadow ${
                  redLeadJack === 'V_OMEGA_mA'
                    ? 'bg-red-600 border-white ring-2 ring-red-500'
                    : 'bg-red-950 border-red-700 text-red-300'
                }`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-red-400" />
                </div>
                <span className="text-[9px] font-black text-red-950">V Ω mA</span>
                <span className="text-[7px] text-red-900">جهد/مقاومة/تيار</span>
              </button>
            </div>

            {/* 4. Interactive Test Probes Manager */}
            <div className="mt-3 p-2.5 rounded-2xl bg-slate-900/90 border border-amber-600/30 text-white space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-amber-300">مجسات القياس التفاعلية (Probes):</span>
                <span className="text-[10px] text-slate-400">انقر لتحديد موقع المجس</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Red Probe Button */}
                <button
                  onClick={() => onSetActiveProbePlacing(activeProbePlacing === 'red' ? null : 'red')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    activeProbePlacing === 'red'
                      ? 'bg-red-600/30 border-red-500 ring-2 ring-red-500 text-red-200 animate-pulse'
                      : redProbe
                      ? 'bg-red-950/40 border-red-500/60 text-red-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-red-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>المجس الأحمر (+)</span>
                  </div>
                  <span className="text-[9.5px] truncate max-w-full text-slate-300">
                    {activeProbePlacing === 'red'
                      ? '👉 انقر على طرف المكون...'
                      : redProbe
                      ? `${redProbe.compName} (${redProbe.termLabel})`
                      : 'حر (غير متصل)'}
                  </span>
                </button>

                {/* Black Probe Button */}
                <button
                  onClick={() => onSetActiveProbePlacing(activeProbePlacing === 'black' ? null : 'black')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    activeProbePlacing === 'black'
                      ? 'bg-slate-700 border-slate-400 ring-2 ring-slate-400 text-white animate-pulse'
                      : blackProbe
                      ? 'bg-slate-950 border-slate-600 text-slate-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-white" />
                    <span>المجس الأسود (-)</span>
                  </div>
                  <span className="text-[9.5px] truncate max-w-full text-slate-300">
                    {activeProbePlacing === 'black'
                      ? '👉 انقر على طرف المكون...'
                      : blackProbe
                      ? `${blackProbe.compName} (${blackProbe.termLabel})`
                      : 'حر (غير متصل)'}
                  </span>
                </button>
              </div>

              {/* Reset probes button */}
              {(redProbe || blackProbe) && (
                <button
                  onClick={() => {
                    onSetRedProbe(null);
                    onSetBlackProbe(null);
                    onSetActiveProbePlacing(null);
                  }}
                  className="w-full py-1 text-[10px] text-slate-400 hover:text-white hover:underline flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>فصل كلا المجسين وإعادتهما إلى الوضع الحر</span>
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
