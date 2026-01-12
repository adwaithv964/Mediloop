import mongoose from 'mongoose';

const medicineScheduleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    medicineId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    frequency: { type: String, enum: ['once', 'daily', 'weekly', 'custom'], required: true },
    times: [{ type: String }],
    dosagePerIntake: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    reminderEnabled: { type: Boolean, default: true },
    taken: [{
        date: { type: Date },
        time: { type: String },
        taken: { type: Boolean },
        skipped: { type: Boolean },
        notes: { type: String }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const MedicineSchedule = mongoose.model('MedicineSchedule', medicineScheduleSchema);
