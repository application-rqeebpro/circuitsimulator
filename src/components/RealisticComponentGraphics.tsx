import React from 'react';
import { CircuitElement } from '../engine/circuitSolver';
import { get4BandColors, get5BandColors } from '../engine/colorCodeCalculator';

interface ComponentGraphicProps {
  element: Partial<CircuitElement> & { type: string; subType?: string; value: number; unit?: string };
  width?: number;
  height?: number;
  isLit?: boolean;
  powerW?: number;
}

export const RealisticComponentGraphic: React.FC<ComponentGraphicProps> = ({
  element,
  width = 90,
  height = 90,
  isLit = false,
  powerW = 0,
}) => {
  const { type, subType, value, state } = element;

  // Helper for 4-band resistor colors
  const bands = get4BandColors(value || 1000, element.tolerancePct || 5);
  // Helper for 5-band resistor colors
  const bands5 = get5BandColors(value || 1000, element.tolerancePct || 1);

  // Helper to format SMD code (e.g. 10000 -> 103, 220 -> 221)
  const getSmdCode = (val: number): string => {
    if (val <= 0) return '000';
    if (val < 10) return `${val}R0`;
    const exp = Math.floor(Math.log10(val));
    const multExp = exp - 1;
    const base = Math.round(val / Math.pow(10, multExp));
    return `${base}${multExp}`;
  };

  // -------------------------------------------------------------
  // 1. BATTERIES & POWER SOURCES
  // -------------------------------------------------------------
  if (type === 'battery' || type === 'dc_power_supply' || type === 'ac_power_supply') {
    switch (subType) {
      case 'battery_aa':
      case 'battery_aaa':
      case 'battery_c':
      case 'battery_d': {
        const isSlim = subType === 'battery_aaa';
        const isThick = subType === 'battery_d' || subType === 'battery_c';
        const bodyWidth = isSlim ? 30 : isThick ? 52 : 38;
        const bodyHeight = isSlim ? 72 : isThick ? 68 : 74;
        const label = subType === 'battery_aaa' ? 'AAA' : subType === 'battery_d' ? 'D' : subType === 'battery_c' ? 'C' : 'AA';

        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Positive terminal pip */}
            <rect x={(100 - 12) / 2} y={12} width={12} height={6} rx={2} fill="#d4d4d8" stroke="#71717a" strokeWidth={0.8} />
            {/* Battery Body */}
            <rect x={(100 - bodyWidth) / 2} y={17} width={bodyWidth} height={bodyHeight} rx={5} fill="#18181b" stroke="#3f3f46" strokeWidth={1} />
            {/* Golden/Copper Top Collar */}
            <rect x={(100 - bodyWidth) / 2} y={17} width={bodyWidth} height={20} rx={4} fill="url(#duracellGold)" />
            {/* Highlight gloss */}
            <rect x={(100 - bodyWidth) / 2 + 3} y={19} width={4} height={bodyHeight - 4} rx={2} fill="#ffffff" opacity={0.25} />
            {/* Label */}
            <text x={50} y={48} textAnchor="middle" fill="#f4f4f5" fontSize={8} fontWeight="bold" fontFamily="sans-serif">
              {label} 1.5V
            </text>
            <text x={50} y={60} textAnchor="middle" fill="#d97706" fontSize={7} fontWeight="bold">
              ALKALINE
            </text>
            {/* Polarity signs */}
            <text x={50} y={26} textAnchor="middle" fill="#18181b" fontSize={9} fontWeight="900">+</text>
            <text x={50} y={85} textAnchor="middle" fill="#a1a1aa" fontSize={9} fontWeight="900">-</text>
            <defs>
              <linearGradient id="duracellGold" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
            </defs>
          </svg>
        );
      }

      case 'battery_coin':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Metallic Coin Cell */}
            <circle cx={50} cy={50} r={34} fill="url(#silverCoin)" stroke="#94a3b8" strokeWidth={1.5} />
            <circle cx={50} cy={50} r={28} fill="none" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 2" />
            <text x={50} y={42} textAnchor="middle" fill="#334155" fontSize={11} fontWeight="bold" fontFamily="sans-serif">
              +
            </text>
            <text x={50} y={54} textAnchor="middle" fill="#1e293b" fontSize={8} fontWeight="bold">
              CR2032
            </text>
            <text x={50} y={64} textAnchor="middle" fill="#475569" fontSize={7} fontWeight="600">
              3V LITHIUM
            </text>
            <defs>
              <radialGradient id="silverCoin" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </radialGradient>
            </defs>
          </svg>
        );

      case 'battery_18650':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Positive cap */}
            <rect x={44} y={11} width={12} height={5} rx={1.5} fill="#e2e8f0" stroke="#64748b" strokeWidth={0.8} />
            {/* Insulator ring */}
            <rect x={38} y={15} width={24} height={3} rx={1} fill="#ffffff" />
            {/* Blue Li-ion Body */}
            <rect x={32} y={17} width={36} height={72} rx={6} fill="url(#liIonBlue)" stroke="#0369a1" strokeWidth={1} />
            {/* Highlight */}
            <rect x={35} y={19} width={3} height={68} rx={1.5} fill="#ffffff" opacity={0.3} />
            <text x={50} y={46} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">
              18650
            </text>
            <text x={50} y={58} textAnchor="middle" fill="#bae6fd" fontSize={7}>
              3.7V 2600mAh
            </text>
            <text x={50} y={26} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">+</text>
            <text x={50} y={84} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">-</text>
            <defs>
              <linearGradient id="liIonBlue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
          </svg>
        );

      case 'battery_liion_pack':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Blue shrink-wrapped 2-cell block */}
            <rect x={20} y={22} width={60} height={60} rx={6} fill="#0284c7" stroke="#0369a1" strokeWidth={1.5} />
            <line x1={50} y1={22} x2={50} y2={82} stroke="#0369a1" strokeWidth={1.5} strokeDasharray="3 2" />
            {/* Silicone lead wires */}
            <line x1={32} y1={12} x2={32} y2={22} stroke="#ef4444" strokeWidth={3.5} strokeLinecap="round" />
            <line x1={68} y1={12} x2={68} y2={22} stroke="#09090b" strokeWidth={3.5} strokeLinecap="round" />
            {/* JST Balance connector white plug */}
            <rect x={44} y={14} width={12} height={8} rx={1} fill="#f8fafc" stroke="#94a3b8" />
            <text x={32} y={32} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">+</text>
            <text x={68} y={32} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">-</text>
            <text x={50} y={50} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">
              7.4V 2S Li-ion
            </text>
            <text x={50} y={62} textAnchor="middle" fill="#bae6fd" fontSize={7}>
              2200mAh 16.2Wh
            </text>
          </svg>
        );

      case 'battery_lipo':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Silver pouch battery */}
            <rect x={24} y={24} width={52} height={62} rx={4} fill="url(#silverPouch)" stroke="#94a3b8" strokeWidth={1} />
            {/* Yellow Kapton Tape Top Header */}
            <rect x={24} y={24} width={52} height={12} fill="#eab308" opacity={0.85} />
            {/* Red & Black wire leads */}
            <line x1={38} y1={12} x2={38} y2={24} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" />
            <line x1={62} y1={12} x2={62} y2={24} stroke="#0f172a" strokeWidth={3} strokeLinecap="round" />
            <text x={50} y={54} textAnchor="middle" fill="#1e293b" fontSize={8} fontWeight="bold">
              Li-Po 3.7V
            </text>
            <text x={50} y={66} textAnchor="middle" fill="#475569" fontSize={7}>
              1200mAh 1S
            </text>
            <defs>
              <linearGradient id="silverPouch" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
          </svg>
        );

      case 'battery_lead_acid_6v':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Compact Black Block */}
            <rect x={22} y={26} width={56} height={60} rx={4} fill="#09090b" stroke="#3f3f46" strokeWidth={1.2} />
            {/* Spade terminals */}
            <rect x={30} y={16} width={8} height={10} rx={1} fill="#ef4444" stroke="#991b1b" />
            <rect x={62} y={16} width={8} height={10} rx={1} fill="#3b82f6" stroke="#1d4ed8" />
            <text x={34} y={24} textAnchor="middle" fill="#ffffff" fontSize={7.5} fontWeight="bold">+</text>
            <text x={66} y={24} textAnchor="middle" fill="#ffffff" fontSize={7.5} fontWeight="bold">-</text>
            <text x={50} y={48} textAnchor="middle" fill="#ffffff" fontSize={9} fontWeight="bold">
              6V 4.5Ah
            </text>
            <text x={50} y={60} textAnchor="middle" fill="#facc15" fontSize={6.5} fontWeight="bold">
              LEAD-ACID VRLA
            </text>
          </svg>
        );

      case 'battery_lead_acid':
      case 'battery_lead_acid_12v':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Black Block Body */}
            <rect x={18} y={28} width={64} height={58} rx={4} fill="#09090b" stroke="#27272a" strokeWidth={1.2} />
            {/* Bolt Terminals at top */}
            <rect x={26} y={18} width={10} height={10} rx={2} fill="#ef4444" stroke="#991b1b" strokeWidth={1} />
            <rect x={64} y={18} width={10} height={10} rx={2} fill="#0284c7" stroke="#075985" strokeWidth={1} />
            <text x={31} y={25} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">+</text>
            <text x={69} y={25} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">-</text>
            <text x={50} y={50} textAnchor="middle" fill="#ffffff" fontSize={9} fontWeight="bold">
              12V 7Ah
            </text>
            <text x={50} y={62} textAnchor="middle" fill="#facc15" fontSize={6.5} fontWeight="bold">
              LEAD-ACID VRLA
            </text>
          </svg>
        );

      case 'battery_nimh':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* 4 Green cells side-by-side */}
            <rect x={22} y={20} width={13} height={64} rx={3} fill="#16a34a" stroke="#14532d" />
            <rect x={36} y={20} width={13} height={64} rx={3} fill="#22c55e" stroke="#14532d" />
            <rect x={50} y={20} width={13} height={64} rx={3} fill="#16a34a" stroke="#14532d" />
            <rect x={64} y={20} width={13} height={64} rx={3} fill="#22c55e" stroke="#14532d" />
            <rect x={20} y={40} width={60} height={20} fill="#000000" opacity={0.6} />
            <text x={50} y={53} textAnchor="middle" fill="#ffffff" fontSize={7.5} fontWeight="bold">
              Ni-MH 4.8V
            </text>
          </svg>
        );

      case 'battery_nicd':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Industrial Yellow-Orange Cell Body */}
            <rect x={26} y={18} width={48} height={68} rx={6} fill="#ea580c" stroke="#c2410c" strokeWidth={1.5} />
            {/* Positive button top */}
            <rect x={44} y={12} width={12} height={6} rx={2} fill="#d4d4d8" stroke="#71717a" />
            {/* White industrial label strip */}
            <rect x={26} y={42} width={48} height={22} fill="#ffffff" opacity={0.9} />
            <text x={50} y={52} textAnchor="middle" fill="#9a3412" fontSize={7.5} fontWeight="900">
              Ni-Cd 7.2V
            </text>
            <text x={50} y={60} textAnchor="middle" fill="#475569" fontSize={6} fontWeight="bold">
              INDUSTRIAL
            </text>
            <text x={50} y={28} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">+</text>
            <text x={50} y={80} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">-</text>
          </svg>
        );

      case 'battery_solar':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Solar panel frame */}
            <rect x={18} y={20} width={64} height={64} rx={3} fill="#1e3a8a" stroke="#3b82f6" strokeWidth={1.5} />
            {/* Grid wafer lines */}
            <line x1={39} y1={20} x2={39} y2={84} stroke="#93c5fd" strokeWidth={1} />
            <line x1={61} y1={20} x2={61} y2={84} stroke="#93c5fd" strokeWidth={1} />
            <line x1={18} y1={41} x2={82} y2={41} stroke="#93c5fd" strokeWidth={1} />
            <line x1={18} y1={63} x2={82} y2={63} stroke="#93c5fd" strokeWidth={1} />
            {/* Sun flare icon */}
            <circle cx={50} cy={52} r={8} fill="#f59e0b" opacity={0.8} />
            <text x={50} y={78} textAnchor="middle" fill="#ffffff" fontSize={6.5} fontWeight="bold">
              SOLAR 5V
            </text>
          </svg>
        );

      case 'ac_power_supply':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <rect x={18} y={18} width={64} height={64} rx={8} fill="#0f172a" stroke="#06b6d4" strokeWidth={1.5} />
            {/* Sine wave */}
            <path d="M 28 50 Q 38 32, 50 50 T 72 50" fill="none" stroke="#22d3ee" strokeWidth={2.5} strokeLinecap="round" />
            <text x={50} y={32} textAnchor="middle" fill="#38bdf8" fontSize={7.5} fontWeight="bold">
              AC SOURCE
            </text>
            <text x={50} y={72} textAnchor="middle" fill="#e2e8f0" fontSize={8} fontWeight="bold">
              {value}V ~ 50Hz
            </text>
          </svg>
        );

      case 'dc_power_supply':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Clean DC Source box */}
            <rect x={16} y={18} width={68} height={64} rx={6} fill="#09090b" stroke="#10b981" strokeWidth={1.5} />
            <text x={50} y={34} textAnchor="middle" fill="#10b981" fontSize={8} fontWeight="bold">
              DC VOLTAGE SOURCE
            </text>
            {/* Digital readout */}
            <rect x={24} y={40} width={52} height={20} rx={3} fill="#022c22" stroke="#059669" />
            <text x={50} y={54} textAnchor="middle" fill="#34d399" fontSize={11} fontWeight="bold" fontFamily="monospace">
              {value.toFixed(1)}V
            </text>
            {/* Polarities */}
            <circle cx={32} cy={72} r={4.5} fill="#dc2626" />
            <text x={32} y={75} textAnchor="middle" fill="#ffffff" fontSize={7} fontWeight="bold">+</text>
            <circle cx={68} cy={72} r={4.5} fill="#0284c7" />
            <text x={68} y={75} textAnchor="middle" fill="#ffffff" fontSize={7} fontWeight="bold">-</text>
          </svg>
        );

      case 'bench_power_supply':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Benchtop Chassis */}
            <rect x={14} y={16} width={72} height={68} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            {/* Digital Display */}
            <rect x={20} y={22} width={60} height={26} rx={3} fill="#09090b" stroke="#334155" />
            {/* Voltage 7-seg style */}
            <text x={34} y={36} textAnchor="middle" fill="#ef4444" fontSize={9} fontWeight="bold" fontFamily="monospace">
              {value.toFixed(1)}V
            </text>
            {/* Current */}
            <text x={64} y={36} textAnchor="middle" fill="#22c55e" fontSize={8} fontWeight="bold" fontFamily="monospace">
              3.00A
            </text>
            <text x={50} y={45} textAnchor="middle" fill="#94a3b8" fontSize={5.5}>
              LAB BENCH SUPPLY
            </text>
            {/* Knobs */}
            <circle cx={32} cy={64} r={7} fill="#334155" stroke="#64748b" />
            <circle cx={50} cy={64} r={7} fill="#334155" stroke="#64748b" />
            {/* Binding Posts */}
            <circle cx={68} cy={60} r={4.5} fill="#dc2626" />
            <circle cx={68} cy={72} r={4.5} fill="#0284c7" />
          </svg>
        );

      default: // Standard 9V Rectangular block
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Snap terminals at top */}
            <circle cx={38} cy={16} r={5} fill="#cbd5e1" stroke="#64748b" strokeWidth={1} />
            <polygon points="62,11 67,16 67,21 57,21 57,16" fill="#cbd5e1" stroke="#64748b" strokeWidth={1} />
            {/* Rectangular block */}
            <rect x={24} y={20} width={52} height={66} rx={4} fill="#09090b" stroke="#3f3f46" strokeWidth={1.2} />
            {/* Gold collar */}
            <rect x={24} y={20} width={52} height={16} fill="url(#duracellGold)" />
            <text x={38} y={32} textAnchor="middle" fill="#000000" fontSize={8} fontWeight="bold">+</text>
            <text x={62} y={32} textAnchor="middle" fill="#000000" fontSize={8} fontWeight="bold">-</text>
            <text x={50} y={54} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="black">
              9V
            </text>
            <text x={50} y={68} textAnchor="middle" fill="#d97706" fontSize={6.5} fontWeight="bold">
              TRANSISTOR
            </text>
          </svg>
        );
    }
  }

  // -------------------------------------------------------------
  // 2. RESISTORS
  // -------------------------------------------------------------
  if (type === 'resistor') {
    switch (subType) {
      case 'resistor_metal_film':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Axial Wire Leads */}
            <line x1={6} y1={50} x2={28} y2={50} stroke="#94a3b8" strokeWidth={3.5} strokeLinecap="round" />
            <line x1={72} y1={50} x2={94} y2={50} stroke="#94a3b8" strokeWidth={3.5} strokeLinecap="round" />
            {/* Light Cyan/Blue Ceramic Body with bulge ends */}
            <rect x={26} y={36} width={48} height={28} rx={10} fill="#38bdf8" stroke="#0284c7" strokeWidth={1} />
            {/* 5 Bands */}
            <rect x={34} y={36} width={3.5} height={28} fill={bands[0]} />
            <rect x={42} y={36} width={3.5} height={28} fill={bands[1]} />
            <rect x={50} y={36} width={3.5} height={28} fill={bands[2]} />
            <rect x={58} y={36} width={3.5} height={28} fill="#78350f" />
            <rect x={66} y={36} width={3.5} height={28} fill="#78350f" />
            <text x={50} y={76} textAnchor="middle" fill="#38bdf8" fontSize={8} fontWeight="bold" fontFamily="monospace">
              {value >= 1000 ? `${(value / 1000).toFixed(1)}kΩ 1%` : `${value}Ω 1%`}
            </text>
          </svg>
        );

      case 'resistor_wirewound':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <line x1={6} y1={50} x2={24} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            <line x1={76} y1={50} x2={94} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            {/* Green vitreous enamel cylinder */}
            <rect x={22} y={35} width={56} height={30} rx={6} fill="#15803d" stroke="#166534" strokeWidth={1.2} />
            {/* Wire coils texture */}
            <line x1={32} y1={36} x2={36} y2={64} stroke="#14532d" strokeWidth={2} />
            <line x1={42} y1={36} x2={46} y2={64} stroke="#14532d" strokeWidth={2} />
            <line x1={52} y1={36} x2={56} y2={64} stroke="#14532d" strokeWidth={2} />
            <line x1={62} y1={36} x2={66} y2={64} stroke="#14532d" strokeWidth={2} />
            <text x={50} y={53} textAnchor="middle" fill="#ffffff" fontSize={7.5} fontWeight="bold">
              {value}Ω 5W
            </text>
          </svg>
        );

      case 'resistor_aluminum_power':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Gold/Orange Heatsink Body */}
            <rect x={18} y={32} width={64} height={36} rx={4} fill="#ea580c" stroke="#c2410c" strokeWidth={1.2} />
            {/* Cooling fins */}
            <rect x={26} y={32} width={3} height={36} fill="#9a3412" />
            <rect x={36} y={32} width={3} height={36} fill="#9a3412" />
            <rect x={46} y={32} width={3} height={36} fill="#9a3412" />
            <rect x={56} y={32} width={3} height={36} fill="#9a3412" />
            <rect x={66} y={32} width={3} height={36} fill="#9a3412" />
            {/* Lug leads */}
            <rect x={8} y={46} width={10} height={8} rx={2} fill="#e2e8f0" stroke="#64748b" />
            <rect x={82} y={46} width={10} height={8} rx={2} fill="#e2e8f0" stroke="#64748b" />
            <text x={50} y={78} textAnchor="middle" fill="#fed7aa" fontSize={7.5} fontWeight="bold">
              {value}Ω 25W AL
            </text>
          </svg>
        );

      case 'resistor_power_cement':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <line x1={6} y1={50} x2={22} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            <line x1={78} y1={50} x2={94} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            {/* White/grey ceramic cement rectangular block */}
            <rect x={20} y={34} width={60} height={32} rx={2} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1.5} />
            <text x={50} y={48} textAnchor="middle" fill="#1e293b" fontSize={7.5} fontWeight="bold" fontFamily="sans-serif">
              5W {value}ΩJ
            </text>
            <text x={50} y={58} textAnchor="middle" fill="#64748b" fontSize={6} fontWeight="600">
              CEMENT
            </text>
          </svg>
        );

      case 'resistor_smd':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* SMD Pads */}
            <rect x={20} y={36} width={12} height={28} rx={2} fill="#cbd5e1" stroke="#64748b" />
            <rect x={68} y={36} width={12} height={28} rx={2} fill="#cbd5e1" stroke="#64748b" />
            {/* Black Ceramic Body */}
            <rect x={30} y={34} width={40} height={32} rx={2} fill="#09090b" stroke="#27272a" />
            {/* Printed Code */}
            <text x={50} y={53} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="bold" fontFamily="monospace">
              {getSmdCode(value)}
            </text>
            <text x={50} y={78} textAnchor="middle" fill="#94a3b8" fontSize={7}>
              SMD 1206 ({value >= 1000 ? `${value / 1000}kΩ` : `${value}Ω`})
            </text>
          </svg>
        );

      case 'resistor_ldr':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Leads */}
            <line x1={40} y1={64} x2={40} y2={88} stroke="#94a3b8" strokeWidth={3} />
            <line x1={60} y1={64} x2={60} y2={88} stroke="#94a3b8" strokeWidth={3} />
            {/* Orange ceramic head */}
            <circle cx={50} cy={44} r={24} fill="#ea580c" stroke="#9a3412" strokeWidth={1.5} />
            {/* Serpentine CdS track */}
            <path
              d="M 34 38 Q 42 34, 50 38 T 66 38 Q 66 46, 50 46 T 34 46 Q 34 54, 50 54 T 66 54"
              fill="none"
              stroke="#fef08a"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <text x={50} y={20} textAnchor="middle" fill="#fed7aa" fontSize={8} fontWeight="bold">
              LDR ضوئية
            </text>
          </svg>
        );

      case 'resistor_ntc':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <line x1={42} y1={60} x2={42} y2={88} stroke="#94a3b8" strokeWidth={3} />
            <line x1={58} y1={60} x2={58} y2={88} stroke="#94a3b8" strokeWidth={3} />
            {/* Black disc */}
            <circle cx={50} cy={42} r={22} fill="#18181b" stroke="#3f3f46" strokeWidth={1.5} />
            <text x={50} y={40} textAnchor="middle" fill="#f43f5e" fontSize={7} fontWeight="bold">
              NTC
            </text>
            <text x={50} y={50} textAnchor="middle" fill="#e4e4e7" fontSize={6.5} fontWeight="bold">
              10D-11
            </text>
          </svg>
        );

      case 'resistor_ptc':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <line x1={42} y1={60} x2={42} y2={88} stroke="#94a3b8" strokeWidth={3} />
            <line x1={58} y1={60} x2={58} y2={88} stroke="#94a3b8" strokeWidth={3} />
            {/* Green disc */}
            <circle cx={50} cy={42} r={22} fill="#15803d" stroke="#166534" strokeWidth={1.5} />
            <text x={50} y={42} textAnchor="middle" fill="#fef08a" fontSize={7.5} fontWeight="bold">
              PTC
            </text>
            <text x={50} y={52} textAnchor="middle" fill="#ffffff" fontSize={6.5}>
              THERMISTOR
            </text>
          </svg>
        );

      case 'resistor_varistor':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <line x1={42} y1={60} x2={42} y2={88} stroke="#94a3b8" strokeWidth={3} />
            <line x1={58} y1={60} x2={58} y2={88} stroke="#94a3b8" strokeWidth={3} />
            {/* Blue MOV disc */}
            <circle cx={50} cy={42} r={22} fill="#0284c7" stroke="#0369a1" strokeWidth={1.5} />
            <text x={50} y={39} textAnchor="middle" fill="#ffffff" fontSize={7} fontWeight="bold">
              MOV
            </text>
            <text x={50} y={50} textAnchor="middle" fill="#bae6fd" fontSize={6.5}>
              14D471K
            </text>
          </svg>
        );

      case 'resistor_thick_film':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Axial Leads */}
            <line x1={6} y1={50} x2={22} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            <line x1={78} y1={50} x2={94} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            {/* White Alumina Substrate */}
            <rect x={20} y={34} width={60} height={32} rx={2} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} />
            {/* Ruthenium Oxide Thick Film Central Block */}
            <rect x={28} y={38} width={44} height={24} rx={1} fill="#0f172a" />
            <text x={50} y={49} textAnchor="middle" fill="#38bdf8" fontSize={7.5} fontWeight="bold" fontFamily="monospace">
              {value >= 1000 ? `${(value / 1000).toFixed(1)}kΩ` : `${value}Ω`}
            </text>
            <text x={50} y={58} textAnchor="middle" fill="#94a3b8" fontSize={6} fontWeight="600">
              THICK FILM 2%
            </text>
          </svg>
        );

      case 'resistor_thin_film':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <line x1={6} y1={50} x2={22} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            <line x1={78} y1={50} x2={94} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            {/* Deep Blue Precision Planar Ceramic */}
            <rect x={20} y={34} width={60} height={32} rx={3} fill="#1e1b4b" stroke="#4338ca" strokeWidth={1.5} />
            {/* Gold Edge Termination Contacts */}
            <rect x={20} y={34} width={6} height={32} fill="#eab308" />
            <rect x={74} y={34} width={6} height={32} fill="#eab308" />
            {/* Micro Laser Trimming Pattern Grid */}
            <line x1={32} y1={42} x2={68} y2={42} stroke="#818cf8" strokeWidth={1} strokeDasharray="3 2" />
            <line x1={32} y1={58} x2={68} y2={58} stroke="#818cf8" strokeWidth={1} strokeDasharray="3 2" />
            <text x={50} y={48} textAnchor="middle" fill="#ffffff" fontSize={7.5} fontWeight="bold" fontFamily="monospace">
              {value >= 1000 ? `${(value / 1000).toFixed(1)}kΩ` : `${value}Ω`}
            </text>
            <text x={50} y={57} textAnchor="middle" fill="#a5b4fc" fontSize={6} fontWeight="bold">
              THIN FILM 0.1%
            </text>
          </svg>
        );

      case 'resistor_shunt':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Left Copper Current Lug */}
            <rect x={10} y={32} width={18} height={36} rx={3} fill="#b45309" stroke="#78350f" strokeWidth={1.5} />
            <circle cx={19} cy={50} r={4} fill="#fef3c7" stroke="#92400e" />
            {/* Right Copper Current Lug */}
            <rect x={72} y={32} width={18} height={36} rx={3} fill="#b45309" stroke="#78350f" strokeWidth={1.5} />
            <circle cx={81} cy={50} r={4} fill="#fef3c7" stroke="#92400e" />
            {/* Central Manganin Resistance Strip */}
            <rect x={28} y={36} width={44} height={28} rx={2} fill="#334155" stroke="#1e293b" />
            {/* Slots for heat dissipation and calibration */}
            <line x1={42} y1={40} x2={42} y2={60} stroke="#0f172a" strokeWidth={2} />
            <line x1={58} y1={40} x2={58} y2={60} stroke="#0f172a" strokeWidth={2} />
            {/* Kelvin Sensing Pins */}
            <circle cx={34} cy={34} r={2.5} fill="#e2e8f0" />
            <circle cx={66} cy={34} r={2.5} fill="#e2e8f0" />
            <text x={50} y={53} textAnchor="middle" fill="#f8fafc" fontSize={7.5} fontWeight="900" fontFamily="monospace">
              {value}Ω
            </text>
            <text x={50} y={76} textAnchor="middle" fill="#d97706" fontSize={7} fontWeight="bold">
              CURRENT SHUNT 5W
            </text>
          </svg>
        );

      case 'resistor_precision':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Gold-plated axial leads */}
            <line x1={6} y1={50} x2={26} y2={50} stroke="#eab308" strokeWidth={3.5} strokeLinecap="round" />
            <line x1={74} y1={50} x2={94} y2={50} stroke="#eab308" strokeWidth={3.5} strokeLinecap="round" />
            {/* Royal Blue Precision Body */}
            <rect x={24} y={36} width={52} height={28} rx={9} fill="#1d4ed8" stroke="#1e40af" strokeWidth={1.2} />
            {/* 5 Precision Bands */}
            <rect x={32} y={36} width={3} height={28} fill={bands5[0]} />
            <rect x={39} y={36} width={3} height={28} fill={bands5[1]} />
            <rect x={46} y={36} width={3} height={28} fill={bands5[2]} />
            <rect x={53} y={36} width={3} height={28} fill={bands5[3]} />
            <rect x={64} y={36} width={3} height={28} fill={bands5[4]} />
            <text x={50} y={76} textAnchor="middle" fill="#60a5fa" fontSize={7.5} fontWeight="bold" fontFamily="monospace">
              {value >= 1000 ? `${(value / 1000).toFixed(1)}kΩ 0.05%` : `${value}Ω 0.05%`}
            </text>
          </svg>
        );

      case 'resistor_heating':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Heavy Leads */}
            <line x1={6} y1={50} x2={20} y2={50} stroke="#94a3b8" strokeWidth={4} />
            <line x1={80} y1={50} x2={94} y2={50} stroke="#94a3b8" strokeWidth={4} />
            {/* Ceramic Core Frame */}
            <rect x={18} y={32} width={64} height={36} rx={4} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} />
            {/* Coiled Nichrome Heating Spiral */}
            <path
              d="M 24 50 Q 28 36, 32 50 T 40 50 T 48 50 T 56 50 T 64 50 T 72 50 T 76 50"
              fill="none"
              stroke="#ef4444"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* Heat glow indication */}
            <rect x={24} y={36} width={52} height={28} fill="#ef4444" opacity={0.12} rx={2} />
            <text x={50} y={48} textAnchor="middle" fill="#b91c1c" fontSize={7.5} fontWeight="bold">
              {value}Ω 50W
            </text>
            <text x={50} y={58} textAnchor="middle" fill="#ea580c" fontSize={6.5} fontWeight="bold">
              ♨ HEATING ELEMENT
            </text>
          </svg>
        );

      case 'resistor_fusible':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <line x1={6} y1={50} x2={24} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            <line x1={76} y1={50} x2={94} y2={50} stroke="#94a3b8" strokeWidth={3.5} />
            {/* Grey body with FUSE stamp */}
            <rect x={22} y={36} width={56} height={28} rx={7} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1.2} />
            <rect x={32} y={36} width={4} height={28} fill="#dc2626" />
            <rect x={40} y={36} width={4} height={28} fill="#ea580c" />
            <text x={58} y={54} textAnchor="middle" fill="#b91c1c" fontSize={8} fontWeight="900">
              FUSE
            </text>
          </svg>
        );

      default: // Standard Carbon Film (Beige/Tan)
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Axial Wire Leads */}
            <line x1={6} y1={50} x2={26} y2={50} stroke="#94a3b8" strokeWidth={3.5} strokeLinecap="round" />
            <line x1={74} y1={50} x2={94} y2={50} stroke="#94a3b8" strokeWidth={3.5} strokeLinecap="round" />
            {/* Beige/Tan Ceramic Body */}
            <rect x={24} y={36} width={52} height={28} rx={9} fill="#fed7aa" stroke="#d97706" strokeWidth={1} />
            {/* 4 Bands */}
            <rect x={34} y={36} width={4} height={28} fill={bands[0]} />
            <rect x={44} y={36} width={4} height={28} fill={bands[1]} />
            <rect x={54} y={36} width={4} height={28} fill={bands[2]} />
            <rect x={66} y={36} width={4} height={28} fill={bands[3]} />
            <text x={50} y={76} textAnchor="middle" fill="#d97706" fontSize={8} fontWeight="bold" fontFamily="monospace">
              {value >= 1000 ? `${(value / 1000).toFixed(1)}kΩ` : `${value}Ω`}
            </text>
          </svg>
        );
    }
  }

  // -------------------------------------------------------------
  // 3. POTENTIOMETER & TRIMMER
  // -------------------------------------------------------------
  if (type === 'potentiometer') {
    const isTrimmer = subType === 'resistor_trimmer';
    const ratio = state?.potentiometerRatio ?? 0.5;
    const angle = -135 + ratio * 270;

    if (isTrimmer) {
      return (
        <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
          {/* Blue cermet square */}
          <rect x={22} y={22} width={56} height={56} rx={6} fill="#0284c7" stroke="#0369a1" strokeWidth={1.5} />
          {/* Center brass screw */}
          <circle cx={50} cy={50} r={14} fill="#eab308" stroke="#ca8a04" strokeWidth={1.5} />
          <line
            x1={50 - 10 * Math.cos((angle * Math.PI) / 180)}
            y1={50 - 10 * Math.sin((angle * Math.PI) / 180)}
            x2={50 + 10 * Math.cos((angle * Math.PI) / 180)}
            y2={50 + 10 * Math.sin((angle * Math.PI) / 180)}
            stroke="#713f12"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <text x={50} y={88} textAnchor="middle" fill="#bae6fd" fontSize={7} fontWeight="bold">
            TRIMMER {Math.round(value * ratio)}Ω
          </text>
        </svg>
      );
    }

    return (
      <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
        {/* Round blue body */}
        <circle cx={50} cy={46} r={28} fill="#0369a1" stroke="#0284c7" strokeWidth={1.5} />
        {/* 3 terminals at bottom */}
        <rect x={32} y={74} width={6} height={14} rx={1.5} fill="#e2e8f0" stroke="#64748b" />
        <rect x={47} y={74} width={6} height={14} rx={1.5} fill="#eab308" stroke="#ca8a04" />
        <rect x={62} y={74} width={6} height={14} rx={1.5} fill="#e2e8f0" stroke="#64748b" />
        {/* Metal shaft center */}
        <circle cx={50} cy={46} r={16} fill="#94a3b8" stroke="#64748b" strokeWidth={1.5} />
        {/* Rotating slot indicator */}
        <circle cx={50} cy={46} r={12} fill="#cbd5e1" />
        <line
          x1={50}
          y1={46}
          x2={50 + 10 * Math.cos((angle * Math.PI) / 180)}
          y2={46 + 10 * Math.sin((angle * Math.PI) / 180)}
          stroke="#0f172a"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <text x={50} y={20} textAnchor="middle" fill="#38bdf8" fontSize={7.5} fontWeight="bold">
          {Math.round(value * ratio)}Ω ({Math.round(ratio * 100)}%)
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 4. CAPACITORS
  // -------------------------------------------------------------
  if (type === 'capacitor') {
    switch (subType) {
      case 'cap_ceramic':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Leads */}
            <line x1={42} y1={60} x2={42} y2={90} stroke="#94a3b8" strokeWidth={3} />
            <line x1={58} y1={60} x2={58} y2={90} stroke="#94a3b8" strokeWidth={3} />
            {/* Orange Disc */}
            <circle cx={50} cy={42} r={24} fill="#ea580c" stroke="#c2410c" strokeWidth={1.5} />
            <text x={50} y={40} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="bold" fontFamily="monospace">
              104
            </text>
            <text x={50} y={52} textAnchor="middle" fill="#fed7aa" fontSize={7}>
              CERAMIC 100nF
            </text>
          </svg>
        );

      case 'cap_tantalum':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            <line x1={42} y1={62} x2={42} y2={90} stroke="#94a3b8" strokeWidth={3} />
            <line x1={58} y1={62} x2={58} y2={90} stroke="#94a3b8" strokeWidth={3} />
            {/* Yellow teardrop bead */}
            <path
              d="M 50 18 C 30 30, 26 50, 40 60 C 50 64, 60 64, 60 60 C 74 50, 70 30, 50 18 Z"
              fill="#eab308"
              stroke="#ca8a04"
              strokeWidth={1.2}
            />
            <text x={42} y={36} textAnchor="middle" fill="#1e293b" fontSize={9} fontWeight="bold">+</text>
            <text x={50} y={48} textAnchor="middle" fill="#1e293b" fontSize={7} fontWeight="bold">
              10µF 16V
            </text>
          </svg>
        );

      case 'cap_supercap':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Dark blue supercap */}
            <rect x={26} y={20} width={48} height={58} rx={8} fill="#1e3a8a" stroke="#172554" strokeWidth={1.5} />
            <ellipse cx={50} cy={20} rx={24} ry={6} fill="#3b82f6" />
            <text x={50} y={45} textAnchor="middle" fill="#ffffff" fontSize={9} fontWeight="bold">
              5.5V 1.0F
            </text>
            <text x={50} y={58} textAnchor="middle" fill="#93c5fd" fontSize={7} fontWeight="bold">
              SUPERCAPACITOR
            </text>
            <line x1={40} y1={78} x2={40} y2={92} stroke="#94a3b8" strokeWidth={3} />
            <line x1={60} y1={78} x2={60} y2={92} stroke="#94a3b8" strokeWidth={3} />
          </svg>
        );

      case 'cap_polypropylene':
      case 'cap_film':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Red Box Film Capacitor */}
            <rect x={20} y={26} width={60} height={44} rx={3} fill="#b91c1c" stroke="#991b1b" strokeWidth={1.5} />
            <text x={50} y={42} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">
              CBB22
            </text>
            <text x={50} y={54} textAnchor="middle" fill="#fecaca" fontSize={7}>
              400V 105J (1µF)
            </text>
            <line x1={36} y1={70} x2={36} y2={90} stroke="#94a3b8" strokeWidth={3} />
            <line x1={64} y1={70} x2={64} y2={90} stroke="#94a3b8" strokeWidth={3} />
          </svg>
        );

      case 'cap_safety':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Yellow Box Safety Cap */}
            <rect x={20} y={26} width={60} height={44} rx={3} fill="#eab308" stroke="#ca8a04" strokeWidth={1.5} />
            <text x={50} y={42} textAnchor="middle" fill="#1e293b" fontSize={7.5} fontWeight="bold">
              X2 275VAC
            </text>
            <text x={50} y={54} textAnchor="middle" fill="#713f12" fontSize={6.5}>
              104K (0.1µF)
            </text>
            <line x1={36} y1={70} x2={36} y2={90} stroke="#94a3b8" strokeWidth={3} />
            <line x1={64} y1={70} x2={64} y2={90} stroke="#94a3b8" strokeWidth={3} />
          </svg>
        );

      case 'cap_polyester':
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Green Chiclet Drop */}
            <rect x={24} y={24} width={52} height={42} rx={12} fill="#15803d" stroke="#166534" strokeWidth={1.5} />
            <text x={50} y={44} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">
              2A 104J
            </text>
            <text x={50} y={55} textAnchor="middle" fill="#bbf7d0" fontSize={6.5}>
              POLYESTER 100V
            </text>
            <line x1={38} y1={66} x2={38} y2={90} stroke="#94a3b8" strokeWidth={3} />
            <line x1={62} y1={66} x2={62} y2={90} stroke="#94a3b8" strokeWidth={3} />
          </svg>
        );

      default: // Standard Aluminum Electrolytic Can
        return (
          <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
            {/* Can Body */}
            <rect x={28} y={18} width={44} height={60} rx={6} fill="#18181b" stroke="#3f3f46" strokeWidth={1.2} />
            {/* Silver Vent Top */}
            <ellipse cx={50} cy={18} rx={22} ry={5} fill="#d4d4d8" stroke="#71717a" />
            <line x1={44} y1={18} x2={56} y2={18} stroke="#52525b" strokeWidth={1} />
            <line x1={50} y1={14} x2={50} y2={22} stroke="#52525b" strokeWidth={1} />
            {/* Negative stripe */}
            <rect x={60} y={18} width={8} height={60} fill="#f4f4f5" />
            <text x={64} y={35} textAnchor="middle" fill="#000000" fontSize={8} fontWeight="bold">-</text>
            <text x={64} y={50} textAnchor="middle" fill="#000000" fontSize={8} fontWeight="bold">-</text>
            <text x={64} y={65} textAnchor="middle" fill="#000000" fontSize={8} fontWeight="bold">-</text>
            {/* Value print */}
            <text x={44} y={45} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="bold">
              {value}µF
            </text>
            <text x={44} y={56} textAnchor="middle" fill="#a1a1aa" fontSize={7}>
              {element.ratedVoltage || 50}V
            </text>
            {/* Leads */}
            <line x1={40} y1={78} x2={40} y2={92} stroke="#94a3b8" strokeWidth={3} />
            <line x1={56} y1={78} x2={56} y2={92} stroke="#94a3b8" strokeWidth={3} />
          </svg>
        );
    }
  }

  // -------------------------------------------------------------
  // 5. OSCILLOSCOPE (راسم الإشارة الرقمي DSO)
  // -------------------------------------------------------------
  if (type === 'oscilloscope') {
    return (
      <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
        {/* Top Carry Handle */}
        <path d="M 28 14 Q 50 8, 72 14" fill="none" stroke="#64748b" strokeWidth={2.5} strokeLinecap="round" />
        {/* Main Oscilloscope Chassis */}
        <rect x={10} y={16} width={80} height={68} rx={6} fill="#0f172a" stroke="#334155" strokeWidth={1.5} />
        {/* Front Bezel */}
        <rect x={14} y={20} width={72} height={60} rx={4} fill="#1e293b" />
        {/* CRT/LCD Scope Screen (Phosphor Screen) */}
        <rect x={18} y={24} width={46} height={36} rx={2} fill="#022c22" stroke="#064e3b" strokeWidth={1} />
        {/* Graticule Grid Lines (8x8 divisions) */}
        <line x1={18} y1={33} x2={64} y2={33} stroke="#065f46" strokeWidth={0.5} strokeDasharray="1.5 1.5" />
        <line x1={18} y1={42} x2={64} y2={42} stroke="#047857" strokeWidth={0.8} />
        <line x1={18} y1={51} x2={64} y2={51} stroke="#065f46" strokeWidth={0.5} strokeDasharray="1.5 1.5" />
        <line x1={29} y1={24} x2={29} y2={60} stroke="#065f46" strokeWidth={0.5} strokeDasharray="1.5 1.5" />
        <line x1={41} y1={24} x2={41} y2={60} stroke="#047857" strokeWidth={0.8} />
        <line x1={53} y1={24} x2={53} y2={60} stroke="#065f46" strokeWidth={0.5} strokeDasharray="1.5 1.5" />
        {/* Real-time Waveform Trace */}
        <path
          d="M 18 42 Q 24 28, 29 42 T 41 42 T 53 42 T 64 42"
          fill="none"
          stroke="#34d399"
          strokeWidth={1.8}
          strokeLinecap="round"
          filter="drop-shadow(0 0 2px #10b981)"
        />
        {/* Digital On-Screen Indicators */}
        <text x={20} y={30} fill="#6ee7b7" fontSize={5} fontFamily="monospace" fontWeight="bold">CH1: 5V</text>
        <text x={48} y={30} fill="#6ee7b7" fontSize={5} fontFamily="monospace" fontWeight="bold">50Hz</text>
        {/* Right Control Knobs Panel */}
        <circle cx={74} cy={30} r={5} fill="#334155" stroke="#94a3b8" strokeWidth={1} />
        <line x1={74} y1={30} x2={77} y2={28} stroke="#f8fafc" strokeWidth={1.2} />
        <circle cx={74} cy={44} r={5} fill="#334155" stroke="#94a3b8" strokeWidth={1} />
        <line x1={74} y1={44} x2={76} y2={47} stroke="#f8fafc" strokeWidth={1.2} />
        <circle cx={74} cy={54} r={2} fill="#10b981" />
        {/* Probe BNC Terminals at Bottom */}
        <circle cx={28} cy={70} r={4.5} fill="#eab308" stroke="#ca8a04" strokeWidth={1} />
        <circle cx={28} cy={70} r={2} fill="#09090b" />
        <text x={28} y={63} textAnchor="middle" fill="#facc15" fontSize={5.5} fontWeight="bold">CH1</text>
        <circle cx={54} cy={70} r={4.5} fill="#475569" stroke="#334155" strokeWidth={1} />
        <circle cx={54} cy={70} r={2} fill="#09090b" />
        <text x={54} y={63} textAnchor="middle" fill="#94a3b8" fontSize={5.5} fontWeight="bold">GND</text>
        <text x={74} y={72} textAnchor="middle" fill="#38bdf8" fontSize={6} fontWeight="bold">DSO</text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 6. TRANSISTORS (الترانزستورات NPN و PNP)
  // -------------------------------------------------------------
  if (type === 'transistor_npn' || type === 'transistor_pnp') {
    const isNpn = type === 'transistor_npn';
    const label = isNpn ? 'BC547 NPN' : 'BC557 PNP';

    return (
      <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-md">
        {/* TO-92 Package: Black D-shaped Epoxy Housing */}
        <path
          d="M 28 25 C 28 15, 72 15, 72 25 L 72 65 C 72 75, 28 75, 28 65 Z"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth={1.5}
        />
        {/* Flat Chamfer Face Accent */}
        <rect x={28} y={35} width={44} height={20} fill="#27272a" />
        {/* Metal Leads (B, C, E) */}
        {/* Base Lead Left */}
        <line x1={15} y1={48} x2={28} y2={48} stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" />
        {/* Collector Lead Top Right */}
        <line x1={72} y1={25} x2={85} y2={25} stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" />
        {/* Emitter Lead Bottom Right */}
        <line x1={72} y1={68} x2={85} y2={68} stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" />

        {/* Silkscreen text */}
        <text x={50} y={44} textAnchor="middle" fill="#ffffff" fontSize={6.5} fontWeight="bold" fontFamily="monospace">
          {label}
        </text>
        <text x={50} y={54} textAnchor="middle" fill="#a1a1aa" fontSize={5.5}>
          {isNpn ? 'BJT NPN' : 'BJT PNP'}
        </text>

        {/* Pin labels */}
        <text x={18} y={42} textAnchor="middle" fill="#38bdf8" fontSize={7} fontWeight="bold">B</text>
        <text x={82} y={18} textAnchor="middle" fill="#f43f5e" fontSize={7} fontWeight="bold">C</text>
        <text x={82} y={80} textAnchor="middle" fill="#10b981" fontSize={7} fontWeight="bold">E</text>

        {/* Schematic Arrow Indicator */}
        <g transform="translate(50, 72)">
          {isNpn ? (
            /* Arrow pointing OUT for NPN */
            <path d="M -4 -2 L 4 2 M 0 3 L 4 2 L 3 -1" fill="none" stroke="#34d399" strokeWidth={1.2} />
          ) : (
            /* Arrow pointing IN for PNP */
            <path d="M 4 2 L -4 -2 M -3 -3 L -4 -2 L 0 -1" fill="none" stroke="#f43f5e" strokeWidth={1.2} />
          )}
        </g>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 7. GREEN ELECTRONICS EXPERIMENT BOARD (لوحة التجارب الخضراء)
  // -------------------------------------------------------------
  if (type === 'board_green') {
    return (
      <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-lg">
        {/* Dark Green Matte PCB Substrate */}
        <rect x={8} y={10} width={84} height={80} rx={6} fill="#14532d" stroke="#166534" strokeWidth={2} />
        {/* Grid pattern / trace lines */}
        <rect x={12} y={14} width={76} height={72} rx={4} fill="#15803d" opacity={0.6} />
        {/* Gold copper traces */}
        <line x1={18} y1={25} x2={40} y2={25} stroke="#eab308" strokeWidth={1.5} opacity={0.8} />
        <line x1={18} y1={75} x2={40} y2={75} stroke="#eab308" strokeWidth={1.5} opacity={0.8} />
        <line x1={60} y1={25} x2={82} y2={25} stroke="#eab308" strokeWidth={1.5} opacity={0.8} />
        <line x1={60} y1={75} x2={82} y2={75} stroke="#eab308" strokeWidth={1.5} opacity={0.8} />
        <line x1={40} y1={25} x2={40} y2={75} stroke="#eab308" strokeWidth={1} strokeDasharray="3 2" opacity={0.6} />
        <line x1={60} y1={25} x2={60} y2={75} stroke="#eab308" strokeWidth={1} strokeDasharray="3 2" opacity={0.6} />

        {/* Mounting screw holes in corners */}
        <circle cx={14} cy={16} r={2.5} fill="#09090b" stroke="#ca8a04" strokeWidth={0.8} />
        <circle cx={86} cy={16} r={2.5} fill="#09090b" stroke="#ca8a04" strokeWidth={0.8} />
        <circle cx={14} cy={84} r={2.5} fill="#09090b" stroke="#ca8a04" strokeWidth={0.8} />
        <circle cx={86} cy={84} r={2.5} fill="#09090b" stroke="#ca8a04" strokeWidth={0.8} />

        {/* Gold ENIG Contact Pads */}
        {/* Left Screw Terminal Block */}
        <rect x={12} y={20} width={8} height={10} rx={1} fill="#09090b" stroke="#ca8a04" strokeWidth={1} />
        <circle cx={16} cy={25} r={2} fill="#eab308" />
        <rect x={12} y={70} width={8} height={10} rx={1} fill="#09090b" stroke="#ca8a04" strokeWidth={1} />
        <circle cx={16} cy={75} r={2} fill="#eab308" />

        {/* Right Screw Terminal Block */}
        <rect x={80} y={20} width={8} height={10} rx={1} fill="#09090b" stroke="#ca8a04" strokeWidth={1} />
        <circle cx={84} cy={25} r={2} fill="#eab308" />
        <rect x={80} y={70} width={8} height={10} rx={1} fill="#09090b" stroke="#ca8a04" strokeWidth={1} />
        <circle cx={84} cy={75} r={2} fill="#eab308" />

        {/* Top/Bottom Test Pins */}
        <circle cx={38} cy={20} r={2.5} fill="#facc15" stroke="#a16207" strokeWidth={0.8} />
        <circle cx={62} cy={20} r={2.5} fill="#facc15" stroke="#a16207" strokeWidth={0.8} />
        <circle cx={38} cy={80} r={2.5} fill="#facc15" stroke="#a16207" strokeWidth={0.8} />
        <circle cx={62} cy={80} r={2.5} fill="#facc15" stroke="#a16207" strokeWidth={0.8} />

        {/* Central Silkscreen Branding */}
        <rect x={24} y={38} width={52} height={24} rx={2} fill="#052e16" stroke="#15803d" />
        <text x={50} y={48} textAnchor="middle" fill="#ffffff" fontSize={5.5} fontWeight="bold" fontFamily="sans-serif">
          YEMEN MECHATRONICS
        </text>
        <text x={50} y={56} textAnchor="middle" fill="#86efac" fontSize={5} fontWeight="bold">
          LAB BOARD
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 8. MULTIMETER (الملتيميتر الرقمي الأصفر)
  // -------------------------------------------------------------
  if (type === 'multimeter') {
    return (
      <svg width={width} height={height} viewBox="0 0 100 100" className="drop-shadow-lg">
        {/* Yellow Holster Casing */}
        <rect x={14} y={10} width={72} height={80} rx={8} fill="#eab308" stroke="#ca8a04" strokeWidth={1.8} />
        {/* Bezel inner dark border */}
        <rect x={18} y={14} width={64} height={72} rx={6} fill="#1e293b" />
        {/* LCD Display */}
        <rect x={24} y={18} width={52} height={20} rx={3} fill="#a3e635" opacity={0.2} stroke="#4d7c0f" strokeWidth={0.8} />
        <rect x={24} y={18} width={52} height={20} rx={3} fill="#09090b" opacity={0.9} />
        <text x={50} y={32} textAnchor="middle" fill="#a3e635" fontSize={11} fontWeight="bold" fontFamily="monospace">
          {element.value ? `${element.value}` : '0.00'}
        </text>
        {/* Rotary Selector Dial */}
        <circle cx={50} cy={52} r={14} fill="#0f172a" stroke="#475569" strokeWidth={1.5} />
        <circle cx={50} cy={52} r={10} fill="#334155" />
        {/* Dial Pointer Line */}
        <line x1={50} y1={52} x2={50} y2={42} stroke="#facc15" strokeWidth={2} strokeLinecap="round" />
        {/* Dial range dots */}
        <circle cx={50} cy={37} r={1} fill="#ffffff" />
        <circle cx={62} cy={44} r={1} fill="#38bdf8" />
        <circle cx={62} cy={60} r={1} fill="#4ade80" />
        <circle cx={38} cy={60} r={1} fill="#fb7185" />
        <circle cx={38} cy={44} r={1} fill="#fbbf24" />
        {/* Bottom Jacks: 10A, COM, VΩmA */}
        <circle cx={32} cy={74} r={3.5} fill="#ef4444" stroke="#991b1b" strokeWidth={0.8} />
        <circle cx={50} cy={74} r={3.5} fill="#09090b" stroke="#475569" strokeWidth={0.8} />
        <circle cx={68} cy={74} r={3.5} fill="#ef4444" stroke="#991b1b" strokeWidth={0.8} />
        <text x={32} y={83} textAnchor="middle" fill="#fca5a5" fontSize={4} fontWeight="bold">10A</text>
        <text x={50} y={83} textAnchor="middle" fill="#cbd5e1" fontSize={4} fontWeight="bold">COM</text>
        <text x={68} y={83} textAnchor="middle" fill="#fca5a5" fontSize={4} fontWeight="bold">VΩmA</text>
      </svg>
    );
  }

  // Fallback generic renderer
  return null;
};
