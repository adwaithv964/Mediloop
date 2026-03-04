import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    // Profile Info
    name: { type: String },
    phone: { type: String },
    address: { type: String },
    preferences: {
        theme: { type: String, default: 'light' },
        elderlyMode: { type: Boolean, default: false },
        notificationsEnabled: { type: Boolean, default: true },
        voiceEnabled: { type: Boolean, default: false },
        language: { type: String, default: 'en' },
        alarmSound: { type: String }
    },
    // Family / Linked Accounts
    familyCode: { type: String, unique: true, sparse: true }, // Code for others to add this user
    caregivers: [{ type: String, ref: 'User' }], // IDs of users who manage this account
    dependents: [{ type: String, ref: 'User' }], // IDs of users this account manages
    emergencyContacts: [{
        name: String,
        phone: String,
        email: String,
        relation: String
    }],
    createdAt: { type: Date, default: Date.now },
});

// Generate family code before saving if not present
userSchema.pre('save', async function () {
    if (!this.familyCode) {
        this.familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
});

export const User = mongoose.model('User', userSchema);
