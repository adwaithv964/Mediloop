import { db } from '../db';


import { API_URL as BASE_URL } from '../config/api';

const API_URL = `${BASE_URL}/api`;

export class SyncService {
    static init() {
        // Hook into Dexie changes to sync with backend
        // We sync Medicines and Schedules as they are critical for Family Mode

        // Users - Critical for creating the user profile on backend
        db.users.hook('creating', (_primKey, obj) => {
            this.syncItem('users', obj);
        });
        db.users.hook('updating', function (mods, _primKey, obj) {
            const updatedObj = { ...obj, ...mods };
            SyncService.syncItem('users', updatedObj);
        });

        db.medicines.hook('creating', (_primKey, obj) => {
            this.syncItem('medicines', obj);
        });


        // Using a simpler approach: Subscribe to changes via liveQuery or just overriding add/put/delete?
        // No, hooks are best.

        // For 'updating', we construct the new object:
        db.medicines.hook('updating', function (mods, _primKey, obj) {
            // 'this' refers to the context
            const updatedObj = { ...obj, ...mods };
            SyncService.syncItem('medicines', updatedObj);
        });



        // Schedules
        db.schedules.hook('creating', (_primKey, obj) => {
            this.syncItem('schedules', obj);
        });
        db.schedules.hook('updating', function (mods, _primKey, obj) {
            const updatedObj = { ...obj, ...mods };
            SyncService.syncItem('schedules', updatedObj);
        });
    }

    static async syncItem(collection: string, item: any) {
        try {
            // Small delay to ensure DB write is done? Not strictly needed for API call.
            // But we want to avoid blocking the UI.
            setTimeout(async () => {
                await fetch(`${API_URL}/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        [collection]: [item]
                    }),
                });
            }, 500);
        } catch (error) {
            console.error(`Failed to sync ${collection} item`, error);
        }
    }
}
