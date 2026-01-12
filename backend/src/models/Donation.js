import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    ngoId: { type: String },
    hospitalId: { type: String },
    donorName: { type: String },
    donorPhone: { type: String },
    donorEmail: { type: String },
    medicines: [{
        medicineId: String,
        name: String,
        quantity: Number,
        expiryDate: Date,
        batchNumber: String
    }],
    status: { type: String, required: true, default: 'pending' },
    pickupAddress: { type: String },
    location: {
        lat: Number,
        lng: Number
    },
    pickupDate: { type: Date },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Donation = mongoose.model('Donation', donationSchema);
