import express from 'express';
import { GeminiService } from '../services/geminiService.js';

const router = express.Router();
const geminiService = new GeminiService();

// Health check for Gemini service
router.get('/health', (req, res) => {
  const isConfigured = geminiService.isConfigured();
  res.json({
    configured: isConfigured,
    message: isConfigured ? 'Gemini API ready' : 'Gemini API key not configured'
  });
});

// Generate general AI response
router.post('/generate', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await geminiService.generateResponse(prompt, context);
    res.json({ response });
  } catch (error) {
    console.error('Gemini generate error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// Analyze symptoms
router.post('/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms, userMedicines } = req.body;

    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ error: 'Symptoms array is required' });
    }

    const analysis = await geminiService.analyzeSymptoms(symptoms, userMedicines);
    res.json({ analysis });
  } catch (error) {
    console.error('Symptom analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze symptoms',
      details: error.message
    });
  }
});

// Generate health tips
router.post('/health-tips', async (req, res) => {
  try {
    const { category, userMedicines } = req.body;

    const tips = await geminiService.generateHealthTips(category, userMedicines);
    res.json({ tips });
  } catch (error) {
    console.error('Health tips error:', error);
    res.status(500).json({
      error: 'Failed to generate health tips',
      details: error.message
    });
  }
});

// Check drug interactions
router.post('/drug-interactions', async (req, res) => {
  try {
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({ error: 'Medicines array is required' });
    }

    const interactions = await geminiService.checkDrugInteractions(medicines);
    res.json({ interactions });
  } catch (error) {
    console.error('Drug interaction error:', error);
    res.status(500).json({
      error: 'Failed to check drug interactions',
      details: error.message
    });
  }
});

// Generate medicine schedule
router.post('/schedule', async (req, res) => {
  try {
    const { frequency } = req.body;

    if (!frequency) {
      return res.status(400).json({ error: 'Frequency description is required' });
    }

    const schedule = await geminiService.generateSchedule(frequency);
    res.json({ schedule });
  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({
      error: 'Failed to generate schedule',
      details: error.message
    });
  }
});

export const geminiRouter = router;

