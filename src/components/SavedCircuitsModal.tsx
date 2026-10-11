import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SavedCircuitItem, CircuitElement, Wire } from '../types';
import { X, Bookmark, Play, Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SavedCircuitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentElements: CircuitElement[];
  currentWires: Wire[];
  onLoadCircuit: (elements: CircuitElement[], wires: Wire[]) => void;
}

export const SavedCircuitsModal: React.FC<SavedCircuitsModalProps> = ({
  isOpen,
  onClose,
  currentElements,
  currentWires,
  onLoadCircuit,
}) => {
  const [circuits, setCircuits] = useState<SavedCircuitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMyCircuits();
    }
  }, [isOpen]);

  const loadMyCircuits = async () => {
    setLoading(true);
    try {
      const res = await api.getMyCircuits();
      setCircuits(res.circuits || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'فشل تحميل الدوائر' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    if (currentElements.length === 0) {
      setMsg({ type: 'error', text: 'لوحة العمل فارغة حاليًا. أضف عناصر قبل الحفظ.' });
      return;
    }

    try {
      const res = await api.saveCircuit({
        title: saveTitle,
        description: saveDesc,
        elements: currentElements,
        wires: currentWires,
      });
      setMsg({ type: 'success', text: 'تم حفظ الدائرة بنجاح في حسابك' });
      setSaveTitle('');
      setSaveDesc('');
      loadMyCircuits();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'فشل حفظ الدائرة' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدائرة المحفوظة؟')) return;
    try {
      await api.deleteCircuit(id);
      loadMyCircuits();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'فشل حذف الدائرة' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">دوائري الكهربائية المحفوظة</h2>
            <p className="text-xs text-slate-400">حفظ واسترجاع التجارب والتصميمات المخصصة</p>
          </div>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Save Current Circuit Section */}
        <form onSubmit={handleSaveCurrent} className="mb-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>حفظ الدائرة الحالية الموجودة باللوحة ({currentElements.length} عنصر، {currentWires.length} سلك):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={saveTitle}
              onChange={e => setSaveTitle(e.target.value)}
              placeholder="عنوان الدائرة (مثال: دائرة مقسم جهد خاصة)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={saveDesc}
              onChange={e => setSaveDesc(e.target.value)}
              placeholder="وصف مختصر اختياري"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>حفظ في السحابة</span>
          </button>
        </form>

        {/* List of Saved Circuits */}
        <div className="space-y-2.5 text-xs">
          <div className="font-bold text-slate-400">التصميمات المحفوظة سابقًا:</div>

          {circuits.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/80">
              لا توجد دوائر محفوظة في حسابك بعد
            </div>
          ) : (
            circuits.map(c => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs">{c.title}</div>
                  {c.description && <div className="text-[11px] text-slate-400">{c.description}</div>}
                  <div className="text-[10px] text-slate-500 mt-1 font-mono-numbers">
                    {c.elements?.length || 0} مكونات · {c.wires?.length || 0} أسلاك توصيل
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onLoadCircuit(c.elements, c.wires);
                      onClose();
                    }}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>تحميل في اللوحة</span>
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-slate-700 transition-colors"
                    title="حذف الدائرة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
