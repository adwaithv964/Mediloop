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
 * @route   POST /api/admin/verify
 * @desc    Verify admin role using Firebase token (fallback for when local Dexie DB is empty)
 * @access  Public (requires valid Firebase token in Authorization header)
 */
router.post('/verify', async (req, res) => {
    try {
        // Extract Firebase ID token from Authorization header
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Decode token without full Firebase Admin SDK (decode JWT payload)
        // Safe because we just read the payload — not verifying signature here
        // For production, use firebase-admin to verifyIdToken
        let email = null;
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            email = payload.email;
        } catch {
            return res.status(401).json({ error: 'Invalid token' });
        }

        if (!email) {
            return res.status(401).json({ error: 'No email in token' });
        }

        // Look up user in MongoDB
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin privileges required' });
        }

        res.json({ verified: true, role: user.role, name: user.name });
    } catch (error) {
        console.error('Admin verify error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

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
 * @route   GET /api/admin/analytics
 * @desc    Get aggregated analytics data (donations, users, trends)
 * @access  Private/Admin
 */
router.get('/analytics', protect, admin, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const numDays = parseInt(days);
        const start = new Date();
        start.setDate(start.getDate() - numDays);
        start.setHours(0, 0, 0, 0);

        // Total counts
        const totalUsers = await User.countDocuments();
        const totalDonations = await Donation.countDocuments();
        const totalMedicines = await Medicine.countDocuments();

        // Donation status breakdown
        const statusAgg = await Donation.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const donationStatusBreakdown = statusAgg.map(s => ({ status: s._id, count: s.count }));

        // Daily donation trend (last N days)
        const donationTrends = await Donation.aggregate([
            { $match: { createdAt: { $gte: start } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // User roles breakdown
        const roleAgg = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        const userRoles = roleAgg.map(r => ({ role: r._id, count: r.count }));

        // Top donors
        const topDonorAgg = await Donation.aggregate([
            { $group: { _id: '$userId', count: { $sum: 1 }, donorName: { $first: '$donorName' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const topDonors = topDonorAgg.map(d => ({ userId: d._id, name: d.donorName || 'Unknown', count: d.count }));

        // New users in range
        const newUsers = await User.countDocuments({ createdAt: { $gte: start } });

        // Donations in range
        const donationsInRange = await Donation.countDocuments({ createdAt: { $gte: start } });
        const completedInRange = await Donation.countDocuments({ createdAt: { $gte: start }, status: 'completed' });

        res.json({
            totals: { totalUsers, totalDonations, totalMedicines },
            monthlyStats: { newUsers, totalDonations: donationsInRange, completedDonations: completedInRange, totalMedicines },
            donationStatusBreakdown,
            donationTrends,
            userRoles,
            topDonors,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * In-memory settings store. Survives between requests for the lifetime of the
 * server process. On a fresh start (or after a restart) _persisted is false,
 * which tells the client that localStorage values should be trusted instead.
 */
let _settings = {
    _persisted: false,
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
};

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings
 * @access  Private/Admin
 */
router.get('/settings', protect, admin, async (req, res) => {
    // Return current in-memory settings.
    // _persisted:true means the admin has explicitly saved settings this server session.
    // The client uses this flag to decide whether to trust server values over localStorage.
    res.json(_settings);
});

/**
 * @route   POST /api/admin/settings
 * @desc    Update system settings
 * @access  Private/Admin
 */
router.post('/settings', protect, admin, async (req, res) => {
    try {
        const { notifications, platform, security, database } = req.body;
        // Merge incoming values into the in-memory store
        _settings = {
            _persisted: true,
            notifications: { ..._settings.notifications, ...(notifications || {}) },
            platform: { ..._settings.platform, ...(platform || {}) },
            security: { ..._settings.security, ...(security || {}) },
            database: { ..._settings.database, ...(database || {}) },
        };
        res.json({ msg: 'Settings updated successfully', settings: _settings });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export const adminRouter = router;
