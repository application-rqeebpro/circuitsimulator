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
  };

  if (!isOpen) {
    return (
      <div className="w-9 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-3 z-30 select-none">
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
    <div className="w-80 lg:w-92 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0 select-none shadow-xl">
      
      {/* Header bar matching Circuit Wizard Gallery */}
      <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">Gallery</h3>
            <div className="text-[9px] text-slate-400 font-sans">معرض المكونات الإلكترونية</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenColorCodeCalculator}
            className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] flex items-center gap-1 font-bold"
            title="حاسبة ألوان المقاومات"
          >
            <Calculator className="w-3 h-3" />
            <span className="hidden sm:inline">الألوان</span>
          </button>
          <button
            onClick={onToggle}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
            title="تصغير المعرض"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/90">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المكونات (Search)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-7 pl-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2 text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categories Dropdown or Tree Navigation */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/60">
        <label className="text-[10px] font-bold text-slate-400 block mb-1">
          التصنيف (Category):
        </label>
        <select
          value={activeCategory}
          onChange={(e) => {
            setActiveCategory(e.target.value);
            setSearchQuery('');
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
        >
          {GALLERY_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nameEn} ({cat.nameAr})
            </option>
          ))}
        </select>
      </div>

      {/* Component Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[160px] scrollbar-thin scrollbar-thumb-slate-700">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            لا توجد مكونات مطابقة للبحث
          </div>
        ) : (
          filteredItems.map(item => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => setSelectedItem(item)}
                className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Miniature schematic icon preview */}
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 text-emerald-400 font-mono text-[10px] font-bold">
                    {item.schematicSymbol?.substring(0, 4) || '—'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate text-slate-100">
                      {item.nameAr}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate" dir="ltr">
                      {item.nameEn}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd(item);
                  }}
                  className="p-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors shrink-0"
                  title="إضافة إلى مساحة العمل"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* BOTTOM PREVIEW PANE (Classic Circuit Wizard Bottom Gallery Box!) */}
      {selectedItem && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              معاينة المكون (Component Preview)
            </span>
            <span className="font-mono text-[10px] font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {selectedItem.defaultValue} {selectedItem.unit}
            </span>
          </div>

          {/* Visual Dual Preview: Schematic Symbol + Realistic View */}
          <div className="h-28 bg-slate-900/90 border border-slate-800 rounded-xl p-2 flex items-center justify-around gap-2 shadow-inner">
            {/* Schematic view */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[9px] text-slate-500 font-mono mb-1">الرمز التخطيطي</span>
              <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
                {selectedItem.schematicSymbol || selectedItem.type}
              </div>
            </div>

            {/* Photorealistic model graphic */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] text-slate-500 font-mono mb-0.5">الشكل الواقعي</span>
              <div className="w-16 h-16 flex items-center justify-center">
                <RealisticComponentGraphic
                  element={{
                    type: selectedItem.type,
                    subType: selectedItem.subType,
                    value: selectedItem.defaultValue,
                    unit: selectedItem.unit,
                  }}
                  width={64}
                  height={64}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="text-xs font-bold text-white leading-tight">
              {selectedItem.nameAr}
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
              {selectedItem.descriptionAr}
            </p>
          </div>

          {/* Add to circuit button + drag instruction */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={() => handleAdd(selectedItem)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة للدائرة (Add)</span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-mono">
            💡 اسحب المكون إلى مساحة العمل للإفلات في الموضع المطلوب
          </div>
        </div>
      )}

    </div>
  );
};
