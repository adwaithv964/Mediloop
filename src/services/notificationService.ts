import { db } from '../db';
import { AppNotification } from '../types';

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
      }, delay);
    }
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
