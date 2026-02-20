import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['info', 'warn', 'error', 'debug'],
        default: 'info',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying by date and level
logSchema.index({ timestamp: -1 });
logSchema.index({ level: 1 });

export const Log = mongoose.model('Log', logSchema);
