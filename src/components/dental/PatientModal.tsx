import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { medicalService } from '../../services/medicalService';
import { useNotification } from '../ui/Notification';

import { Patient } from '../../types';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient?: Patient | null;
}

export default function PatientModal({ isOpen, onClose, onSuccess, patient }: PatientModalProps) {
  const { showNotification } = useNotification();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const patientData = {
      name: formData.get('name') as string,
      lastName: formData.get('lastName') as string,
      dni: formData.get('dni') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      birthDate: formData.get('birthDate') as string,
      address: formData.get('address') as string,
      bloodType: formData.get('bloodType') as string,
      allergies: formData.get('allergies') as string,
      observations: formData.get('observations') as string,
    };

    try {
      if (patient) {
        await medicalService.updatePatient(patient.id, patientData);
        showNotification('success', 'Paciente actualizado correctamente');
      } else {
        await medicalService.createPatient(patientData);
        showNotification('success', 'Paciente registrado correctamente');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showNotification('error', `Error al ${patient ? 'actualizar' : 'registrar'} el paciente`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="bg-indigo-600 p-6 md:p-8 flex items-center justify-between text-white shrink-0">
               <div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase mb-1">
                    {patient ? 'Editar Paciente' : 'Nuevo Paciente'}
                  </h3>
                  <p className="text-[9px] md:text-[10px] font-black text-white/60 uppercase tracking-widest">
                    {patient ? 'Actualización de Expediente Clínico' : 'Apertura de Expediente Clínico'}
                  </p>
               </div>
               <button onClick={onClose} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                  <input name="name" defaultValue={patient?.name} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apellidos</label>
                  <input name="lastName" defaultValue={patient?.lastName} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI / Identificación</label>
                  <input name="dni" defaultValue={patient?.dni} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Nacimiento</label>
                  <input name="birthDate" type="date" defaultValue={patient?.birthDate} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</label>
                  <input name="phone" defaultValue={patient?.phone} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                  <input name="email" type="email" defaultValue={patient?.email} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección Residencia</label>
                <input name="address" defaultValue={patient?.address} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Sangre</label>
                  <input name="bloodType" defaultValue={patient?.bloodType} placeholder="O+, A-, etc." className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alergias</label>
                  <input name="allergies" defaultValue={patient?.allergies} placeholder="Ninguna" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones</label>
                <textarea name="observations" defaultValue={patient?.observations} rows={3} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold" />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 shrink-0">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {isSaving ? 'Guardando...' : (patient ? 'Guardar Cambios' : 'Confirmar Registro')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
