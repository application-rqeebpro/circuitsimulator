import React, { useState, useRef, useEffect } from 'react';
import { 
  CircuitElement, 
  Wire, 
  Terminal, 
  SimulationResult, 
  ComponentType 
} from '../engine/circuitSolver';
import { 
  Trash2, 
  RotateCw, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  HelpCircle,
  Lightbulb,
  Radio,
  Gauge,
  Power,
  Sun,
  Thermometer,
  Move
} from 'lucide-react';
import { RealisticComponentGraphic } from './RealisticComponentGraphics';
import { SchematicSymbol } from './SchematicSymbols';
import { PCBSymbol } from './PCBSymbols';
import { ProbeTarget } from './InteractiveMultimeter';
import { playSwitchClickSound, updateBuzzerSound } from '../engine/audioEffects';

interface CircuitCanvasProps {
  elements: CircuitElement[];
  wires: Wire[];
  simulationResult: SimulationResult;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CircuitElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddWire: (wire: Wire) => void;
  onDeleteWire: (wireId: string) => void;
  isSimulating: boolean;
  onDropComponentAt?: (comp: Omit<CircuitElement, 'id'>) => void;
  onOpenOscilloscope?: (el: CircuitElement) => void;
  redProbe?: ProbeTarget | null;
  blackProbe?: ProbeTarget | null;
  onSetRedProbe?: (probe: ProbeTarget | null) => void;
  onSetBlackProbe?: (probe: ProbeTarget | null) => void;
  activeProbePlacing?: 'red' | 'black' | null;
  onSetActiveProbePlacing?: (mode: 'red' | 'black' | null) => void;
  onOpenMultimeter?: () => void;
  viewMode?: 'schematic' | 'pcb' | 'breadboard';
  displayStyle?: 'schematic' | 'realistic';
  showCurrentFlow?: boolean;
  showVoltageLevels?: boolean;
  showLogicLevels?: boolean;
  showGrid?: boolean;
  onCursorMove?: (pos: { x: number; y: number }) => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  elements,
  wires,
  simulationResult,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onAddWire,
  onDeleteWire,
  isSimulating,
  onDropComponentAt,
  onOpenOscilloscope,
  redProbe,
  blackProbe,
  onSetRedProbe,
  onSetBlackProbe,
  activeProbePlacing,
  onSetActiveProbePlacing,
  onOpenMultimeter,
  viewMode = 'schematic',
  displayStyle = 'schematic',
  showCurrentFlow = true,
  showVoltageLevels = false,
  showLogicLevels = false,
  showGrid = true,
  onCursorMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false); // Mobile toggle: Pan mode vs Component edit mode

  // Pinch-to-zoom state for mobile
  const [isPinching, setIsPinching] = useState(false);
  const [pinchStartDist, setPinchStartDist] = useState<number>(0);
  const [pinchStartScale, setPinchStartScale] = useState<number>(1);
  const [pinchStartCenter, setPinchStartCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging element
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Wiring state
  const [wiringFrom, setWiringFrom] = useState<{ compId: string; termId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Selected wire for deletion
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [selectedWireColor, setSelectedWireColor] = useState<string>('#ef4444');

  // Handle Pan start
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'path') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectElement(null);
      setSelectedWireId(null);
      setWiringFrom(null);
      if (activeProbePlacing && onSetActiveProbePlacing) onSetActiveProbePlacing(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }

    if (draggingCompId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / scale - dragOffset.x;
      const rawY = (e.clientY - rect.top - pan.y) / scale - dragOffset.y;
      // Grid snapping to 10px
      const snapX = Math.round(rawX / 10) * 10;
      const snapY = Math.round(rawY / 10) * 10;
      onUpdateElement(draggingCompId, { x: Math.max(20, snapX), y: Math.max(20, snapY) });
    }

    if (containerRef.current && onCursorMove) {
      const rect = containerRef.current.getBoundingClientRect();
      const curX = Math.round((e.clientX - rect.left - pan.x) / scale);
      const curY = Math.round((e.clientY - rect.top - pan.y) / scale);
      onCursorMove({ x: Math.max(0, curX), y: Math.max(0, curY) });
    }
  };

  // Sound effect for buzzers when active in the circuit
  useEffect(() => {
    if (!isSimulating) {
      updateBuzzerSound(false);
      return;
    }
    const isBuzzerActive = elements.some(el => {
      if (el.type !== 'buzzer') return false;
      const powerW = simulationResult.elementPowers[el.id] || 0;
      return powerW > 0.01;
    });
    updateBuzzerSound(isBuzzerActive);
    return () => {
      updateBuzzerSound(false);
    };
  }, [isSimulating, elements, simulationResult]);

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingCompId(null);
  };

  // Touch handlers for mobile Android & touchscreens (Single finger drag/pan + 2-finger pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    // 1. Two-finger pinch-to-zoom gesture
    if (e.touches.length === 2) {
      setIsPinching(true);
      setIsPanning(false);
      setDraggingCompId(null);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      setPinchStartDist(dist);
      setPinchStartScale(scale);
      setPinchStartCenter({
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      });
      return;
    }

    // 2. Single finger touch
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      // If Pan Mode active or background touched
      const isTargetBackground = 
        e.target === containerRef.current || 
        (e.target as HTMLElement).tagName === 'svg' ||
        (e.target as HTMLElement).tagName === 'path';

      if (isPanMode || isTargetBackground) {
        setIsPanning(true);
        setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
        if (!isPanMode) {
          onSelectElement(null);
          setSelectedWireId(null);
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 1. Handle pinch-to-zoom
    if (e.touches.length === 2 && isPinching && pinchStartDist > 0) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = newDist / pinchStartDist;
      const targetScale = Math.min(2.2, Math.max(0.45, pinchStartScale * factor));
      setScale(targetScale);
      return;
    }

    // 2. Single finger panning
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({ x: touch.clientX - panStart.x, y: touch.clientY - panStart.y });
      return;
    }

    // 3. Single finger component dragging (snapping to 10px grid)
    if (draggingCompId && containerRef.current && e.touches.length === 1 && !isPanMode) {
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (touch.clientX - rect.left - pan.x) / scale - dragOffset.x;
      const rawY = (touch.clientY - rect.top - pan.y) / scale - dragOffset.y;
      const snapX = Math.round(rawX / 10) * 10;
      const snapY = Math.round(rawY / 10) * 10;
      onUpdateElement(draggingCompId, { x: Math.max(20, snapX), y: Math.max(20, snapY) });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setIsPinching(false);
    setDraggingCompId(null);
  };

  // Terminal absolute coordinates calculator
  const getTerminalCoords = (comp: CircuitElement, term: Terminal) => {
    const rad = (comp.rotation * Math.PI) / 180;
    // Base center of component icon ~ 45x45
    const cx = 45;
    const cy = 45;
    const dx = term.relX - cx;
    const dy = term.relY - cy;

    const rotatedX = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
    const rotatedY = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;

    return {
      x: comp.x + rotatedX,
      y: comp.y + rotatedY,
    };
  };

  // Start or Complete Wiring or Place Multimeter Probe
  const handleTerminalClick = (e: React.MouseEvent, comp: CircuitElement, term: Terminal) => {
    e.stopPropagation();
    const coords = getTerminalCoords(comp, term);

    // If actively placing multimeter probe
    if (activeProbePlacing === 'red') {
      if (onSetRedProbe) {
        onSetRedProbe({
          compId: comp.id,
          termId: term.id,
          compName: comp.name,
          termLabel: term.label,
          x: coords.x,
          y: coords.y,
        });
      }
      if (onSetActiveProbePlacing) onSetActiveProbePlacing(null);
      return;
    }

    if (activeProbePlacing === 'black') {
      if (onSetBlackProbe) {
        onSetBlackProbe({
          compId: comp.id,
          termId: term.id,
          compName: comp.name,
          termLabel: term.label,
          x: coords.x,
          y: coords.y,
        });
      }
      if (onSetActiveProbePlacing) onSetActiveProbePlacing(null);
      return;
    }

    if (!wiringFrom) {
      // Start wire
      setWiringFrom({ compId: comp.id, termId: term.id, x: coords.x, y: coords.y });
      setMousePos(coords);
    } else {
      // Complete wire if different terminal
      if (wiringFrom.compId !== comp.id || wiringFrom.termId !== term.id) {
        onAddWire({
          id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          fromCompId: wiringFrom.compId,
          fromTermId: wiringFrom.termId,
          toCompId: comp.id,
          toTermId: term.id,
          color: selectedWireColor,
        });
      }
      setWiringFrom(null);
    }
  };

  // Toggle Switch state
  const handleToggleSwitch = (comp: CircuitElement) => {
    const isCurrentlyOpen = comp.state?.isOpen ?? false;
    playSwitchClickSound(!isCurrentlyOpen);
    onUpdateElement(comp.id, {
      state: { ...comp.state, isOpen: !isCurrentlyOpen },
    });
  };

  // Render Component Icon & Details
  const renderComponentBody = (el: CircuitElement) => {
    const isSelected = selectedElementId === el.id;
    const voltDrop = simulationResult.elementVoltages[el.id] || 0;
    const currentA = simulationResult.elementCurrents[el.id] || 0;
    const currentMA = currentA * 1000;
    const powerW = simulationResult.elementPowers[el.id] || 0;

    // 1. PCB Layout Mode (silkscreen outlines, copper solder pads)
    if (viewMode === 'pcb') {
      return (
        <div className="relative w-[90px] h-[90px] flex items-center justify-center">
          <PCBSymbol element={el} isSelected={isSelected} />
        </div>
      );
    }

    // 2. Circuit Diagram Schematic Mode (standard IEC/IEEE symbols)
    if (displayStyle === 'schematic' && viewMode === 'schematic') {
      return (
        <div 
          onClick={() => {
            if (el.type === 'switch' || el.type === 'push_button') {
              handleToggleSwitch(el);
            }
          }}
          className={`relative w-[90px] h-[90px] flex items-center justify-center ${
            el.type === 'switch' || el.type === 'push_button' ? 'cursor-pointer' : ''
          }`}
        >
          <SchematicSymbol
            element={el}
            isSelected={isSelected}
            isSimulating={isSimulating}
            powerW={powerW}
            currentA={currentA}
            voltageDrop={voltDrop}
          />
          {/* LDR Lux slider on canvas */}
          {el.subType === 'resistor_ldr' && (
            <div 
              onClick={e => e.stopPropagation()}
              className="absolute -top-3 z-20 flex items-center gap-1 bg-slate-900/95 border border-slate-700 px-1.5 py-0.5 rounded-full shadow"
            >
              <Sun className="w-2.5 h-2.5 text-amber-400" />
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={el.state?.ambientLightLux ?? 500}
                onChange={e => {
                  onUpdateElement(el.id, {
                    state: { ...el.state, ambientLightLux: parseInt(e.target.value, 10) }
                  });
                }}
                className="w-12 h-1 bg-slate-700 rounded cursor-pointer accent-amber-400"
              />
            </div>
          )}
        </div>
      );
    }

    switch (el.type) {
      case 'battery':
      case 'dc_power_supply':
      case 'ac_power_supply':
        return (
          <div className="relative w-[95px] h-[95px] flex flex-col items-center justify-center p-1">
            <RealisticComponentGraphic element={el} width={88} height={88} />
            <div className="absolute -bottom-2 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700/80 text-[9px] font-mono-numbers text-emerald-300 font-bold tracking-tight shadow">
              {el.value}V {el.type === 'ac_power_supply' ? '~' : 'DC'}
            </div>
          </div>
        );

      case 'resistor': {
        const isLDR = el.subType === 'resistor_ldr';
        const isNTC = el.subType === 'resistor_ntc' || el.subType === 'resistor_ptc';

        return (
          <div className="relative w-[96px] h-[86px] flex flex-col items-center justify-center p-1">
            <RealisticComponentGraphic element={el} width={88} height={70} />

            {/* Quick interactive slider on canvas for LDR (Lux) */}
            {isLDR && (
              <div 
                onClick={e => e.stopPropagation()}
                className="absolute -top-3 z-20 flex items-center gap-1 bg-slate-900/95 border border-slate-700 px-1.5 py-0.5 rounded-full shadow"
              >
                <Sun className="w-2.5 h-2.5 text-amber-400" />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={el.state?.ambientLightLux ?? 500}
                  onChange={e => {
                    onUpdateElement(el.id, {
                      state: { ...el.state, ambientLightLux: parseInt(e.target.value, 10) }
                    });
                  }}
                  className="w-12 h-1 bg-slate-700 rounded cursor-pointer accent-amber-400"
                />
              </div>
            )}

            {/* Quick interactive slider on canvas for NTC/PTC (Temperature) */}
            {isNTC && (
              <div 
                onClick={e => e.stopPropagation()}
                className="absolute -top-3 z-20 flex items-center gap-1 bg-slate-900/95 border border-slate-700 px-1.5 py-0.5 rounded-full shadow"
              >
                <Thermometer className="w-2.5 h-2.5 text-rose-400" />
                <input
                  type="range"
                  min="-20"
                  max="120"
                  step="5"
                  value={el.state?.temperatureC ?? 25}
                  onChange={e => {
                    onUpdateElement(el.id, {
                      state: { ...el.state, temperatureC: parseInt(e.target.value, 10) }
                    });
                  }}
                  className="w-12 h-1 bg-slate-700 rounded cursor-pointer accent-rose-400"
                />
              </div>
            )}

            <div className="absolute -bottom-2 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700/80 text-[9px] font-mono-numbers text-slate-200 font-bold shadow">
              {el.value >= 1000 ? `${(el.value / 1000).toFixed(1)}kΩ` : `${el.value}Ω`}
            </div>
          </div>
        );
      }

      case 'potentiometer': {
        const ratio = el.state?.potentiometerRatio ?? 0.5;
        return (
          <div className="relative w-[96px] h-[96px] flex flex-col items-center justify-center p-1">
            <RealisticComponentGraphic element={el} width={88} height={88} />
            <div 
              onClick={e => e.stopPropagation()}
              className="absolute -bottom-3 z-20 flex items-center gap-1 bg-slate-900/95 border border-slate-700 px-2 py-0.5 rounded-full shadow"
            >
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={ratio}
                onChange={e => {
                  onUpdateElement(el.id, {
                    state: { ...el.state, potentiometerRatio: parseFloat(e.target.value) }
                  });
                }}
                className="w-16 h-1.5 bg-slate-700 rounded cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        );
      }

      case 'capacitor': {
        const chargeV = el.state?.chargeVoltage || voltDrop;
        return (
          <div className="relative w-[95px] h-[95px] flex flex-col items-center justify-center p-1">
            <RealisticComponentGraphic element={el} width={88} height={88} />
            <div className="absolute -bottom-2 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700/80 text-[9px] font-mono-numbers text-blue-300 font-bold shadow">
              {el.value} {el.unit}
              {isSimulating && Math.abs(chargeV) > 0.05 && (
                <span className="text-emerald-400 ml-1">({chargeV.toFixed(1)}V)</span>
              )}
            </div>
          </div>
        );
      }

      case 'lamp': {
        const isLit = isSimulating && powerW > 0.05;
        return (
          <div className="relative w-[92px] h-[92px] bg-slate-900/90 border border-slate-700 rounded-2xl p-2 flex flex-col items-center justify-center shadow-md">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isLit
                  ? 'bg-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.95)] text-slate-950 scale-105'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              <Lightbulb className={`w-7 h-7 ${isLit ? 'fill-amber-400 animate-pulse' : ''}`} />
            </div>
            <div className="text-[9px] font-bold text-slate-300 mt-1">{el.name}</div>
            {isLit && (
              <div className="text-[8px] font-mono-numbers text-amber-300">
                {powerW.toFixed(2)}W
              </div>
            )}
          </div>
        );
      }

      case 'switch': {
        const isOpen = el.state?.isOpen ?? false;
        return (
          <div 
            onClick={() => handleToggleSwitch(el)}
            className="cursor-pointer relative w-[92px] h-[80px] bg-slate-900 border border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center shadow-md hover:border-slate-500"
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} />
              <span className={`text-[10px] font-bold font-mono ${isOpen ? 'text-red-400' : 'text-emerald-400'}`}>
                {isOpen ? 'مفتوح (OFF)' : 'مغلق (ON)'}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">{el.name}</div>
            <div className="text-[8px] text-slate-500">(انقر للتبديل)</div>
          </div>
        );
      }

      case 'fuse': {
        const isBlown = el.state?.isBlown || simulationResult.blownFuses.includes(el.id);
        return (
          <div className="relative w-[92px] h-[78px] bg-slate-900 border border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center shadow-md">
            <div className={`w-14 h-4 rounded border flex items-center justify-center ${isBlown ? 'border-red-500 bg-red-950/40' : 'border-emerald-600 bg-slate-800'}`}>
              <div className={`w-10 h-0.5 ${isBlown ? 'bg-red-600 border-dashed line-through' : 'bg-amber-400'}`} />
            </div>
            <div className="text-[9px] font-bold text-slate-300 mt-1">{el.name}</div>
            <div className={`text-[8px] font-bold font-mono-numbers ${isBlown ? 'text-red-400' : 'text-slate-400'}`}>
              {isBlown ? 'محترق (BLOWN)' : `${el.value}A سليم`}
            </div>
          </div>
        );
      }

      case 'ammeter': {
        const meterData = simulationResult.meterReadings.ammeters[el.id];
        return (
          <div className="relative w-[96px] h-[92px] bg-slate-900 border-2 border-cyan-500/60 rounded-xl p-2 flex flex-col items-center justify-between shadow-lg">
            <div className="text-[9px] font-bold text-cyan-400 flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>أميتر (توالي)</span>
            </div>
            {/* LCD Screen */}
            <div className="w-full bg-black/90 border border-cyan-500/40 rounded px-1.5 py-1 text-center">
              <span className="font-mono-numbers text-xs font-bold text-cyan-300 tracking-wider">
                {isSimulating && meterData ? `${meterData.value} ${meterData.unit}` : '0.00 mA'}
              </span>
            </div>
            <div className="text-[8px] text-slate-400">{el.name}</div>
          </div>
        );
      }

      case 'voltmeter': {
        const meterData = simulationResult.meterReadings.voltmeters[el.id];
        return (
          <div className="relative w-[96px] h-[92px] bg-slate-900 border-2 border-emerald-500/60 rounded-xl p-2 flex flex-col items-center justify-between shadow-lg">
            <div className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>فولتميتر (توازي)</span>
            </div>
            {/* LCD Screen */}
            <div className="w-full bg-black/90 border border-emerald-500/40 rounded px-1.5 py-1 text-center">
              <span className="font-mono-numbers text-xs font-bold text-emerald-300 tracking-wider">
                {isSimulating && meterData ? `${meterData.value} ${meterData.unit}` : '0.00 V'}
              </span>
            </div>
            <div className="text-[8px] text-slate-400">{el.name}</div>
          </div>
        );
      }

      case 'multimeter': {
        const meterData = simulationResult.meterReadings.multimeters[el.id];
        const mode = el.state?.mode || 'voltage';
        return (
          <div className="relative w-[100px] h-[100px] bg-amber-950/20 border-2 border-amber-500/60 rounded-xl p-2 flex flex-col items-center justify-between shadow-lg">
            <div className="text-[8px] font-bold text-amber-400">DMM ملتيميتر</div>
            {/* LCD */}
            <div className="w-full bg-black/90 border border-amber-500/50 rounded px-1 py-1 text-center">
              <div className="font-mono-numbers text-xs font-bold text-amber-300">
                {isSimulating && meterData ? `${meterData.value} ${meterData.unit}` : '0.00'}
              </div>
            </div>
            {/* Mode switch */}
            <div className="flex gap-1 text-[8px] font-bold">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateElement(el.id, { state: { ...el.state, mode: 'voltage' } });
                }}
                className={`px-1 rounded ${mode === 'voltage' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
              >
                V
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateElement(el.id, { state: { ...el.state, mode: 'current' } });
                }}
                className={`px-1 rounded ${mode === 'current' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
              >
                mA
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateElement(el.id, { state: { ...el.state, mode: 'resistance' } });
                }}
                className={`px-1 rounded ${mode === 'resistance' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
              >
                Ω
              </button>
            </div>
          </div>
        );
      }

      case 'led': {
        const isForwardLit = isSimulating && currentA > 0.005;
        const color = el.state?.color || (el.subType?.includes('green') ? 'green' : 'red');
        return (
          <div className="relative w-[92px] h-[88px] bg-slate-900 border border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center shadow-md">
            <div
              className={`w-8 h-8 rounded-full transition-all duration-200 border ${
                isForwardLit
                  ? color === 'green'
                    ? 'bg-emerald-400 shadow-[0_0_20px_#10b981] border-emerald-300'
                    : color === 'blue'
                    ? 'bg-cyan-400 shadow-[0_0_20px_#06b6d4] border-cyan-300'
                    : 'bg-red-500 shadow-[0_0_20px_#ef4444] border-red-400'
                  : 'bg-slate-800 border-slate-700 opacity-60'
              }`}
            />
            <div className="text-[9px] font-bold text-slate-300 mt-1">{el.name}</div>
            <div className="text-[8px] font-mono text-slate-400">
              {isForwardLit ? `${currentMA.toFixed(1)} mA` : 'مطفأ'}
            </div>
          </div>
        );
      }

      case 'diode':
        return (
          <div className="relative w-[92px] h-[78px] bg-slate-900 border border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center shadow-md">
            <div className="w-14 h-4 bg-slate-800 rounded border border-slate-600 flex items-center justify-between px-1">
              <span className="text-[9px] font-bold text-slate-400">A</span>
              <div className="w-2 h-full bg-slate-300 rounded-r-sm" title="Cathode line" />
            </div>
            <div className="text-[9px] font-bold text-slate-300 mt-1">{el.name}</div>
            <div className="text-[8px] text-slate-400">1N4007 (0.7V)</div>
          </div>
        );

      case 'inductor':
        return (
          <div className="relative w-[92px] h-[78px] bg-slate-900 border border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center shadow-md">
            <div className="w-12 h-3.5 bg-slate-800 rounded-full border border-amber-600 flex items-center justify-around px-0.5">
              <div className="w-1.5 h-full bg-amber-500/80 rounded" />
              <div className="w-1.5 h-full bg-amber-500/80 rounded" />
              <div className="w-1.5 h-full bg-amber-500/80 rounded" />
            </div>
            <div className="text-[9px] font-bold text-slate-300 mt-1">{el.name}</div>
            <div className="text-[8px] font-mono-numbers text-slate-400">{el.value}mH</div>
          </div>
        );

      case 'oscilloscope': {
        const scopeReading = simulationResult.meterReadings.oscilloscopes[el.id];
        return (
          <div 
            onClick={() => onOpenOscilloscope && onOpenOscilloscope(el)}
            className="cursor-pointer relative w-[100px] h-[95px] flex flex-col items-center justify-center p-1 group hover:scale-105 transition-transform"
            title="انقر لفتح شاشة راسم الإشارة (Oscilloscope Display)"
          >
            <RealisticComponentGraphic element={el} width={92} height={85} />
            <div className="absolute -bottom-2 px-1.5 py-0.5 rounded bg-slate-950/95 border border-emerald-500/50 text-[8px] font-mono-numbers text-emerald-300 font-bold tracking-tight shadow flex items-center gap-1 group-hover:border-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isSimulating && scopeReading ? `${scopeReading.vDiff}V` : 'DSO'} (انقر للعرض)</span>
            </div>
          </div>
        );
      }

      case 'transistor_npn':
      case 'transistor_pnp': {
        const isConducting = isSimulating && Math.abs(currentA) > 0.001;
        return (
          <div className="relative w-[96px] h-[92px] flex flex-col items-center justify-center p-1 group">
            <RealisticComponentGraphic element={el} width={88} height={82} />
            <div className={`absolute -bottom-2 px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold shadow flex items-center gap-1 ${
              isConducting 
                ? 'bg-emerald-950/95 border-emerald-500/80 text-emerald-300' 
                : 'bg-slate-950/90 border-slate-700/80 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConducting ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>{isConducting ? 'ON موصّل' : 'OFF قاطع'}</span>
            </div>
          </div>
        );
      }

      case 'buzzer': {
        const isBuzzing = isSimulating && powerW > 0.01;
        return (
          <div className="relative w-[92px] h-[86px] bg-slate-900 border border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center shadow-md">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isBuzzing ? 'bg-purple-600 shadow-[0_0_20px_#a855f7] scale-105' : 'bg-slate-800'
            }`}>
              <Radio className={`w-6 h-6 ${isBuzzing ? 'text-white animate-spin' : 'text-slate-500'}`} />
            </div>
            <div className="text-[9px] font-bold text-slate-300 mt-1">{el.name}</div>
            {isBuzzing && <div className="text-[8px] font-mono text-purple-300">~850Hz 🕪</div>}
          </div>
        );
      }

      case 'motor': {
        const isSpinning = isSimulating && powerW > 0.01;
        return (
          <div className="relative w-[92px] h-[86px] bg-slate-900 border border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center shadow-md">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
              isSpinning ? 'border-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'border-slate-700 bg-slate-800'
            }`}>
              <RotateCw className={`w-6 h-6 ${isSpinning ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
            </div>
            <div className="text-[9px] font-bold text-slate-300 mt-1">{el.name}</div>
            {isSpinning && <div className="text-[8px] font-mono text-cyan-300">RPM: {(voltDrop * 350).toFixed(0)}</div>}
          </div>
        );
      }

      case 'ground': {
        return (
          <div className="relative w-[80px] h-[75px] bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center shadow-md">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs font-bold">
              ⏚
            </div>
            <div className="text-[8px] font-mono font-bold text-slate-400 mt-1">0V GND</div>
          </div>
        );
      }

      case 'board_green': {
        return (
          <div className="relative w-[130px] h-[120px] flex flex-col items-center justify-center p-1 group">
            <RealisticComponentGraphic element={el} width={124} height={114} />
            <div className="absolute -bottom-2 px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/60 text-[8px] font-bold text-emerald-300 shadow">
              لوحة تجارب خضراء (PCB)
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="w-[92px] h-[78px] bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs flex items-center justify-center">
            {el.name}
          </div>
        );
    }
  };

  // Multimeter attached probe coordinates
  const rComp = redProbe ? elements.find(e => e.id === redProbe.compId) : null;
  const rTerm = rComp && redProbe ? rComp.terminals.find(t => t.id === redProbe.termId) : null;
  const rCoords = rComp && rTerm ? getTerminalCoords(rComp, rTerm) : null;

  const bComp = blackProbe ? elements.find(e => e.id === blackProbe.compId) : null;
  const bTerm = bComp && blackProbe ? bComp.terminals.find(t => t.id === blackProbe.termId) : null;
  const bCoords = bComp && bTerm ? getTerminalCoords(bComp, bTerm) : null;
  const bgClasses = viewMode === 'pcb'
    ? 'bg-[#031d13] bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:20px_20px]'
    : viewMode === 'breadboard'
    ? 'bg-[#0f172a] bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]'
    : showGrid
    ? 'bg-slate-950 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:20px_20px]'
    : 'bg-slate-950';

  return (
    <div
      ref={containerRef}
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const json = e.dataTransfer.getData('application/json');
        if (json && onDropComponentAt && containerRef.current) {
          try {
            const item = JSON.parse(json);
            const rect = containerRef.current.getBoundingClientRect();
            const rawX = (e.clientX - rect.left - pan.x) / scale - 45;
            const rawY = (e.clientY - rect.top - pan.y) / scale - 45;
            const snapX = Math.round(rawX / 10) * 10;
            const snapY = Math.round(rawY / 10) * 10;
            onDropComponentAt({
              ...item,
              x: Math.max(20, snapX),
              y: Math.max(20, snapY),
            });
          } catch (err) {
            console.error('Error dropping component:', err);
          }
        }
      }}
      className={`relative w-full h-full min-h-[420px] sm:min-h-[550px] overflow-hidden select-none cursor-crosshair touch-none ${bgClasses}`}
    >
      {/* Zoom / Pan Controller Overlay & Wire Palette */}
      <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-lg backdrop-blur max-w-[calc(100vw-24px)]">
        <button
          onClick={() => setScale(s => Math.min(s + 0.15, 2.2))}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold active:scale-95"
          title="تكبير +"
        >
          +
        </button>
        <span className="text-[11px] font-mono-numbers text-slate-300 px-0.5">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(s => Math.max(s - 0.15, 0.45))}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold active:scale-95"
          title="تصغير -"
        >
          -
        </button>
        <button
          onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
          className="px-2 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
          title="إعادة ضبط الموضع"
        >
          إعادة
        </button>

        {/* Pan Mode Toggle for Touch & Mobile */}
        <button
          type="button"
          onClick={() => setIsPanMode(p => !p)}
          className={`px-2 h-7 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
            isPanMode
              ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title={isPanMode ? 'وضع تحريك اللوحة مفعّل (انقر للعودة لوضع التحديد والتوصيل)' : 'تفعيل وضع تحريك اللوحة باللمس (Pan)'}
        >
          <Move className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isPanMode ? 'وضع التحريك' : 'تحريك'}</span>
        </button>

        {/* Wire Color Selector: Red, Black, Blue, Green, Yellow */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-1.5 mr-0.5">
          <span className="text-[9px] text-slate-400 font-bold hidden md:inline">السلك:</span>
          {[
            { color: '#ef4444', label: 'أحمر (+)' },
            { color: '#09090b', label: 'أسود (-)' },
            { color: '#0284c7', label: 'أزرق' },
            { color: '#10b981', label: 'أخضر' },
            { color: '#eab308', label: 'أصفر' },
          ].map(c => (
            <button
              key={c.color}
              type="button"
              onClick={() => setSelectedWireColor(c.color)}
              className={`w-4.5 h-4.5 rounded-full border-2 transition-transform ${
                selectedWireColor === c.color ? 'scale-125 ring-2 ring-white z-10' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.color, borderColor: '#cbd5e1' }}
              title={`سلك ${c.label}`}
            />
          ))}
        </div>

        {/* Multimeter Launch Button */}
        {onOpenMultimeter && (
          <button
            onClick={onOpenMultimeter}
            className="px-2 py-1 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors"
            title="فتح جهاز الملتيميتر الرقمي الأصفر"
          >
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">الملتيميتر</span>
          </button>
        )}
      </div>

      {/* Multimeter Probe Placement Banner */}
      {activeProbePlacing && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 animate-bounce shadow-2xl backdrop-blur ${
          activeProbePlacing === 'red'
            ? 'bg-red-950/95 border-red-500 text-red-200'
            : 'bg-slate-950/95 border-slate-400 text-white'
        }`}>
          <div className={`w-3 h-3 rounded-full ${activeProbePlacing === 'red' ? 'bg-red-500' : 'bg-slate-900 border border-white'}`} />
          <span>👉 انقر على طرف المكون في الدائرة لتوصيل المجس {activeProbePlacing === 'red' ? 'الأحمر (+)' : 'الأسود (-)'}</span>
          <button
            onClick={() => onSetActiveProbePlacing && onSetActiveProbePlacing(null)}
            className="p-0.5 rounded hover:bg-white/20 text-slate-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Wiring In-Progress Notice */}
      {wiringFrom && !activeProbePlacing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-pulse shadow-lg backdrop-blur">
          <Zap className="w-3.5 h-3.5" />
          <span>جارٍ توصيل سلك... انقر على طرف المكون الآخر لإنهاء التوصيل (أو انقر بالخلفية للإلغاء)</span>
        </div>
      )}

      {/* SVG Canvas for Wires & Probes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <linearGradient id="wireGradRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="wireGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="wireGradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Render Saved/Connected Wires */}
        {wires.map(wire => {
          const fromComp = elements.find(e => e.id === wire.fromCompId);
          const toComp = elements.find(e => e.id === wire.toCompId);
          if (!fromComp || !toComp) return null;

          const fromTerm = fromComp.terminals.find(t => t.id === wire.fromTermId) || fromComp.terminals[0];
          const toTerm = toComp.terminals.find(t => t.id === wire.toTermId) || toComp.terminals[0];
          if (!fromTerm || !toTerm) return null;

          const c1 = getTerminalCoords(fromComp, fromTerm);
          const c2 = getTerminalCoords(toComp, toTerm);

          const midX = (c1.x + c2.x) / 2;
          const midY = (c1.y + c2.y) / 2;
          // Smooth curve
          const d = `M ${c1.x} ${c1.y} Q ${midX} ${midY - 20} ${c2.x} ${c2.y}`;

          const isSelected = selectedWireId === wire.id;
          
          // Voltage Levels: dynamic color based on electric potential
          let strokeColor = wire.color || '#10b981';
          if (showVoltageLevels) {
            const vFrom = simulationResult.elementVoltages[wire.fromCompId] || 0;
            const vTo = simulationResult.elementVoltages[wire.toCompId] || 0;
            const avgV = Math.max(vFrom, vTo);
            if (avgV >= 4.5) strokeColor = '#ef4444'; // Red (+5V to +9V+)
            else if (avgV > 1.5) strokeColor = '#f59e0b'; // Amber
            else if (avgV > 0.1) strokeColor = '#eab308'; // Yellow
            else strokeColor = '#10b981'; // Green (0V / Ground)
          }

          // PCB Mode: Emerald copper traces
          if (viewMode === 'pcb') {
            strokeColor = '#059669';
          }

          // Current flow calculations
          const fromCurrent = Math.abs(simulationResult.elementCurrents[wire.fromCompId] || 0);
          const toCurrent = Math.abs(simulationResult.elementCurrents[wire.toCompId] || 0);
          const wireCurrent = Math.max(fromCurrent, toCurrent);
          const hasFlow = isSimulating && wireCurrent > 1e-5 && !simulationResult.shortCircuit;

          return (
            <g key={wire.id} className="pointer-events-auto">
              {/* Outer clickable thicker path */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                className="cursor-pointer hover:stroke-red-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWireId(wire.id);
                }}
              />
              {/* Rendered wire path / PCB copper trace */}
              <path
                d={d}
                fill="none"
                stroke={isSelected ? '#f43f5e' : strokeColor}
                strokeWidth={isSelected ? 4 : viewMode === 'pcb' ? 4 : 3}
                strokeLinecap="round"
              />

              {/* PCB Mode: solder pads at connection points */}
              {viewMode === 'pcb' && (
                <>
                  <circle cx={c1.x} cy={c1.y} r={5} fill="#d97706" stroke="#f59e0b" strokeWidth={1} />
                  <circle cx={c1.x} cy={c1.y} r={2} fill="#022c22" />
                  <circle cx={c2.x} cy={c2.y} r={5} fill="#d97706" stroke="#f59e0b" strokeWidth={1} />
                  <circle cx={c2.x} cy={c2.y} r={2} fill="#022c22" />
                </>
              )}

              {/* Circuit Wizard Animated Current Flow: Glowing yellow dots moving along wires */}
              {showCurrentFlow && hasFlow && (
                <path
                  d={d}
                  fill="none"
                  stroke="#fde047"
                  strokeWidth={viewMode === 'pcb' ? 3 : 4}
                  strokeLinecap="round"
                  strokeDasharray="4 16"
                  className="pointer-events-none drop-shadow-[0_0_6px_#fde047] animate-[dash_0.6s_linear_infinite]"
                />
              )}

              {/* Delete button on wire center when clicked */}
              {isSelected && (
                <g
                  transform={`translate(${midX}, ${midY - 10})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWire(wire.id);
                    setSelectedWireId(null);
                  }}
                >
                  <circle r={10} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
                  <text x={0} y={3.5} textAnchor="middle" fill="#ffffff" fontSize={10} fontWeight="bold">✕</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Temporary line during wire creation */}
        {wiringFrom && (
          <line
            x1={wiringFrom.x}
            y1={wiringFrom.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke={selectedWireColor}
            strokeWidth={3}
            strokeDasharray="4 4"
          />
        )}

        {/* Render Connected Multimeter Probes */}
        {rCoords && (
          <g className="pointer-events-auto cursor-pointer" onClick={() => onSetRedProbe && onSetRedProbe(null)}>
            {/* Red probe tip pin */}
            <circle cx={rCoords.x} cy={rCoords.y} r={9} fill="#ef4444" stroke="#ffffff" strokeWidth={2.5} filter="drop-shadow(0 0 8px #ef4444)" />
            {/* Probe Handle Needle */}
            <line x1={rCoords.x} y1={rCoords.y} x2={rCoords.x - 24} y2={rCoords.y - 32} stroke="#ef4444" strokeWidth={7} strokeLinecap="round" />
            <rect x={rCoords.x - 44} y={rCoords.y - 48} width={22} height={8} rx={2} fill="#991b1b" />
            {/* Badge */}
            <g transform={`translate(${rCoords.x - 10}, ${rCoords.y - 36})`}>
              <rect x={-36} y={-10} width={72} height={20} rx={6} fill="#b91c1c" stroke="#fca5a5" strokeWidth={1.2} />
              <text x={0} y={4} textAnchor="middle" fill="#ffffff" fontSize={10} fontWeight="bold">🔴 مجس V(+)</text>
            </g>
          </g>
        )}

        {bCoords && (
          <g className="pointer-events-auto cursor-pointer" onClick={() => onSetBlackProbe && onSetBlackProbe(null)}>
            {/* Black probe tip pin */}
            <circle cx={bCoords.x} cy={bCoords.y} r={9} fill="#09090b" stroke="#ffffff" strokeWidth={2.5} filter="drop-shadow(0 0 8px #ffffff)" />
            {/* Probe Handle Needle */}
            <line x1={bCoords.x} y1={bCoords.y} x2={bCoords.x + 24} y2={bCoords.y - 32} stroke="#18181b" strokeWidth={7} strokeLinecap="round" />
            <rect x={bCoords.x + 22} y={bCoords.y - 48} width={22} height={8} rx={2} fill="#27272a" />
            {/* Badge */}
            <g transform={`translate(${bCoords.x + 10}, ${bCoords.y - 36})`}>
              <rect x={-42} y={-10} width={84} height={20} rx={6} fill="#18181b" stroke="#e2e8f0" strokeWidth={1.2} />
              <text x={0} y={4} textAnchor="middle" fill="#ffffff" fontSize={10} fontWeight="bold">⚫ مجس COM(-)</text>
            </g>
          </g>
        )}
      </svg>

      {/* Render Circuit Components */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {elements.map(el => {
          const isSelected = selectedElementId === el.id;

          return (
            <div
              key={el.id}
              style={{
                left: el.x,
                top: el.y,
                transform: `rotate(${el.rotation}deg)`,
                transformOrigin: '45px 45px',
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelectElement(el.id);
                setSelectedWireId(null);
                setDraggingCompId(el.id);
                if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  const compMouseX = (e.clientX - rect.left - pan.x) / scale;
                  const compMouseY = (e.clientY - rect.top - pan.y) / scale;
                  setDragOffset({ x: compMouseX - el.x, y: compMouseY - el.y });
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                onSelectElement(el.id);
                setSelectedWireId(null);
                setDraggingCompId(el.id);
                if (containerRef.current && e.touches[0]) {
                  const rect = containerRef.current.getBoundingClientRect();
                  const compMouseX = (e.touches[0].clientX - rect.left - pan.x) / scale;
                  const compMouseY = (e.touches[0].clientY - rect.top - pan.y) / scale;
                  setDragOffset({ x: compMouseX - el.x, y: compMouseY - el.y });
                }
              }}
              className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing transition-shadow ${
                isSelected ? 'ring-2 ring-emerald-500 rounded-xl shadow-emerald-500/20 shadow-xl' : ''
              }`}
            >
              {/* Component Body */}
              {renderComponentBody(el)}

              {/* Terminals (Snapping Pins) */}
              {el.terminals.map(term => {
                const isWiringStart = wiringFrom?.compId === el.id && wiringFrom?.termId === term.id;
                const vDrop = simulationResult.elementVoltages[el.id] || 0;
                const isHighLogic = isSimulating && vDrop >= 2.5;

                return (
                  <div
                    key={term.id}
                    style={{
                      left: term.relX - 7,
                      top: term.relY - 7,
                    }}
                    onClick={(e) => handleTerminalClick(e, el, term)}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      handleTerminalClick(e as any, el, term);
                    }}
                    className={`absolute w-3.5 h-3.5 rounded-full border cursor-pointer transition-all flex items-center justify-center before:absolute before:-inset-3.5 before:content-[''] before:z-20 ${
                      isWiringStart
                        ? 'bg-emerald-400 border-white ring-4 ring-emerald-500/50 animate-ping'
                        : viewMode === 'pcb'
                        ? 'bg-[#d97706] border-[#f59e0b] shadow'
                        : 'bg-slate-900 border-emerald-400 hover:bg-emerald-500 hover:scale-125'
                    }`}
                    title={`طرف ${term.label} (انقر للتوصيل)`}
                  >
                    <div className={`w-1 h-1 rounded-full ${viewMode === 'pcb' ? 'bg-[#022c22]' : 'bg-emerald-300'}`} />

                    {/* Circuit Wizard Logic Levels indicator (1 = Red, 0 = Blue) */}
                    {showLogicLevels && isSimulating && (
                      <span className={`absolute -top-3.5 px-1 py-0.2 rounded font-mono text-[8px] font-bold ${
                        isHighLogic ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {isHighLogic ? '1' : '0'}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Floating Quick Action Bar when Selected (Mobile-friendly thumb targets) */}
              {isSelected && (
                <div
                  className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/95 border border-slate-700 px-2 py-1 rounded-xl shadow-2xl z-30 backdrop-blur"
                  style={{ transform: `rotate(-${el.rotation}deg)` }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateElement(el.id, { rotation: (el.rotation + 90) % 360 });
                    }}
                    className="p-1.5 rounded-lg text-teal-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all"
                    title="تدوير 90° (Rotate)"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(el.id);
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 active:scale-95 transition-all"
                    title="حذف المكون (Delete)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
