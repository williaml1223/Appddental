import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, MoreHorizontal, UserPlus, FileText, ChevronRight, Phone, Mail, X, Loader2, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { medicalService } from '../services/medicalService';
import { auth } from '../lib/firebase';
import { Patient } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { EmptyState } from '../components/ui/EmptyState';
import { useNotification } from '../components/ui/Notification';
import PatientModal from '../components/dental/PatientModal';

export default function Patients() {
  const { showNotification } = useNotification();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPatients = async () => {
    setIsLoading(true);
    const data = await medicalService.getPatients();
    setPatients(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        loadPatients();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dni.includes(searchTerm)
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight font-sans uppercase">Directorio Clínico</h1>
          <p className="text-slate-400 text-sm font-medium">Base de datos unificada de pacientes y registros.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <UserPlus className="w-5 h-5" />
          Registrar Paciente
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-center">
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder="Buscar por nombre o identificación..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
          />
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors border border-slate-100">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPatients.map((patient, i) => (
            <motion.div
              layout
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-[2rem] border border-slate-200 p-5 md:p-6 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-indigo-50 rounded-[1.5rem] md:rounded-3xl flex items-center justify-center text-indigo-600 text-xl md:text-2xl font-black border border-indigo-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shrink-0">
                    {patient.name[0]}{patient.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter group-hover:text-indigo-700 transition-colors mb-1 truncate">
                      {patient.name} {patient.lastName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                      <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100 text-slate-500">ID: {patient.dni}</span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3 h-3" /> {patient.phone}</span>
                      <span className="hidden sm:flex items-center gap-1.5 whitespace-nowrap"><Mail className="w-3 h-3" /> {patient.email}</span>
                      <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap"><Calendar className="w-3 h-3" /> {format(patient.createdAt, 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden xl:block text-right mr-4">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Última Visita</p>
                        <p className="text-sm font-bold text-slate-500">{patient.lastVisit || 'Hoy'}</p>
                    </div>
                    <Link 
                      to={`/patients/${patient.id}`}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Expediente
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <button className="p-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-300 rounded-xl transition-all border border-slate-100">
                      <MoreHorizontal className="w-6 h-6" />
                    </button>
                </div>
              </div>
              
              {/* Abstract decorative element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 -translate-y-1/2"></div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-indigo-600 gap-4">
             <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin-slow opacity-20" />
                <Loader2 className="w-12 h-12 animate-spin absolute inset-0" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando pacientes...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <EmptyState 
            icon={Search}
            title="Sin resultados"
            description={searchTerm ? `No encontramos pacientes que coincidan con "${searchTerm}"` : "No hay pacientes registrados en el sistema."}
            action={!searchTerm ? {
                label: "Registrar Paciente",
                onClick: () => setIsModalOpen(true)
            } : undefined}
          />
        ) : null}
      </div>

      <PatientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadPatients}
      />
    </div>
  );
}
