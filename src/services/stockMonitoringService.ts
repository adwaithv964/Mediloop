import { db } from '../db';
import { NotificationService } from './notificationService';

interface NotificationTracker {
  medicineId: string;
  type: 'expiry' | 'low_stock' | 'out_of_stock';
  lastNotified: Date;
  notificationCount: number;
}

class StockMonitoringService {
  private notificationTrackers: Map<string, NotificationTracker> = new Map();
  private readonly MAX_EXPIRY_NOTIFICATIONS_PER_DAY = 4;
  private readonly NOTIFICATION_INTERVALS = [8, 12, 16, 20]; // Hours: 8 AM, 12 PM, 4 PM, 8 PM

  constructor() {
    // Load trackers from localStorage
    this.loadTrackers();
  }

  private loadTrackers() {
    try {
      const saved = localStorage.getItem('notificationTrackers');
      if (saved) {
        const data = JSON.parse(saved);
        this.notificationTrackers = new Map(
          Object.entries(data).map(([key, value]: [string, any]) => [
            key,
            { ...value, lastNotified: new Date(value.lastNotified) },
          ])
        );
      }
    } catch (error) {
      console.error('Error loading notification trackers:', error);
    }
  }

  private saveTrackers() {
    try {
      const data = Object.fromEntries(this.notificationTrackers);
      localStorage.setItem('notificationTrackers', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving notification trackers:', error);
    }
  }

  private getTrackerKey(medicineId: string, type: string): string {
    return `${medicineId}-${type}`;
  }

  private canSendNotification(medicineId: string, type: 'expiry' | 'low_stock' | 'out_of_stock'): boolean {
    const key = this.getTrackerKey(medicineId, type);
    const tracker = this.notificationTrackers.get(key);

    if (!tracker) {
      return true;
    }

    const now = new Date();
    const lastNotified = tracker.lastNotified;
    const hoursSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60);

    // Reset counter if it's a new day
    if (now.toDateString() !== lastNotified.toDateString()) {
      tracker.notificationCount = 0;
      this.notificationTrackers.set(key, tracker);
      this.saveTrackers();
      return true;
    }

    // For expiry notifications, limit to 4 per day at specific times
    if (type === 'expiry') {
      if (tracker.notificationCount >= this.MAX_EXPIRY_NOTIFICATIONS_PER_DAY) {
        return false;
      }

      // Check if current hour matches one of the notification intervals
      const currentHour = now.getHours();
      const shouldNotifyAtThisHour = this.NOTIFICATION_INTERVALS.includes(currentHour);
      
      // Only send if at notification interval and at least 3 hours since last
      return shouldNotifyAtThisHour && hoursSinceLastNotification >= 3;
    }

    // For stock notifications, send once per day
    return hoursSinceLastNotification >= 24;
  }

  private markNotificationSent(medicineId: string, type: 'expiry' | 'low_stock' | 'out_of_stock') {
    const key = this.getTrackerKey(medicineId, type);
    const tracker = this.notificationTrackers.get(key);

    if (tracker && new Date().toDateString() === tracker.lastNotified.toDateString()) {
      tracker.notificationCount++;
      tracker.lastNotified = new Date();
    } else {
      this.notificationTrackers.set(key, {
        medicineId,
        type,
        lastNotified: new Date(),
        notificationCount: 1,
      });
    }

    this.saveTrackers();
  }

  async checkExpiryWarnings(userId: string): Promise<void> {
    const medicines = await db.medicines.where('userId').equals(userId).toArray();
    const now = new Date();

    for (const medicine of medicines) {
      const daysUntilExpiry = Math.floor(
        (medicine.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if medicine is expiring soon (within 7 days)
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        if (this.canSendNotification(medicine.id, 'expiry')) {
          await NotificationService.sendNotification(
            userId,
            'expiry_warning',
            '⚠️ Medicine Expiring Soon',
            `${medicine.name} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
            '/medicines'
          );
          this.markNotificationSent(medicine.id, 'expiry');
          console.log(`📅 Expiry notification sent for ${medicine.name} (${daysUntilExpiry} days left)`);
        }
      } 
      // Check if medicine has expired
      else if (daysUntilExpiry <= 0) {
        if (this.canSendNotification(medicine.id, 'expiry')) {
          await NotificationService.sendNotification(
            userId,
            'expiry_warning',
            '🚫 Medicine Expired',
            `${medicine.name} has expired. Please dispose safely or donate if suitable.`,
            '/medicines'
          );
          this.markNotificationSent(medicine.id, 'expiry');
          console.log(`🚫 Expired notification sent for ${medicine.name}`);
        }
      }
    }
  }

  async checkLowStock(userId: string): Promise<void> {
    const medicines = await db.medicines.where('userId').equals(userId).toArray();

    for (const medicine of medicines) {
      const quantity = medicine.quantity || 0;

      // Out of stock
      if (quantity === 0) {
        if (this.canSendNotification(medicine.id, 'out_of_stock')) {
          await NotificationService.sendNotification(
            userId,
            'refill_alert',
            '📦 Medicine Out of Stock',
            `${medicine.name} has run out! Please refill immediately.`,
            '/medicines'
          );
          this.markNotificationSent(medicine.id, 'out_of_stock');
          console.log(`📦 Out of stock notification sent for ${medicine.name}`);
        }
      }
      // Low stock (10 or less)
      else if (quantity <= 10) {
        if (this.canSendNotification(medicine.id, 'low_stock')) {
          await NotificationService.sendNotification(
            userId,
            'refill_alert',
            '⚠️ Low Stock Alert',
            `${medicine.name} is running low! Only ${quantity} ${medicine.unit || 'units'} left. Consider refilling soon.`,
            '/medicines'
          );
          this.markNotificationSent(medicine.id, 'low_stock');
          console.log(`⚠️ Low stock notification sent for ${medicine.name} (${quantity} left)`);
        }
      }
    }
  }

  async checkAllNotifications(userId: string): Promise<void> {
    console.log('🔍 Checking medicine expiry and stock levels...');
    await this.checkExpiryWarnings(userId);
    await this.checkLowStock(userId);
  }

  // Auto-decrement stock when medicine is taken
  async decrementStock(medicineId: string, amount: number = 1): Promise<void> {
    try {
      const medicine = await db.medicines.get(medicineId);
      if (!medicine) return;

      const newQuantity = Math.max(0, (medicine.quantity || 0) - amount);
      
      await db.medicines.update(medicineId, {
        quantity: newQuantity,
        updatedAt: new Date(),
      });

      console.log(`📉 Stock updated for ${medicine.name}: ${medicine.quantity} → ${newQuantity}`);

      // Check if now out of stock or low
      if (newQuantity === 0 || newQuantity <= 10) {
        await this.checkLowStock(medicine.userId);
      }
    } catch (error) {
      console.error('Error decrementing stock:', error);
    }
  }

  // Get summary of medicine stocks
  async getStockSummary(userId: string): Promise<{
    total: number;
    outOfStock: number;
    lowStock: number;
    expiring: number;
    expired: number;
  }> {
    const medicines = await db.medicines.where('userId').equals(userId).toArray();
    const now = new Date();

    const summary = {
      total: medicines.length,
      outOfStock: 0,
      lowStock: 0,
      expiring: 0,
      expired: 0,
    };

    for (const medicine of medicines) {
      const quantity = medicine.quantity || 0;
      const daysUntilExpiry = Math.floor(
        (medicine.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (quantity === 0) {
        summary.outOfStock++;
      } else if (quantity <= 10) {
        summary.lowStock++;
      }

      if (daysUntilExpiry <= 0) {
        summary.expired++;
      } else if (daysUntilExpiry <= 7) {
        summary.expiring++;
      }
    }

    return summary;
  }

  // Clear notification history for a medicine
  clearMedicineTrackers(medicineId: string) {
    const keysToDelete: string[] = [];
    
    this.notificationTrackers.forEach((_, key) => {
      if (key.startsWith(medicineId)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.notificationTrackers.delete(key));
    this.saveTrackers();
  }

  // Reset all trackers (for testing)
  resetAllTrackers() {
    this.notificationTrackers.clear();
    localStorage.removeItem('notificationTrackers');
    console.log('🔄 All notification trackers reset');
  }
}

export const stockMonitoringService = new StockMonitoringService();
