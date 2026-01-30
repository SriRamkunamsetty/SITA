import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Experience from './pages/Experience';
import AccessGate from './pages/AccessGate';
import Verification from './pages/Verification';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ProtectedRoute from './components/layout/ProtectedRoute';
import StarField from './components/ui/StarField';
import { ToastProvider } from './context/ToastContext';

function App() {

  const location = useLocation();

  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-brand-dark overflow-hidden relative text-slate-200 selection:bg-brand-neon selection:text-brand-dark">
        {/* Background Ambience */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-glow/10 blur-[150px] rounded-full animate-float" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-neon/5 blur-[150px] rounded-full animate-pulse-slow" />
          <StarField />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Experience />} />
              <Route path="/access" element={<AccessGate />} />
              <Route path="/verification" element={<Verification />} />

              {/* Protected Routes */}
              <Route
                path="/agent"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
