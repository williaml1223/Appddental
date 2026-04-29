import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calculator, Plus, Trash2, Download, CheckCircle, Receipt, DollarSign, Save, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BudgetItem } from '../../types';
import { medicalService } from '../../services/medicalService';
import { useParams } from 'react-router-dom';
import { useNotification } from '../ui/Notification';

const COMMON_PROCEDURES = [
  { label: 'Limpieza Dental Profiláctica', price: 60 },
  { label: 'Resina Simple (1 cara)', price: 45 },
  { label: 'Resina Compuesta (2+ caras)', price: 75 },
  { label: 'Endodoncia Unirradicular', price: 180 },
  { label: 'Endodoncia Multirradicular', price: 250 },
  { label: 'Extracción Simple', price: 50 },
  { label: 'Corona Porcelana', price: 450 },
  { label: 'Blanqueamiento Dental', price: 120 },
];

export default function BudgetGenerator({ onSaved }: { onSaved?: () => void }) {
  const { showNotification } = useNotification();
  const { id: patientId } = useParams<{ id: string }>();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addItem = (proc: { label: string, price: number }) => {
    setItems([...items, { description: proc.label, price: proc.price, status: 'PENDING' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const toggleItemStatus = (index: number, status: 'ACCEPTED' | 'REJECTED' | 'PENDING') => {
    setItems(items.map((item, i) => i === index ? { ...item, status } : item));
  };

  const total = useMemo(() => items.reduce((acc, item) => acc + item.price, 0), [items]);
  const acceptedTotal = useMemo(() => items.filter(i => i.status === 'ACCEPTED').reduce((acc, item) => acc + item.price, 0), [items]);

  const handleSave = async () => {
    if (!patientId || items.length === 0) return;
    setIsSaving(true);
    try {
      await medicalService.saveBudget(patientId, {
        patientId,
        items,
        total,
        status: 'DRAFT'
      });
      showNotification('success', 'Presupuesto guardado correctamente');
      onSaved?.();
    } catch (error) {
      console.error(error);
      showNotification('error', 'Error al guardar el presupuesto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col xl:flex-row min-h-[600px]">
      {/* Procedures Selection */}
      <div className="w-full xl:w-1/3 xl:border-r border-b xl:border-b-0 border-slate-100 p-6 md:p-8 bg-slate-50/30 overflow-y-auto shrink-0 max-h-[300px] xl:max-h-none">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Procedimientos
        </h3>
        <div className="space-y-2">
          {COMMON_PROCEDURES.map(proc => (
            <button
              key={proc.label}
              onClick={() => addItem(proc)}
              className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group"
            >
              <p className="text-xs font-bold text-slate-700 mb-1 group-hover:text-indigo-600">{proc.label}</p>
              <span className="text-sm font-black text-emerald-600">${proc.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quote Preview */}
      <div className="flex-1 p-6 md:p-10 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-slate-50 gap-6">
           <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Presupuesto Clínico</h2>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Cotización Válida por 30 días</p>
           </div>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-700 flex items-center justify-between sm:justify-end gap-3">
              <Receipt className="w-5 h-5 shrink-0" />
              <div className="text-right">
                 <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Total Estimado</p>
                 <p className="text-xl md:text-2xl font-black">${total.toFixed(2)}</p>
                 {acceptedTotal > 0 && acceptedTotal !== total && (
                   <p className="text-[8px] md:text-[9px] font-black text-emerald-600 uppercase tracking-widest">Aceptado: ${acceptedTotal.toFixed(2)}</p>
                 )}
              </div>
           </div>
        </div>

        <div className="flex-1 space-y-3">
          {items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center opacity-40">
                  <Calculator className="w-10 h-10" />
               </div>
               <p className="font-bold text-xs uppercase tracking-widest">Agregue elementos a la lista</p>
            </div>
          )}
          
          {items.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={idx}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl group border transition-all gap-4",
                item.status === 'ACCEPTED' ? "bg-emerald-50/50 border-emerald-100" : 
                item.status === 'REJECTED' ? "bg-rose-50/50 border-rose-100 opacity-60" :
                "bg-slate-50/50 border-transparent hover:border-slate-100 hover:bg-white"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                 <div className={cn(
                   "w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-colors shrink-0",
                   item.status === 'ACCEPTED' ? "bg-emerald-500 text-white" :
                   item.status === 'REJECTED' ? "bg-rose-500 text-white" :
                   "bg-white text-slate-400 group-hover:text-indigo-600"
                 )}>
                    {item.status === 'ACCEPTED' ? <CheckCircle className="w-5 h-5" /> : 
                     item.status === 'REJECTED' ? <Trash2 className="w-5 h-5" /> : 
                     <Calculator className="w-5 h-5" />}
                 </div>
                 <div className="min-w-0 flex-1">
                    <span className={cn(
                      "font-bold text-sm block leading-tight",
                      item.status === 'REJECTED' ? "text-rose-900/50 line-through" : "text-slate-700"
                    )}>{item.description}</span>
                    <div className="flex gap-2 mt-1">
                       <button 
                         onClick={() => toggleItemStatus(idx, 'ACCEPTED')}
                         className={cn(
                           "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border transition-all whitespace-nowrap",
                           item.status === 'ACCEPTED' ? "bg-emerald-500 text-white border-emerald-500" : "text-slate-400 border-slate-200 hover:border-emerald-500 hover:text-emerald-500"
                         )}
                       >
                         Aceptar
                       </button>
                       <button 
                         onClick={() => toggleItemStatus(idx, 'REJECTED')}
                         className={cn(
                           "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border transition-all whitespace-nowrap",
                           item.status === 'REJECTED' ? "bg-rose-500 text-white border-rose-500" : "text-slate-400 border-slate-200 hover:border-rose-500 hover:text-rose-500"
                         )}
                       >
                         Rechazar
                       </button>
                    </div>
                 </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 pl-14 sm:pl-0">
                 <span className={cn(
                   "font-black whitespace-nowrap",
                   item.status === 'REJECTED' ? "text-rose-900/50 line-through" : "text-slate-900"
                 )}>${item.price.toFixed(2)}</span>
                 <button 
                   onClick={() => removeItem(idx)}
                   className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Moneda: Dólares (USD)
           </div>
           <div className="flex gap-4 w-full sm:w-auto">
              <button 
                className="flex-1 sm:flex-none px-8 py-4 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                 <Download className="w-4 h-4" /> Imprimir
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || items.length === 0}
                className="flex-1 sm:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Guardando...' : 'Aprobar y Guardar'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
