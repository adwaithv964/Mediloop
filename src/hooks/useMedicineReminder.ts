import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../db';
import { stockMonitoringService } from '../services/stockMonitoringService';

interface ReminderNotification {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  scheduleId: string;
}

export function useMedicineReminder() {
  const { user } = useAuthStore();
  const [currentReminder, setCurrentReminder] = useState<ReminderNotification | null>(null);
  const [snoozeQueue, setSnoozeQueue] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Listen for custom medicine reminder events
  useEffect(() => {
    const handleReminderEvent = (event: CustomEvent) => {
      const { medicineName, dosage, time, scheduleId } = event.detail;
      setCurrentReminder({
        id: `${scheduleId}-${time}-${Date.now()}`,
        medicineName,
        dosage,
        time,
        scheduleId,
      });
    };

    window.addEventListener('medicineReminder' as any, handleReminderEvent);

    return () => {
      window.removeEventListener('medicineReminder' as any, handleReminderEvent);
      // Clear all snooze timers
      snoozeQueue.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismissReminder = useCallback(() => {
    setCurrentReminder(null);
  }, []);

  const markAsTaken = useCallback(async () => {
    if (!currentReminder || !user) return;

    try {
      const schedule = await db.schedules.get(currentReminder.scheduleId);
      if (!schedule) return;

      const takenRecord = {
        date: new Date(),
        time: currentReminder.time,
        taken: true,
      };

      await db.schedules.update(currentReminder.scheduleId, {
        taken: [...(schedule.taken || []), takenRecord],
        updatedAt: new Date(),
      });

      // Auto-decrement medicine stock
      const dosageMatch = currentReminder.dosage.match(/^(\d+)/);
      const amount = dosageMatch ? parseInt(dosageMatch[1]) : 1;
      await stockMonitoringService.decrementStock(schedule.medicineId, amount);

      setCurrentReminder(null);
    } catch (error) {
      console.error('Error marking as taken:', error);
    }
  }, [currentReminder, user]);

  const snoozeReminder = useCallback(() => {
    if (!currentReminder) return;

    // Dismiss current notification
    setCurrentReminder(null);

    // Set snooze for 5 minutes
    const snoozeTimer = setTimeout(() => {
      setCurrentReminder({
        ...currentReminder,
        id: `${currentReminder.scheduleId}-${currentReminder.time}-${Date.now()}`,
      });
      snoozeQueue.delete(currentReminder.id);
    }, 5 * 60 * 1000); // 5 minutes

    setSnoozeQueue((prev) => {
      const newQueue = new Map(prev);
      newQueue.set(currentReminder.id, snoozeTimer);
      return newQueue;
    });
  }, [currentReminder, snoozeQueue]);

  return {
    currentReminder,
    dismissReminder,
    markAsTaken,
    snoozeReminder,
  };
}
