export type UserRole = 'patient' | 'admin' | 'ngo' | 'hospital';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  elderlyMode: boolean;
  notificationsEnabled: boolean;
  voiceEnabled: boolean;
  language: string;
  alarmSound?: string;
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  genericName?: string;
  category: string;
  dosage: string;
  quantity: number;
  unit?: string;
  expiryDate: Date;
  batchNumber?: string;
  manufacturer?: string;
  price?: number;
  notes?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface MedicineSchedule {
  id: string;
  medicineId: string;
  userId: string;
  frequency: 'once' | 'daily' | 'weekly' | 'custom';
  times: string[]; // ["08:00", "14:00", "20:00"]
  dosagePerIntake: string;
  startDate: Date;
  endDate?: Date;
  reminderEnabled: boolean;
  taken: TakenRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TakenRecord {
  date: Date;
  time: string;
  taken: boolean;
  skipped?: boolean;
  notes?: string;
}

export interface Donation {
  id: string;
  userId: string;
  medicines: DonationMedicine[];
  ngoId?: string;
  hospitalId?: string;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  status: 'pending' | 'confirmed' | 'picked-up' | 'completed' | 'cancelled';
  pickupAddress: string;
  location?: {
    lat: number;
    lng: number;
  };
  pickupDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DonationMedicine {
  medicineId: string;
  name: string;
  quantity: number;
  expiryDate: Date;
  batchNumber?: string;
}

export interface NGO {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  certificationNumber: string;
  location: {
    lat: number;
    lng: number;
  };
  acceptedCategories: string[];
  operatingHours?: string;
  verified: boolean;
  createdAt: Date;
}

export interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  location: {
    lat: number;
    lng: number;
  };
  departments: string[];
  operatingHours?: string;
  verified: boolean;
  createdAt: Date;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'reminder' | 'expiry_warning' | 'refill_alert' | 'donation_update' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface MedicineCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface AnalyticsData {
  userId: string;
  medicineCount: number;
  adherenceRate: number;
  activeMedicines: number;
  period: 'day' | 'week' | 'month';
  date: Date;
}

export interface HealthRecord {
  id: string;
  userId: string;
  title: string;
  type: 'prescription' | 'lab_report' | 'medical_history' | 'insurance' | 'other';
  fileUrl?: string;
  fileName?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  { id: 'painkiller', name: 'Painkillers', icon: 'Pill', color: '#ef4444' },
  { id: 'antibiotic', name: 'Antibiotics', icon: 'ShieldPlus', color: '#3b82f6' },
  { id: 'vitamin', name: 'Vitamins', icon: 'Sparkles', color: '#22c55e' },
  { id: 'supplement', name: 'Supplements', icon: 'Leaf', color: '#10b981' },
  { id: 'cardiac', name: 'Cardiac', icon: 'Heart', color: '#f43f5e' },
  { id: 'diabetes', name: 'Diabetes', icon: 'Droplet', color: '#8b5cf6' },
  { id: 'respiratory', name: 'Respiratory', icon: 'Wind', color: '#06b6d4' },
  { id: 'digestive', name: 'Digestive', icon: 'Activity', color: '#f59e0b' },
  { id: 'other', name: 'Other', icon: 'Package', color: '#6b7280' },
];

export const EXPIRY_STATUS = {
  GOOD: { color: 'green', label: 'Good', days: 90 },
  WARNING: { color: 'yellow', label: 'Warning', days: 30 },
  CRITICAL: { color: 'red', label: 'Critical', days: 7 },
  EXPIRED: { color: 'gray', label: 'Expired', days: 0 },
};
