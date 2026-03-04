import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MedicineReminderNotification from '../MedicineReminderNotification';
import { useMedicineReminder } from '../../hooks/useMedicineReminder';
import { usePlatformStore } from '../../store/usePlatformStore';
import { useAuthStore } from '../../store/useAuthStore';
import { AlertTriangle, Wrench } from 'lucide-react';

export default function MainLayout() {
  const { currentReminder, dismissReminder, markAsTaken, snoozeReminder } = useMedicineReminder();
  const { config } = usePlatformStore();
  // isLoading MUST be read — while true, user is null and we can't tell if they're admin yet
  const { user, isLoading } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  // Only block non-admins AFTER auth has finished loading.
  // If we check before isLoading is false, admins appear as null users and get blocked.
  if (!isLoading && config.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
          <p className="text-gray-400 text-lg mb-2">
            Mediloop is currently undergoing scheduled maintenance.
          </p>
          <p className="text-gray-500 text-sm">
            We'll be back shortly. Thank you for your patience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Medicine reminder notification */}
      <MedicineReminderNotification
        notification={currentReminder}
        onDismiss={dismissReminder}
        onTake={markAsTaken}
        onSnooze={snoozeReminder}
      />

      {/* Yellow banner visible only to admins when maintenance mode is on */}
      {config.maintenanceMode && isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-yellow-900 px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg">
          <AlertTriangle size={16} />
          Maintenance Mode is ON — non-admin users see a maintenance screen
        </div>
      )}

      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden ${config.maintenanceMode && isAdmin ? 'pt-9' : ''}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
