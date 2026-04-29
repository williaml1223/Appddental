import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Calendar, Receipt, TrendingUp, Clock, 
  ArrowRight, UserCheck, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { medicalService } from '../services/medicalService';
import { auth } from '../lib/firebase';
import { Patient, Appointment, Budget, AppointmentStatus } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { EmptyState } from '../components/ui/EmptyState';
import AppointmentModal from '../components/dental/AppointmentModal';
import PatientModal from '../components/dental/PatientModal';
import { useNotification } from '../components/ui/Notification';

export default function Dashboard() {
  const { showNotification } = useNotification();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingBudgets: 0,
    revenueMonth: 0
  });
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [todayApts, setTodayApts] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const loadTodayApts = async () => {
    setIsLoading(true);
    try {
      const appointments = await medicalService.getAllAppointments();
      const today = new Date();
      const filtered = appointments.filter(a => isSameDay(new Date(a.date), today));
      setTodayApts(filtered);
      setStats(prev => ({ ...prev, todayAppointments: filtered.length }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribePatients: () => void = () => {};

    const setupWatchers = () => {
      if (!auth.currentUser) return;
      
      setIsLoading(true);
      unsubscribePatients = medicalService.watchPatients((patients) => {
        setRecentPatients(patients.slice(0, 5));
        setStats(prev => ({ ...prev, totalPatients: patients.length }));
      });
      loadTodayApts();
    };

    // Watch for auth changes
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setupWatchers();
      }
    });

    return () => {
      unsubscribePatients();
      unsubscribeAuth();
    };
  }, []);

  const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
    try {
      await medicalService.updateAppointmentStatus(id, status);
      showNotification('success', `Cita ${status === AppointmentStatus.COMPLETED ? 'completada' : 'cancelada'}`);
      loadTodayApts();
    } catch (e) {
      showNotification('error', 'Error al actualizar la cita');
    }
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Panel de Control</h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Agenda para hoy, {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/patients"
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            Ver Pacientes
          </Link>
          <button 
            onClick={() => setIsAptModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Pacientes', value: stats.totalPatients, icon: Users, color: 'indigo' },
          { label: 'Citas Hoy', value: stats.todayAppointments, icon: Calendar, color: 'emerald' },
          { label: 'Presupuestos', value: stats.pendingBudgets, icon: Receipt, color: 'amber' },
          { label: 'Ingresos', value: `$${stats.revenueMonth}`, icon: TrendingUp, color: 'rose' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: i * 0.1,
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1]
            }}
            key={stat.label}
            className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-default"
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner",
              stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
              stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
              stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
              "bg-rose-50 text-rose-600"
            )}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Appointments Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 tracking-tighter uppercase">Próximas Citas</h2>
            <Link to="/appointments" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
              Ver Agenda Completa <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse" />)
            ) : todayApts.length > 0 ? (
              todayApts.map((apt) => (
                <div key={apt.id} className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 group hover:border-indigo-100 transition-all hover:shadow-lg hover:shadow-indigo-50/20">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shrink-0">
                      <span className="text-[9px] md:text-[10px] font-black uppercase">{format(apt.date, 'MMM')}</span>
                      <span className="text-xl md:text-2xl font-black">{format(apt.date, 'dd')}</span>
                    </div>
                  <div className="flex-1 min-w-0">
                      <h4 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">{apt.patientName || 'Paciente'}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap">
                          <Clock className="w-3 h-3" /> {format(apt.date, 'hh:mm a')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap">
                          <TrendingUp className="w-3 h-3" /> {apt.reason}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                    <button 
                      onClick={() => handleStatusUpdate(apt.id, AppointmentStatus.COMPLETED)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-emerald-600 hover:bg-emerald-50 transition-all" 
                      title="Completar"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(apt.id, AppointmentStatus.CANCELLED)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-600 hover:bg-rose-50 transition-all" 
                      title="Cancelar"
                    >
                      <AlertCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState 
                icon={Calendar}
                title="Sin citas hoy"
                description="No tienes pacientes programados para el resto del día."
                action={{
                  label: "Programar Cita",
                  onClick: () => setIsAptModalOpen(true)
                }}
              />
            )}
          </div>
        </div>

        {/* Sidebar Column: Recent Patients */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 tracking-tighter uppercase">Pacientes Recientes</h2>
            <Link to="/patients" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver Todos</Link>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
            <div className="space-y-6">
              {recentPatients.map((patient, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  key={patient.id}
                >
                  <Link 
                    to={`/patients/${patient.id}`}
                    className="flex items-center gap-4 group transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {patient.name[0]}{patient.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{patient.name} {patient.lastName}</h4>
                      <p className="text-[10px] font-bold text-slate-400 truncate tracking-widest">{patient.dni}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              ))}
            </div>
            {recentPatients.length === 0 && !isLoading && (
              <div className="text-center py-6">
                <p className="text-xs font-bold text-slate-300 italic">No hay pacientes registrados</p>
              </div>
            )}
            <button 
              onClick={() => setIsPatientModalOpen(true)}
              className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
            >
              + Registrar Paciente
            </button>
          </div>
        </div>
      </div>
      <AppointmentModal 
        isOpen={isAptModalOpen}
        onClose={() => setIsAptModalOpen(false)}
        onSuccess={loadTodayApts}
      />
      <PatientModal 
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => {}} // stats will update via firestore watcher
      />
    </div>
  );
}
