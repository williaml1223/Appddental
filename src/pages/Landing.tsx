import { motion } from 'motion/react';
import { ShieldCheck, Calendar, Users, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">ODONTOCLOUD</span>
          </div>
          <button 
            onClick={loginWithGoogle}
            className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Gestión Dental 2.0</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8 uppercase">
              La evolución <br />
              <span className="text-indigo-600">clínica</span> dental <br />
              está aquí.
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-[1.4] mb-10 max-w-lg">
              Simplifica tu práctica odontológica con historias clínicas inteligentes, 
              odontogramas interactivos y una gestión de pacientes sin precedentes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={loginWithGoogle}
                className="group flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                Comenzar Ahora Gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4 px-6 py-5 bg-slate-50 rounded-3xl">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                  ))}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+500 Dentistas unidos</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8 md:p-12 overflow-hidden">
               <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-indigo-50 rounded-[2rem] p-6">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Pacientes</p>
                    <p className="text-3xl font-black text-indigo-900 tracking-tight">+1.2k</p>
                  </div>
                  <div className="h-32 bg-emerald-50 rounded-[2rem] p-6">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Citas Hoy</p>
                    <p className="text-3xl font-black text-emerald-900 tracking-tight">12</p>
                  </div>
               </div>
               <div className="mt-8 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full w-1/2"></div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Todo lo que necesitas</h2>
            <p className="text-slate-500 font-medium">Potencia tu clínica con herramientas diseñadas por y para dentistas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Pacientes', desc: 'Expedientes clínicos digitales completos y centralizados.' },
              { icon: Calendar, title: 'Agenda', desc: 'Gestión inteligente de citas con vista diaria y semanal.' },
              { icon: FileText, title: 'Presupuestos', desc: 'Genera presupuestos profesionales en segundos.' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-100">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-3xl rounded-full -mr-40 -mt-40"></div>
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
                Únete a la nueva <br />era dental.
              </h2>
              <p className="text-indigo-100 mb-12 text-lg font-medium opacity-80 max-w-xl mx-auto">
                No pierdas más tiempo con papeles y archivos físicos. 
                Es momento de digitalizar tu éxito.
              </p>
              <button 
                onClick={loginWithGoogle}
                className="flex items-center justify-center gap-3 px-10 py-6 bg-white text-indigo-600 rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl"
              >
                Registrarme Gratis con Google
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
             </div>
             <span className="text-sm font-black tracking-tight text-slate-900 uppercase">OdontoCloud</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 Crafted with Passion • Privacy Policy • Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}
