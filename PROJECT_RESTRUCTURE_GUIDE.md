# 🏗️ Project Restructure Guide - Frontend & Backend Separation

## 📁 **New Project Structure**

```
mediloop-production/
├── frontend/                 # React/Vite Frontend (EXISTING CODE)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js/Express Backend (NEW)
│   ├── src/
│   │   ├── server.js        # Main server file
│   │   ├── routes/
│   │   │   └── gemini.js    # Gemini API routes
│   │   └── services/
│   │       └── geminiService.js  # Gemini service
│   ├── .env                 # Backend environment variables
│   └── package.json
│
└── scripts/                 # Utility scripts
    └── setup-dev.sh         # Development setup script
```

---

## 🚀 **Quick Start**

### **Step 1: Move Files to Frontend Folder**

The current project structure IS your frontend. We need to:

1. **Create frontend folder structure**
2. **Keep all existing frontend files**
3. **Create backend folder** (already done)

### **Step 2: Install Backend Dependencies**

```bash
cd backend
npm install
```

### **Step 3: Configure Environment**

Create `backend/.env`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### **Step 4: Start Development Servers**

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
# Stay in root or cd to frontend
npm run dev
```

---

## 🔧 **Architecture Overview**

### **Frontend (React + Vite)**
- **Location:** Keep all current files
- **Port:** 3000
- **Technology:** React 18, TypeScript, Vite, TailwindCSS
- **Purpose:** User interface and interactions

### **Backend (Node.js + Express)**
- **Location:** `backend/` folder
- **Port:** 5000
- **Technology:** Node.js, Express, Google Gemini AI
- **Purpose:** API endpoints and AI services

---

## 📝 **Migration Steps**

### **Option 1: Keep Current Structure (Recommended)**

**Keep everything as-is for frontend** and add backend as a sibling directory.

```
mediloop-production/          # CURRENT STRUCTURE (Frontend)
├── src/                      # Frontend code
├── public/                   # Frontend assets
├── backend/                  # NEW - Backend API
└── package.json              # Frontend package.json
```

### **Option 2: Complete Separation**

Move everything to frontend/ folder:

```
mediloop-production/
├── frontend/
│   └── [move all current files here]
├── backend/
│   └── [backend files]
└── package.json (root)
```

---

## 🔄 **How Frontend Communicates with Backend**

### **Before (Current):**
Frontend calls Gemini API directly from browser.

### **After (With Backend):**
Frontend calls backend API, backend handles Gemini.

### **Update Frontend Gemini Service:**

Change `src/services/geminiAPI.ts` to call your backend:

```typescript
// OLD: Direct API call
const response = await fetch(`https://generativelanguage.googleapis.com/...`);

// NEW: Call your backend
const response = await fetch(`http://localhost:5000/api/gemini/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, context })
});
```

---

## 📦 **Environment Variables**

### **Frontend (.env)**
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_BASE_URL=http://localhost:5000
```

### **Backend (.env)**
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

---

## 🎯 **Benefits of This Structure**

✅ **Security:** API keys stay on server (not exposed to browser)
✅ **Scalability:** Easy to add more backend services
✅ **Separation:** Clear frontend/backend boundaries
✅ **Professional:** Industry-standard structure
✅ **API Management:** Centralized API endpoints
✅ **Future-Ready:** Easy to add authentication, databases, etc.

---

## 🧪 **Testing**

### **Test Backend:**
```bash
cd backend
npm run dev
# Visit: http://localhost:5000/health
```

### **Test Gemini API:**
```bash
curl -X POST http://localhost:5000/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are common side effects of blood pressure medicine?"}'
```

### **Test Frontend:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
npm run dev  # Frontend
```

---

## 📚 **Next Steps**

1. ✅ Backend structure created
2. ✅ Gemini API service created
3. ⏳ Move frontend files (or keep as-is)
4. ⏳ Update frontend to call backend API
5. ⏳ Test integration
6. ⏳ Deploy

---

## 🔒 **Security Notes**

- ✅ API keys are now on server (not exposed to browser)
- ✅ CORS enabled for your frontend domain
- ✅ Error handling in place
- ✅ Input validation

---

## 🎉 **Ready to Use!**

Your project now has:
- ✅ Professional backend structure
- ✅ Gemini AI integration on server
- ✅ REST API endpoints
- ✅ Proper error handling
- ✅ Environment configuration

**Start the backend and frontend to begin using!**

