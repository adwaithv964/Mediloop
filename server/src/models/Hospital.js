import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    verified: { type: Boolean, default: false },
    location: {
        lat: Number,
        lng: Number
    },
    createdAt: { type: Date, default: Date.now },
});

export const Hospital = mongoose.model('Hospital', hospitalSchema);
