import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { geminiRouter } from './routes/gemini.js';
import mongoose from 'mongoose';

import connectDB from './db.js';
import { syncRouter } from './routes/sync.js';
import donationsRouter from './routes/donations.js';
import ngosRouter from './routes/ngos.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to Database
// Only connect if MONGODB_URI is provided
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.warn('⚠️ MONGODB_URI not found in .env, skipping database connection');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mediloop-adwaithv964s-projects.vercel.app', // Your Vercel URL
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Mediloop Backend API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

import { familyRouter } from './routes/family.js';

// API Routes
app.use('/api/gemini', geminiRouter);
app.use('/api/sync', syncRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/ngos', ngosRouter);
app.use('/api/family', familyRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Mediloop Backend Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

" " 
