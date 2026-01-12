import { db } from '../db';
import { AppNotification } from '../types';
import { FamilyService } from './familyService';

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  static async sendNotification(
    userId: string,
    type: AppNotification['type'],
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    // Save to database
    const notification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      read: false,
      actionUrl,
      createdAt: new Date(),
    };

    await db.notifications.add(notification);

    // Send browser notification if permission granted
    const hasPermission = await this.requestPermission();
    if (hasPermission) {
      const browserNotif = new Notification(title, {
        body: message,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: notification.id,
        requireInteraction: type === 'reminder',
      });

      if (actionUrl) {
        browserNotif.onclick = () => {
          window.focus();
          window.location.href = actionUrl;
          browserNotif.close();
        };
      }
    }
  }



  static async scheduleReminder(
    userId: string,
    medicineName: string,
    time: string,
    date: Date
  ): Promise<void> {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date(date);
    scheduledTime.setHours(hours, minutes, 0, 0);

    const delay = scheduledTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        this.sendNotification(
          userId,
          'reminder',
          'Medicine Reminder',
          `Time to take ${medicineName}`,
          '/dashboard'
        );

        // Schedule missed dose check (e.g. 30 mins after)
        this.scheduleMissedDoseCheck(userId, medicineName, time, scheduledTime);
      }, delay);
    }
  }

  static async scheduleMissedDoseCheck(
    userId: string,
    medicineName: string,
    time: string,
    scheduledTime: Date
  ) {
    const MISSED_DOSE_DELAY = 30 * 60 * 1000; // 30 minutes

    setTimeout(async () => {
      // Check if dose was taken
      // We need to find the schedule and check the 'taken' array for this date/time
      // Since we don't have scheduleId passed here, we might need to query or pass it.
      // For simplicity, we'll check if any schedule for this medicine has a taken record for today.

      // This logic is slightly simplified because querying Dexie for exact time match is verbose
      // We assume best effort check

      try {
        // Fetch schedules for this user (User might be offline, so we check local DB)
        // But 'db' is available
        /* 
           Refining Logic:
           We need to know if the user marked it as taken.
           If they did, there should be a 'TakenRecord' in the relevant schedule.
        */
        // This requires querying the DB. 
        // We'll trust that the App updates the DB when user clicks "Take".
        // If we can't find it, we assume missed.

        // ... Logic to query DB ...
        // For now, let's assume we can't easily query without ID.
        // We'll just trigger the alert if the UI hasn't cancelled this timeout 
        // (which is complex to implement with setTimeout).

        // Better approach:
        // Just triggering the API call to check. But wait, the API doesn't know if I took it locally.

        // Let's implement a check:
        const todayStr = scheduledTime.toDateString();

        // We need to find the medicine ID to query schedules efficiently.
        // But we only have name.
        // Let's query by Name (not ideal but works for prototype)
        const medicines = await db.medicines.where('name').equals(medicineName).toArray();
        const medicineIds = medicines.map(m => m.id);

        const schedules = await db.schedules
          .where('userId').equals(userId)
          .filter(s => medicineIds.includes(s.medicineId))
          .toArray();

        let isTaken = false;
        for (const schedule of schedules) {
          if (schedule.taken.some(t => {
            const tDate = new Date(t.date).toDateString();
            return tDate === todayStr && t.time === time && t.taken;
          })) {
            isTaken = true;
            break;
          }
        }

        if (!isTaken) {
          console.log(`Missed dose detected for ${medicineName}. Sending alert...`);
          await FamilyService.sendMissedDoseAlert(userId, medicineName, time);
        }

      } catch (e) {
        console.error('Error checking missed dose', e);
      }

    }, MISSED_DOSE_DELAY);
  }

  static async checkExpiryWarnings(userId: string): Promise<void> {
    const medicines = await db.medicines.where('userId').equals(userId).toArray();
    const now = new Date();

    for (const medicine of medicines) {
      const daysUntilExpiry = Math.floor(
        (medicine.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        await this.sendNotification(
          userId,
          'expiry_warning',
          'Medicine Expiring Soon',
          `${medicine.name} expires in ${daysUntilExpiry} days`,
          '/medicines'
        );
      } else if (daysUntilExpiry <= 0) {
        await this.sendNotification(
          userId,
          'expiry_warning',
          'Medicine Expired',
          `${medicine.name} has expired. Please dispose safely or donate if suitable.`,
          '/medicines'
        );
      }
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await db.notifications.update(notificationId, { read: true });
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const notifications = await db.notifications
      .where('userId')
      .equals(userId)
      .toArray();

    await Promise.all(
      notifications.map((notif) =>
        db.notifications.update(notif.id, { read: true })
      )
    );
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return await db.notifications
      .where('userId')
      .equals(userId)
      .and((notif) => !notif.read)
      .count();
  }

  static async deleteAll(userId: string): Promise<void> {
    const notifications = await db.notifications
      .where('userId')
      .equals(userId)
      .toArray();

    await Promise.all(
      notifications.map((notif) => db.notifications.delete(notif.id))
    );
  }
}
