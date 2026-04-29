import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, 
  ImageIcon, History, Plus, Download, ExternalLink, 
  MoreVertical, CheckCircle2, AlertCircle, Trash2, Edit2, Shield,
  Stethoscope, Receipt, X, ZoomIn, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { EmptyState } from '../components/ui/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Odontogram from '../components/dental/Odontogram';
import BudgetGenerator from '../components/dental/BudgetGenerator';
import AppointmentModal from '../components/dental/AppointmentModal';
import PatientModal from '../components/dental/PatientModal';
import { medicalService } from '../services/medicalService';
import { auth } from '../lib/firebase';
import { Appointment, Budget, BudgetItem, MedicalDocument, Patient } from '../types';
import { useNotification } from '../components/ui/Notification';

type Tab = 'history' | 'documents' | 'appointments' | 'odontogram' | 'budget';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    let unsubscribeDocuments: (() => void) | undefined;

    const fetchData = async () => {
      setIsLoading(true);
      const data = await medicalService.getPatient(id);
      setPatient(data);
      setIsLoading(false);

      setIsLoadingAppointments(true);
      medicalService.getAppointments(id).then(data => {
        setAppointments(data);
        setIsLoadingAppointments(false);
      });

      setIsLoadingBudgets(true);
      medicalService.getBudgets(id).then(data => {
        setBudgets(data);
        setIsLoadingBudgets(false);
      });

      setIsLoadingDocuments(true);
      unsubscribeDocuments = medicalService.watchDocuments(id, (data) => {
        setDocuments(data);
        setIsLoadingDocuments(false);
      }) as any;
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      }
    });

    return () => {
      unsubscribeAuth();
      if (typeof unsubscribeDocuments === 'function') {
        unsubscribeDocuments();
      }
    };
  }, [id, showNotification]);

  const loadPatientData = async () => {
    if (!id || !auth.currentUser) return;
    const data = await medicalService.getPatient(id);
    setPatient(data);
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await medicalService.deletePatient(id);
      showNotification('success', 'Paciente eliminado correctamente');
      navigate('/patients');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Error al eliminar el paciente');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'history', label: 'Historial Clínico', icon: History },
    { id: 'odontogram', label: 'Odontodiagrama', icon: Stethoscope },
    { id: 'budget', label: 'Presupuestos', icon: Receipt },
    { id: 'documents', label: 'Radiografías', icon: ImageIcon },
    { id: 'appointments', label: 'Citas', icon: Calendar },
  ];

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-indigo-600 gap-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin-slow opacity-20" />
          <Loader2 className="w-16 h-16 animate-spin absolute inset-0" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recuperando información del paciente...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-6">
        <div className="w-24 h-24 bg-rose-50 rounded-[3rem] flex items-center justify-center text-rose-500 mb-6 shadow-xl shadow-rose-100 border border-rose-100">
           <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">Paciente no encontrado</h2>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest leading-relaxed max-w-md mb-10">
          El registro que busca no existe o fue eliminado permanentemente de la base de datos.
        </p>
        <Link to="/patients" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-3">
           <ArrowLeft className="w-5 h-5" /> Volver al Directorio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <Link to="/patients" className="inline-flex items-center gap-3 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-colors">
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm"><ArrowLeft className="w-4 h-4" /></div>
          <span className="hidden xs:inline">Volver al Directorio</span>
          <span className="xs:hidden">Volver</span>
        </Link>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
             onClick={() => setShowDeleteConfirm(true)}
             className="p-4 bg-white border border-rose-100 text-rose-300 rounded-2xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
          >
             <Trash2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden md:inline">Editar Perfil</span>
            <span className="md:hidden">Editar</span>
          </button>
          <button 
             onClick={() => setIsAptModalOpen(true)}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Calendar className="w-5 h-5" />
            <span className="hidden md:inline">Programar Cita</span>
            <span className="md:hidden">Cita</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sleek Sidebar Profile */}
        <aside className="lg:col-span-3 space-y-8 flex flex-col">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 text-center relative overflow-hidden group">
            <div className="w-32 h-32 bg-indigo-50 rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-4xl font-black text-indigo-600 border-4 border-white shadow-xl relative z-10 group-hover:scale-105 transition-transform duration-500">
               {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="relative z-10">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{patient.name}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-8">ID: {patient.dni} • {calculateAge(patient.birthDate)} años</p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><Phone className="w-4 h-4 text-slate-400" /></div>
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><Mail className="w-4 h-4 text-slate-400" /></div>
                    <span className="truncate">{patient.email}</span>
                  </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-[60px] opacity-40 translate-x-1/2 -translate-y-1/2"></div>
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 shadow-sm shadow-indigo-50/50">
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1.5">Tipo de Sangre</p>
              <p className="text-lg font-black text-indigo-900 tracking-tight">{patient.bloodType}</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 shadow-sm shadow-rose-50/50">
              <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-1.5 flex items-center gap-2">
                 <AlertCircle className="w-3 h-3" /> Alergias
              </p>
              <p className="text-sm font-bold text-rose-700 leading-snug">{patient.allergies}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Observaciones Críticas</p>
             <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-indigo-100 pl-4">
                {patient.observations ? `"${patient.observations}"` : "Sin observaciones registradas."}
             </p>
          </div>

          <div className="space-y-3">
             <a 
               href={`https://wa.me/${patient.phone.replace(/\D/g, '')}`}
               target="_blank"
               rel="noreferrer"
               className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
             >
               <Phone className="w-4 h-4" /> WhatsApp
             </a>
             <a 
               href={`mailto:${patient.email}`}
               className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
             >
               <Mail className="w-4 h-4" /> Enviar Correo
             </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-10 order-1 lg:order-2">
          {/* Custom Sleek Tabs */}
          <div className="flex overflow-x-auto no-scrollbar gap-6 md:gap-8 border-b border-slate-200 -mx-4 px-4 md:mx-0 md:px-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    "pb-4 md:pb-6 px-1 font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 border-b-4 whitespace-nowrap",
                    isActive 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
             >
                {activeTab === 'history' && <ClinicalHistory />}
                {activeTab === 'odontogram' && <Odontogram />}
                 {activeTab === 'budget' && (
                   isCreatingBudget ? (
                     <div className="space-y-6">
                       <button 
                         onClick={() => setIsCreatingBudget(false)}
                         className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
                       >
                         <ArrowLeft className="w-4 h-4" /> Volver al Listado
                       </button>
                       <BudgetGenerator onSaved={async () => {
                         setIsCreatingBudget(false);
                         if (id) {
                           setIsLoadingBudgets(true);
                           const updated = await medicalService.getBudgets(id);
                           setBudgets(updated);
                           setIsLoadingBudgets(false);
                         }
                       }} />
                     </div>
                   ) : (
                     <BudgetList 
                       budgets={budgets} 
                       isLoading={isLoadingBudgets} 
                       onNew={() => setIsCreatingBudget(true)}
                       onUpdateStatus={async (budgetId, updates) => {
                         if (!id) return;
                         await medicalService.updateBudget(id, budgetId, updates);
                         const updated = await medicalService.getBudgets(id);
                         setBudgets(updated);
                       }}
                     />
                   )
                 )}
                {activeTab === 'documents' && <DocumentsGallery documents={documents} isLoading={isLoadingDocuments} />}
                {activeTab === 'appointments' && (
                  <AppointmentsTable 
                    appointments={appointments} 
                    isLoading={isLoadingAppointments} 
                    onNew={() => setIsAptModalOpen(true)} 
                  />
                )}
             </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-6 shadow-lg shadow-rose-100">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">¿Eliminar Paciente?</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed mb-10">
                Esta acción es irreversible y eliminará todo el historial clínico, presupuestos y radiografías asociados a {patient.name} {patient.lastName}.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Registro'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {patient && (
        <AppointmentModal 
          isOpen={isAptModalOpen}
          onClose={() => setIsAptModalOpen(false)}
          onSuccess={async () => {
            setIsLoadingAppointments(true);
            const data = await medicalService.getAppointments(id!);
            setAppointments(data);
            setIsLoadingAppointments(false);
          }}
          selectedPatient={patient}
        />
      )}

      {patient && (
        <PatientModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={loadPatientData}
          patient={patient}
        />
      )}
    </div>
  );
}

function ClinicalHistory() {
  const notes = [
    { id: 1, date: '14 May 2024', title: 'Limpieza y Profilaxis', content: 'Paciente presenta encías sanas. Se realiza remoción de cálculo en sector anteroinferior. Próxima cita para revisión de ortodoncia.', tag: 'Última: hace 2 días', color: 'indigo' },
    { id: 2, date: '22 Mar 2024', title: 'Endodoncia Conducto Molar 4.6', content: 'Fase II completada. No se reporta dolor a la percusión. Se coloca restauración provisional de ionómero.', tag: 'Completado', color: 'slate' },
    { id: 3, date: '05 Feb 2024', title: 'Evaluación Inicial', content: 'Diagnóstico general. Se sugiere plan de tratamiento integral incluyendo cirugía de terceros molares.', tag: 'Diagnóstico', color: 'slate' },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm min-h-[500px]">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Notas de Evolución</h3>
        <div className="flex bg-slate-50 p-1 rounded-xl">
           <button className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><History className="w-4 h-4" /></button>
           <button className="p-2 text-slate-400"><Clock className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-12">
        {notes.map((note) => (
          <div key={note.id} className={cn("relative pl-10 border-l-[3px] transition-opacity", note.color === 'slate' ? "border-slate-100 opacity-60" : "border-indigo-600")}>
            <div className={cn(
              "absolute -left-[10px] top-0 w-[18px] h-[18px] rounded-full border-4 border-white shadow-md",
              note.color === 'indigo' ? "bg-indigo-600" : "bg-slate-300"
            )} />
            
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                 <h4 className="text-lg font-black text-slate-800 tracking-tight">{note.title}</h4>
                 <span className={cn(
                   "text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-widest",
                   note.color === 'indigo' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-400"
                 )}>
                   {note.tag}
                 </span>
              </div>
              <span className="text-xs font-bold text-slate-400">{note.date}</span>
            </div>
            
            <p className={cn(
              "text-sm leading-relaxed font-medium",
              note.color === 'indigo' ? "text-slate-600 italic" : "text-slate-500"
            )}>
              {note.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsGallery({ documents, isLoading }: { documents: MedicalDocument[], isLoading: boolean }) {
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocument | null>(null);

  const mockDocs = [
    { id: '1', name: 'Panorámica Inicial', type: 'XRAY', url: 'https://images.unsplash.com/photo-1620067664453-2775797305d2?auto=format&fit=crop&q=80&w=800', createdAt: Date.now() - 10000000 },
    { id: '2', name: 'Periapical Molar 4.6', type: 'PHOTO', url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800', createdAt: Date.now() - 20000000 },
  ];

  const displayDocs = documents.length > 0 ? documents : mockDocs;

  return (
    <div className="space-y-8">
       <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-sm relative">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tighter">Radiografías Recientes</h3>
             <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Ver todas ({displayDocs.length})</button>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando archivos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6">
               {displayDocs.map((doc) => (
                 <motion.div 
                   key={doc.id}
                   whileHover={{ y: -5 }}
                   onClick={() => setSelectedDoc(doc)}
                   className="aspect-square bg-slate-900 rounded-3xl flex items-center justify-center relative overflow-hidden group cursor-pointer border-4 border-white shadow-xl transition-all duration-300"
                 >
                    <img 
                      src={doc.url} 
                      alt={doc.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity grayscale hover:grayscale-0 duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Hover Info Overlay */}
                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                       <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{doc.type}</p>
                          <h4 className="text-sm font-black text-white leading-tight mb-1 truncate">{doc.name}</h4>
                          <div className="flex items-center gap-2 text-[9px] font-bold text-white/60 uppercase">
                             <Calendar className="w-3 h-3" />
                             {format(doc.createdAt, 'dd MMM, yyyy', { locale: es })}
                          </div>
                       </div>
                       <ZoomIn className="absolute top-4 right-4 w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                    </div>
                 </motion.div>
               ))}

               <button className="aspect-square border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-3 group hover:border-indigo-200 hover:bg-white transition-all transition-duration-500 min-h-[160px]">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest group-hover:text-indigo-600">Subir Placa</span>
               </button>
            </div>
          )}
       </div>

       <div className="bg-indigo-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden text-center md:text-left">
          <div className="relative z-10 flex-1">
             <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Almacenamiento Seguro</span>
             </div>
             <h4 className="text-xl md:text-2xl font-black uppercase mb-2 tracking-tight">Protocolo de Visualización</h4>
             <p className="text-indigo-200 text-sm font-medium leading-relaxed max-w-lg italic">Todas las imágenes son procesadas con algoritmos de ISO-27001 para asegurar que la privacidad del paciente sea la prioridad número uno.</p>
          </div>
          <button className="relative z-10 w-full md:w-auto px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-colors">
            Descargar DICOM
          </button>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
       </div>

       {/* Detail Modal */}
       <AnimatePresence>
          {selectedDoc && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 overflow-y-auto">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedDoc(null)}
                 className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl"
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="relative w-full max-w-5xl bg-white rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
               >
                  <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 relative overflow-y-auto min-h-[300px]">
                     <img 
                       src={selectedDoc.url} 
                       alt={selectedDoc.name}
                       className="max-h-full max-w-full object-contain rounded-2xl shadow-lg relative z-10 transition-transform duration-700"
                       referrerPolicy="no-referrer"
                     />
                  </div>
                  <div className="w-full md:w-80 p-6 md:p-10 flex flex-col justify-between bg-white border-l border-slate-100 shrink-0">
                     <div>
                        <div className="flex items-center justify-between mb-8">
                           <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 tracking-widest">
                              {selectedDoc.type}
                           </span>
                           <button 
                             onClick={() => setSelectedDoc(null)}
                             className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-600 transition-all"
                           >
                              <X className="w-5 h-5" />
                           </button>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-4 uppercase">{selectedDoc.name}</h3>
                        <div className="space-y-4 md:space-y-6">
                           <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold text-slate-500">
                              <Calendar className="w-4 h-4 text-slate-300 shrink-0" />
                              <span>Fecha: {format(selectedDoc.createdAt, 'dd MMMM, yyyy', { locale: es })}</span>
                           </div>
                           <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold text-slate-500">
                              <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                              <span>Hora: {format(selectedDoc.createdAt, 'hh:mm a')}</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 flex flex-col gap-3">
                        <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100">
                           <Download className="w-4 h-4" /> Descargar Original
                        </button>
                        <button className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                           Compartir Original
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
       </AnimatePresence>
    </div>
  );
}

function AppointmentsTable({ appointments, isLoading, onNew }: { appointments: Appointment[], isLoading: boolean, onNew: () => void }) {
  const statusConfig = {
    'SCHEDULED': { label: 'Confirmada', color: 'emerald', icon: CheckCircle2 },
    'COMPLETED': { label: 'Completada', color: 'slate', icon: CheckCircle2 },
    'CANCELLED': { label: 'Cancelada', color: 'rose', icon: AlertCircle },
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 md:p-10">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Historial de Citas</h3>
          <button 
            onClick={onNew}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
             Agendar Nueva
          </button>
       </div>

       {isLoading ? (
         <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando historial...</p>
         </div>
       ) : appointments.length === 0 ? (
         <EmptyState 
           icon={Calendar}
           title="Sin historial"
           description="No se han registrado citas previas."
           className="py-12"
         />
       ) : (
         <div className="space-y-4 md:space-y-6">
            {appointments.map((apt) => {
              const config = statusConfig[apt.status] || statusConfig['SCHEDULED'];
              return (
                <div key={apt.id} className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8 p-5 md:p-6 rounded-3xl border border-slate-50 transition-all group", 
                  apt.status === 'COMPLETED' || apt.status === 'CANCELLED' ? "opacity-60" : "hover:bg-slate-50 hover:shadow-lg hover:shadow-indigo-50/50 hover:border-indigo-100"
                )}>
                   <div className="flex items-center gap-6 flex-1">
                      <div className={cn(
                        "w-14 h-14 md:w-16 md:h-16 min-w-[56px] md:min-w-[64px] rounded-2xl flex flex-col items-center justify-center border transition-all duration-500",
                        config.color === 'emerald' ? "bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" : 
                        config.color === 'rose' ? "bg-rose-50 border-rose-100 text-rose-600" :
                        "bg-slate-100 border-slate-200 text-slate-400"
                      )}>
                         <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{format(apt.date, 'MMM', { locale: es })}</span>
                         <span className="text-xl md:text-2xl font-black leading-none">{format(apt.date, 'dd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-base md:text-lg font-black text-slate-800 tracking-tight mb-1 group-hover:text-indigo-700 transition-colors uppercase truncate">{apt.reason}</h4>
                         <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-sans whitespace-nowrap">
                               <Clock className="w-3 h-3" /> {format(apt.date, 'hh:mm a')}
                            </span>
                            <span className={cn(
                              "text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap",
                              config.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                              config.color === 'rose' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                              "bg-slate-100 text-slate-400 border border-slate-200"
                            )}>
                               <config.icon className="w-2.5 h-2.5" />
                               {config.label}
                            </span>
                         </div>
                      </div>
                   </div>
                   <div className="flex justify-end gap-2 shrink-0">
                      <button className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all">
                         <MoreVertical className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              );
            })}
         </div>
       )}
    </div>
  );
}

function BudgetList({ budgets, isLoading, onNew, onUpdateStatus }: { 
  budgets: Budget[], 
  isLoading: boolean, 
  onNew: () => void,
  onUpdateStatus: (id: string, updates: Partial<Budget>) => Promise<void>
}) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 md:p-10">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Presupuestos</h3>
          <button 
            onClick={onNew}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md"
          >
             Nuevo Presupuesto
          </button>
       </div>

       {isLoading ? (
         <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando presupuestos...</p>
         </div>
       ) : budgets.length === 0 ? (
         <EmptyState 
           icon={Receipt}
           title="Sin presupuestos"
           description="Comience creando un nuevo presupuesto para este paciente."
           className="py-12"
           action={{
             label: "Nuevo Presupuesto",
             onClick: onNew
           }}
         />
       ) : (
         <div className="space-y-4 md:space-y-6">
            {budgets.map((budget) => {
              const acceptedItemsCount = budget.items?.filter(i => i.status === 'ACCEPTED').length || 0;
              const totalItems = budget.items?.length || 0;
              
              return (
                <div key={budget.id} className="p-6 md:p-8 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all group">
                   <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 md:gap-6">
                         <div className={cn(
                           "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors shrink-0",
                           acceptedItemsCount === totalItems && totalItems > 0 ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                         )}>
                            <Receipt className="w-5 h-5 md:w-6 md:h-6" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">
                               {new Date(budget.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <h4 className="text-base md:text-lg font-black text-slate-800 tracking-tight truncate">Presupuesto #{budget.id.slice(-4).toUpperCase()}</h4>
                            <div className="flex gap-2 mt-2">
                               <span className={cn(
                                 "text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border whitespace-nowrap",
                                 acceptedItemsCount === totalItems && totalItems > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                               )}>
                                  {acceptedItemsCount} / {totalItems} aceptados
                               </span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between md:justify-end border-t xl:border-t-0 border-slate-100 pt-4 xl:pt-0">
                         <div className="sm:text-right">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                            <p className="text-xl md:text-2xl font-black text-slate-900">${budget.total.toFixed(2)}</p>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => onUpdateStatus(budget.id, { status: 'ACCEPTED' })}
                              className="flex-1 sm:flex-none p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center"
                              title="Marcar como Aceptado"
                            >
                               <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button className="flex-1 sm:flex-none p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center">
                               <Download className="w-5 h-5" />
                            </button>
                            <button className="flex-1 sm:flex-none p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center">
                               <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              );
            })}
         </div>
       )}
    </div>
  );
}
