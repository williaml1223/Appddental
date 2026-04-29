import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

import { NotificationProvider } from './components/ui/Notification';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando OdontoCloud...</p>
        </div>
      </div>
    );
  }
  
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shell user={user} />}>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}
