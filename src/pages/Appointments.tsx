import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, Clock, User, Filter, 
  MoreVertical, CheckCircle2, XCircle, ChevronLeft, 
  ChevronRight, Plus, Loader2, Search, CalendarPlus
} from 'lucide-react';
import { medicalService } from '../services/medicalService';
import { auth } from '../lib/firebase';
import { Appointment, AppointmentStatus } from '../types';
import { format, addDays, startOfToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import AppointmentModal from '../components/dental/AppointmentModal';
import { EmptyState } from '../components/ui/EmptyState';
import { useNotification } from '../components/ui/Notification';

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const { showNotification } = useNotification();

  const fetchAppointments = async () => {
    setIsLoading(true);
    const data = await medicalService.getAllAppointments();
    setAppointments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAppointments();
      }
    });

    return () => unsubscribeAuth();
  }, [showNotification]);

  const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
    try {
      await medicalService.updateAppointmentStatus(id, status);
      showNotification('success', `Cita ${status === AppointmentStatus.COMPLETED ? 'completada' : 'cancelada'}`);
      
      // Re-fetch appointments after update
      const data = await medicalService.getAllAppointments();
      setAppointments(data);
    } catch (e) {
      showNotification('error', 'Error al actualizar la cita');
    }
  };

  const currentViewApts = appointments.filter(apt => {
    if (viewMode === 'day') {
      return isSameDay(apt.date, selectedDate);
    } else {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return apt.date >= weekStart.getTime() && apt.date <= weekEnd.getTime();
    }
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Agenda Médica</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
            <CalendarIcon className="w-3 h-3" />
            Gestionando {appointments.length} citas programadas
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" /> Nueva Cita
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Weekly Calendar Component */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{format(selectedDate, 'MMMM yyyy', { locale: es })}</p>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                       <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                       <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-8">
                 {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                   <div key={d} className="text-center text-[10px] font-black text-slate-300 py-2">{d}</div>
                 ))}
                 {weekDays.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, startOfToday());
                    const hasAppointments = appointments.some(a => isSameDay(a.date, day));
                    
                    return (
                      <button
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all group",
                          isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "hover:bg-slate-50",
                          isToday && !isSelected && "ring-2 ring-indigo-100"
                        )}
                      >
                         <span className={cn(
                           "text-[10px] font-black",
                           isSelected ? "text-white" : "text-slate-700",
                           isToday && !isSelected && "text-indigo-600"
                         )}>
                            {format(day, 'd')}
                         </span>
                         {hasAppointments && !isSelected && (
                           <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1"></div>
                         )}
                      </button>
                    );
                 })}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                 <button 
                   onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
                   className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                 >
                    <Filter className="w-3 h-3" /> Ver por {viewMode === 'day' ? 'Semana' : 'Día'}
                 </button>
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Resumen Semanal</p>
              <p className="text-2xl font-black tracking-tighter mb-6">{appointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length} Citas Pendientes</p>
              <button 
                 onClick={() => setIsModalOpen(true)}
                 className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
              >
                 + Crear día de cita
              </button>
           </div>
        </div>

        {/* Appointments List Area */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tighter uppercase">
                 {viewMode === 'day' ? `Citas para el ${format(selectedDate, 'd MMM', { locale: es })}` : 'Agenda de la semana'}
              </h2>
           </div>

           <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando agenda...</p>
                </div>
              ) : currentViewApts.length > 0 ? (
                currentViewApts.map((apt) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={apt.id} 
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-6 group hover:shadow-xl hover:shadow-indigo-50/50 transition-all"
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shrink-0">
                         <Clock className="w-5 h-5 mb-1" />
                         <span className="text-[10px] font-black uppercase tracking-tighter">{format(apt.date, 'HH:mm')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                           <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">{apt.patientName || 'Cargando paciente...'}</h4>
                           <span className={cn(
                             "text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shrink-0",
                             apt.status === AppointmentStatus.SCHEDULED ? "bg-amber-100 text-amber-600" :
                             apt.status === AppointmentStatus.COMPLETED ? "bg-emerald-100 text-emerald-600" :
                             "bg-rose-100 text-rose-600"
                           )}>
                              {apt.status}
                           </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                           <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                           {apt.reason}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                      {apt.status === AppointmentStatus.SCHEDULED && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(apt.id, AppointmentStatus.COMPLETED)}
                            className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                            title="Marcar como completada"
                          >
                             <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(apt.id, AppointmentStatus.CANCELLED)}
                            className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                            title="Cancelar cita"
                          >
                             <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 hover:bg-slate-100 transition-all shadow-sm">
                         <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState 
                  icon={CalendarIcon}
                  title="No hay citas registradas"
                  description="No se encontraron encuentros programados para este periodo."
                  className="py-16"
                  action={{
                    label: "Agendar Cita",
                    onClick: () => setIsModalOpen(true)
                  }}
                />
              )}
           </div>
        </div>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
