import React, { useState } from 'react';
import { 
  Battery, 
  Zap, 
  Lightbulb, 
  ToggleLeft, 
  Gauge, 
  ShieldAlert, 
  Layers, 
  Radio, 
  Sliders, 
  Plus,
  Search,
  Calculator,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { CircuitElement, ComponentType } from '../engine/circuitSolver';
import { COMPONENT_CATALOG, CatalogItem } from '../data/componentCatalog';
import { RealisticComponentGraphic } from './RealisticComponentGraphics';

interface ComponentLibraryProps {
  onAddComponent: (comp: Omit<CircuitElement, 'id' | 'x' | 'y'>) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenColorCodeCalculator: () => void;
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onAddComponent,
  isOpen,
  onToggle,
  onOpenColorCodeCalculator,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'الكل (شامل)', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'batteries', label: 'البطاريات ومصادر الطاقة', icon: <Battery className="w-3.5 h-3.5" /> },
    { id: 'resistors', label: 'المقاومات', icon: <div className="font-mono text-[10px] font-bold">Ω</div> },
    { id: 'capacitors', label: 'المكثفات', icon: <div className="font-mono text-[10px] font-bold">C</div> },
    { id: 'switches', label: 'المفاتيح', icon: <ToggleLeft className="w-3.5 h-3.5" /> },
    { id: 'loads', label: 'المصابيح وLED', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'semiconductors', label: 'أشباه الموصلات', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'meters', label: 'أجهزة القياس', icon: <Gauge className="w-3.5 h-3.5" /> },
    { id: 'protection', label: 'الحماية والفيوز', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  ];

  // Filter catalog items by category and search term
  const filteredItems = COMPONENT_CATALOG.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      item.nameAr.toLowerCase().includes(q) || 
      item.nameEn.toLowerCase().includes(q) ||
      item.descriptionAr.toLowerCase().includes(q) ||
      item.defaultValue.toString().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`transition-all duration-300 ${isOpen ? 'w-full md:w-88 lg:w-96' : 'w-12'} bg-slate-900 border-l border-slate-800 flex flex-col z-20 shrink-0 select-none`}>
      
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-slate-200 font-bold text-xs hover:text-white"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          {isOpen && <span>مكتبة المكونات الهندسية</span>}
        </button>

        {isOpen && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenColorCodeCalculator}
              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs flex items-center gap-1"
              title="حاسبة ألوان المقاومات"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] font-bold">حاسبة الألوان</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono-numbers px-2 py-0.5 rounded bg-slate-800">
              {filteredItems.length}
            </span>
          </div>
        )}
      </div>

      {isOpen && (
        <>
          {/* Search Bar */}
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-900">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم العربي أو الإنجليزي أو القيمة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-3 pl-8 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Categories Tab Strip */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-800/80 overflow-x-auto scrollbar-none text-[11px] bg-slate-950/40">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Components Grid / Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(100vh-210px)]">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                لا توجد مكونات مطابقة لبحثك
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({
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
                        state: {
                          isOpen: false,
                          isBlown: false,
                          potentiometerRatio: 0.5,
                          ambientLightLux: 500,
                          temperatureC: 25,
                          mode: 'voltage',
                        },
                        terminals: item.terminals,
                      })
                    );
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
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
                      state: {
                        isOpen: false,
                        isBlown: false,
                        potentiometerRatio: 0.5,
                        ambientLightLux: 500,
                        temperatureC: 25,
                        mode: 'voltage',
                      },
                      terminals: item.terminals,
                    });
                  }}
                  className="group p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-emerald-500/50 hover:bg-slate-950 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between gap-3 shadow-md select-none"
                >
                  {/* Left (RTL Right): Realistic Graphic Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 p-1 group-hover:scale-105 transition-transform overflow-hidden">
                    <RealisticComponentGraphic
                      element={{
                        type: item.type,
                        subType: item.subType,
                        value: item.defaultValue,
                        unit: item.unit,
                        tolerancePct: item.tolerancePct,
                      }}
                      width={52}
                      height={52}
                    />
                  </div>

                  {/* Middle: Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                        {item.nameAr}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 truncate mb-1" dir="ltr">
                      {item.nameEn}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-mono-numbers px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-bold border border-slate-800">
                        {item.defaultValue} {item.unit}
                      </span>
                      <span className="font-mono text-slate-400">
                        {item.schematicSymbol}
                      </span>
                      {item.ratedPower && (
                        <span className="text-amber-400/90 font-mono-numbers">
                          {item.ratedPower}W
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Button: Add */}
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-800/80 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white transition-colors shrink-0 shadow-sm"
                    title="سحب أو إضافة إلى لوحة التجارب"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
