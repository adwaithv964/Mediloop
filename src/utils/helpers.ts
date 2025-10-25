import { format, differenceInDays, isBefore } from 'date-fns';
import { EXPIRY_STATUS } from '../types';
import CryptoJS from 'crypto-js';

export function getExpiryStatus(expiryDate: Date) {
  const now = new Date();
  const daysUntilExpiry = differenceInDays(expiryDate, now);

  if (daysUntilExpiry < 0) {
    return EXPIRY_STATUS.EXPIRED;
  } else if (daysUntilExpiry <= EXPIRY_STATUS.CRITICAL.days) {
    return EXPIRY_STATUS.CRITICAL;
  } else if (daysUntilExpiry <= EXPIRY_STATUS.WARNING.days) {
    return EXPIRY_STATUS.WARNING;
  } else {
    return EXPIRY_STATUS.GOOD;
  }
}

export function formatDate(date: Date): string {
  return format(date, 'MMM dd, yyyy');
}

export function formatDateTime(date: Date): string {
  return format(date, 'MMM dd, yyyy HH:mm');
}

export function getDaysUntilExpiry(expiryDate: Date): number {
  return differenceInDays(expiryDate, new Date());
}

export function isExpiringSoon(expiryDate: Date, days: number = 30): boolean {
  const daysUntil = getDaysUntilExpiry(expiryDate);
  return daysUntil >= 0 && daysUntil <= days;
}

export function isExpired(expiryDate: Date): boolean {
  return isBefore(expiryDate, new Date());
}

export function calculateAdherenceRate(takenRecords: any[], expectedDoses: number): number {
  if (expectedDoses === 0) return 0;
  const taken = takenRecords.length;
  return Math.round((taken / expectedDoses) * 100);
}

export function encryptData(data: string, secretKey: string): string {
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}

export function decryptData(encryptedData: string, secretKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}-${random}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGreeting(name?: string): string {
  const timeOfDay = getTimeOfDay();
  const greetings = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  };

  return name ? `${greetings[timeOfDay]}, ${name}!` : `${greetings[timeOfDay]}!`;
}
