import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { usePlatformStore } from './store/usePlatformStore';
import { initializeSampleData } from './db';
import MedicineAssistant from './components/MedicineAssistant';
import { SyncService } from './services/syncService';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import AdminRegister from './pages/auth/AdminRegister';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import MedicineList from './pages/patient/MedicineList';
import AddMedicine from './pages/patient/AddMedicine';
import MedicineSchedule from './pages/patient/MedicineSchedule';
import DonationCenter from './pages/patient/DonationCenter';
import Reports from './pages/patient/Reports';
import Settings from './pages/patient/Settings';
import AIAssistant from './pages/patient/AIAssistant';
import HealthRecords from './pages/patient/HealthRecords';
import DrugInteractions from './pages/patient/DrugInteractions';
import PatientAnalytics from './pages/patient/Analytics';
import SymptomChecker from './pages/patient/SymptomChecker';
import HealthTips from './pages/patient/HealthTips';
import FamilyManager from './pages/patient/FamilyManager';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemSettings from './pages/admin/SystemSettings';
import Analytics from './pages/admin/Analytics';
import SystemLogs from './pages/admin/SystemLogs';

// NGO/Hospital Pages
import NGODashboard from './pages/ngo/Dashboard';
import DonationRequests from './pages/ngo/DonationRequests';
import DonationHistory from './pages/ngo/DonationHistory';
import NGOProfile from './pages/ngo/Profile';
import NotFound from './pages/NotFound';

function App() {
  const { isAuthenticated, isLoading, user, initialize } = useAuthStore();
  const { theme, elderlyMode } = useThemeStore();
  const { loadFromServer } = usePlatformStore();

  useEffect(() => {
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply elderly mode styles
    if (elderlyMode) {
      document.documentElement.classList.add('elderly-mode');
    } else {
      document.documentElement.classList.remove('elderly-mode');
    }
  }, [theme, elderlyMode]);

  useEffect(() => {
    // One-time clear of all stale localStorage keys from the old architecture
    // Preserve mediloop_role_* keys so offline auth fallback works on refresh
    const CLEARED_KEY = 'mediloop-v2-cleared';
    if (!localStorage.getItem(CLEARED_KEY)) {
      const preserved: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (k.startsWith('mediloop_role_')) preserved[k] = localStorage.getItem(k)!;
      }
      localStorage.clear();
      Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));
      localStorage.setItem(CLEARED_KEY, '1');
    }

    // Initialize database sample data (NGOs/Hospitals)
    initializeSampleData();

    // Load platform config fresh from server (no localStorage persistence)
    loadFromServer();

    // Initialize Sync Service
    SyncService.init();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initialize Auth Listener (Firebase — fetches user from MongoDB)
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, []);

  // While Firebase is resolving the session (onAuthStateChanged async),
  // show a spinner — do NOT render routes yet or the router will redirect to /login.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading Mediloop…</p>
        </div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#1f2937' : '#fff',
            color: theme === 'dark' ? '#fff' : '#000',
          },
        }}
      />
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
        </Route>

        {/* Protected Routes */}
        {isAuthenticated ? (
          <Route element={<MainLayout />}>
            {/* Patient Routes */}
            {user?.role === 'patient' && (
              <>
                <Route path="/dashboard" element={<PatientDashboard />} />
                <Route path="/medicines" element={<MedicineList />} />
                <Route path="/medicines/add" element={<AddMedicine />} />
                <Route path="/medicines/:id/edit" element={<AddMedicine />} />
                <Route path="/schedule" element={<MedicineSchedule />} />
                <Route path="/donations" element={<DonationCenter />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/health-records" element={<HealthRecords />} />
                <Route path="/drug-interactions" element={<DrugInteractions />} />
                <Route path="/analytics" element={<PatientAnalytics />} />
                <Route path="/symptom-checker" element={<SymptomChecker />} />
                <Route path="/health-tips" element={<HealthTips />} />
                <Route path="/family" element={<FamilyManager />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </>
            )}

            {/* Admin Routes */}
            {user?.role === 'admin' && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/logs" element={<SystemLogs />} />
                <Route path="/system" element={<SystemSettings />} />
                <Route path="/" element={<Navigate to="/admin" replace />} />
              </>
            )}

            {/* NGO/Hospital Routes */}
            {(user?.role === 'ngo' || user?.role === 'hospital') && (
              <>
                <Route path="/dashboard" element={<NGODashboard />} />
                <Route path="/donation-requests" element={<DonationRequests />} />
                <Route path="/donation-history" element={<DonationHistory />} />
                <Route path="/profile" element={<NGOProfile />} />
                {/* Redirect /donations to /donation-requests for NGOs avoiding confusion */}
                <Route path="/donations" element={<Navigate to="/donation-requests" replace />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </>
            )}

            {/* Catch all inside MainLayout */}
            <Route path="*" element={<NotFound />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>

      {/* AI Medicine Assistant - Available globally when logged in */}
      {isAuthenticated && <MedicineAssistant />}


    </Router >
  );
}

export default App;
