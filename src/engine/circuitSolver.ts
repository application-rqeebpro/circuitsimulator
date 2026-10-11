/**
 * Electrical Circuit Simulation Engine
 * Modified Nodal Analysis (MNA) & DC Circuit Solver
 * Yemeni Mechatronics Academy - مختبر الدوائر الكهربائية
 */

export type ComponentType =
  | 'battery'          // مصدر جهد مستمر (بطارية/مصدر تيار)
  | 'dc_power_supply'  // وحدة تغذية مختبرية متغيرة
  | 'ac_power_supply'  // مصدر جهد متردد AC
  | 'resistor'         // مقاومة كربونية / معدنية / قدرة
  | 'potentiometer'    // مقاومة متغيرة
  | 'lamp'             // مصباح كهربائي
  | 'switch'           // مفتاح كهربائي
  | 'push_button'      // زر ضاغط لحظي
  | 'fuse'             // فيوز حماية
  | 'diode'            // دايود سيليكون
  | 'led'              // دايود مشع للضوء
  | 'capacitor'        // مكثف كهربائي (إلكتروليتي / سيراميك / فيلم / فائق)
  | 'inductor'         // ملف حثي
  | 'ammeter'          // مقياس تيار رقمي
  | 'voltmeter'        // مقياس جهد رقمي
  | 'multimeter'       // ملتيميتر شامل
  | 'oscilloscope';    // راسم الإشارة (أوسيلوسكوب رقمي)

export interface Terminal {
  id: string;          // e.g. 't1', 't2'
  label: string;       // e.g. '+', '-', 'A', 'B'
  relX: number;        // relative X offset on component icon
  relY: number;        // relative Y offset on component icon
}

export interface OscilloscopeReading {
  vDiff: number;
  vPeak: number;
  vRms: number;
  frequency: number;
  waveType: 'sine' | 'dc' | 'zero';
}

export interface CircuitElement {
  id: string;
  type: ComponentType;
  subType?: string;    // specific model e.g. 'battery_aa', 'battery_coin', 'resistor_smd', 'cap_electrolytic'
  name: string;        // e.g. "R1 (1kΩ)"
  nameEn?: string;     // e.g. "Carbon Film Resistor"
  x: number;
  y: number;
  rotation: number;    // 0, 90, 180, 270
  value: number;       // primary value (Ohms, Volts, Farads, Henry, Amps rating)
  unit: string;        // Ω, V, F, H, A
  ratedPower?: number; // Watts (for resistors)
  ratedVoltage?: number; // Volts (for capacitors/battery)
  tolerancePct?: number; // %
  internalResistance?: number; // Ohms (for batteries)
  isPolarized?: boolean; // for electrolytic/tantalum caps
  dielectricType?: string; // for capacitors
  state?: {
    isOpen?: boolean;        // for switches
    isBlown?: boolean;       // for fuses / fusible resistors
    potentiometerRatio?: number; // 0 to 1
    ambientLightLux?: number;    // for LDR (0 to 1000)
    temperatureC?: number;       // for NTC/PTC thermistors
    chargeVoltage?: number;      // for capacitors (V)
    energyStoredJoules?: number; // for capacitors (J)
    frequencyHz?: number;        // for AC sources (Hz)
    color?: string;          // for LED (red, green, blue, yellow)
    mode?: 'voltage' | 'current' | 'resistance'; // for multimeter
    timePerDivMs?: number;   // for oscilloscope (ms/div)
    voltsPerDiv?: number;    // for oscilloscope (V/div)
    coupling?: 'dc' | 'ac' | 'gnd'; // for oscilloscope
  };
  terminals: Terminal[];
}

export interface Wire {
  id: string;
  fromCompId: string;
  fromTermId: string;
  toCompId: string;
  toTermId: string;
  color?: string;
}

export interface SimulationResult {
  nodeVoltages: Record<number, number>;
  elementCurrents: Record<string, number>; // in Amperes
  elementVoltages: Record<string, number>; // in Volts
  elementPowers: Record<string, number>;   // in Watts
  totalCurrent: number;                    // in Amperes from main source
  totalPower: number;                      // in Watts
  shortCircuit: boolean;
  openCircuit: boolean;
  blownFuses: string[];
  warnings: string[];
  errors: string[];
  meterReadings: {
    ammeters: Record<string, { value: number; unit: string; isCorrectlyConnected: boolean; warning?: string }>;
    voltmeters: Record<string, { value: number; unit: string; isCorrectlyConnected: boolean; warning?: string }>;
    multimeters: Record<string, { value: number; unit: string; mode: string }>;
    oscilloscopes: Record<string, OscilloscopeReading>;
  };
}

/**
 * Union-Find Disjoint Set to identify electrical nodes from connected terminals
 */
class DisjointSet {
  parent: Record<string, string> = {};

  find(x: string): string {
    if (!this.parent[x]) this.parent[x] = x;
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: string, y: string) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX !== rootY) {
      this.parent[rootX] = rootY;
    }
  }
}

/**
 * Solve a linear system A * x = b using Gaussian elimination with partial pivoting
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  if (n === 0) return [];

  // Make copies
  const M = A.map(row => [...row]);
  const y = [...b];

  for (let p = 0; p < n; p++) {
    // Find pivot
    let max = Math.abs(M[p][p]);
    let maxRow = p;
    for (let i = p + 1; i < n; i++) {
      if (Math.abs(M[i][p]) > max) {
        max = Math.abs(M[i][p]);
        maxRow = i;
      }
    }

    if (max < 1e-12) {
      // Singular or near-singular matrix
      return null;
    }

    // Swap rows
    const tempRow = M[p];
    M[p] = M[maxRow];
    M[maxRow] = tempRow;
    const tempB = y[p];
    y[p] = y[maxRow];
    y[maxRow] = tempB;

    // Eliminate below
    for (let i = p + 1; i < n; i++) {
      const alpha = M[i][p] / M[p][p];
      y[i] -= alpha * y[p];
      for (let j = p; j < n; j++) {
        M[i][j] -= alpha * M[p][j];
      }
    }
  }

  // Back-substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += M[i][j] * x[j];
    }
    x[i] = (y[i] - sum) / M[i][i];
  }

  return x;
}

/**
 * Main Circuit Solver
 */
export function solveCircuit(
  elements: CircuitElement[],
  wires: Wire[],
  knownBlownFuses: Set<string> = new Set()
): SimulationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const blownFuses: string[] = Array.from(knownBlownFuses);

  // Default empty result
  const defaultResult: SimulationResult = {
    nodeVoltages: {},
    elementCurrents: {},
    elementVoltages: {},
    elementPowers: {},
    totalCurrent: 0,
    totalPower: 0,
    shortCircuit: false,
    openCircuit: true,
    blownFuses,
    warnings,
    errors,
    meterReadings: {
      ammeters: {},
      voltmeters: {},
      multimeters: {},
      oscilloscopes: {},
    },
  };

  if (elements.length === 0 || wires.length === 0) {
    warnings.push('الدائرة فارغة أو لا توجد أسلاك توصيل.');
    return defaultResult;
  }

  // Step 1: Disjoint Set for electrical nodes
  const ds = new DisjointSet();
  const terminalKey = (compId: string, termId: string) => `${compId}:${termId}`;

  // Register all terminals
  elements.forEach(el => {
    el.terminals.forEach(t => {
      ds.find(terminalKey(el.id, t.id));
    });
  });

  // Connect terminals via wires
  wires.forEach(w => {
    ds.union(terminalKey(w.fromCompId, w.fromTermId), terminalKey(w.toCompId, w.toTermId));
  });

  // Collect distinct connected nets (nodes)
  const netRepresentatives = new Set<string>();
  elements.forEach(el => {
    el.terminals.forEach(t => {
      netRepresentatives.add(ds.find(terminalKey(el.id, t.id)));
    });
  });

  // Map net root to integer node index (0 is Ground)
  const netToNodeIndex: Record<string, number> = {};
  let nextNodeIdx = 1;

  // Find a ground node: Prefer the negative terminal of the first voltage source
  let groundRoot: string | null = null;
  const voltageSources = elements.filter(
    e => e.type === 'battery' || e.type === 'dc_power_supply' || e.type === 'ac_power_supply'
  );

  if (voltageSources.length > 0) {
    const primarySrc = voltageSources[0];
    const negTerm = primarySrc.terminals.find(t => t.id === 't2' || t.label === '-') || primarySrc.terminals[1];
    if (negTerm) {
      groundRoot = ds.find(terminalKey(primarySrc.id, negTerm.id));
    }
  }

  // If no voltage source ground found, pick the first net as node 0
  const allNets = Array.from(netRepresentatives);
  if (!groundRoot && allNets.length > 0) {
    groundRoot = allNets[0];
  }

  if (groundRoot) {
    netToNodeIndex[groundRoot] = 0; // Reference node
  }

  allNets.forEach(net => {
    if (net !== groundRoot) {
      netToNodeIndex[net] = nextNodeIdx++;
    }
  });

  const numNonGroundNodes = nextNodeIdx - 1; // Nodes 1 .. numNonGroundNodes

  // Helper to get node index of an element's terminal
  const getNodeOfTerminal = (compId: string, termId: string): number => {
    const root = ds.find(terminalKey(compId, termId));
    return netToNodeIndex[root] ?? 0;
  };

  // Check if voltage sources exist
  if (voltageSources.length === 0) {
    warnings.push('لا يوجد مصدر طاقة (بطارية أو وحدة تغذية) في الدائرة.');
    return defaultResult;
  }

  // Check for short circuits directly across voltage sources
  let isDirectShortCircuit = false;
  voltageSources.forEach(src => {
    const t1 = src.terminals[0]?.id || 't1';
    const t2 = src.terminals[1]?.id || 't2';
    const n1 = getNodeOfTerminal(src.id, t1);
    const n2 = getNodeOfTerminal(src.id, t2);
    if (n1 === n2 && wires.length > 0) {
      isDirectShortCircuit = true;
    }
  });

  if (isDirectShortCircuit) {
    errors.push('تحذير شديد: حدث قصر كهربائي مباشر (Short Circuit) بين طرفي مصدر الجهد! الدائرة مفصولة لحماية المكونات.');
    return {
      ...defaultResult,
      shortCircuit: true,
      openCircuit: false,
      errors,
    };
  }

  // Step 2: Formulate MNA (Modified Nodal Analysis)
  // Non-ground nodes: 1 .. N
  // Independent voltage sources: M sources -> additional M equations
  // Size of MNA matrix: (N + M) x (N + M)
  const vSourceList: { element: CircuitElement; nPos: number; nNeg: number; voltage: number }[] = [];

  voltageSources.forEach(src => {
    const posTerm = src.terminals.find(t => t.id === 't1' || t.label === '+') || src.terminals[0];
    const negTerm = src.terminals.find(t => t.id === 't2' || t.label === '-') || src.terminals[1];
    const nPos = getNodeOfTerminal(src.id, posTerm.id);
    const nNeg = getNodeOfTerminal(src.id, negTerm.id);
    vSourceList.push({
      element: src,
      nPos,
      nNeg,
      voltage: src.value || 0,
    });
  });

  const M = vSourceList.length;
  const N = numNonGroundNodes;
  const matrixSize = N + M;

  if (matrixSize === 0) {
    return defaultResult;
  }

  const G: number[][] = Array.from({ length: matrixSize }, () => new Array(matrixSize).fill(0));
  const I: number[] = new Array(matrixSize).fill(0);

  // Helper to add conductance between two nodes
  const addConductance = (nodeA: number, nodeB: number, g: number) => {
    if (nodeA > 0) {
      G[nodeA - 1][nodeA - 1] += g;
    }
    if (nodeB > 0) {
      G[nodeB - 1][nodeB - 1] += g;
    }
    if (nodeA > 0 && nodeB > 0) {
      G[nodeA - 1][nodeB - 1] -= g;
      G[nodeB - 1][nodeA - 1] -= g;
    }
  };

  // Helper to calculate effective resistance based on subtype
  const getEffectiveResistance = (el: CircuitElement): number => {
    if (el.state?.isBlown) return 1e9; // Blown fusible resistor

    if (el.subType === 'resistor_ldr') {
      const lux = el.state?.ambientLightLux ?? 500;
      return Math.max(50, Math.round(100 + 400000 / (1 + lux / 8)));
    }
    if (el.subType === 'resistor_ntc') {
      const tempC = el.state?.temperatureC ?? 25;
      const tKelvin = 273.15 + tempC;
      const bConstant = 3950;
      const r0 = el.value || 10000;
      return Math.max(10, Math.round(r0 * Math.exp(bConstant * (1 / tKelvin - 1 / 298.15))));
    }
    if (el.subType === 'resistor_ptc') {
      const tempC = el.state?.temperatureC ?? 25;
      const r0 = el.value || 1000;
      return Math.max(10, Math.round(r0 * (1 + 0.04 * (tempC - 25))));
    }
    if (el.subType === 'resistor_varistor') {
      return 1e6; // Normal un-clamped state
    }
    return Math.max(el.value || 1000, 1e-4);
  };

  // Process passive and active components
  elements.forEach(el => {
    const t1 = el.terminals[0]?.id || 't1';
    const t2 = el.terminals[1]?.id || 't2';
    const nA = getNodeOfTerminal(el.id, t1);
    const nB = getNodeOfTerminal(el.id, t2);

    switch (el.type) {
      case 'battery':
      case 'dc_power_supply':
      case 'ac_power_supply': {
        // Internal resistance is modeled correctly in series via MNA source row below
        break;
      }
      case 'resistor': {
        const rVal = getEffectiveResistance(el);
        addConductance(nA, nB, 1 / rVal);
        break;
      }
      case 'potentiometer': {
        // Effective resistance based on ratio
        const ratio = el.state?.potentiometerRatio ?? 0.5;
        const rEffective = Math.max(el.value * Math.max(ratio, 0.001), 1e-3);
        addConductance(nA, nB, 1 / rEffective);
        break;
      }
      case 'lamp': {
        // Lamp with nominal resistance (default 50Ω if 0)
        const rLamp = Math.max(el.value || 50, 1);
        addConductance(nA, nB, 1 / rLamp);
        break;
      }
      case 'switch':
      case 'push_button': {
        const isOpen = el.state?.isOpen ?? false;
        // If open, huge resistance 10^9; if closed, tiny 10^-4
        const rSwitch = isOpen ? 1e9 : 1e-4;
        addConductance(nA, nB, 1 / rSwitch);
        break;
      }
      case 'fuse': {
        const isBlown = knownBlownFuses.has(el.id) || el.state?.isBlown;
        const rFuse = isBlown ? 1e9 : 1e-4;
        addConductance(nA, nB, 1 / rFuse);
        break;
      }
      case 'ammeter': {
        // Ideal ammeter: almost 0 resistance (1e-4)
        addConductance(nA, nB, 1 / 1e-4);
        break;
      }
      case 'voltmeter': {
        // Ideal voltmeter: high resistance (10^7)
        addConductance(nA, nB, 1 / 1e7);
        break;
      }
      case 'multimeter': {
        const mode = el.state?.mode || 'voltage';
        if (mode === 'current') {
          addConductance(nA, nB, 1 / 1e-4);
        } else if (mode === 'resistance') {
          addConductance(nA, nB, 1 / 1e5);
        } else {
          addConductance(nA, nB, 1 / 1e7);
        }
        break;
      }
      case 'oscilloscope': {
        // High input impedance probe (10MΩ)
        addConductance(nA, nB, 1 / 1e7);
        break;
      }
      case 'diode': {
        // Simplified piecewise linear diode (forward threshold 0.7V)
        addConductance(nA, nB, 1 / 100);
        break;
      }
      case 'led': {
        // LED forward threshold ~ 2.0V
        addConductance(nA, nB, 1 / 150);
        break;
      }
      case 'capacitor': {
        // DC steady state: capacitor acts as open circuit (1e9 Ω)
        addConductance(nA, nB, 1 / 1e9);
        break;
      }
      case 'inductor': {
        // DC steady state: inductor acts as short circuit (1e-3 Ω)
        addConductance(nA, nB, 1 / 1e-3);
        break;
      }
    }
  });

  // Voltage source constraints in MNA:
  // For k-th voltage source: V(nPos) - V(nNeg) = V_k
  // and contributes to KCL equations
  vSourceList.forEach((src, idx) => {
    const row = N + idx;
    const { nPos, nNeg, voltage } = src;

    if (nPos > 0) {
      G[row][nPos - 1] = 1;
      G[nPos - 1][row] = 1;
    }
    if (nNeg > 0) {
      G[row][nNeg - 1] = -1;
      G[nNeg - 1][row] = -1;
    }

    // Realistic Thévenin internal resistance: V(nPos) - V(nNeg) - R_int * I_src = V_source
    const rInt = src.element.internalResistance || 0;
    if (rInt > 0) {
      G[row][row] = -rInt;
    }

    I[row] = voltage;
  });

  // Solve system
  const solution = solveLinearSystem(G, I);
  if (!solution) {
    errors.push('تعذر حل معادلات الدائرة: يرجى التحقق من وجود عقد معلقة أو تضارب في مصادر الجهد.');
    return {
      ...defaultResult,
      errors,
    };
  }

  // Extract node voltages
  const nodeVoltages: Record<number, number> = { 0: 0 };
  for (let i = 1; i <= N; i++) {
    nodeVoltages[i] = solution[i - 1];
  }

  // Calculate component voltages and currents
  const elementVoltages: Record<string, number> = {};
  const elementCurrents: Record<string, number> = {};
  const elementPowers: Record<string, number> = {};
  let totalCurrent = 0;
  let totalPower = 0;

  elements.forEach(el => {
    const t1 = el.terminals[0]?.id || 't1';
    const t2 = el.terminals[1]?.id || 't2';
    const nA = getNodeOfTerminal(el.id, t1);
    const nB = getNodeOfTerminal(el.id, t2);

    const vA = nodeVoltages[nA] ?? 0;
    const vB = nodeVoltages[nB] ?? 0;
    const vDiff = vA - vB;
    elementVoltages[el.id] = Math.abs(vDiff) < 1e-6 ? 0 : vDiff;

    let current = 0;

    switch (el.type) {
      case 'battery':
      case 'dc_power_supply':
      case 'ac_power_supply': {
        // Find index in vSourceList
        const sIdx = vSourceList.findIndex(s => s.element.id === el.id);
        if (sIdx !== -1) {
          // Source current from MNA solution vector
          current = Math.abs(solution[N + sIdx]);
          totalCurrent += current;
          totalPower += current * el.value;
        }
        break;
      }
      case 'resistor': {
        const rVal = getEffectiveResistance(el);
        current = vDiff / rVal;
        const pDiss = Math.abs(vDiff * current);
        // Check fusible resistor
        if (el.subType === 'resistor_fusible' && el.ratedPower && pDiss > el.ratedPower && !knownBlownFuses.has(el.id)) {
          blownFuses.push(el.id);
          warnings.push(`احترقت المقاومة الفيوزية (${el.name}) بسبب تجاوز القدرة المقننة (${pDiss.toFixed(2)}W > ${el.ratedPower}W).`);
        }
        break;
      }
      case 'potentiometer': {
        const ratio = el.state?.potentiometerRatio ?? 0.5;
        const rEffective = Math.max(el.value * Math.max(ratio, 0.001), 1e-3);
        current = vDiff / rEffective;
        break;
      }
      case 'lamp': {
        const rLamp = Math.max(el.value || 50, 1);
        current = vDiff / rLamp;
        break;
      }
      case 'switch':
      case 'push_button': {
        const isOpen = el.state?.isOpen ?? false;
        current = isOpen ? 0 : vDiff / 1e-4;
        break;
      }
      case 'fuse': {
        const isBlown = knownBlownFuses.has(el.id) || el.state?.isBlown;
        current = isBlown ? 0 : vDiff / 1e-4;
        // Check if current exceeds rating
        const rating = el.value || 0.5; // default 0.5A
        if (!isBlown && Math.abs(current) > rating) {
          blownFuses.push(el.id);
          warnings.push(`احترق الفيوز (${el.name}) لتجاوز التيار المقنن (${(Math.abs(current) * 1000).toFixed(1)} mA > ${(rating * 1000).toFixed(1)} mA).`);
        }
        break;
      }
      case 'ammeter': {
        current = vDiff / 1e-4;
        break;
      }
      case 'voltmeter': {
        current = vDiff / 1e7;
        break;
      }
      case 'multimeter': {
        const mode = el.state?.mode || 'voltage';
        if (mode === 'current') {
          current = vDiff / 1e-4;
        } else {
          current = vDiff / 1e7;
        }
        break;
      }
      case 'diode': {
        // Forward biased if vDiff > 0.6V
        if (vDiff > 0.65) {
          current = (vDiff - 0.65) / 10;
        } else {
          current = 0;
        }
        break;
      }
      case 'led': {
        // Forward biased if vDiff > 1.8V
        if (vDiff > 1.8) {
          current = (vDiff - 1.8) / 25;
        } else {
          current = 0;
        }
        break;
      }
      case 'capacitor': {
        current = 0; // DC steady state
        // Track stored voltage and check polarity
        const capFarads = (el.value || 100) * 1e-6; // assume µF nominal
        const energyJ = 0.5 * capFarads * Math.pow(vDiff, 2);
        el.state = {
          ...el.state,
          chargeVoltage: Number(vDiff.toFixed(2)),
          energyStoredJoules: Number(energyJ.toExponential(3)),
        };

        if (el.isPolarized && vDiff < -0.3) {
          warnings.push(`تحذير قطبية: المكثف القطبي (${el.name}) متصل بقطبية معكوسة (${vDiff.toFixed(2)}V)! في الواقع قد يسخن أو ينفجر.`);
        }
        if (el.ratedVoltage && Math.abs(vDiff) > el.ratedVoltage) {
          warnings.push(`تحذير أمان: جهد المكثف (${el.name}) تجاوز الجهد الاسمي (${Math.abs(vDiff).toFixed(1)}V > ${el.ratedVoltage}V)!`);
        }
        break;
      }
      case 'inductor': {
        current = vDiff / 1e-3;
        break;
      }
    }

    elementCurrents[el.id] = Math.abs(current) < 1e-7 ? 0 : current;
    elementPowers[el.id] = Math.abs(vDiff * current);
  });

  // Calculate meter readings & didactic guidance
  const ammeters: Record<string, { value: number; unit: string; isCorrectlyConnected: boolean; warning?: string }> = {};
  const voltmeters: Record<string, { value: number; unit: string; isCorrectlyConnected: boolean; warning?: string }> = {};
  const multimeters: Record<string, { value: number; unit: string; mode: string }> = {};
  const oscilloscopes: Record<string, OscilloscopeReading> = {};

  const hasAcSource = elements.some(e => e.type === 'ac_power_supply');

  elements.forEach(el => {
    if (el.type === 'ammeter') {
      const cur = Math.abs(elementCurrents[el.id] || 0);
      const volt = Math.abs(elementVoltages[el.id] || 0);
      // Ammeter connected directly in parallel across voltage source
      const isShort = volt > 0.5 && cur > 5;
      const isCorrect = !isShort;

      ammeters[el.id] = {
        value: cur >= 1 ? Number(cur.toFixed(3)) : Number((cur * 1000).toFixed(2)),
        unit: cur >= 1 ? 'A' : 'mA',
        isCorrectlyConnected: isCorrect,
        warning: isShort ? 'تنبيه هندسي: الأميتر متصل على التوازي مع المصدر مسببًا قصرًا! يجب توصيل الأميتر على التوالي.' : undefined,
      };
    }

    if (el.type === 'voltmeter') {
      const volt = Math.abs(elementVoltages[el.id] || 0);
      const cur = Math.abs(elementCurrents[el.id] || 0);
      // If voltmeter is somehow connected in series and completely blocking circuit
      const isSeriesError = cur > 1e-4; // If notable current goes through voltmeter

      voltmeters[el.id] = {
        value: Number(volt.toFixed(2)),
        unit: 'V',
        isCorrectlyConnected: true,
        warning: isSeriesError ? 'الفولتميتر يوصل دائمًا على التوازي لقياس فرق الجهد.' : undefined,
      };
    }

    if (el.type === 'multimeter') {
      const mode = el.state?.mode || 'voltage';
      if (mode === 'voltage') {
        const volt = Math.abs(elementVoltages[el.id] || 0);
        multimeters[el.id] = {
          value: Number(volt.toFixed(2)),
          unit: 'V',
          mode: 'جهد مستمر (DC Voltage)',
        };
      } else if (mode === 'current') {
        const cur = Math.abs(elementCurrents[el.id] || 0);
        multimeters[el.id] = {
          value: cur >= 1 ? Number(cur.toFixed(3)) : Number((cur * 1000).toFixed(2)),
          unit: cur >= 1 ? 'A' : 'mA',
          mode: 'تيار مستمر (DC Current)',
        };
      } else {
        // Ohmmeter mode
        multimeters[el.id] = {
          value: 0,
          unit: 'Ω',
          mode: 'مقاومة كهربائية (Resistance)',
        };
      }
    }

    if (el.type === 'oscilloscope') {
      const volt = Math.abs(elementVoltages[el.id] || 0);
      const coupling = el.state?.coupling || 'dc';

      if (coupling === 'gnd' || volt < 0.005) {
        oscilloscopes[el.id] = {
          vDiff: 0,
          vPeak: 0,
          vRms: 0,
          frequency: 0,
          waveType: 'zero',
        };
      } else if (hasAcSource) {
        const vRms = Number(volt.toFixed(2));
        const vPeak = Number((volt * Math.SQRT2).toFixed(2));
        oscilloscopes[el.id] = {
          vDiff: vRms,
          vPeak,
          vRms,
          frequency: 50,
          waveType: 'sine',
        };
      } else {
        const vDc = Number(volt.toFixed(2));
        oscilloscopes[el.id] = {
          vDiff: vDc,
          vPeak: vDc,
          vRms: vDc,
          frequency: 0,
          waveType: 'dc',
        };
      }
    }
  });

  const isOpenCircuit = totalCurrent < 1e-6;

  return {
    nodeVoltages,
    elementCurrents,
    elementVoltages,
    elementPowers,
    totalCurrent,
    totalPower,
    shortCircuit: false,
    openCircuit: isOpenCircuit,
    blownFuses,
    warnings,
    errors,
    meterReadings: {
      ammeters,
      voltmeters,
      multimeters,
      oscilloscopes,
    },
  };
}

/**
 * Pre-validation test helper to verify standard engineering test cases
 */
export function runEngineeringVerificationTests(): {
  test1: { passed: boolean; message: string; calculatedCurrentMA: number };
  test2: { passed: boolean; message: string; totalCurrentMA: number; vR1: number; vR2: number };
  test3: { passed: boolean; message: string; totalCurrentMA: number; branch1MA: number; branch2MA: number };
} {
  // Test 1: 9V source with 1kΩ resistor -> 9mA (0.009 A)
  const t1Elements: CircuitElement[] = [
    {
      id: 'bat1',
      type: 'battery',
      name: 'بطارية 9V',
      x: 100,
      y: 100,
      rotation: 0,
      value: 9,
      unit: 'V',
      terminals: [
        { id: 't1', label: '+', relX: 40, relY: 10 },
        { id: 't2', label: '-', relX: 40, relY: 70 },
      ],
    },
    {
      id: 'res1',
      type: 'resistor',
      name: 'مقاومة 1kΩ',
      x: 300,
      y: 100,
      rotation: 0,
      value: 1000,
      unit: 'Ω',
      terminals: [
        { id: 't1', label: 'A', relX: 10, relY: 40 },
        { id: 't2', label: 'B', relX: 70, relY: 40 },
      ],
    },
  ];
  const t1Wires: Wire[] = [
    { id: 'w1', fromCompId: 'bat1', fromTermId: 't1', toCompId: 'res1', toTermId: 't1' },
    { id: 'w2', fromCompId: 'res1', fromTermId: 't2', toCompId: 'bat1', toTermId: 't2' },
  ];
  const res1 = solveCircuit(t1Elements, t1Wires);
  const current1MA = (res1.elementCurrents['res1'] || 0) * 1000;
  const pass1 = Math.abs(current1MA - 9.0) < 0.05;

  // Test 2: 12V source with two 1kΩ in series -> 6mA total, 6V across each resistor
  const t2Elements: CircuitElement[] = [
    {
      id: 'bat2',
      type: 'dc_power_supply',
      name: 'مصدر 12V',
      x: 100,
      y: 100,
      rotation: 0,
      value: 12,
      unit: 'V',
      terminals: [
        { id: 't1', label: '+', relX: 40, relY: 10 },
        { id: 't2', label: '-', relX: 40, relY: 70 },
      ],
    },
    {
      id: 'r_s1',
      type: 'resistor',
      name: 'R1 (1kΩ)',
      x: 300,
      y: 100,
      rotation: 0,
      value: 1000,
      unit: 'Ω',
      terminals: [
        { id: 't1', label: 'A', relX: 10, relY: 40 },
        { id: 't2', label: 'B', relX: 70, relY: 40 },
      ],
    },
    {
      id: 'r_s2',
      type: 'resistor',
      name: 'R2 (1kΩ)',
      x: 500,
      y: 100,
      rotation: 0,
      value: 1000,
      unit: 'Ω',
      terminals: [
        { id: 't1', label: 'A', relX: 10, relY: 40 },
        { id: 't2', label: 'B', relX: 70, relY: 40 },
      ],
    },
  ];
  const t2Wires: Wire[] = [
    { id: 'w1', fromCompId: 'bat2', fromTermId: 't1', toCompId: 'r_s1', toTermId: 't1' },
    { id: 'w2', fromCompId: 'r_s1', fromTermId: 't2', toCompId: 'r_s2', toTermId: 't1' },
    { id: 'w3', fromCompId: 'r_s2', fromTermId: 't2', toCompId: 'bat2', toTermId: 't2' },
  ];
  const res2 = solveCircuit(t2Elements, t2Wires);
  const current2MA = (res2.elementCurrents['bat2'] || 0) * 1000;
  const vr1 = res2.elementVoltages['r_s1'] || 0;
  const vr2 = res2.elementVoltages['r_s2'] || 0;
  const pass2 = Math.abs(current2MA - 6.0) < 0.05 && Math.abs(vr1 - 6.0) < 0.05 && Math.abs(vr2 - 6.0) < 0.05;

  // Test 3: 12V source with two 1kΩ in parallel -> 24mA total, 12mA in each branch
  const t3Elements: CircuitElement[] = [
    {
      id: 'bat3',
      type: 'dc_power_supply',
      name: 'مصدر 12V',
      x: 100,
      y: 100,
      rotation: 0,
      value: 12,
      unit: 'V',
      terminals: [
        { id: 't1', label: '+', relX: 40, relY: 10 },
        { id: 't2', label: '-', relX: 40, relY: 70 },
      ],
    },
    {
      id: 'r_p1',
      type: 'resistor',
      name: 'R1 (1kΩ)',
      x: 300,
      y: 80,
      rotation: 0,
      value: 1000,
      unit: 'Ω',
      terminals: [
        { id: 't1', label: 'A', relX: 10, relY: 40 },
        { id: 't2', label: 'B', relX: 70, relY: 40 },
      ],
    },
    {
      id: 'r_p2',
      type: 'resistor',
      name: 'R2 (1kΩ)',
      x: 300,
      y: 220,
      rotation: 0,
      value: 1000,
      unit: 'Ω',
      terminals: [
        { id: 't1', label: 'A', relX: 10, relY: 40 },
        { id: 't2', label: 'B', relX: 70, relY: 40 },
      ],
    },
  ];
  const t3Wires: Wire[] = [
    { id: 'w1', fromCompId: 'bat3', fromTermId: 't1', toCompId: 'r_p1', toTermId: 't1' },
    { id: 'w2', fromCompId: 'bat3', fromTermId: 't1', toCompId: 'r_p2', toTermId: 't1' },
    { id: 'w3', fromCompId: 'r_p1', fromTermId: 't2', toCompId: 'bat3', toTermId: 't2' },
    { id: 'w4', fromCompId: 'r_p2', fromTermId: 't2', toCompId: 'bat3', toTermId: 't2' },
  ];
  const res3 = solveCircuit(t3Elements, t3Wires);
  const current3TotalMA = (res3.elementCurrents['bat3'] || 0) * 1000;
  const currentBranch1MA = (res3.elementCurrents['r_p1'] || 0) * 1000;
  const currentBranch2MA = (res3.elementCurrents['r_p2'] || 0) * 1000;
  const pass3 =
    Math.abs(current3TotalMA - 24.0) < 0.05 &&
    Math.abs(currentBranch1MA - 12.0) < 0.05 &&
    Math.abs(currentBranch2MA - 12.0) < 0.05;

  return {
    test1: {
      passed: pass1,
      message: `Test 1: 9V + 1kΩ -> Expected 9.0mA, Got ${current1MA.toFixed(2)}mA`,
      calculatedCurrentMA: current1MA,
    },
    test2: {
      passed: pass2,
      message: `Test 2: 12V + 2x 1kΩ Series -> Expected 6.0mA, 6V/6V; Got Total=${current2MA.toFixed(2)}mA, V1=${vr1.toFixed(2)}V, V2=${vr2.toFixed(2)}V`,
      totalCurrentMA: current2MA,
      vR1: vr1,
      vR2: vr2,
    },
    test3: {
      passed: pass3,
      message: `Test 3: 12V + 2x 1kΩ Parallel -> Expected 24.0mA total, 12.0mA branches; Got Total=${current3TotalMA.toFixed(2)}mA, Branch1=${currentBranch1MA.toFixed(2)}mA, Branch2=${currentBranch2MA.toFixed(2)}mA`,
      totalCurrentMA: current3TotalMA,
      branch1MA: currentBranch1MA,
      branch2MA: currentBranch2MA,
    },
  };
}
