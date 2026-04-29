import { Outlet, Link, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { LayoutDashboard, Users, Calendar, LogOut, Search, PlusCircle, Settings, Menu, X, ShieldCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { loginWithGoogle, logout } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { medicalService } from '../../services/medicalService';
import { Patient } from '../../types';

interface ShellProps {
  user: User | null;
}

export default function Shell({ user }: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const patients = await medicalService.getPatients();
        const filtered = patients.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.dni.includes(searchQuery)
        );
        setSearchResults(filtered.slice(0, 5));
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Panel Principal', path: '/' },
    { icon: Users, label: 'Pacientes', path: '/patients' },
    { icon: Calendar, label: 'Citas', path: '/appointments' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden">
      {/* Header Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 md:hidden"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-indigo-900 hidden sm:inline-block">ODONTOCLOUD <span className="font-light text-slate-400 text-sm tracking-normal ml-1 hidden lg:inline-block">v2.4</span></span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="relative group hidden sm:block" ref={searchRef}>
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 md:w-80 pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
            
            <AnimatePresence>
              {searchQuery.length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 right-0 sm:left-0 w-[90vw] sm:w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60]"
                >
                  <div className="p-4 border-b border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultados de búsqueda</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-8 flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <Search className="w-5 h-5 text-indigo-400" />
                        </motion.div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((p) => (
                        <Link 
                          key={p.id}
                          to={`/patients/${p.id}`}
                          onClick={() => setSearchQuery('')}
                          className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                            {p.name[0]}{p.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{p.name} {p.lastName}</p>
                            <p className="text-[10px] font-bold text-slate-400">DNI: {p.dni}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-xs font-bold text-slate-400 italic">No se encontraron pacientes</p>
                      </div>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <Link 
                      to="/patients"
                      onClick={() => setSearchQuery('')}
                      className="block p-4 bg-slate-50 text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      Ver todos los resultados
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative group/profile">
            <button className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center ring-2 ring-indigo-50 ring-offset-2 transition-transform active:scale-95">
               {user.photoURL ? (
                 <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 <UserPlaceholder name={user.displayName || 'Doctor'} />
               )}
            </button>
            <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all z-[70] translate-y-2 group-hover/profile:translate-y-0">
               <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{user.displayName || 'Usuario'}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>
               </div>
               <div className="p-2">
                  <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest">
                     <Settings className="w-4 h-4" /> Configuración
                  </Link>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                     <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
               </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          "bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col shrink-0 z-40 h-full",
          "fixed inset-y-0 left-0 transform md:relative md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0",
          isSidebarOpen ? "md:w-64" : "md:w-20"
        )}>
          <div className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group font-bold uppercase tracking-wider text-xs",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                      : "text-slate-400 hover:bg-slate-50 hover:text-indigo-600"
                  )}
                >
                  <Icon className={cn("w-5 h-5 min-w-[20px]", isActive ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-600")} />
                  <span className={cn(
                    "whitespace-nowrap transition-opacity",
                    !isSidebarOpen && "md:opacity-0 md:w-0"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-50 space-y-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-100 transition-all font-bold uppercase tracking-wider text-xs"
            >
              <Menu className="w-5 h-5 min-w-[20px]" />
              {isSidebarOpen && <span className="whitespace-nowrap">Contraer</span>}
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all font-bold uppercase tracking-wider text-xs group"
            >
              <LogOut className="w-5 h-5 min-w-[20px] text-slate-300 group-hover:text-rose-500" />
              {isSidebarOpen && <span className="whitespace-nowrap">Cerrar Sesión</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-4 md:p-8 pb-12">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Bar with Security Indicator */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 text-[10px] text-slate-400 uppercase font-bold tracking-widest relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="hidden xs:inline">Encriptado AES-256</span>
          <span className="xs:hidden">Seguro</span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
           <div className="flex items-center gap-2 truncate max-w-[120px] md:max-w-none">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"></span>
              <span className="truncate">{user.displayName || user.email?.split('@')[0]}</span>
           </div>
           <div className="hidden md:block">
              {new Date().toLocaleTimeString()}
           </div>
        </div>
      </footer>
    </div>
  );
}

function UserPlaceholder({ name }: { name: string }) {
  return (
    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
