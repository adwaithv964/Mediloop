import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    genericName: { type: String },
    category: { type: String, required: true },
    dosage: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    expiryDate: { type: Date, required: true },
    batchNumber: { type: String },
    manufacturer: { type: String },
    price: { type: Number },
    notes: { type: String },
    imageUrl: { type: String },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});

export const Medicine = mongoose.model('Medicine', medicineSchema);
