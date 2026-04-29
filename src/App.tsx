import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import Appointments from './pages/Appointments';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
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

    // Fallback timer: if auth doesn't respond in 4 seconds, show the UI anyway
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
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
          {!user ? (
            <>
              <Route path="/" element={<Landing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <Route path="/" element={<Shell user={user} />}>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientProfile />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}
