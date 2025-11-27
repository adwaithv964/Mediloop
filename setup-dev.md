# 🚀 Development Setup Guide

## **Current State**

✅ Backend structure created in `backend/` folder
✅ Frontend remains in current location (no changes needed)
✅ Gemini API backend service ready

---

## **Quick Setup (3 Steps)**

### **Step 1: Install Backend Dependencies**

```bash
cd backend
npm install
```

### **Step 2: Configure Backend Environment**

Create `backend/.env` file:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_from_google_ai_studio
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### **Step 3: Start Both Servers**

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Server runs on: http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
# Stay in root directory
npm run dev
# Server runs on: http://localhost:3000
```

---

## **What Changed**

### **New Files Created:**

1. **`backend/`** - Node.js/Express backend
   - `src/server.js` - Main server
   - `src/routes/gemini.js` - API routes
   - `src/services/geminiService.js` - Gemini service
   - `package.json` - Backend dependencies

2. **Documentation**
   - `PROJECT_RESTRUCTURE_GUIDE.md` - Complete guide
   - `backend/README.md` - Backend documentation

### **Frontend (No Changes)**

- ✅ All frontend files stay in place
- ✅ Can continue using as-is
- ✅ Optionally update to call backend API

---

## **Current Architecture**

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
│  Port: 3000 │
└──────┬──────┘
       │
       │ HTTP Requests
       ▼
┌─────────────────┐
│   Backend API   │
│  Port: 5000     │
│  (Node.js)      │
└──────┬──────────┘
       │
       │ API Calls
       ▼
┌─────────────────┐
│  Gemini AI API  │
│  (Google Cloud) │
└─────────────────┘
```

---

## **Testing the Backend**

### **1. Check Health:**
```bash
curl http://localhost:5000/health
```

### **2. Check Gemini Configuration:**
```bash
curl http://localhost:5000/api/gemini/health
```

### **3. Test AI Generation:**
```bash
curl -X POST http://localhost:5000/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are common medicine side effects?"}'
```

---

## **Option: Update Frontend to Use Backend**

Currently, frontend calls Gemini directly. To use the backend API:

1. Update `src/services/geminiAPI.ts` to call your backend
2. Change API endpoint from Gemini to your backend
3. Keep the rest of the code the same

**Example change:**

```typescript
// OLD (Direct Gemini call)
const response = await fetch(`https://generativelanguage.googleapis.com/...`);

// NEW (Call your backend)
const response = await fetch('http://localhost:5000/api/gemini/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, context })
});
```

---

## **Project Structure**

```
mediloop-production/
├── backend/                  # NEW - Backend API
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── src/                      # EXISTING - Frontend
├── public/                   # EXISTING - Frontend
└── package.json              # EXISTING - Frontend
```

---

## **Commands Summary**

### **Start Backend:**
```bash
cd backend && npm run dev
```

### **Start Frontend:**
```bash
npm run dev
```

### **Install Backend Dependencies:**
```bash
cd backend && npm install
```

### **Check Backend:**
```bash
curl http://localhost:5000/health
```

---

## **Next Steps**

1. ✅ Install backend dependencies
2. ✅ Add API key to backend/.env
3. ✅ Start backend server
4. ⏳ (Optional) Update frontend to call backend
5. ⏳ Test integration
6. ⏳ Deploy

---

## **Benefits**

✅ **Security:** API keys on server (not in browser)
✅ **Separation:** Clear frontend/backend split
✅ **Scalability:** Easy to add more services
✅ **Professional:** Industry-standard structure
✅ **Flexible:** Frontend can still call APIs directly if needed

---

## **Help & Troubleshooting**

### **Backend won't start:**
- Check if port 5000 is available
- Verify `.env` file exists
- Check API key is correct

### **API errors:**
- Verify GEMINI_API_KEY in .env
- Check API key at: https://makersuite.google.com/app/apikey

### **CORS errors:**
- Update CORS_ORIGIN in backend/.env to your frontend URL

---

**Ready to develop!** 🎉

