/**
 * Resistor Color Code Calculator
 * Supports 4-band and 5-band resistors
 */

export interface ColorBand {
  color: string;
  nameAr: string;
  nameEn: string;
  digit: number | null;
  multiplier: number | null;
  tolerance: number | null;
  hex: string;
}

export const RESISTOR_COLORS: Record<string, ColorBand> = {
  black:  { color: 'black',  nameAr: 'أسود',  nameEn: 'Black',  digit: 0, multiplier: 1,      tolerance: null,   hex: '#1e293b' },
  brown:  { color: 'brown',  nameAr: 'بني',   nameEn: 'Brown',  digit: 1, multiplier: 10,     tolerance: 1,      hex: '#78350f' },
  red:    { color: 'red',    nameAr: 'أحمر',  nameEn: 'Red',    digit: 2, multiplier: 100,    tolerance: 2,      hex: '#dc2626' },
  orange: { color: 'orange', nameAr: 'برتقالي', nameEn: 'Orange', digit: 3, multiplier: 1000,   tolerance: null,   hex: '#ea580c' },
  yellow: { color: 'yellow', nameAr: 'أصفر',  nameEn: 'Yellow', digit: 4, multiplier: 10000,  tolerance: null,   hex: '#eab308' },
  green:  { color: 'green',  nameAr: 'أخضر',  nameEn: 'Green',  digit: 5, multiplier: 100000, tolerance: 0.5,    hex: '#16a34a' },
  blue:   { color: 'blue',   nameAr: 'أزرق',  nameEn: 'Blue',   digit: 6, multiplier: 1000000, tolerance: 0.25,  hex: '#2563eb' },
  violet: { color: 'violet', nameAr: 'بنفسجي', nameEn: 'Violet', digit: 7, multiplier: 10000000, tolerance: 0.1, hex: '#9333ea' },
  grey:   { color: 'grey',   nameAr: 'رمادي', nameEn: 'Grey',   digit: 8, multiplier: null,    tolerance: 0.05,   hex: '#64748b' },
  white:  { color: 'white',  nameAr: 'أبيض',  nameEn: 'White',  digit: 9, multiplier: null,    tolerance: null,   hex: '#f8fafc' },
  gold:   { color: 'gold',   nameAr: 'ذهبي',  nameEn: 'Gold',   digit: null, multiplier: 0.1,  tolerance: 5,      hex: '#d97706' },
  silver: { color: 'silver', nameAr: 'فضي',   nameEn: 'Silver', digit: null, multiplier: 0.01, tolerance: 10,     hex: '#94a3b8' },
};

/**
 * Given a resistance in Ohms, return the standard 4 color bands (Band 1, Band 2, Multiplier, Tolerance)
 */
export function get4BandColors(resistance: number, tolerancePct: number = 5): string[] {
  if (resistance <= 0) return ['#78350f', '#1e293b', '#1e293b', '#d97706']; // default 10Ω

  // Format in scientific notation to get significant digits
  const exp = Math.floor(Math.log10(resistance));
  const multExp = exp - 1;
  const normalized = Math.round(resistance / Math.pow(10, multExp));
  const d1 = Math.floor(normalized / 10);
  const d2 = normalized % 10;

  const digitColors = ['#1e293b', '#78350f', '#dc2626', '#ea580c', '#eab308', '#16a34a', '#2563eb', '#9333ea', '#64748b', '#f8fafc'];
  const c1 = digitColors[Math.min(Math.max(d1, 0), 9)] || '#78350f';
  const c2 = digitColors[Math.min(Math.max(d2, 0), 9)] || '#1e293b';

  let multColor = '#1e293b';
  if (multExp === -2) multColor = '#94a3b8'; // silver
  else if (multExp === -1) multColor = '#d97706'; // gold
  else if (multExp >= 0 && multExp <= 9) multColor = digitColors[multExp];

  let tolColor = '#d97706'; // default 5% gold
  if (tolerancePct <= 1) tolColor = '#78350f'; // 1% brown
  else if (tolerancePct <= 2) tolColor = '#dc2626'; // 2% red
  else if (tolerancePct <= 5) tolColor = '#d97706'; // 5% gold
  else tolColor = '#94a3b8'; // 10% silver

  return [c1, c2, multColor, tolColor];
}

/**
 * Given 4 band names, calculate the resistance value
 */
export function calculateFrom4Bands(band1: string, band2: string, multiplier: string, tolerance: string): { resistance: number; tolerancePct: number } {
  const d1 = RESISTOR_COLORS[band1]?.digit ?? 1;
  const d2 = RESISTOR_COLORS[band2]?.digit ?? 0;
  const mult = RESISTOR_COLORS[multiplier]?.multiplier ?? 1;
  const tol = RESISTOR_COLORS[tolerance]?.tolerance ?? 5;

  return {
    resistance: (d1 * 10 + d2) * mult,
    tolerancePct: tol,
  };
}

/**
 * Given a resistance in Ohms, return the 5 color bands for 1% and precision resistors:
 * Band 1 (1st digit), Band 2 (2nd digit), Band 3 (3rd digit), Multiplier, Tolerance
 */
export function get5BandColors(resistance: number, tolerancePct: number = 1): string[] {
  if (resistance <= 0) return ['#78350f', '#1e293b', '#1e293b', '#1e293b', '#78350f'];

  const exp = Math.floor(Math.log10(resistance));
  const multExp = exp - 2;
  const normalized = Math.round(resistance / Math.pow(10, multExp));
  const d1 = Math.floor(normalized / 100);
  const d2 = Math.floor((normalized % 100) / 10);
  const d3 = normalized % 10;

  const digitColors = ['#1e293b', '#78350f', '#dc2626', '#ea580c', '#eab308', '#16a34a', '#2563eb', '#9333ea', '#64748b', '#f8fafc'];
  const c1 = digitColors[Math.min(Math.max(d1, 0), 9)] || '#78350f';
  const c2 = digitColors[Math.min(Math.max(d2, 0), 9)] || '#1e293b';
  const c3 = digitColors[Math.min(Math.max(d3, 0), 9)] || '#1e293b';

  let multColor = '#1e293b';
  if (multExp === -2) multColor = '#94a3b8'; // silver
  else if (multExp === -1) multColor = '#d97706'; // gold
  else if (multExp >= 0 && multExp <= 9) multColor = digitColors[multExp];

  let tolColor = '#78350f'; // default 1% brown
  if (tolerancePct <= 0.05) tolColor = '#64748b'; // 0.05% grey
  else if (tolerancePct <= 0.1) tolColor = '#9333ea'; // 0.1% violet
  else if (tolerancePct <= 0.25) tolColor = '#2563eb'; // 0.25% blue
  else if (tolerancePct <= 0.5) tolColor = '#16a34a'; // 0.5% green
  else if (tolerancePct <= 1) tolColor = '#78350f'; // 1% brown
  else if (tolerancePct <= 2) tolColor = '#dc2626'; // 2% red
  else tolColor = '#d97706'; // 5% gold

  return [c1, c2, c3, multColor, tolColor];
}
