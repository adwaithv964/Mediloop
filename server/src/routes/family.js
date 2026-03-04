import express from 'express';
import { User } from '../models/User.js';
import { Medicine } from '../models/Medicine.js';
import { MedicineSchedule } from '../models/MedicineSchedule.js';

export const familyRouter = express.Router();

// middleware to get user from body (simulated auth for this context if needed, 
// usually done via header token but we'll use body.userId for simplicity since auth logic isn't fully visible)
// Wait, the sync logic passes full objects. Here we interact via API.
// We'll assume the client sends { userId: 'current_user_id', ...data }

// Link Account
familyRouter.post('/link', async (req, res) => {
    try {
        const { userId, familyCode } = req.body;

        if (!userId || !familyCode) {
            return res.status(400).json({ error: 'Missing userId or familyCode' });
        }

        const caregiver = await User.findOne({ id: userId });
        if (!caregiver) {
            return res.status(404).json({ error: 'User not found' });
        }

        const dependent = await User.findOne({ familyCode: familyCode.toUpperCase() });
        if (!dependent) {
            return res.status(404).json({ error: 'Invalid Family Code' });
        }

        if (dependent.id === caregiver.id) {
            return res.status(400).json({ error: 'Cannot link to yourself' });
        }

        // Add to arrays if not already present
        if (!caregiver.dependents.includes(dependent.id)) {
            caregiver.dependents.push(dependent.id);
            await caregiver.save();
        }

        if (!dependent.caregivers.includes(caregiver.id)) {
            dependent.caregivers.push(caregiver.id);
            await dependent.save();
        }

        res.json({
            success: true,
            message: `Successfully linked with ${dependent.name || dependent.email}`,
            dependent: {
                id: dependent.id,
                name: dependent.name,
                email: dependent.email
            }
        });

    } catch (error) {
        console.error('Link error:', error);
        res.status(500).json({ error: 'Link failed' });
    }
});

// Get Profile (generates family code if missing)
familyRouter.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let user = await User.findOne({ id: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if family code exists, if not save to trigger generation
        if (!user.familyCode) {
            // The pre-save hook will generate it
            // We need to mark it modified if we're not actually changing anything else?
            // Actually, simply saving should trigger the hook if we access it?
            // Mongoose pre-save runs on save().
            // If the document hasn't changed, save() might not do anything?
            // Let's force a change or relying on the fact that if it's missing, we want it.
            // But wait, the hook checks `if (!this.familyCode)`.
            // We can explicitly set it here if we want to be sure, or just call save.

            // Let's rely on the pre-save hook by triggering a save.
            // To ensure save triggers, we might need to modify something?
            // Or just `user.familyCode = undefined` (it is already)
            // Let's manually generate it here to be safe and efficient
            user.familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await user.save();
        }

        res.json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// Get Dependents
familyRouter.get('/dependents/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ id: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const dependents = await User.find({
            id: { $in: user.dependents }
        }).select('id name email phone familyCode');

        res.json(dependents);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// Get Dependent Data (Medicines & Schedules)
familyRouter.get('/data/:dependentId', async (req, res) => {
    try {
        // In a real app, verify req.userId is a caregiver of dependentId
        const { dependentId } = req.params;

        const medicines = await Medicine.find({ userId: dependentId });
        const schedules = await MedicineSchedule.find({ userId: dependentId });

        res.json({ medicines, schedules });
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// Send Missed Dose Alert
familyRouter.post('/alert', async (req, res) => {
    try {
        const { userId, medicineName, time } = req.body;

        const user = await User.findOne({ id: userId });
        if (!user || !user.caregivers || user.caregivers.length === 0) {
            return res.json({ status: 'no_caregivers', message: 'No caregivers to alert' });
        }

        // Find caregivers
        const caregivers = await User.find({ id: { $in: user.caregivers } });

        // Simulate sending email/SMS
        const alertsSent = caregivers.map(cg => ({
            to: cg.email,
            message: `URGENT: ${user.name || 'Your dependent'} missed their dose of ${medicineName} at ${time}.`
        }));

        console.log('--- SENDING ALERTS ---');
        console.log(alertsSent);
        console.log('----------------------');

        res.json({ success: true, alertsSent: alertsSent.length });

    } catch (error) {
        console.error('Alert error:', error);
        res.status(500).json({ error: 'Alert failed' });
    }
});
