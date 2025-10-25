# Mediloop - Quick Setup Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Install Dependencies

Open your terminal in the `mediloop` folder and run:

```bash
npm install
```

This will install all required packages including React, TypeScript, Firebase, Dexie, Tesseract.js, and more.

### Step 2: Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`

### Step 3: Test the Application

1. **Register a New User**
   - Go to `http://localhost:3000/register`
   - Create an account with role "Patient"
   - Login with your credentials

2. **Explore Features**
   - View the dashboard
   - Add a medicine (manually for now)
   - Set up a schedule
   - Browse donation options

## 🔧 Configuration (Optional)

### Firebase Setup (for Cloud Sync)

1. Create a Firebase project at https://firebase.google.com
2. Get your config from Project Settings
3. Update `src/config/firebase.ts` with your credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### OpenAI API (for AI Assistant)

1. Get API key from https://platform.openai.com
2. In the app Settings page, enter your API key
3. Or set it in `src/services/aiService.ts`

## 📱 Features Demo

### Patient Features

1. **Medicine Management**
   - Dashboard shows all medicines
   - Color-coded expiry warnings
   - Category-based organization

2. **Scheduling**
   - Set multiple daily reminders
   - Track adherence
   - View upcoming doses

3. **OCR Scanning**
   - Upload medicine strip photo
   - Auto-extract name and expiry
   - Edit and save details

4. **Donations**
   - Browse nearby NGOs/Hospitals
   - Select medicines to donate
   - Request pickup

5. **Reports**
   - Generate PDF reports
   - Export to Excel
   - Print for doctors

### Admin Features

1. **User Management**
   - View all users
   - Manage accounts
   - Monitor activity

2. **Analytics**
   - Platform statistics
   - Donation trends
   - User engagement

### NGO/Hospital Features

1. **Donation Management**
   - View incoming requests
   - Schedule pickups
   - Track inventory

## 🎨 UI Features

### Theme Toggle
- Click moon/sun icon in header
- Switches between light/dark mode
- Preference saved automatically

### Elderly Mode
- Enable in Settings
- Larger fonts and buttons
- Simplified navigation
- Enhanced contrast

### Offline Mode
- Works without internet
- All data stored locally
- Syncs when online

## 🧪 Testing the Features

### Test Medicine Entry
```
Name: Paracetamol 500mg
Category: Painkiller
Dosage: 1 tablet
Quantity: 20 tablets
Expiry: [Future date]
```

### Test Schedule
```
Medicine: Paracetamol
Times: 08:00, 14:00, 20:00
Frequency: Daily
```

### Test Donation
1. Add medicines with future expiry
2. Go to Donations
3. Select medicines
4. Choose NGO
5. Request pickup

## 📊 Sample Data

The app initializes with:
- 2 Sample NGOs
- 1 Sample Hospital
- Pre-configured medicine categories

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Use different port
npm run dev -- --port 3001
```

### Dependencies Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Browser Notifications
1. Enable notifications in browser settings
2. Allow when prompted by the app
3. Check system notification permissions

### OCR Not Working
- Tesseract.js downloads language files on first use
- May take a few seconds initially
- Check browser console for errors

## 🏗️ Build for Production

```bash
npm run build
```

Output in `dist/` folder. Deploy to:
- Netlify
- Vercel
- Firebase Hosting
- Any static host

## 📱 Progressive Web App

The app is PWA-ready:
- Install to home screen
- Works offline
- Push notifications
- Fast loading

## 🔐 Security Notes

- All sensitive data encrypted
- HTTPS required for production
- Firebase handles authentication
- No data sent to third parties

## 🎯 Next Steps

1. Customize Firebase config
2. Add your API keys
3. Test all features
4. Customize branding
5. Deploy to production

## 📚 Documentation

- Full README: See `README.md`
- Code Documentation: Comments in source files
- API Docs: Check service files in `src/services/`

## 🆘 Support

For issues:
1. Check console for errors
2. Review browser compatibility
3. Ensure dependencies installed
4. Check Firebase configuration

---

**Happy Medicine Managing! 💊**
