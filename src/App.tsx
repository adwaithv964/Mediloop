import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { initializeSampleData } from './db';
import MedicineAssistant from './components/MedicineAssistant';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

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

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemSettings from './pages/admin/SystemSettings';
import Analytics from './pages/admin/Analytics';

// NGO/Hospital Pages
import NGODashboard from './pages/ngo/Dashboard';
import DonationRequests from './pages/ngo/DonationRequests';
import DonationHistory from './pages/ngo/DonationHistory';
import NGOProfile from './pages/ngo/Profile';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { theme, elderlyMode } = useThemeStore();

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
    // Initialize database with sample data
    initializeSampleData();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </>
            )}

            {/* Admin Routes */}
            {user?.role === 'admin' && (
              <>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/system" element={<SystemSettings />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </>
            )}

            {/* NGO/Hospital Routes */}
            {(user?.role === 'ngo' || user?.role === 'hospital') && (
              <>
                <Route path="/dashboard" element={<NGODashboard />} />
                <Route path="/donation-requests" element={<DonationRequests />} />
                <Route path="/donation-history" element={<DonationHistory />} />
                <Route path="/profile" element={<NGOProfile />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>

      {/* AI Medicine Assistant - Available globally when logged in */}
      {isAuthenticated && <MedicineAssistant />}


    </Router>
  );
}

export default App;
