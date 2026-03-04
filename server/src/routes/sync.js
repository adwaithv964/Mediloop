import express from 'express';
import { User } from '../models/User.js';
import { Medicine } from '../models/Medicine.js';
import { MedicineSchedule } from '../models/MedicineSchedule.js';
import { Donation } from '../models/Donation.js';
import { NGO } from '../models/NGO.js';
import { Hospital } from '../models/Hospital.js';
import { HealthRecord } from '../models/HealthRecord.js';

export const syncRouter = express.Router();

const models = {
    users: User,
    medicines: Medicine,
    schedules: MedicineSchedule,
    donations: Donation,
    ngos: NGO,
    hospitals: Hospital,
    healthRecords: HealthRecord
};

// Sync endpoint
syncRouter.post('/', async (req, res) => {
    try {
        const changes = req.body;
        const results = {};

        // Process changes for each collection
        for (const [collectionName, items] of Object.entries(changes)) {
            if (models[collectionName] && Array.isArray(items)) {
                results[collectionName] = { success: 0, failed: 0 };

                for (const item of items) {
                    try {
                        // Update or Insert (Upsert) based on 'id'
                        await models[collectionName].findOneAndUpdate(
                            { id: item.id },
                            item,
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        results[collectionName].success++;
                    } catch (err) {
                        console.error(`Error syncing ${collectionName} item ${item.id}:`, err);
                        results[collectionName].failed++;
                    }
                }
            }
        }

        res.json({ status: 'success', synced: results });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Sync failed' });
    }
});

/**
 * @route   GET /api/sync/user-by-email
 * @desc    Fetch full user profile from MongoDB by email (used by auth store instead of Dexie)
 * @access  Public
 * NOTE: Must be defined BEFORE /:collection so Express doesn't swallow it as a wildcard.
 */
syncRouter.get('/user-by-email', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'email query param required' });
        }
        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('user-by-email error:', error);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// Get all data for a collection (for admin panel)
syncRouter.get('/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        if (!models[collection]) {
            return res.status(400).json({ error: 'Invalid collection' });
        }

        const data = await models[collection].find({});
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});
