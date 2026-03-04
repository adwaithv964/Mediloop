import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ['prescription', 'lab_report', 'medical_history', 'insurance', 'other'],
        required: true
    },
    fileUrl: { type: String },
    fileName: { type: String },
    notes: { type: String },
    date: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
