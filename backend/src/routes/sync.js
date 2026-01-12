import express from 'express';
import { User } from '../models/User.js';
import { Medicine } from '../models/Medicine.js';
import { Donation } from '../models/Donation.js';
import { NGO } from '../models/NGO.js';
import { Hospital } from '../models/Hospital.js';
import { HealthRecord } from '../models/HealthRecord.js';

export const syncRouter = express.Router();

const models = {
    users: User,
    medicines: Medicine,
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

// Get all data (for initial load)
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
