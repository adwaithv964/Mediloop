import { Medicine, MedicineSchedule, User } from '../types';

import { API_URL as BASE_URL } from '../config/api';

const API_URL = `${BASE_URL}/api`;

export const FamilyService = {
    async linkAccount(userId: string, familyCode: string): Promise<{ success: boolean; message: string; dependent?: User }> {
        const response = await fetch(`${API_URL}/family/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, familyCode }),
        });
        return response.json();
    },

    async getDependents(userId: string): Promise<User[]> {
        const response = await fetch(`${API_URL}/family/dependents/${userId}`);
        if (!response.ok) return [];
        return response.json();
    },

    async getDependentData(dependentId: string): Promise<{ medicines: Medicine[], schedules: MedicineSchedule[] }> {
        const response = await fetch(`${API_URL}/family/data/${dependentId}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
    },

    async sendMissedDoseAlert(userId: string, medicineName: string, time: string) {
        await fetch(`${API_URL}/family/alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, medicineName, time }),
        });
    },

    async getProfile(userId: string): Promise<User> {
        const response = await fetch(`${API_URL}/family/profile/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    }
};
