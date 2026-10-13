import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Activity, 
  Layers, 
  Maximize2,
  Sliders
} from 'lucide-react';
import { SimulationResult } from '../engine/circuitSolver';

interface CircuitWizardStatusBarProps {
  isSimulating: boolean;
  simulationResult: SimulationResult;
  elementsCount: number;
  wiresCount: number;
  totalVoltage: number;
  cursorPos?: { x: number; y: number };
  scale: number;
  viewMode: 'schematic' | 'pcb' | 'breadboard';
}

export const CircuitWizardStatusBar: React.FC<CircuitWizardStatusBarProps> = ({
  isSimulating,
  simulationResult,
  elementsCount,
  wiresCount,
  totalVoltage,
  cursorPos = { x: 140, y: 80 },
  scale,
  viewMode,
}) => {
  const current = simulationResult.totalCurrent;
  const power = simulationResult.totalPower;

  const currentDisplay = current >= 1 
    ? `${current.toFixed(3)} A`
    : current >= 1e-3 
    ? `${(current * 1000).toFixed(2)} mA`
    : `${(current * 1e6).toFixed(1)} µA`;

  const powerDisplay = power >= 1
    ? `${power.toFixed(2)} W`
    : `${(power * 1000).toFixed(1)} mW`;

  // Scale pixels to standard CAD millimeters (assume 10px = 2.54mm pitch)
  const mmX = ((cursorPos.x * 2.54) / 10).toFixed(1);
  const mmY = ((cursorPos.y * 2.54) / 10).toFixed(1);

  return (
    <div className="bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-300 px-3 py-1 flex items-center justify-between gap-3 select-none z-30 overflow-x-auto scrollbar-none">
      
      {/* Left: Simulation State & Health */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            simulationResult.shortCircuit 
              ? 'bg-red-500 animate-ping' 
              : isSimulating 
              ? 'bg-emerald-400' 
              : 'bg-amber-400'
          }`} />
          <span className="font-bold">
            {simulationResult.shortCircuit 
              ? 'SHORT CIRCUIT!' 
              : isSimulating 
              ? 'SIMULATION RUNNING' 
              : 'PAUSED / READY'}
          </span>
        </div>

        {/* Status text */}
        <div className="border-r border-slate-850 pr-3 hidden sm:flex items-center gap-1 text-[10px]">
          {simulationResult.shortCircuit ? (
            <span className="text-red-400 flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3 h-3" />
              <span>قصر كهربائي - افصل المصدر فوراً</span>
            </span>
          ) : simulationResult.openCircuit ? (
            <span className="text-slate-400">
              الدائرة مفتوحة (لا يمر تيار)
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>دائرة مغلقة وسليمة</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Live Electrical Telemetry */}
      <div className="flex items-center gap-3 text-[10px] shrink-0">
        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          <span className="text-slate-400">Vcc:</span>
          <span className="font-bold text-emerald-400">{totalVoltage} V</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          <span className="text-slate-400">Itotal:</span>
          <span className="font-bold text-cyan-400">{currentDisplay}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 hidden md:flex">
          <span className="text-slate-400">Ptotal:</span>
          <span className="font-bold text-amber-400">{powerDisplay}</span>
        </div>
      </div>

      {/* Right: CAD Metrics: Zoom, Coords, Grid, View */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
        <div className="hidden lg:flex items-center gap-1">
          <span>X:</span>
          <span className="text-slate-200">{mmX}mm</span>
          <span>Y:</span>
          <span className="text-slate-200">{mmY}mm</span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <span>Grid:</span>
          <span className="text-slate-200">2.54mm (0.1")</span>
        </div>

        <div className="flex items-center gap-1">
          <span>Zoom:</span>
          <span className="text-slate-200">{Math.round(scale * 100)}%</span>
        </div>

        <div className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] uppercase font-bold text-emerald-400">
          {viewMode}
        </div>
      </div>

    </div>
  );
};
