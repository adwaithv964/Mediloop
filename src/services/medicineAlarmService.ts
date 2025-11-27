import { db } from '../db';
import { MedicineSchedule } from '../types';
import { NotificationService } from './notificationService';

class MedicineAlarmService {
  private checkInterval: NodeJS.Timeout | null = null;
  // Alarm audio generated on-demand using Web Audio API
  private activeAlarms: Set<string> = new Set();
  private currentSoundId: string = 'mediloop';

  constructor() {
    // Create alarm sound (using Web Audio API to generate beep)
    this.initializeAlarmSound();
  }

  setAlarmSound(soundId: string) {
    this.currentSoundId = soundId;
    console.log(`🔔 Alarm sound set to: ${soundId}`);
  }

  private initializeAlarmSound() {
    // We'll use a data URL for a simple beep sound
    const audioContext = typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext);
    if (audioContext) {
      // Sound will be generated on-demand
      console.log('✅ Alarm sound initialized');
    }
  }

  private playAlarmSound() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();

      const playNote = (frequency: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        // Gentle envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;

      switch (this.currentSoundId) {
        case 'beep':
          // Gentle Beep
          playNote(800, now, 0.3);
          playNote(800, now + 0.4, 0.3);
          playNote(800, now + 0.8, 0.3);
          console.log('🔔 Gentle Beep played');
          break;

        case 'crystal':
          // Crystal Bell (High pitched, clear)
          playNote(1567.98, now, 2.0); // G6
          playNote(1975.53, now + 0.2, 2.0); // B6
          console.log('🔔 Crystal sound played');
          break;

        case 'cosmic':
          // Cosmic Sweep
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 1.0);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

          osc.start(now);
          osc.stop(now + 1.5);
          console.log('🔔 Cosmic sound played');
          break;

        case 'mediloop':
        default:
          // Mediloop Theme: Soft Double Chime (E5 -> B5)
          playNote(659.25, now, 0.6);
          playNote(987.77, now + 0.15, 1.2);
          console.log('🔔 Mediloop chime played');
          break;
      }
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }

  async startMonitoring(userId: string) {
    // Stop existing monitoring
    this.stopMonitoring();

    console.log('🔔 Starting medicine alarm monitoring for user:', userId);

    // Check immediately
    await this.checkMedicineSchedules(userId);

    // Then check every 5 seconds (reduced from 1 minute to minimize delay)
    this.checkInterval = setInterval(async () => {
      await this.checkMedicineSchedules(userId);
    }, 5000); // Check every 5 seconds
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Medicine alarm monitoring stopped');
    }
    this.activeAlarms.clear();
  }

  private async checkMedicineSchedules(userId: string) {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get all schedules for the user
      const schedules = await db.schedules
        .where('userId')
        .equals(userId)
        .toArray();

      for (const schedule of schedules) {
        // Skip if reminders are disabled for this schedule
        if (!schedule.reminderEnabled) {
          continue;
        }

        // Check if schedule is for today
        if (!this.isScheduledForToday(schedule, currentDay)) {
          continue;
        }

        // Check each time in the schedule
        for (const scheduleTime of schedule.times || []) {
          const alarmKey = `${schedule.id}-${scheduleTime}`;

          // If alarm already triggered for this time today, skip
          if (this.activeAlarms.has(alarmKey)) {
            continue;
          }

          // Check if current time matches schedule time (with 1-minute tolerance)
          if (this.isTimeMatch(currentTime, scheduleTime)) {
            // Mark alarm as triggered
            this.activeAlarms.add(alarmKey);

            // Get medicine details
            const medicine = await db.medicines.get(schedule.medicineId);
            if (!medicine) continue;

            // Play alarm sound
            this.playAlarmSound();

            // Show browser notification
            await NotificationService.sendNotification(
              userId,
              'reminder',
              '💊 Medicine Reminder',
              `Time to take ${medicine.name} (${schedule.dosagePerIntake})`,
              '/schedule'
            );

            // Trigger mobile-style notification bar
            this.triggerMobileNotification(medicine.name, schedule.dosagePerIntake, scheduleTime, schedule.id);

            console.log(`🔔 Alarm triggered for ${medicine.name} at ${scheduleTime}`);

            // Clear this alarm after 5 minutes
            setTimeout(() => {
              this.activeAlarms.delete(alarmKey);
            }, 300000);
          }
        }
      }
    } catch (error) {
      console.error('Error checking medicine schedules:', error);
    }
  }

  private isScheduledForToday(schedule: MedicineSchedule, _currentDay: number): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if schedule has started
    const startDate = new Date(schedule.startDate);
    startDate.setHours(0, 0, 0, 0);
    if (today < startDate) return false;

    // Check if schedule has ended
    if (schedule.endDate) {
      const endDate = new Date(schedule.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (today > endDate) return false;
    }

    if (!schedule.frequency || schedule.frequency === 'daily') return true;

    if (schedule.frequency === 'custom') {
      // For custom schedules, check specific days
      // This would need to be implemented based on your custom schedule logic
      return true;
    }

    return true;
  }

  private isTimeMatch(currentTime: string, scheduleTime: string): boolean {
    // Compare times (currentTime and scheduleTime are in HH:MM format)
    return currentTime === scheduleTime;
  }

  private triggerMobileNotification(medicineName: string, dosage: string, time: string, scheduleId: string) {
    // Dispatch custom event for mobile-style notification
    const event = new CustomEvent('medicineReminder', {
      detail: {
        medicineName,
        dosage,
        time,
        scheduleId,
      },
    });
    window.dispatchEvent(event);
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    return await NotificationService.requestPermission();
  }

  // Test alarm (for user to test)
  async testAlarm(userId: string, medicineName: string) {
    this.playAlarmSound();
    await NotificationService.sendNotification(
      userId,
      'reminder',
      'Test Alarm',
      `This is a test alarm for ${medicineName}`
    );

    // Trigger mobile-style notification for test
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.triggerMobileNotification(medicineName, '1 tablet', currentTime, 'test-schedule');
  }
}

export const medicineAlarmService = new MedicineAlarmService();
