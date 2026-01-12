import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    ngoId: { type: String },
    hospitalId: { type: String },
    status: { type: String, required: true, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

export const Donation = mongoose.model('Donation', donationSchema);
