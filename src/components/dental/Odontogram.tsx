import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, BookOpen, Calculator, Save, Info, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DentalSurface, Patient, ToothCondition, ToothMarking } from '../../types';
import { medicalService } from '../../services/medicalService';
import { useParams } from 'react-router-dom';
import { useNotification } from '../ui/Notification';

// Tooth structure constants (FDI notation)
const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const PEDIATRIC_UPPER_ARCH = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const PEDIATRIC_LOWER_ARCH = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const TREATMENTS = [
  { 
    id: ToothCondition.CARIES, 
    label: 'Caries', 
    color: 'bg-rose-500', 
    icon: '🔴', 
    description: 'Destrucción de los tejidos del diente por ácidos de bacterias.',
    studentNote: {
      adult: 'Frecuente en fosetas y fisuras (oclusal) y puntos de contacto (mesial/distal).',
      pediatric: 'Cuidado con "caries de biberón" en caras lisas (vestibular/lingual) y caries rampantes.'
    }
  },
  { 
    id: ToothCondition.FILLING, 
    label: 'Obturación', 
    color: 'bg-blue-500', 
    icon: '🔵', 
    description: 'Restauración del diente con resina, amalgama o ionómero.',
    studentNote: {
      adult: 'Evaluar integridad del margen y recidivas de caries periféricas.',
      pediatric: 'En dientes temporales se prefiere ionómero de vidrio por su liberación de flúor.'
    }
  },
  { 
    id: ToothCondition.ABSENCE, 
    label: 'Ausencia', 
    color: 'bg-slate-400', 
    icon: '⚪', 
    description: 'Falta total de la pieza dental en el arco.',
    studentNote: {
      adult: 'Diferenciar entre agenesia (nunca existió) o pérdida por trauma/caries.',
      pediatric: 'Verificar si es una pérdida prematura; puede requerir mantenedor de espacio.'
    }
  },
  { 
    id: ToothCondition.CROWN, 
    label: 'Corona', 
    color: 'bg-amber-500', 
    icon: '👑', 
    description: 'Estructura protésica que cubre completamente el diente tallado.',
    studentNote: {
      adult: 'Evaluar estado periodontal alrededor de la corona y oclusión.',
      pediatric: 'Común el uso de coronas de acero cromo en molares temporales muy destruidos.'
    }
  },
  { 
    id: ToothCondition.ENDODONTICS, 
    label: 'Endodoncia', 
    color: 'bg-emerald-500', 
    icon: '🦷', 
    description: 'Eliminación de la pulpa dental y sellado de conductos.',
    studentNote: {
      adult: 'Fundamental verificar el sellado apical y reconstrucción post-endodóntica.',
      pediatric: 'En niños se llama Pulpotomía (parcial) o Pulpectomía (total). No usar gutapercha en temporales.'
    }
  }
];

const SURFACE_INFO: Record<DentalSurface, { label: string, desc: string }> = {
  [DentalSurface.VESTIBULAR]: { label: 'Vestibular', desc: 'Cara externa del diente que da hacia los labios o mejillas.' },
  [DentalSurface.LINGUAL]: { label: 'Lingual/Palatina', desc: 'Cara interna que da hacia la lengua (inferiores) o paladar (superiores).' },
  [DentalSurface.MESIAL]: { label: 'Mesial', desc: 'Cara lateral del diente que mira hacia la línea media del arco.' },
  [DentalSurface.DISTAL]: { label: 'Distal', desc: 'Cara lateral del diente que se aleja de la línea media.' },
  [DentalSurface.OCCLUSAL]: { label: 'Oclusal/Incisal', desc: 'Superficie de masticación (molares) o borde cortante (incisivos).' },
  [DentalSurface.GENERAL]: { label: 'General', desc: 'Afecta a toda la pieza dental de forma integral.' }
};

export default function Odontogram() {
  const { showNotification } = useNotification();
  const { id: patientId } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [markings, setMarkings] = useState<ToothMarking[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>(ToothCondition.CARIES);
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [viewMode, setViewMode] = useState<'adult' | 'pediatric' | 'mixed'>('adult');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSurface, setHoveredSurface] = useState<DentalSurface | null>(null);

  const isPediatric = viewMode === 'pediatric' || viewMode === 'mixed';

  useEffect(() => {
    if (patientId) {
      // Load patient for header info
      medicalService.getPatient(patientId).then(setPatient);
      
      medicalService.getLatestOdontogram(patientId).then(odo => {
        if (odo) setMarkings(odo.markings);
        setIsLoading(false);
      });
    }
  }, [patientId]);

  const handleSave = async () => {
    if (!patientId) return;
    setIsSaving(true);
    try {
      await medicalService.saveOdontogram(patientId, {
        patientId,
        markings
      });
      showNotification('success', 'Odontograma guardado correctamente');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Error al guardar el odontograma');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSurface = (toothNumber: number, surface: DentalSurface) => {
    // Priority: Handle Absence (Whole tooth status)
    if (selectedCondition === ToothCondition.ABSENCE) {
      setMarkings(prev => {
        const hasAbsence = prev.some(m => m.toothNumber === toothNumber && m.condition === ToothCondition.ABSENCE);
        if (hasAbsence) {
          return prev.filter(m => !(m.toothNumber === toothNumber && m.condition === ToothCondition.ABSENCE));
        } else {
          // Remove any other markings for this tooth if it goes absent
          const filtered = prev.filter(m => m.toothNumber !== toothNumber);
          return [...filtered, { toothNumber, surfaces: [DentalSurface.GENERAL], condition: ToothCondition.ABSENCE }];
        }
      });
      return;
    }

    // Prevent marking other conditions on absent teeth
    const isAbsent = markings.some(m => m.toothNumber === toothNumber && m.condition === ToothCondition.ABSENCE);
    if (isAbsent) {
      setValidationError("No se puede marcar tratamientos en piezas ausentes. Primero remueva el estado de ausencia.");
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    // Validation Logic
    if (selectedCondition === ToothCondition.CARIES) {
      const allowedSurfaces = [DentalSurface.OCCLUSAL, DentalSurface.MESIAL, DentalSurface.DISTAL];
      const isDeciduous = toothNumber >= 51 && toothNumber <= 85;

      if (isDeciduous) {
        allowedSurfaces.push(DentalSurface.VESTIBULAR, DentalSurface.LINGUAL);
      }

      if (!allowedSurfaces.includes(surface)) {
        setValidationError(isDeciduous 
          ? "En niños, las caries de superficies lisas (Vestibular/Lingual) son comunes. Verifique si es caries o erosión."
          : "Clínicamente, las caries de adultos suelen ser oclusales o interproximales.");
        setTimeout(() => setValidationError(null), 4000);
        return;
      }
    }

    if (selectedCondition === ToothCondition.ENDODONTICS) {
      const isDeciduous = toothNumber >= 51 && toothNumber <= 85;
      if (surface !== DentalSurface.OCCLUSAL) {
        setValidationError(isDeciduous 
          ? "En niños hablamos de pulpotomía/pulpectomía. El acceso se marca en oclusal."
          : "El acceso para endodoncia se marca en la cara oclusal/incisal por convención.");
        setTimeout(() => setValidationError(null), 4000);
        return;
      }
    }

    setMarkings(prev => {
      const existing = prev.find(m => m.toothNumber === toothNumber && m.condition === selectedCondition);
      if (existing) {
        const hasSurface = existing.surfaces.includes(surface);
        const newSurfaces = hasSurface 
          ? existing.surfaces.filter(s => s !== surface)
          : [...existing.surfaces, surface];
        
        if (newSurfaces.length === 0) {
          return prev.filter(m => m !== existing);
        }
        
        return prev.map(m => m === existing ? { ...m, surfaces: newSurfaces } : m);
      } else {
        return [...prev, { toothNumber, surfaces: [surface], condition: selectedCondition }];
      }
    });
  };

  const getConditionStyle = (toothNumber: number, surface: DentalSurface) => {
    // Priority 1: Full Tooth Conditions (Absence always shown)
    const absence = markings.find(m => m.toothNumber === toothNumber && m.condition === ToothCondition.ABSENCE);
    if (absence) return 'fill-slate-100 stroke-slate-300 opacity-50'; // Faded out for absence

    const active = markings.find(m => m.toothNumber === toothNumber && m.surfaces.includes(surface));
    if (!active) return 'fill-white stroke-slate-200';
    
    switch (active.condition) {
      case ToothCondition.CARIES: return 'fill-rose-500 stroke-rose-600';
      case ToothCondition.FILLING: return 'fill-blue-500 stroke-blue-600';
      case ToothCondition.CROWN: return 'fill-amber-500 stroke-amber-600';
      case ToothCondition.ENDODONTICS: return 'fill-emerald-500 stroke-emerald-600';
      default: return 'fill-slate-400 stroke-slate-500';
    }
  };

  const currentUpper = isPediatric ? PEDIATRIC_UPPER_ARCH : UPPER_ARCH;
  const currentLower = isPediatric ? PEDIATRIC_LOWER_ARCH : LOWER_ARCH;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[700px] lg:min-h-[850px]">
      {/* Sidebar Controls - Optimized for all screens */}
      <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-100 p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 bg-slate-50/50 shrink-0">
        <div>
          {patient && (
            <div className="mb-6 lg:mb-10 pb-6 lg:pb-8 border-b border-slate-200">
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2">Paciente en Atención</p>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight leading-none uppercase truncate">{patient.name}</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2">DNI: {patient.dni}</p>
            </div>
          )}

          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Dentición</h3>
          <div className="flex p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setViewMode('adult')}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap px-4",
                viewMode === 'adult' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Permanente
            </button>
            <button 
              onClick={() => setViewMode('pediatric')}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap px-4",
                viewMode === 'pediatric' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Decidua
            </button>
            <button 
              onClick={() => setViewMode('mixed')}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap px-4",
                viewMode === 'mixed' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Mixta
            </button>
          </div>

          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Hallazgos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
            {TREATMENTS.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedCondition(t.id)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border",
                  selectedCondition === t.id 
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-xl shadow-indigo-100" 
                    : "bg-white text-slate-600 border-slate-100 hover:border-indigo-200"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 border-white/20 shadow-sm", t.color)}></div>
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100">
           <button 
             onClick={() => setIsLearningMode(!isLearningMode)}
             className={cn(
               "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
               isLearningMode ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-white border border-slate-200 text-slate-400"
             )}
           >
             <BookOpen className="w-5 h-5" />
             {isLearningMode ? 'Modo Guía Activo' : 'Activar Guía FDI'}
           </button>
        </div>

        {isLearningMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 space-y-5"
          >
             <div className="flex items-center gap-3 text-indigo-700">
                <Shield className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Protocolo Clínico FDI</span>
             </div>
             
             <div className="space-y-3">
                <p className="text-sm font-black text-indigo-900 uppercase tracking-tight flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>
                   {TREATMENTS.find(t => t.id === selectedCondition)?.label}
                </p>
                <p className="text-xs text-indigo-600 leading-relaxed font-medium">
                   {TREATMENTS.find(t => t.id === selectedCondition)?.description}
                </p>
                <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                   <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">
                      Aplicación: {isPediatric ? 'Odontopediatría' : 'Adultos'}
                   </p>
                   <p className="text-[12px] text-indigo-800 font-bold leading-snug">
                      {isPediatric 
                        ? (TREATMENTS.find(t => t.id === selectedCondition) as any)?.studentNote?.pediatric 
                        : (TREATMENTS.find(t => t.id === selectedCondition) as any)?.studentNote?.adult
                      }
                   </p>
                </div>
             </div>
          </motion.div>
        )}

        <div className="pt-8 pt-auto">
           <button 
             onClick={handleSave}
             disabled={isSaving || isLoading}
             className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
           >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Guardando...' : 'Finalizar y Guardar'}
           </button>
        </div>
      </div>

      {/* Interactive Odontogram Stage */}
      <div className="flex-1 p-6 md:p-10 lg:p-16 flex flex-col items-center justify-start lg:justify-center space-y-10 md:space-y-16 relative overflow-hidden bg-slate-50/20">
        <div className="lg:hidden w-full flex items-center justify-center gap-2 mb-4 text-slate-400 animate-pulse">
           <span className="text-[10px] font-black uppercase tracking-widest">Desliza para ver piezas dentales</span>
           <div className="w-8 h-px bg-slate-200"></div>
        </div>

        <AnimatePresence>
          {validationError && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 lg:top-8 left-4 lg:left-8 right-4 lg:right-8 z-20 bg-rose-50 border border-rose-200 p-5 rounded-[2rem] flex items-center gap-4 shadow-2xl shadow-rose-100 max-w-2xl mx-auto"
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-[9px] lg:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Nota de Tratamiento</p>
                <p className="text-xs lg:text-sm text-rose-800 font-bold leading-tight">{validationError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-10 flex flex-col items-center justify-center gap-4">
             <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargando Odontodiagrama...</p>
          </div>
        )}
        
        <div className="w-full overflow-x-auto no-scrollbar pb-10 cursor-grab active:cursor-grabbing px-4">
          <div className="flex flex-col gap-10 lg:gap-14 min-w-[950px] lg:min-w-[1100px] w-full px-4 lg:px-8">
            {/* Adult Upper Arch */}
            {(viewMode === 'adult' || viewMode === 'mixed') && (
              <div className="grid grid-cols-16 gap-2 lg:gap-3">
                {UPPER_ARCH.map(num => (
                  <ToothComponent 
                    key={num} 
                    number={num} 
                    onSurfaceClick={(s) => toggleSurface(num, s)}
                    onSurfaceHover={(s) => setHoveredSurface(s)}
                    getStyle={(s) => getConditionStyle(num, s)}
                    isAbsent={markings.some(m => m.toothNumber === num && m.condition === ToothCondition.ABSENCE)}
                  />
                ))}
              </div>
            )}

            {/* Pediatric Upper Arch */}
            {(viewMode === 'pediatric' || viewMode === 'mixed') && (
              <div className={cn(
                "grid gap-4 px-24 md:px-32 lg:px-48",
                viewMode === 'mixed' ? "grid-cols-10 scale-90 -mt-10" : "grid-cols-10"
              )}>
                {PEDIATRIC_UPPER_ARCH.map(num => (
                  <ToothComponent 
                    key={num} 
                    number={num} 
                    onSurfaceClick={(s) => toggleSurface(num, s)}
                    onSurfaceHover={(s) => setHoveredSurface(s)}
                    getStyle={(s) => getConditionStyle(num, s)}
                    isAbsent={markings.some(m => m.toothNumber === num && m.condition === ToothCondition.ABSENCE)}
                  />
                ))}
              </div>
            )}

            <div className="h-px bg-slate-200/50 w-full relative my-6 lg:my-8">
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 lg:px-8 py-2 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap shadow-sm">
                  Línea de Oclusión • Arco Dental
               </div>
            </div>

            {/* Pediatric Lower Arch */}
            {(viewMode === 'pediatric' || viewMode === 'mixed') && (
              <div className={cn(
                "grid gap-4 px-24 md:px-32 lg:px-48",
                viewMode === 'mixed' ? "grid-cols-10 scale-90 -mb-10" : "grid-cols-10"
              )}>
                {PEDIATRIC_LOWER_ARCH.map(num => (
                  <ToothComponent 
                    key={num} 
                    number={num} 
                    onSurfaceClick={(s) => toggleSurface(num, s)}
                    onSurfaceHover={(s) => setHoveredSurface(s)}
                    getStyle={(s) => getConditionStyle(num, s)}
                    isAbsent={markings.some(m => m.toothNumber === num && m.condition === ToothCondition.ABSENCE)}
                  />
                ))}
              </div>
            )}

            {/* Adult Lower Arch */}
            {(viewMode === 'adult' || viewMode === 'mixed') && (
              <div className="grid grid-cols-16 gap-2 lg:gap-3">
                {LOWER_ARCH.map(num => (
                  <ToothComponent 
                    key={num} 
                    number={num} 
                    onSurfaceClick={(s) => toggleSurface(num, s)}
                    onSurfaceHover={(s) => setHoveredSurface(s)}
                    getStyle={(s) => getConditionStyle(num, s)}
                    isAbsent={markings.some(m => m.toothNumber === num && m.condition === ToothCondition.ABSENCE)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 lg:gap-10 pt-8 lg:pt-10 border-t border-slate-100 w-full justify-center">
           <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-rose-500 rounded-md border-2 border-white shadow-sm ring-1 ring-rose-100"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caries</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-md border-2 border-white shadow-sm ring-1 ring-blue-100"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Obturación</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-emerald-500 rounded-md border-2 border-white shadow-sm ring-1 ring-emerald-100"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conducto</span>
           </div>
           <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full shadow-inner">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Estándar ISO 3950</span>
           </div>
        </div>
      </div>
    </div>
  );
}

function ToothComponent({ number, onSurfaceClick, onSurfaceHover, getStyle, isAbsent }: { 
  key?: number;
  number: number;
  onSurfaceClick: (s: DentalSurface) => void;
  onSurfaceHover: (s: DentalSurface | null) => void;
  getStyle: (s: DentalSurface) => any;
  isAbsent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 group relative">
      <span className="text-[11px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase bg-slate-50 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 shadow-sm">{number}</span>
      <div className="relative p-1 bg-white rounded-xl shadow-sm border border-slate-50 group-hover:shadow-md transition-all">
        <svg 
          width="52" height="52" viewBox="0 0 100 100" 
          className="cursor-crosshair"
          onMouseLeave={() => onSurfaceHover(null)}
        >
          {/* Five Surfaces representation */}
          {/* Vestibular / Buccal (Outer) */}
          <path 
            d="M 5,5 L 95,5 L 75,25 L 25,25 Z" 
            className={cn("transition-colors duration-200 hover:opacity-80 active:scale-95", getStyle(DentalSurface.VESTIBULAR))} 
            onClick={() => onSurfaceClick(DentalSurface.VESTIBULAR)}
            onMouseEnter={() => onSurfaceHover(DentalSurface.VESTIBULAR)}
          />
          {/* Mesial */}
          <path 
            d="M 5,5 L 25,25 L 25,75 L 5,95 Z" 
            className={cn("transition-colors duration-200 hover:opacity-80 active:scale-95", getStyle(DentalSurface.MESIAL))} 
            onClick={() => onSurfaceClick(DentalSurface.MESIAL)}
            onMouseEnter={() => onSurfaceHover(DentalSurface.MESIAL)}
          />
          {/* Distal */}
          <path 
            d="M 95,5 L 75,25 L 75,75 L 95,95 Z" 
            className={cn("transition-colors duration-200 hover:opacity-80 active:scale-95", getStyle(DentalSurface.DISTAL))} 
            onClick={() => onSurfaceClick(DentalSurface.DISTAL)}
            onMouseEnter={() => onSurfaceHover(DentalSurface.DISTAL)}
          />
          {/* Lingual / Palatine (Inner) */}
          <path 
            d="M 25,75 L 75,75 L 95,95 L 5,95 Z" 
            className={cn("transition-colors duration-200 hover:opacity-80 active:scale-95", getStyle(DentalSurface.LINGUAL))} 
            onClick={() => onSurfaceClick(DentalSurface.LINGUAL)}
            onMouseEnter={() => onSurfaceHover(DentalSurface.LINGUAL)}
          />
          {/* Occlusal / Incisal (Center) */}
          <rect 
            x="25" y="25" width="50" height="50" 
            className={cn("transition-colors duration-200 hover:opacity-80 active:scale-95", getStyle(DentalSurface.OCCLUSAL))} 
            onClick={() => onSurfaceClick(DentalSurface.OCCLUSAL)}
            onMouseEnter={() => onSurfaceHover(DentalSurface.OCCLUSAL)}
          />
        </svg>
        {isAbsent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-900/5 backdrop-blur-[1px] rounded-xl">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-400 drop-shadow-sm">
               <line x1="18" y1="6" x2="6" y2="18" />
               <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

