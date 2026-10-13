import React from 'react';
import { CircuitElement, Terminal } from '../engine/circuitSolver';

interface SchematicSymbolProps {
  element: CircuitElement;
  isSelected?: boolean;
  isSimulating?: boolean;
  powerW?: number;
  currentA?: number;
  voltageDrop?: number;
}

export const SchematicSymbol: React.FC<SchematicSymbolProps> = ({
  element,
  isSelected = false,
  isSimulating = false,
  powerW = 0,
  currentA = 0,
  voltageDrop = 0,
}) => {
  const { type, subType, value, unit, name } = element;
  const strokeColor = isSelected ? '#38bdf8' : '#e2e8f0';

  switch (type) {
    // 1. BATTERY & DC SOURCES
    case 'battery':
    case 'dc_power_supply':
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Top connection lead */}
          <line x1={45} y1={10} x2={45} y2={32} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Long line (+) */}
          <line x1={22} y1={32} x2={68} y2={32} stroke={strokeColor} strokeWidth={3} strokeLinecap="round" />
          {/* Plus sign */}
          <text x={72} y={30} fill="#ef4444" fontSize={11} fontWeight="bold" fontFamily="monospace">+</text>
          
          {/* Short thick line (-) */}
          <line x1={32} y1={44} x2={58} y2={44} stroke={strokeColor} strokeWidth={5} strokeLinecap="round" />
          {/* Minus sign */}
          <text x={72} y={48} fill="#38bdf8" fontSize={12} fontWeight="bold" fontFamily="monospace">-</text>

          {/* Long line */}
          <line x1={26} y1={56} x2={64} y2={56} stroke={strokeColor} strokeWidth={3} strokeLinecap="round" />
          {/* Short thick line */}
          <line x1={34} y1={68} x2={56} y2={68} stroke={strokeColor} strokeWidth={5} strokeLinecap="round" />

          {/* Bottom connection lead */}
          <line x1={45} y1={68} x2={45} y2={85} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />

          {/* Value Label */}
          <text x={45} y={54} textAnchor="middle" fill="#10b981" fontSize={9} fontWeight="bold" fontFamily="monospace">
            {value}V
          </text>
        </svg>
      );

    // 2. 0V GROUND
    case 'ground':
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Stem wire */}
          <line x1={45} y1={15} x2={45} y2={45} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Descending ground bars */}
          <line x1={25} y1={45} x2={65} y2={45} stroke={strokeColor} strokeWidth={3} strokeLinecap="round" />
          <line x1={32} y1={53} x2={58} y2={53} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={40} y1={61} x2={50} y2={61} stroke={strokeColor} strokeWidth={2} strokeLinecap="round" />
          <text x={45} y={75} textAnchor="middle" fill="#64748b" fontSize={9} fontWeight="bold" fontFamily="monospace">
            0V GND
          </text>
        </svg>
      );

    // 3. RESISTOR (Standard IEEE zigzag schematic symbol)
    case 'resistor': {
      const isLDR = subType === 'resistor_ldr';
      const isNTC = subType?.includes('ntc') || subType?.includes('ptc');
      const valStr = value >= 1000 ? `${(value / 1000).toFixed(1)}kΩ` : `${value}Ω`;

      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Left lead */}
          <line x1={15} y1={40} x2={27} y2={40} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* IEEE Zigzag body */}
          <path
            d="M 27 40 L 31 28 L 39 52 L 47 28 L 55 52 L 63 40"
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right lead */}
          <line x1={63} y1={40} x2={75} y2={40} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />

          {/* LDR incoming light arrows */}
          {isLDR && (
            <g stroke="#f59e0b" strokeWidth={1.5} fill="#f59e0b">
              <line x1={32} y1={18} x2={42} y2={28} />
              <polygon points="42,28 36,25 40,21" />
              <line x1={40} y1={14} x2={50} y2={24} />
              <polygon points="50,24 44,21 48,17" />
            </g>
          )}

          {/* Thermistor diagonal bar */}
          {isNTC && (
            <line x1={25} y1={58} x2={65} y2={22} stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="3 2" />
          )}

          {/* Resistor Value text */}
          <text x={45} y={66} textAnchor="middle" fill="#38bdf8" fontSize={9} fontWeight="bold" fontFamily="monospace">
            {valStr}
          </text>
        </svg>
      );
    }

    // 4. POTENTIOMETER
    case 'potentiometer':
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <line x1={15} y1={40} x2={27} y2={40} stroke={strokeColor} strokeWidth={2.5} />
          <path
            d="M 27 40 L 31 30 L 39 50 L 47 30 L 55 50 L 63 40"
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <line x1={63} y1={40} x2={75} y2={40} stroke={strokeColor} strokeWidth={2.5} />
          {/* Wiper arrow */}
          <line x1={45} y1={68} x2={45} y2={48} stroke="#06b6d4" strokeWidth={2} />
          <polygon points="45,44 41,50 49,50" fill="#06b6d4" />
          <line x1={45} y1={68} x2={45} y2={80} stroke={strokeColor} strokeWidth={2.5} />
        </svg>
      );

    // 5. CAPACITOR
    case 'capacitor': {
      const isElectrolytic = element.isPolarized || subType === 'cap_electrolytic';
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Left lead */}
          <line x1={15} y1={40} x2={40} y2={40} stroke={strokeColor} strokeWidth={2.5} />
          {/* Left Plate (straight) */}
          <line x1={40} y1={22} x2={40} y2={58} stroke={strokeColor} strokeWidth={3} strokeLinecap="round" />
          
          {isElectrolytic ? (
            <>
              {/* Right Plate (curved for electrolytic) */}
              <path d="M 50 22 Q 44 40 50 58" fill="none" stroke={strokeColor} strokeWidth={3} strokeLinecap="round" />
              <text x={33} y={26} fill="#ef4444" fontSize={11} fontWeight="bold" fontFamily="monospace">+</text>
            </>
          ) : (
            /* Right Plate (straight) */
            <line x1={50} y1={22} x2={50} y2={58} stroke={strokeColor} strokeWidth={3} strokeLinecap="round" />
          )}

          {/* Right lead */}
          <line x1={50} y1={40} x2={75} y2={40} stroke={strokeColor} strokeWidth={2.5} />

          {/* Value text */}
          <text x={45} y={72} textAnchor="middle" fill="#60a5fa" fontSize={9} fontWeight="bold" fontFamily="monospace">
            {value}{unit}
          </text>
        </svg>
      );
    }

    // 6. SWITCH (SPST)
    case 'switch':
    case 'push_button': {
      const isOpen = element.state?.isOpen ?? false;
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Left terminal lead & contact dot */}
          <line x1={15} y1={40} x2={34} y2={40} stroke={strokeColor} strokeWidth={2.5} />
          <circle cx={34} cy={40} r={4} fill={strokeColor} />

          {/* Moving Arm (Open or Closed) */}
          {isOpen ? (
            <line x1={34} y1={40} x2={54} y2={20} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" />
          ) : (
            <line x1={34} y1={40} x2={56} y2={40} stroke="#10b981" strokeWidth={3} strokeLinecap="round" />
          )}

          {/* Right terminal lead & contact dot */}
          <circle cx={56} cy={40} r={4} fill={strokeColor} />
          <line x1={56} y1={40} x2={75} y2={40} stroke={strokeColor} strokeWidth={2.5} />

          <text x={45} y={66} textAnchor="middle" fill={isOpen ? '#ef4444' : '#10b981'} fontSize={9} fontWeight="bold" fontFamily="monospace">
            {isOpen ? 'OPEN (OFF)' : 'CLOSED (ON)'}
          </text>
        </svg>
      );
    }

    // 7. DIODE & LED
    case 'diode':
    case 'led': {
      const isLED = type === 'led' || subType?.includes('led');
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Anode lead */}
          <line x1={15} y1={40} x2={35} y2={40} stroke={strokeColor} strokeWidth={2.5} />
          {/* Diode Triangle */}
          <polygon points="35,26 35,54 53,40" fill={strokeColor} stroke={strokeColor} strokeWidth={2} />
          {/* Cathode Bar */}
          <line x1={53} y1={25} x2={53} y2={55} stroke={strokeColor} strokeWidth={3.5} strokeLinecap="round" />
          {/* Cathode lead */}
          <line x1={53} y1={40} x2={75} y2={40} stroke={strokeColor} strokeWidth={2.5} />

          {/* Light emission arrows for LED */}
          {isLED && (
            <g stroke="#f43f5e" strokeWidth={1.5} fill="#f43f5e">
              <line x1={42} y1={24} x2={52} y2={12} />
              <polygon points="52,12 45,15 48,19" />
              <line x1={50} y1={28} x2={60} y2={16} />
              <polygon points="60,16 53,19 56,23" />
            </g>
          )}

          <text x={45} y={68} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight="bold" fontFamily="monospace">
            {isLED ? 'LED' : '1N4001'}
          </text>
        </svg>
      );
    }

    // 8. LAMP
    case 'lamp': {
      const isLit = isSimulating && powerW > 0.05;
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <line x1={15} y1={40} x2={27} y2={40} stroke={strokeColor} strokeWidth={2.5} />
          <circle
            cx={45}
            cy={40}
            r={18}
            fill={isLit ? '#fbbf24' : 'none'}
            stroke={isLit ? '#f59e0b' : strokeColor}
            strokeWidth={2.5}
            className={isLit ? 'drop-shadow-[0_0_8px_#f59e0b]' : ''}
          />
          {/* Diagonal Cross inside bulb */}
          <line x1={32} y1={27} x2={58} y2={53} stroke={isLit ? '#78350f' : strokeColor} strokeWidth={2} />
          <line x1={32} y1={53} x2={58} y2={27} stroke={isLit ? '#78350f' : strokeColor} strokeWidth={2} />
          <line x1={63} y1={40} x2={75} y2={40} stroke={strokeColor} strokeWidth={2.5} />

          <text x={45} y={72} textAnchor="middle" fill="#f59e0b" fontSize={9} fontWeight="bold" fontFamily="monospace">
            {isLit ? `${powerW.toFixed(1)}W` : 'LAMP'}
          </text>
        </svg>
      );
    }

    // 9. BUZZER
    case 'buzzer': {
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <line x1={20} y1={45} x2={35} y2={45} stroke={strokeColor} strokeWidth={2.5} />
          {/* Half circle buzzer bell */}
          <path d="M 35 25 A 20 20 0 0 1 35 65 Z" fill="#1e293b" stroke={strokeColor} strokeWidth={2.5} />
          <line x1={55} y1={45} x2={75} y2={45} stroke={strokeColor} strokeWidth={2.5} />
          <text x={45} y={75} textAnchor="middle" fill="#a855f7" fontSize={9} fontWeight="bold" fontFamily="monospace">
            BUZZER
          </text>
        </svg>
      );
    }

    // 10. DC MOTOR
    case 'motor': {
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <line x1={20} y1={45} x2={27} y2={45} stroke={strokeColor} strokeWidth={2.5} />
          <circle cx={45} cy={45} r={18} fill="#0f172a" stroke={strokeColor} strokeWidth={2.5} />
          <text x={45} y={51} textAnchor="middle" fill="#38bdf8" fontSize={16} fontWeight="bold" fontFamily="sans-serif">
            M
          </text>
          <line x1={63} y1={45} x2={75} y2={45} stroke={strokeColor} strokeWidth={2.5} />
          <text x={45} y={74} textAnchor="middle" fill="#94a3b8" fontSize={8} fontWeight="bold">
            DC MOTOR
          </text>
        </svg>
      );
    }

    // 11. TRANSISTOR (NPN / PNP)
    case 'transistor_npn':
    case 'transistor_pnp': {
      const isNPN = type === 'transistor_npn';
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Base lead */}
          <line x1={15} y1={45} x2={36} y2={45} stroke={strokeColor} strokeWidth={2.5} />
          {/* Base vertical plate */}
          <line x1={36} y1={25} x2={36} y2={65} stroke={strokeColor} strokeWidth={3.5} strokeLinecap="round" />

          {/* Collector branch */}
          <line x1={36} y1={33} x2={56} y2={18} stroke={strokeColor} strokeWidth={2.5} />
          <line x1={56} y1={18} x2={75} y2={18} stroke={strokeColor} strokeWidth={2.5} />

          {/* Emitter branch with arrow */}
          <line x1={36} y1={57} x2={56} y2={72} stroke={strokeColor} strokeWidth={2.5} />
          <line x1={56} y1={72} x2={75} y2={72} stroke={strokeColor} strokeWidth={2.5} />

          {/* Arrow on Emitter (pointing outward for NPN, inward for PNP) */}
          {isNPN ? (
            <polygon points="56,72 46,65 52,60" fill={strokeColor} />
          ) : (
            <polygon points="36,57 46,64 42,54" fill={strokeColor} />
          )}

          {/* Outer circle */}
          <circle cx={45} cy={45} r={28} fill="none" stroke={strokeColor} strokeWidth={1.5} opacity={0.6} />

          <text x={45} y={84} textAnchor="middle" fill="#a78bfa" fontSize={8} fontWeight="bold" fontFamily="monospace">
            {isNPN ? 'NPN (BC548)' : 'PNP (BC558)'}
          </text>
        </svg>
      );
    }

    // 12. LOGIC GATES (AND, OR, NOT)
    case 'logic_and':
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <line x1={15} y1={30} x2={30} y2={30} stroke={strokeColor} strokeWidth={2} />
          <line x1={15} y1={60} x2={30} y2={60} stroke={strokeColor} strokeWidth={2} />
          {/* AND Gate D-Shape */}
          <path d="M 30 20 L 45 20 A 25 25 0 0 1 45 70 L 30 70 Z" fill="#0f172a" stroke={strokeColor} strokeWidth={2.5} />
          <line x1={70} y1={45} x2={80} y2={45} stroke={strokeColor} strokeWidth={2} />
          <text x={42} y={49} textAnchor="middle" fill="#c084fc" fontSize={11} fontWeight="bold">&amp;</text>
        </svg>
      );

    case 'logic_or':
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <line x1={15} y1={30} x2={32} y2={30} stroke={strokeColor} strokeWidth={2} />
          <line x1={15} y1={60} x2={32} y2={60} stroke={strokeColor} strokeWidth={2} />
          {/* OR Gate curved shape */}
          <path d="M 30 20 Q 42 45 30 70 Q 56 68 70 45 Q 56 22 30 20 Z" fill="#0f172a" stroke={strokeColor} strokeWidth={2.5} />
          <line x1={70} y1={45} x2={80} y2={45} stroke={strokeColor} strokeWidth={2} />
          <text x={46} y={49} textAnchor="middle" fill="#c084fc" fontSize={10} fontWeight="bold">≥1</text>
        </svg>
      );

    case 'logic_not':
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <line x1={15} y1={45} x2={32} y2={45} stroke={strokeColor} strokeWidth={2} />
          {/* Triangle */}
          <polygon points="32,25 32,65 56,45" fill="#0f172a" stroke={strokeColor} strokeWidth={2.5} />
          {/* Inversion Bubble */}
          <circle cx={60} cy={45} r={4} fill="#0f172a" stroke={strokeColor} strokeWidth={2} />
          <line x1={64} y1={45} x2={80} y2={45} stroke={strokeColor} strokeWidth={2} />
          <text x={45} y={76} textAnchor="middle" fill="#c084fc" fontSize={8} fontWeight="bold">NOT</text>
        </svg>
      );

    // 13. IC 555 & OP-AMP
    case 'ic_555':
    case 'ic_opamp': {
      const is555 = type === 'ic_555';
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <rect x={22} y={15} width={46} height={60} rx={4} fill="#0f172a" stroke={strokeColor} strokeWidth={2.5} />
          {/* IC Orientation Notch */}
          <circle cx={45} cy={15} r={4} fill="#334155" />
          <text x={45} y={48} textAnchor="middle" fill="#38bdf8" fontSize={11} fontWeight="bold" fontFamily="monospace">
            {is555 ? 'NE555' : 'LM741'}
          </text>
          <text x={45} y={62} textAnchor="middle" fill="#64748b" fontSize={7} fontWeight="bold">
            {is555 ? 'TIMER' : 'OP-AMP'}
          </text>
        </svg>
      );
    }

    // 14. METERS (Ammeter & Voltmeter)
    case 'ammeter':
    case 'voltmeter': {
      const isAmmeter = type === 'ammeter';
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          <line x1={15} y1={45} x2={26} y2={45} stroke={strokeColor} strokeWidth={2.5} />
          <circle
            cx={45}
            cy={45}
            r={19}
            fill="#090d16"
            stroke={isAmmeter ? '#06b6d4' : '#10b981'}
            strokeWidth={2.5}
          />
          <text
            x={45}
            y={52}
            textAnchor="middle"
            fill={isAmmeter ? '#06b6d4' : '#10b981'}
            fontSize={17}
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {isAmmeter ? 'A' : 'V'}
          </text>
          <line x1={64} y1={45} x2={75} y2={45} stroke={strokeColor} strokeWidth={2.5} />
        </svg>
      );
    }

    default:
      return (
        <div className="w-[80px] h-[70px] border border-slate-700 bg-slate-900 rounded p-1 text-center text-xs flex items-center justify-center font-bold text-slate-300">
          {name}
        </div>
      );
  }
};
