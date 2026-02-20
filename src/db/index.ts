import Dexie, { Table } from 'dexie';
import {
  User,
  Medicine,
  MedicineSchedule,
  Donation,
  NGO,
  Hospital,
  AppNotification,
  AnalyticsData,
  HealthRecord,
} from '../types';

export class MediloopDB extends Dexie {
  users!: Table<User>;
  medicines!: Table<Medicine>;
  schedules!: Table<MedicineSchedule>;
  donations!: Table<Donation>;
  ngos!: Table<NGO>;
  hospitals!: Table<Hospital>;
  notifications!: Table<AppNotification>;
  analytics!: Table<AnalyticsData>;
  healthRecords!: Table<HealthRecord>;

  constructor() {
    super('MediloopDB');
    this.version(2).stores({
      users: 'id, email, role, createdAt',
      medicines: 'id, userId, name, category, expiryDate, createdAt',
      schedules: 'id, medicineId, userId, startDate, endDate',
      donations: 'id, userId, ngoId, hospitalId, status, createdAt',
      ngos: 'id, name, verified',
      hospitals: 'id, name, verified',
      notifications: 'id, userId, type, read, createdAt',
      analytics: 'id, userId, period, date',
      healthRecords: 'id, userId, type, date, createdAt',
    });
  }
}

export const db = new MediloopDB();

// Initialize with sample data
export async function initializeSampleData() {
  const userCount = await db.users.count();

  if (userCount === 0) {
    // Add sample NGOs
    await db.ngos.bulkAdd([
      {
        id: 'ngo-1',
        name: 'HealthCare Foundation',
        email: 'contact@healthcare.org',
        phone: '+1-555-0101',
        address: '123 Medical St, Health City, HC 12345',
        certificationNumber: 'NGO-2023-001',
        location: { lat: 40.7128, lng: -74.0060 },
        acceptedCategories: ['painkiller', 'antibiotic', 'vitamin'],
        operatingHours: '9:00 AM - 6:00 PM',
        verified: true,
        createdAt: new Date(),
      },
      {
        id: 'ngo-2',
        name: 'Medicine Aid Network',
        email: 'info@medicineaid.org',
        phone: '+1-555-0102',
        address: '456 Care Ave, Wellness Town, WT 67890',
        certificationNumber: 'NGO-2023-002',
        location: { lat: 34.0522, lng: -118.2437 },
        acceptedCategories: ['cardiac', 'diabetes', 'respiratory'],
        operatingHours: '8:00 AM - 8:00 PM',
        verified: true,
        createdAt: new Date(),
      },
    ]);

    // Add sample Hospitals
    await db.hospitals.bulkAdd([
      {
        id: 'hosp-1',
        name: 'City General Hospital',
        email: 'donations@citygeneral.org',
        phone: '+1-555-0201',
        address: '789 Hospital Rd, Medical District, MD 11111',
        licenseNumber: 'HOSP-LIC-2023-001',
        location: { lat: 41.8781, lng: -87.6298 },
        departments: ['Emergency', 'Cardiology', 'Pediatrics'],
        operatingHours: '24/7',
        verified: true,
        createdAt: new Date(),
      },
    ]);
  }
}
