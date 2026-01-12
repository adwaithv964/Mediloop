import express from 'express';
import { Donation } from '../models/Donation.js';

const router = express.Router();

// Create a new donation request
router.post('/', async (req, res) => {
    try {
        const donation = new Donation(req.body);
        await donation.save();
        res.status(201).json(donation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get donations for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const donations = await Donation.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get donation requests for a specific NGO
router.get('/ngo/:ngoId', async (req, res) => {
    try {
        // Find donations specifically for this NGO or general ones if logic required
        // For now, assuming straightforward assignment
        const donations = await Donation.find({ ngoId: req.params.ngoId }).sort({ createdAt: -1 });
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update donation status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const donation = await Donation.findOneAndUpdate(
            { id: req.params.id }, // Use custom id field
            { status, updatedAt: new Date() },
            { new: true }
        );
        if (!donation) return res.status(404).json({ message: 'Donation not found' });
        res.json(donation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single donation details
router.get('/:id', async (req, res) => {
    try {
        const donation = await Donation.findOne({ id: req.params.id });
        if (!donation) return res.status(404).json({ message: 'Donation not found' });
        res.json(donation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update donation (full update for editing)
router.put('/:id', async (req, res) => {
    try {
        const check = await Donation.findOne({ id: req.params.id });
        if (!check) return res.status(404).json({ message: 'Donation not found' });
        if (check.status !== 'pending') {
            return res.status(400).json({ message: 'Can only edit pending donations' });
        }

        const donation = await Donation.findOneAndUpdate(
            { id: req.params.id },
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        res.json(donation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete donation
router.delete('/:id', async (req, res) => {
    try {
        const donation = await Donation.findOne({ id: req.params.id });
        if (!donation) return res.status(404).json({ message: 'Donation not found' });
        if (donation.status !== 'pending') {
            return res.status(400).json({ message: 'Can only delete pending donations' });
        }
        await Donation.deleteOne({ id: req.params.id });
        res.json({ message: 'Donation deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
