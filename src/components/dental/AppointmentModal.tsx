import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, MessageSquare, Loader2 } from 'lucide-react';
import { Patient, AppointmentStatus } from '../../types';
import { medicalService } from '../../services/medicalService';
import { useNotification } from '../ui/Notification';
import { cn } from '../../lib/utils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedPatient?: Patient;
}

export default function AppointmentModal({ isOpen, onClose, onSuccess, selectedPatient }: AppointmentModalProps) {
  const { showNotification } = useNotification();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    reason: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (selectedPatient) {
        setFormData(prev => ({ ...prev, patientId: selectedPatient.id }));
      } else {
        setIsLoadingPatients(true);
        medicalService.getPatients().then(data => {
          setPatients(data);
          setIsLoadingPatients(false);
        });
      }
    }
  }, [isOpen, selectedPatient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date || !formData.time || !formData.reason) {
      showNotification('error', 'Por favor complete todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`).getTime();
      const patient = selectedPatient || patients.find(p => p.id === formData.patientId);

      await medicalService.createAppointment({
        patientId: formData.patientId,
        patientName: patient ? `${patient.name} ${patient.lastName}` : 'Paciente Desconocido',
        date: dateTime,
        reason: formData.reason,
        status: AppointmentStatus.SCHEDULED
      });

      showNotification('success', 'Cita programada correctamente');
      onSuccess();
      onClose();
      setFormData({ patientId: '', date: '', time: '', reason: '' });
    } catch (error) {
      console.error(error);
      showNotification('error', 'Error al programar la cita');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100"
          >
            <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Programar Nueva Cita</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure los detalles del encuentro</p>
              </div>
              <button onClick={onClose} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {!selectedPatient && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <User className="w-3 h-3" /> Seleccionar Paciente
                  </label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccione un paciente...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.lastName} - {p.dni}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Calendar className="w-3 h-3" /> Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Clock className="w-3 h-3" /> Hora
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <MessageSquare className="w-3 h-3" /> Motivo / Procedimiento
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ej: Control de ortodoncia, Limpieza, Exodoncia..."
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none"
                />
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                  {isSubmitting ? 'Guardando...' : 'Confirmar Cita'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
