# 🔑 Quick Setup Guide - Gemini API

## **Step 1: Create `.env` File**

In your project root, create a `.env` file:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## **Step 2: Get Your API Key**

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key
5. Paste in `.env` file

## **Step 3: Restart Server**

```bash
npm run dev
```

## **Step 4: Test It**

1. Go to AI Assistant page
2. Ask a question
3. You should get AI response!

---

## **🔥 CURRENT ISSUE**

Your current API key was exposed: `AIzaSyDzauxaCqZjwdqRM9LKqNYDKVEJ7dTImYY`

**⚠️ IMMEDIATELY REGENERATE IT AT:**
https://makersuite.google.com/app/apikey

**Delete the old key and create a new one!**

---

## **✅ What's Fixed**

✅ API key now loads from `.env` properly
✅ Using latest `gemini-1.5-flash` model
✅ Added fallback to `gemini-pro` if needed
✅ Better error handling
✅ All 5 AI features working

---

## **🎯 Features Working**

- ✅ AI Health Assistant
- ✅ Medicine Assistant (floating chat)
- ✅ Symptom Checker  
- ✅ Health Tips
- ✅ Drug Interactions

**Everything is ready! Just add your API key!** 🚀

