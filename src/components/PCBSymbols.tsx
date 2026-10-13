import React from 'react';
import { CircuitElement } from '../engine/circuitSolver';

interface PCBSymbolProps {
  element: CircuitElement;
  isSelected?: boolean;
}

export const PCBSymbol: React.FC<PCBSymbolProps> = ({ element, isSelected = false }) => {
  const { type, subType, name } = element;
  const strokeColor = isSelected ? '#38bdf8' : '#ffffff';

  // Copper solder pad with hole
  const renderPad = (cx: number, cy: number, r = 6, holeR = 2.5) => (
    <g key={`${cx}-${cy}`}>
      {/* Outer copper annular ring */}
      <circle cx={cx} cy={cy} r={r} fill="#d97706" stroke="#f59e0b" strokeWidth={1} />
      {/* Central drilled plated hole */}
      <circle cx={cx} cy={cy} r={holeR} fill="#022c22" stroke="#78350f" strokeWidth={0.5} />
    </g>
  );

  switch (type) {
    // 1. AXIAL RESISTOR / DIODE FOOTPRINT
    case 'resistor':
    case 'diode':
    case 'fuse': {
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Silkscreen white rectangular box */}
          <rect
            x={22}
            y={28}
            width={46}
            height={24}
            rx={2}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
            strokeDasharray={isSelected ? '3 1' : undefined}
          />
          {/* Lead lines */}
          <line x1={15} y1={40} x2={22} y2={40} stroke="#f59e0b" strokeWidth={1.5} />
          <line x1={68} y1={40} x2={75} y2={40} stroke="#f59e0b" strokeWidth={1.5} />
          {/* Pads */}
          {renderPad(15, 40)}
          {renderPad(75, 40)}
          {/* Silkscreen label */}
          <text x={45} y={44} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold" fontFamily="monospace">
            {type === 'diode' ? 'D1' : type === 'fuse' ? 'F1' : 'R1'}
          </text>
        </svg>
      );
    }

    // 2. RADIAL CAPACITOR FOOTPRINT
    case 'capacitor': {
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Silkscreen circular outline */}
          <circle cx={45} cy={40} r={22} fill="none" stroke={strokeColor} strokeWidth={1.5} />
          {/* Polarity hatched area */}
          <path d="M 23 40 A 22 22 0 0 1 45 18 L 45 40 Z" fill="#ffffff" opacity={0.3} />
          {/* Pads */}
          {renderPad(30, 40)}
          {renderPad(60, 40)}
          <text x={26} y={30} fill="#ffffff" fontSize={9} fontWeight="bold">+</text>
          <text x={45} y={54} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold" fontFamily="monospace">
            C1
          </text>
        </svg>
      );
    }

    // 3. TO-92 TRANSISTOR FOOTPRINT
    case 'transistor_npn':
    case 'transistor_pnp': {
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Semi-circle TO-92 package silkscreen outline */}
          <path
            d="M 24 28 L 66 28 A 21 21 0 0 1 24 28 Z"
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
          />
          {/* 3 Inline Pads (E, B, C) */}
          {renderPad(30, 45, 5, 2)}
          {renderPad(45, 45, 5, 2)}
          {renderPad(60, 45, 5, 2)}
          <text x={45} y={23} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold" fontFamily="monospace">
            Q1
          </text>
        </svg>
      );
    }

    // 4. DIP IC (555, 741, Logic Gates)
    case 'ic_555':
    case 'ic_opamp':
    case 'logic_and':
    case 'logic_or':
    case 'logic_not': {
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* IC DIP outline with pin 1 notch */}
          <rect x={26} y={15} width={38} height={60} fill="none" stroke={strokeColor} strokeWidth={1.5} />
          {/* Polarity semi-circle notch on top */}
          <path d="M 40 15 A 5 5 0 0 0 50 15" fill="none" stroke={strokeColor} strokeWidth={1.5} />
          {/* Left pads (pins 1-4) */}
          {renderPad(20, 24, 4.5, 2)}
          {renderPad(20, 37, 4.5, 2)}
          {renderPad(20, 50, 4.5, 2)}
          {renderPad(20, 63, 4.5, 2)}
          {/* Right pads (pins 5-8) */}
          {renderPad(70, 63, 4.5, 2)}
          {renderPad(70, 50, 4.5, 2)}
          {renderPad(70, 37, 4.5, 2)}
          {renderPad(70, 24, 4.5, 2)}
          <text x={45} y={46} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold" fontFamily="monospace">
            U1
          </text>
        </svg>
      );
    }

    // 5. LED / LAMP
    case 'led':
    case 'lamp': {
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Round 5mm LED silkscreen outline with flat cathode edge */}
          <path d="M 32 18 A 22 22 0 1 1 58 62 L 58 18 Z" fill="none" stroke={strokeColor} strokeWidth={1.5} />
          {renderPad(35, 40)}
          {renderPad(55, 40)}
          <text x={45} y={56} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold" fontFamily="monospace">
            LED1
          </text>
        </svg>
      );
    }

    // 6. TERMINAL BLOCKS / POWER / BATTERY / SWITCH
    default: {
      return (
        <svg width={90} height={90} viewBox="0 0 90 90" className="drop-shadow-sm select-none">
          {/* Rectangular terminal block footprint */}
          <rect x={20} y={20} width={50} height={50} rx={4} fill="none" stroke={strokeColor} strokeWidth={1.5} />
          {renderPad(32, 45, 6, 3)}
          {renderPad(58, 45, 6, 3)}
          <text x={45} y={35} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold" fontFamily="monospace">
            TB1
          </text>
        </svg>
      );
    }
  }
};
