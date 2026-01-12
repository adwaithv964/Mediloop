import express from 'express';
import { NGO } from '../models/NGO.js';
import { User } from '../models/User.js';

const router = express.Router();

// Get all NGOs
router.get('/', async (req, res) => {
    try {
        const ngos = await NGO.find({ verified: true });
        res.json(ngos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create or Update NGO Profile
router.post('/', async (req, res) => {
    try {
        const { id, ...data } = req.body;
        // Upsert based on ID
        const ngo = await NGO.findOneAndUpdate(
            { id: id },
            { id, ...data },
            { new: true, upsert: true }
        );
        res.status(201).json(ngo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get NGO by ID
router.get('/:id', async (req, res) => {
    try {
        const ngo = await NGO.findOne({ id: req.params.id });
        if (!ngo) return res.status(404).json({ message: 'NGO not found' });
        res.json(ngo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
