import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MedicineReminderNotification from '../MedicineReminderNotification';
import { useMedicineReminder } from '../../hooks/useMedicineReminder';

export default function MainLayout() {
  const { currentReminder, dismissReminder, markAsTaken, snoozeReminder } = useMedicineReminder();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-style notification bar */}
      <MedicineReminderNotification
        notification={currentReminder}
        onDismiss={dismissReminder}
        onTake={markAsTaken}
        onSnooze={snoozeReminder}
      />

      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
