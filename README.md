# Mediloop - Medicine Management & Donation Platform

![Mediloop](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Mediloop is an integrated, offline-first web platform designed for comprehensive medicine management and local donations. It helps individuals and families manage medicine schedules, track expiry dates, and connect with certified NGOs or hospitals to donate unused, non-expired medicines.

## Features

### 🏥 Patient Module
- **Daily Reminders**: Web notifications to ensure doses are never missed
- **OCR Medicine Scanning**: Automatically extract medicine details from strip photos
- **Medicine Category Tagging**: Organize medicines by type (painkillers, vitamins, etc.)
- **Smart Refill Alerts**: Get notified when medicine stock is running low
- **Report Export & Print**: Generate comprehensive reports for doctors
- **Color-Coded Expiry Warnings**: Visual indicators (Green/Yellow/Red) for expiry status
- **Donation Module**: Donate unused medicines to certified NGOs/hospitals
- **One-Click Pickup Request**: Schedule medicine pickups effortlessly
- **Dashboard Overview**: Central hub for medicines, schedules, and health stats
- **Progress Tracker**: Visual charts showing medication adherence
- **Voice Input**: Add medicines using voice commands
- **AI Health Assistant**: Get personalized health suggestions and guidance
- **Elderly-Friendly Mode**: Large buttons and simplified navigation for seniors

### 👨‍💼 Admin Module
- **User Management**: Manage all platform users
- **Analytics Dashboard**: Track platform usage and donation trends
- **Cloud Sync & Data Security**: End-to-end encryption with Firebase
- **Offline-First Mode**: Full functionality using IndexedDB
- **System Settings**: Configure platform-wide settings
- **Notification Management**: Control all notification systems
- **OCR Backend**: Manage OCR processing

### 🏢 NGO/Hospital Module
- **Donation Requests**: View and manage incoming medicine donations
- **Pickup Scheduling**: Confirm and schedule donation pickups
- **Donation Tracking**: Monitor medicines received and distributed
- **User Communication**: Provide feedback on donations
- **Analytics**: Track donation trends and compliance

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router v6** - Routing
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Framer Motion** - Animations

### Database & Storage
- **IndexedDB (Dexie)** - Offline-first local storage
- **Firebase Firestore** - Cloud sync and real-time updates
- **Firebase Storage** - Image storage

### Key Libraries
- **Tesseract.js** - OCR for medicine strip scanning
- **Chart.js** - Data visualization
- **jsPDF** - PDF report generation
- **SheetJS (xlsx)** - Excel export
- **Crypto-js** - Data encryption
- **Zustand** - State management
- **React Hot Toast** - Notifications
- **date-fns** - Date utilities

### APIs & Services
- **Web Push API** - Browser notifications
- **Google Maps JavaScript API** - Location services
- **OpenAI/Gemini API** - AI-powered suggestions

## Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Modern browser with IndexedDB support
- (Optional) Firebase account for cloud sync
- (Optional) OpenAI API key for AI features

### Setup Steps

1. **Clone the repository**
```bash
cd mediloop
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase (Optional)**

Edit `src/config/firebase.ts` and add your Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to `http://localhost:3000`

## Build & Deployment

### Production Build
```bash
npm run build
```

The optimized build will be in the `dist` folder.

### Type Checking
```bash
npm run type-check
```

## Usage Guide

### For Patients

1. **Register/Login**
   - Choose "Patient" role during registration
   - Login with your credentials

2. **Add Medicines**
   - Click "Add Medicine" on dashboard
   - Enter manually or use "Scan Medicine" with OCR
   - Set dosage, quantity, and expiry date
   - Add category tags

3. **Set Reminders**
   - Go to Schedule section
   - Select medicine and set times
   - Enable browser notifications

4. **Donate Medicines**
   - Navigate to Donations section
   - Select non-expired medicines
   - Choose nearby NGO/Hospital
   - Request pickup

5. **View Reports**
   - Access Reports section
   - Export as PDF or Excel
   - Print for doctor visits

### For NGOs/Hospitals

1. **Register as NGO/Hospital**
   - Select appropriate role
   - Provide certification details

2. **Manage Donations**
   - View incoming requests
   - Confirm pickups
   - Track donation history

### For Admins

1. **System Management**
   - Monitor all users
   - View analytics
   - Configure settings
   - Manage notifications

## Features Detail

### Offline-First Architecture

Mediloop uses IndexedDB for local storage, ensuring full functionality without internet:
- All medicine data stored locally
- Schedules and reminders work offline
- Cloud sync when online

### OCR Medicine Scanning

Upload a photo of your medicine strip:
1. Click "Scan Medicine"
2. Take/upload photo
3. OCR extracts: name, expiry date, batch number
4. Review and save

### Color-Coded Expiry System

- 🟢 **Green**: >90 days until expiry
- 🟡 **Yellow**: 30-90 days (Warning)
- 🔴 **Red**: <30 days (Critical)
- ⚫ **Gray**: Expired

### AI Health Assistant

Get intelligent suggestions:
- "Take vitamin D with fatty foods"
- "Avoid milk with antibiotics"
- "Best time to take iron supplements"
- Medicine interaction warnings

### Elderly-Friendly Mode

Activated in Settings:
- Larger fonts (18px+)
- Bigger buttons
- Simplified navigation
- Voice reminders
- High contrast colors

## Security

### Data Protection
- **End-to-end encryption** using AES
- **Secure authentication** via Firebase Auth
- **HTTPS only** in production
- **No sensitive data** in localStorage

### Privacy
- User data stays local by default
- Cloud sync is optional
- No data sharing with third parties
- GDPR compliant

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Progressive Web App (PWA)

Mediloop can be installed as a PWA:
- Offline functionality
- Home screen installation
- Push notifications
- Fast loading

## API Keys & Configuration

### Google Maps (Optional)
For medical shop location tracking, add your API key to the maps component.

### OpenAI/Gemini (Optional)
For AI suggestions, configure in Settings > AI Assistant.

## Troubleshooting

### Notifications not working
1. Enable browser notifications permission
2. Check system notification settings
3. Ensure HTTPS (required for Web Push)

### OCR not accurate
1. Ensure good lighting in photo
2. Keep medicine strip flat
3. Avoid glare/reflections
4. Try manual entry if needed

### Offline sync issues
1. Check internet connection
2. Verify Firebase config
3. Clear IndexedDB and re-sync

## Project Structure

```
mediloop/
├── public/
│   ├── logo.svg
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── components/
│   │   └── layout/
│   ├── config/
│   │   └── firebase.ts
│   ├── db/
│   │   └── index.ts
│   ├── pages/
│   │   ├── auth/
│   │   ├── patient/
│   │   ├── admin/
│   │   └── ngo/
│   ├── services/
│   │   ├── ocrService.ts
│   │   ├── notificationService.ts
│   │   └── aiService.ts
│   ├── store/
│   │   ├── useAuthStore.ts
│   │   └── useThemeStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@mediloop.com

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Barcode scanning support
- [ ] Medicine interaction checker
- [ ] Integration with pharmacy APIs
- [ ] Multi-language support
- [ ] Wearable device integration
- [ ] Telemedicine integration
- [ ] Prescription OCR

## Acknowledgments

- **Tesseract.js** for OCR capabilities
- **Firebase** for backend services
- **Lucide** for beautiful icons
- **TailwindCSS** for styling framework
- All open-source contributors

---

**Made with ❤️ for better healthcare management**

**Version:** 1.0.0  
**Last Updated:** October 2024
