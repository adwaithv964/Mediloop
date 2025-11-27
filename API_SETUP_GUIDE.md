# Environment Variables Setup

## Required API Keys for AI Features

Add these to your `.env` file:

```env
# OpenAI API Key (optional - fallback if Gemini fails)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini API Key (recommended primary API)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase (existing)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Supabase (existing)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env` file as `VITE_GEMINI_API_KEY`

## Features Using AI APIs

- ✅ **AI Health Assistant** - Chat interface for health guidance
- ✅ **Symptom Checker** - AI-powered symptom analysis
- ✅ **Drug Interactions** - Medicine compatibility checking
- ✅ **Daily Health Tips** - AI-generated wellness tips

All features include intelligent fallbacks when API keys are not configured.
