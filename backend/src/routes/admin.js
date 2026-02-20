import express from 'express';
import { Log } from '../models/Log.js';
import { User } from '../models/User.js';
import { Donation } from '../models/Donation.js';
import { Medicine } from '../models/Medicine.js';

const router = express.Router();

// Helper middleware for demo purposes (replace with actual auth)
const protect = (req, res, next) => next();
const admin = (req, res, next) => next();

/**
 * @route   GET /api/admin/logs
 * @desc    Get system logs
 * @access  Private/Admin
 */
router.get('/logs', protect, admin, async (req, res) => {
    try {
        const { page = 1, limit = 50, level, startDate, endDate } = req.query;
        const query = {};

        if (level) query.level = level;
        if (startDate && endDate) {
            query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('userId', 'name email');

        const count = await Log.countDocuments(query);

        res.json({
            logs,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private/Admin
 */
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDonations = await Donation.countDocuments();
        const totalMedicines = await Medicine.countDocuments();

        // Example: completed donations
        const completedDonations = await Donation.countDocuments({ status: 'completed' });
        const pendingDonations = await Donation.countDocuments({ status: 'pending' });

        res.json({
            totalUsers,
            totalDonations,
            totalMedicines,
            completedDonations,
            pendingDonations
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings
 * @access  Private/Admin
 */
router.get('/settings', protect, admin, async (req, res) => {
    // In a real app, you might fetch this from a Settings model
    // For now, we return a mock configuration
    res.json({
        notifications: {
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            reminderInterval: 30,
            expiryWarningDays: 7,
        },
        platform: {
            maintenanceMode: false,
            registrationEnabled: true,
            donationEnabled: true,
            maxUsersPerDay: 100,
            maxDonationsPerUser: 10,
        },
        security: {
            sessionTimeout: 24,
            passwordMinLength: 8,
            requireEmailVerification: true,
            enableTwoFactor: false,
        },
        database: {
            backupEnabled: true,
            backupInterval: 24,
            retentionDays: 30,
            compressionEnabled: true,
        },
    });
});

/**
 * @route   POST /api/admin/settings
 * @desc    Update system settings
 * @access  Private/Admin
 */
router.post('/settings', protect, admin, async (req, res) => {
    try {
        // Here you would validate and save the settings to the database
        // const { notifications, platform, security, database } = req.body;
        // await Settings.findOneAndUpdate({}, { ...req.body }, { upsert: true, new: true });

        // For now, just echo back success
        res.json({ msg: 'Settings updated successfully', settings: req.body });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export const adminRouter = router;
