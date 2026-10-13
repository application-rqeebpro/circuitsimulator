import React, { useState } from 'react';
import { 
  Battery, 
  ToggleLeft, 
  Lightbulb, 
  Cpu, 
  Gauge, 
  ShieldAlert, 
  Layers, 
  Search, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Sliders, 
  Sun, 
  Activity, 
  Radio, 
  Calculator,
  Compass,
  ArrowRight
} from 'lucide-react';
import { CircuitElement, ComponentType } from '../engine/circuitSolver';
import { COMPONENT_CATALOG, CatalogItem } from '../data/componentCatalog';
import { RealisticComponentGraphic } from './RealisticComponentGraphics';

interface CircuitWizardGalleryProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddComponent: (comp: Omit<CircuitElement, 'id' | 'x' | 'y'>) => void;
  onOpenColorCodeCalculator: () => void;
}

interface GalleryCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: React.ReactNode;
}

const GALLERY_CATEGORIES: GalleryCategory[] = [
  { id: 'power_supplies', nameEn: 'Power Supplies', nameAr: 'مصادر الطاقة والتأريض', icon: <Battery className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'connectors', nameEn: 'Connectors', nameAr: 'نقاط التوصيل والألواح', icon: <Layers className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: 'input', nameEn: 'Input Components', nameAr: 'مفاتيح الإدخال والتحكم', icon: <ToggleLeft className="w-3.5 h-3.5 text-cyan-400" /> },
  { id: 'sensors', nameEn: 'Sensors', nameAr: 'الحساسات (ضوء وحرارة)', icon: <Sun className="w-3.5 h-3.5 text-yellow-400" /> },
  { id: 'passive', nameEn: 'Passive Components', nameAr: 'المكونات الخاملة (مقاومات ومكثفات)', icon: <div className="font-mono text-[10px] font-bold text-teal-400">R/C</div> },
  { id: 'diodes', nameEn: 'Diodes', nameAr: 'الثنائيات والـ LEDs', icon: <Zap className="w-3.5 h-3.5 text-rose-400" /> },
  { id: 'transistors', nameEn: 'Transistors', nameAr: 'الترانزستورات (BJT & FET)', icon: <Cpu className="w-3.5 h-3.5 text-indigo-400" /> },
  { id: 'logic_gates', nameEn: 'Logic Gates', nameAr: 'بوابات المنطق الرقمي', icon: <div className="font-mono text-[10px] font-bold text-purple-400">&amp;</div> },
  { id: 'integrated_circuits', nameEn: 'Integrated Circuits', nameAr: 'الدارات المتكاملة (555 & 741)', icon: <Cpu className="w-3.5 h-3.5 text-blue-400" /> },
  { id: 'output', nameEn: 'Output Components', nameAr: 'مكونات الخرج (طنان ومحرك ولمبة)', icon: <Lightbulb className="w-3.5 h-3.5 text-amber-300" /> },
  { id: 'instruments', nameEn: 'Virtual Instruments', nameAr: 'أجهزة القياس الافتراضية', icon: <Gauge className="w-3.5 h-3.5 text-cyan-300" /> },
];

export const CircuitWizardGallery: React.FC<CircuitWizardGalleryProps> = ({
  isOpen,
  onToggle,
  onAddComponent,
  onOpenColorCodeCalculator,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('power_supplies');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem>(COMPONENT_CATALOG[0]);

  // Map legacy categories to Circuit Wizard gallery categories
  const getCategoryForCatalogItem = (item: CatalogItem): string => {
    if (item.category === 'power_supplies' || item.category === 'batteries') return 'power_supplies';
    if (item.category === 'input' || item.category === 'switches') return 'input';
    if (item.category === 'passive' || item.category === 'resistors' || item.category === 'capacitors') return 'passive';
    if (item.category === 'diodes') return 'diodes';
    if (item.category === 'transistors') return 'transistors';
    if (item.category === 'logic_gates') return 'logic_gates';
    if (item.category === 'integrated_circuits') return 'integrated_circuits';
    if (item.category === 'output' || item.category === 'loads') return 'output';
    if (item.category === 'instruments' || item.category === 'meters') return 'instruments';
    if (item.category === 'sensors') return 'sensors';
    if (item.category === 'connectors' || item.type === 'board_green') return 'connectors';
    if (item.subType?.includes('ldr') || item.subType?.includes('ntc') || item.subType?.includes('ptc')) return 'sensors';
    return 'passive';
  };

  const filteredItems = COMPONENT_CATALOG.filter(item => {
    const itemCat = getCategoryForCatalogItem(item);
    const matchesCategory = searchQuery.trim() !== '' || itemCat === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      item.nameAr.toLowerCase().includes(q) || 
      item.nameEn.toLowerCase().includes(q) ||
      item.descriptionAr.toLowerCase().includes(q) ||
      item.defaultValue.toString().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, item: CatalogItem) => {
    const payload: Omit<CircuitElement, 'id'> = {
      type: item.type,
      subType: item.subType,
      name: item.nameAr,
      nameEn: item.nameEn,
      x: 200,
      y: 200,
      rotation: 0,
      value: item.defaultValue,
      unit: item.unit,
      ratedPower: item.ratedPower,
      ratedVoltage: item.ratedVoltage,
      internalResistance: item.internalResistance,
      tolerancePct: item.tolerancePct,
      isPolarized: item.isPolarized,
      dielectricType: item.dielectricType,
      terminals: item.terminals,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const handleAdd = (item: CatalogItem) => {
    onAddComponent({
      type: item.type,
      subType: item.subType,
      name: item.nameAr,
      nameEn: item.nameEn,
      rotation: 0,
      value: item.defaultValue,
      unit: item.unit,
      ratedPower: item.ratedPower,
      ratedVoltage: item.ratedVoltage,
      internalResistance: item.internalResistance,
      tolerancePct: item.tolerancePct,
      isPolarized: item.isPolarized,
      dielectricType: item.dielectricType,
      terminals: item.terminals,
    });
    setRecentlyAddedId(item.id);
    setTimeout(() => setRecentlyAddedId(null), 1000);
  };

  if (!isOpen) {
    return (
      <div className="hidden lg:flex w-9 bg-slate-900 border-l border-slate-800 flex-col items-center py-3 z-30 select-none">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
          title="فتح معرض المكونات (Gallery)"
        >
          <Layers className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-bold text-slate-500 [writing-mode:vertical-rl] mt-6 tracking-widest uppercase">
          Gallery
        </span>
      </div>
    );
  }

  return (
    <div className="h-full w-[46%] min-w-[150px] max-w-[210px] sm:w-72 md:w-80 lg:w-80 xl:w-88 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 select-none shadow-2xl relative z-25 animate-in slide-in-from-right duration-200">
      
      {/* Header bar matching Circuit Wizard Gallery */}
      <div className="px-2.5 sm:px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white tracking-wide truncate">المكونات</h3>
            <div className="text-[9px] text-slate-400 font-sans truncate hidden sm:block">معرض Circuit Wizard</div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenColorCodeCalculator}
            className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] flex items-center gap-1 font-bold"
            title="حاسبة ألوان المقاومات"
          >
            <Calculator className="w-3 h-3" />
            <span className="hidden md:inline">الألوان</span>
          </button>
          <button
            onClick={onToggle}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center justify-center font-bold"
            title="إغلاق المعرض"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-1.5 sm:p-2 border-b border-slate-800 bg-slate-900/90">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-7 pl-3 py-1 sm:py-1.5 text-[11px] sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
          />
          <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 absolute right-2.5 top-2 sm:top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1.5 text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categories Dropdown or Tree Navigation */}
      <div className="p-1.5 sm:p-2 border-b border-slate-800 bg-slate-950/60">
        <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mb-1">
          التصنيف:
        </label>
        <select
          value={activeCategory}
          onChange={(e) => {
            setActiveCategory(e.target.value);
            setSearchQuery('');
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] sm:text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 truncate"
        >
          {GALLERY_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nameAr}
            </option>
          ))}
        </select>
      </div>

      {/* Quick notice banner for mobile */}
      <div className="px-2 py-1 bg-emerald-950/40 border-b border-emerald-900/40 text-[9px] text-emerald-300 sm:hidden flex items-center justify-between">
        <span>انقر أي عنصر لإضافته للوحة 👈</span>
      </div>

      {/* Component Items List */}
      <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 min-h-[160px] scrollbar-thin scrollbar-thumb-slate-700">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            لا توجد مكونات مطابقة
          </div>
        ) : (
          filteredItems.map(item => {
            const isSelected = selectedItem?.id === item.id;
            const wasJustAdded = recentlyAddedId === item.id;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => {
                  setSelectedItem(item);
                  handleAdd(item);
                }}
                className={`p-1.5 sm:p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-1.5 active:scale-98 ${
                  wasJustAdded
                    ? 'bg-emerald-600/40 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/80 animate-pulse'
                    : isSelected
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
                title="انقر للإضافة مباشرة إلى لوحة الدائرة على اليسار"
              >
                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                  {/* Miniature schematic icon preview */}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border flex items-center justify-center shrink-0 font-mono text-[9px] font-bold ${
                    wasJustAdded ? 'border-emerald-400 text-white bg-emerald-700' : 'border-slate-700/80 text-emerald-400'
                  }`}>
                    {wasJustAdded ? '✓' : item.schematicSymbol?.substring(0, 3) || '⚡'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] sm:text-xs font-bold truncate text-slate-100">
                      {item.nameAr}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 truncate hidden sm:block" dir="ltr">
                      {item.nameEn}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd(item);
                  }}
                  className={`p-1 rounded-md transition-colors shrink-0 ${
                    wasJustAdded 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white'
                  }`}
                  title="إضافة إلى مساحة العمل"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* BOTTOM PREVIEW PANE - Visible on sm+ screens */}
      {selectedItem && (
        <div className="hidden sm:flex p-3 bg-slate-950 border-t border-slate-800 flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              معاينة المكون
            </span>
            <span className="font-mono text-[10px] font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {selectedItem.defaultValue} {selectedItem.unit}
            </span>
          </div>

          {/* Visual Dual Preview: Schematic Symbol + Realistic View */}
          <div className="h-24 bg-slate-900/90 border border-slate-800 rounded-xl p-2 flex items-center justify-around gap-2 shadow-inner">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[9px] text-slate-500 font-mono mb-1">الرمز التخطيطي</span>
              <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
                {selectedItem.schematicSymbol || selectedItem.type}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] text-slate-500 font-mono mb-0.5">الشكل الواقعي</span>
              <div className="w-14 h-14 flex items-center justify-center">
                <RealisticComponentGraphic
                  element={{
                    type: selectedItem.type,
                    subType: selectedItem.subType,
                    value: selectedItem.defaultValue,
                    unit: selectedItem.unit,
                  }}
                  width={56}
                  height={56}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white leading-tight">
              {selectedItem.nameAr}
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">
              {selectedItem.descriptionAr}
            </p>
          </div>

          {/* Add to circuit button */}
          <div className="pt-0.5 flex items-center gap-2">
            <button
              onClick={() => handleAdd(selectedItem)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة للدائرة (Add)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
