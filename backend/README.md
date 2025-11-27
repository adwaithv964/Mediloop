# Mediloop Backend API

Node.js/Express backend for Mediloop medicine management platform with Gemini AI integration.

## 🚀 Quick Start

### **1. Install Dependencies**

```bash
npm install
```

### **2. Configure Environment**

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
NODE_ENV=development
```

Get your API key from: https://makersuite.google.com/app/apikey

### **3. Start Development Server**

```bash
npm run dev
```

Server runs on: `http://localhost:5000`

---

## 📡 API Endpoints

### **Health Check**
```bash
GET /health
```

### **Gemini Service Health**
```bash
GET /api/gemini/health
```

### **Generate AI Response**
```bash
POST /api/gemini/generate
Content-Type: application/json

{
  "prompt": "What are common side effects?",
  "context": "User's medicines: Aspirin, Vitamin D"
}

Response:
{
  "response": "Common side effects..."
}
```

### **Analyze Symptoms**
```bash
POST /api/gemini/analyze-symptoms
Content-Type: application/json

{
  "symptoms": [
    {
      "name": "Headache",
      "severity": "moderate",
      "duration": "2 days"
    }
  ]
}

Response:
{
  "analysis": "Analysis text..."
}
```

### **Generate Health Tips**
```bash
POST /api/gemini/health-tips
Content-Type: application/json

{
  "category": "medicine",
  "userMedicines": [
    { "name": "Aspirin", "dosage": "100mg" }
  ]
}

Response:
{
  "tips": [
    {
      "title": "Take Medicines on Time",
      "content": "...",
      "category": "medicine"
    }
  ]
}
```

### **Check Drug Interactions**
```bash
POST /api/gemini/drug-interactions
Content-Type: application/json

{
  "medicines": [
    { "name": "Aspirin", "dosage": "100mg" },
    { "name": "Ibuprofen", "dosage": "200mg" }
  ]
}

Response:
{
  "interactions": [
    {
      "severity": "moderate",
      "medicines": ["Aspirin", "Ibuprofen"],
      "description": "May increase bleeding risk",
      "recommendation": "Monitor closely, consult doctor"
    }
  ]
}
```

---

## 🔧 Configuration

### **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | ✅ Yes |
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment | No (default: development) |
| `CORS_ORIGIN` | Frontend URL | No (default: *)

---

## 🧪 Testing

### **Test with curl:**

```bash
# Health check
curl http://localhost:5000/health

# Generate response
curl -X POST http://localhost:5000/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js              # Main server file
│   ├── routes/
│   │   └── gemini.js          # Gemini API routes
│   └── services/
│       └── geminiService.js   # Gemini service
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## 🛡️ Security

- ✅ API keys stay on server (not exposed to client)
- ✅ CORS enabled for your frontend
- ✅ Input validation
- ✅ Error handling
- ✅ Rate limiting (can be added)

---

## 📝 Development

### **Auto-reload with Nodemon:**

```bash
npm run dev
```

Server auto-restarts on file changes.

### **Production:**

```bash
npm start
```

---

## 🔗 Integration with Frontend

The frontend should call these endpoints instead of calling Gemini directly.

Update frontend code:

```typescript
// Frontend call to backend
const response = await fetch('http://localhost:5000/api/gemini/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, context })
});
```

---

## 🐛 Troubleshooting

### **Port already in use:**
```bash
# Change PORT in .env
PORT=5001
```

### **API key error:**
- Check `.env` file exists
- Verify API key is correct
- Get new key from: https://makersuite.google.com/app/apikey

### **CORS errors:**
- Check `CORS_ORIGIN` in `.env`
- Update to your frontend URL

---

## 📚 Next Steps

1. ✅ Backend created
2. ⏳ Connect frontend to backend
3. ⏳ Add authentication
4. ⏳ Add database
5. ⏳ Deploy

---

**Made with ❤️ for Mediloop**

