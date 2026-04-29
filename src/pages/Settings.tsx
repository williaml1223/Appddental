import { motion } from 'motion/react';
import { User, Mail, Shield, Bell, AppWindow, LogOut, Save } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useNotification } from '../components/ui/Notification';

export default function Settings() {
  const user = auth.currentUser;
  const { showNotification } = useNotification();

  const handleSave = () => {
    showNotification('success', 'Configuración guardada correctamente');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Configuración</h1>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
          <Shield className="w-3 h-3" />
          Administre su cuenta y preferencias de la aplicación
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
           <button className="w-full flex items-center gap-3 px-6 py-4 bg-white border border-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
              <User className="w-4 h-4" /> Mi Perfil
           </button>
           <button className="w-full flex items-center gap-3 px-6 py-4 text-slate-400 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              <Bell className="w-4 h-4" /> Notificaciones
           </button>
           <button className="w-full flex items-center gap-3 px-6 py-4 text-slate-400 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              <AppWindow className="w-4 h-4" /> Apariencia
           </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-8">
           {/* Profile Section */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-sm space-y-8"
           >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                 <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden ring-4 ring-indigo-50">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-2xl font-black italic">
                        {user?.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                 </div>
                 <div className="text-center sm:text-left">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{user?.displayName || 'Usuario'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dentista Colegiado</p>
                    <button className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                       Cambiar foto de perfil
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-50">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                       <User className="w-3 h-3" /> Nombre Completo
                    </label>
                    <input 
                      type="text" 
                      defaultValue={user?.displayName || ''} 
                      className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                       <Mail className="w-3 h-3" /> Correo Electrónico
                    </label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || ''} 
                      disabled
                      className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed opacity-70"
                    />
                    <p className="text-[9px] font-medium text-slate-400 px-1 italic">El correo no puede modificarse por seguridad</p>
                 </div>
              </div>

              <div className="pt-6">
                 <button 
                   onClick={handleSave}
                   className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95"
                 >
                    <Save className="w-5 h-5" /> Guardar Cambios
                 </button>
              </div>
           </motion.div>

           {/* Danger Zone */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-rose-50/30 rounded-[2.5rem] border border-rose-100 p-8 md:p-10 shadow-sm"
           >
              <h3 className="text-lg font-black text-rose-800 uppercase tracking-tighter mb-2">Zona de Peligro</h3>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-6">Acciones irreversibles para su cuenta</p>
              
              <button 
                onClick={() => auth.signOut()}
                className="flex items-center gap-3 text-[10px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-100/50 px-4 py-3 rounded-xl transition-all border border-rose-200 shadow-sm bg-white"
              >
                 <LogOut className="w-4 h-4" /> Cerrar todas las sesiones
              </button>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
