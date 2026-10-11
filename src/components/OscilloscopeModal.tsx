import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, Maximize2, Minimize2, Play, Pause, RotateCcw, Sliders, Radio, HelpCircle } from 'lucide-react';
import { CircuitElement, SimulationResult, OscilloscopeReading } from '../engine/circuitSolver';

interface OscilloscopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: CircuitElement | null;
  simulationResult: SimulationResult;
  isSimulating: boolean;
  onUpdateElement: (id: string, updates: Partial<CircuitElement>) => void;
}

export const OscilloscopeModal: React.FC<OscilloscopeModalProps> = ({
  isOpen,
  onClose,
  element,
  simulationResult,
  isSimulating,
  onUpdateElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Scope Settings
  const [timeDiv, setTimeDiv] = useState<number>(element?.state?.timePerDivMs || 5); // ms per division (e.g. 1ms, 2ms, 5ms, 10ms, 20ms)
  const [voltsDiv, setVoltsDiv] = useState<number>(element?.state?.voltsPerDiv || 2); // Volts per division (e.g. 0.5V, 1V, 2V, 5V)
  const [coupling, setCoupling] = useState<'dc' | 'ac' | 'gnd'>(element?.state?.coupling || 'dc');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [yOffset, setYOffset] = useState<number>(0); // Vertical offset in divisions
  const [triggerLevel, setTriggerLevel] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Time ticker for wave animation
  const phaseRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Reading from simulation
  const reading: OscilloscopeReading = (element && simulationResult.meterReadings.oscilloscopes[element.id]) || {
    vDiff: 0,
    vPeak: 0,
    vRms: 0,
    frequency: 0,
    waveType: 'zero',
  };

  // Sync state if element changes
  useEffect(() => {
    if (element?.state) {
      if (element.state.timePerDivMs) setTimeDiv(element.state.timePerDivMs);
      if (element.state.voltsPerDiv) setVoltsDiv(element.state.voltsPerDiv);
      if (element.state.coupling) setCoupling(element.state.coupling);
    }
  }, [element?.id]);

  // Persist scope settings on element update
  const handleTimeDivChange = (val: number) => {
    setTimeDiv(val);
    if (element) {
      onUpdateElement(element.id, {
        state: { ...element.state, timePerDivMs: val },
      });
    }
  };

  const handleVoltsDivChange = (val: number) => {
    setVoltsDiv(val);
    if (element) {
      onUpdateElement(element.id, {
        state: { ...element.state, voltsPerDiv: val },
      });
    }
  };

  const handleCouplingChange = (val: 'dc' | 'ac' | 'gnd') => {
    setCoupling(val);
    if (element) {
      onUpdateElement(element.id, {
        state: { ...element.state, coupling: val },
      });
    }
  };

  // Canvas drawing loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const w = canvas.width;
      const h = canvas.height;

      // 1. Clear CRT background (classic phosphor dark-green)
      ctx.fillStyle = '#031711';
      ctx.fillRect(0, 0, w, h);

      // Grid specifications: 10 horizontal divisions, 8 vertical divisions
      const numDivsX = 10;
      const numDivsY = 8;
      const divWidth = w / numDivsX;
      const divHeight = h / numDivsY;

      // 2. Draw Graticule (Grid)
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = '#064e3b';
      ctx.setLineDash([2, 4]);

      // Vertical grid lines
      for (let x = 0; x <= numDivsX; x++) {
        const curX = Math.round(x * divWidth);
        ctx.beginPath();
        ctx.moveTo(curX, 0);
        ctx.lineTo(curX, h);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y <= numDivsY; y++) {
        const curY = Math.round(y * divHeight);
        ctx.beginPath();
        ctx.moveTo(0, curY);
        ctx.lineTo(w, curY);
        ctx.stroke();
      }

      // Center crosshairs (solid & tick marks)
      ctx.setLineDash([]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#059669';

      const centerX = Math.round(w / 2);
      const centerY = Math.round(h / 2);

      // Center X axis
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      // Center Y axis
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, h);
      ctx.stroke();

      // Minor Sub-division tick marks on axes
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#10b981';
      // X ticks
      for (let x = 0; x <= numDivsX * 5; x++) {
        const tx = (x * divWidth) / 5;
        const tickLen = x % 5 === 0 ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(tx, centerY - tickLen);
        ctx.lineTo(tx, centerY + tickLen);
        ctx.stroke();
      }
      // Y ticks
      for (let y = 0; y <= numDivsY * 5; y++) {
        const ty = (y * divHeight) / 5;
        const tickLen = y % 5 === 0 ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(centerX - tickLen, ty);
        ctx.lineTo(centerX + tickLen, ty);
        ctx.stroke();
      }

      // 3. Signal Waveform Calculation & Rendering
      const effectiveV = coupling === 'gnd' ? 0 : reading.vDiff;
      const isAC = reading.waveType === 'sine';
      const freq = reading.frequency || (isAC ? 50 : 0);

      // Advance phase if simulated & not paused
      if (isSimulating && !isPaused && isAC) {
        phaseRef.current += 0.08;
        if (phaseRef.current > Math.PI * 2) {
          phaseRef.current -= Math.PI * 2;
        }
      }

      // Trace line setup
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const totalTimeMs = numDivsX * timeDiv;
      const vScale = divHeight / voltsDiv; // pixels per Volt
      const zeroY = centerY - yOffset * divHeight;

      let started = false;

      for (let px = 0; px <= w; px++) {
        const tMs = (px / w) * totalTimeMs;
        let vInst = 0;

        if (coupling === 'gnd') {
          vInst = 0;
        } else if (isAC) {
          // V(t) = V_peak * sin(2*pi*f*t + phase)
          const angle = 2 * Math.PI * (freq / 1000) * tMs + phaseRef.current;
          vInst = reading.vPeak * Math.sin(angle);
        } else {
          // Pure DC level
          vInst = effectiveV;
        }

        // Apply AC coupling: remove DC component
        if (coupling === 'ac' && !isAC) {
          vInst = 0; // Blocks steady DC
        }

        const py = zeroY - vInst * vScale;

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Reset shadow for subsequent drawings
      ctx.shadowBlur = 0;

      // 4. Ground reference indicator marker on left
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(2, zeroY);
      ctx.lineTo(10, zeroY - 5);
      ctx.lineTo(10, zeroY + 5);
      ctx.closePath();
      ctx.fill();

      // 5. Trigger level indicator marker on right
      const trigY = zeroY - triggerLevel * vScale;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(w - 2, trigY);
      ctx.lineTo(w - 10, trigY - 5);
      ctx.lineTo(w - 10, trigY + 5);
      ctx.closePath();
      ctx.fill();

      if (running) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, timeDiv, voltsDiv, coupling, isPaused, yOffset, triggerLevel, reading, isSimulating]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 transition-all ${
          isExpanded ? 'w-full h-full max-w-5xl max-h-[92vh]' : 'w-full max-w-3xl max-h-[90vh]'
        }`}
      >
        
        {/* Top Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  أوسيلوسكوب رقمي (DSO) – راسم الإشارة والجهد مع الزمن
                </h3>
                <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  CH1 ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {element ? `${element.name} · تمثيل V(t) بدقة فيزيائية متصلة بـ MNA Engine` : 'أداة القياس والتحليل المعملي'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(e => !e)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isExpanded ? 'تصغير الحجم' : 'تكبير ملء الشاشة'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
              title="إغلاق راسم الإشارة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Oscilloscope Body (Screen + Control Panel) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          
          {/* Main Scope Display Canvas */}
          <div className="flex-1 flex flex-col p-3 sm:p-4 bg-slate-950 border-b md:border-b-0 md:border-l border-slate-800">
            
            {/* Live On-Screen CRT Display */}
            <div className="relative flex-1 min-h-[260px] sm:min-h-[320px] rounded-xl overflow-hidden border-2 border-emerald-600/40 shadow-inner bg-[#031711] flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={640}
                height={380}
                className="w-full h-full block"
              />

              {/* On-screen Telemetry Overlay OSD */}
              <div className="absolute top-2 left-3 flex flex-wrap gap-2 text-[10px] font-mono-numbers pointer-events-none select-none">
                <span className="px-2 py-0.5 rounded bg-black/70 border border-emerald-500/40 text-emerald-300 font-bold backdrop-blur">
                  CH1: {voltsDiv}V/DIV
                </span>
                <span className="px-2 py-0.5 rounded bg-black/70 border border-emerald-500/40 text-cyan-300 font-bold backdrop-blur">
                  TIME: {timeDiv}ms/DIV
                </span>
                <span className="px-2 py-0.5 rounded bg-black/70 border border-emerald-500/40 text-amber-300 font-bold backdrop-blur uppercase">
                  {coupling}
                </span>
                {isPaused && (
                  <span className="px-2 py-0.5 rounded bg-red-500/30 border border-red-500/50 text-red-200 font-bold">
                    HOLD
                  </span>
                )}
              </div>

              {/* On-screen Measurements Footer */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2 text-[10px] font-mono-numbers pointer-events-none select-none">
                <div className="flex items-center gap-2 bg-black/75 px-2.5 py-1 rounded-lg border border-slate-800 backdrop-blur">
                  <span className="text-slate-400">V_rms:</span>
                  <span className="text-emerald-300 font-bold">{reading.vRms.toFixed(2)} V</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">V_pp:</span>
                  <span className="text-cyan-300 font-bold">{(reading.vPeak * 2).toFixed(2)} V</span>
                </div>

                <div className="flex items-center gap-2 bg-black/75 px-2.5 py-1 rounded-lg border border-slate-800 backdrop-blur">
                  <span className="text-slate-400">Freq:</span>
                  <span className="text-amber-300 font-bold">
                    {reading.waveType === 'sine' ? `${reading.frequency} Hz` : '0 Hz (DC)'}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">Wave:</span>
                  <span className="text-emerald-400 font-bold">
                    {reading.waveType === 'sine' ? 'Sine ∿' : reading.waveType === 'dc' ? 'DC ⎓' : 'None —'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Transport Buttons under Screen */}
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(p => !p)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                    isPaused 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                      : 'bg-amber-600 text-white hover:bg-amber-500'
                  }`}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'استئناف (Run)' : 'تجميد (Hold)'}</span>
                </button>

                <button
                  onClick={() => {
                    setYOffset(0);
                    setTimeDiv(5);
                    setVoltsDiv(2);
                    setCoupling('dc');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                  title="إعادة ضبط إعدادات الأوسيلوسكوب"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ضبط تلقائي (Auto)</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 hidden sm:block">
                طرف CH1 (+) متصل بالموجب وGND (-) متصل بالأرضي
              </div>
            </div>

          </div>

          {/* Right Controls Knobs Sidebar */}
          <div className="w-full md:w-72 bg-slate-900/90 p-4 space-y-4 overflow-y-auto max-h-[50vh] md:max-h-none text-xs">
            
            {/* Section 1: Vertical (Y-Axis / Volts) */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-emerald-400 font-bold text-xs pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>المحور الرأسي (VOLTS / DIV)</span>
                </span>
                <span className="font-mono-numbers">{voltsDiv} V</span>
              </div>

              {/* Volts per div selector */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">معامل تكبير الجهد لكل مربع:</label>
                <div className="grid grid-cols-4 gap-1 font-mono-numbers">
                  {[0.5, 1, 2, 5, 10].map(v => (
                    <button
                      key={v}
                      onClick={() => handleVoltsDivChange(v)}
                      className={`py-1 rounded text-center font-bold text-[11px] transition-colors ${
                        voltsDiv === v
                          ? 'bg-emerald-500 text-slate-950 font-black shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {v}V
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Position Offset */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>إزاحة الموضع الرأسي (Position Y):</span>
                  <span className="font-mono-numbers text-slate-200">{yOffset} div</span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.5"
                  value={yOffset}
                  onChange={e => setYOffset(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Coupling Selector (DC / AC / GND) */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">نوع الربط (Input Coupling):</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['dc', 'ac', 'gnd'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => handleCouplingChange(c)}
                      className={`py-1 rounded text-center font-bold uppercase text-[11px] transition-colors ${
                        coupling === c
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Horizontal (X-Axis / Time) */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-cyan-400 font-bold text-xs pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>المحور الأفقي (TIME / DIV)</span>
                </span>
                <span className="font-mono-numbers">{timeDiv} ms</span>
              </div>

              {/* Time per div selector */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">قاعدة الزمن لكل مربع:</label>
                <div className="grid grid-cols-4 gap-1 font-mono-numbers">
                  {[1, 2, 5, 10, 20, 50].map(t => (
                    <button
                      key={t}
                      onClick={() => handleTimeDivChange(t)}
                      className={`py-1 rounded text-center font-bold text-[11px] transition-colors ${
                        timeDiv === t
                          ? 'bg-cyan-500 text-slate-950 font-black shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {t}ms
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Engineering Guidance Note */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300/90 leading-relaxed space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>إرشادات هندسية للطلاب:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
                <li>في دوائر التيار المستمر (DC)، يظهر الجهد كخط أفقي مستقيم مساوٍ لقيمة الفولت.</li>
                <li>في دوائر التيار المتردد (AC)، تظهر موجة جيبية بتردد 50Hz ويكون V_pp = 2 × √2 × V_rms.</li>
                <li>وضع AC Coupling يحجب المركبة المستمرة ويظهر التموج فقط.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
