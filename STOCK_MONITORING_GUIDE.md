# 📦 Stock Monitoring & Notification System - Complete Guide

## 🎉 **NEW FEATURES ADDED**

### **1. Limited Expiry Notifications** ✅
- **Problem Fixed:** Expiry notifications were spamming continuously
- **Solution:** Limited to **4 notifications per day** at specific times

### **2. Stock Tracking** ✅
- **Auto-decrement:** Stock reduces when you mark medicine as taken
- **Low stock alerts:** Notifies when ≤10 units left
- **Out of stock alerts:** Notifies when quantity reaches 0

### **3. Dashboard Stock Alerts** ✅
- **Visual banner:** Shows stock issues at top of dashboard
- **Quick stats:** See out-of-stock and low-stock counts
- **Direct link:** Click to view and refill medicines

---

## 🔔 **EXPIRY NOTIFICATION SYSTEM**

### **How It Works Now:**

#### **Limited to 4 Notifications Per Day:**
Expiry notifications only trigger at these times:
- 🌅 **8:00 AM** (Morning reminder)
- 🌞 **12:00 PM** (Lunch reminder)
- 🌆 **4:00 PM** (Afternoon reminder)
- 🌙 **8:00 PM** (Evening reminder)

#### **Smart Spacing:**
- Minimum **3 hours** between notifications
- Maximum **4 per day** per medicine
- Resets every day at midnight
- No more spam!

### **When You Get Notified:**

#### **Expiring Soon (≤7 days):**
```
Title: ⚠️ Medicine Expiring Soon
Message: Aspirin 500mg expires in 5 days
```

#### **Already Expired:**
```
Title: 🚫 Medicine Expired
Message: Aspirin 500mg has expired. Please dispose safely or donate if suitable.
```

### **Notification Schedule Example:**
```
Monday:
8:00 AM  → "Aspirin expires in 5 days"
12:00 PM → "Aspirin expires in 5 days"
4:00 PM  → "Aspirin expires in 5 days"
8:00 PM  → "Aspirin expires in 5 days"

Then no more until Tuesday!
```

---

## 📦 **STOCK MONITORING SYSTEM**

### **Automatic Stock Tracking:**

#### **When Stock Decreases:**
1. You mark medicine as taken
2. System extracts quantity from dosage:
   - "1 tablet" → reduces by 1
   - "2 capsules" → reduces by 2
   - "5 ml" → reduces by 5
3. Stock updates automatically
4. Checks if now low or out of stock
5. Sends notification if needed

#### **Stock Levels:**
```
> 10 units  = ✅ Good Stock (no alerts)
≤ 10 units  = ⚠️ Low Stock (daily alert)
0 units     = 🚫 Out of Stock (daily alert)
```

### **Stock Notifications:**

#### **Low Stock Alert (≤10 units):**
```
Title: ⚠️ Low Stock Alert
Message: Aspirin 500mg is running low! Only 8 tablets left. Consider refilling soon.
```
- Sent once per day
- Until you refill above 10 units

#### **Out of Stock Alert (0 units):**
```
Title: 📦 Medicine Out of Stock
Message: Aspirin 500mg has run out! Please refill immediately.
```
- Sent once per day
- Until you refill

---

## 📊 **DASHBOARD STOCK ALERTS**

### **Visual Banner:**
When you have stock issues, a red alert banner appears at the top:

```
╔═══════════════════════════════════════════════╗
║  ⚠️  STOCK ALERTS                             ║
║                                               ║
║  • 2 medicines out of stock                   ║
║  • 3 medicines running low (≤10 units)        ║
║                                               ║
║  View & Refill →                              ║
╚═══════════════════════════════════════════════╝
```

### **Stats Cards:**
Dashboard now shows:
- **Total Medicines** - Your medicine count
- **Expiring Soon** - Expiring within 30 days
- **Today's Doses** - Scheduled for today
- **Adherence Rate** - % of taken medicines

### **Stock Summary:**
Internally tracks:
- Total medicines
- Out of stock count
- Low stock count
- Expiring count
- Expired count

---

## 🔧 **HOW IT WORKS (Technical)**

### **Notification Tracking:**
System stores in `localStorage`:
```javascript
{
  "medicine-123-expiry": {
    medicineId: "medicine-123",
    type: "expiry",
    lastNotified: "2024-10-25T08:00:00Z",
    notificationCount: 2
  }
}
```

### **Daily Reset:**
- At midnight, counters reset to 0
- New day = fresh 4 notifications allowed
- Old timestamp cleared

### **Stock Decrement Logic:**
```javascript
// Extract quantity from dosage
"1 tablet" → 1
"2 capsules" → 2
"500 mg" → 1 (default)

// Update database
currentStock - extractedAmount = newStock

// Check thresholds
if (newStock === 0) → Send "Out of Stock"
if (newStock <= 10) → Send "Low Stock"
```

---

## 🎯 **USAGE EXAMPLES**

### **Example 1: Taking Medicine**

**Scenario:**
- You have 15 Aspirin tablets
- Schedule: 1 tablet, 3 times daily
- You mark as taken

**What Happens:**
```
Day 1: 15 tablets
  → Take at 8 AM: 14 tablets ✅
  → Take at 2 PM: 13 tablets ✅
  → Take at 8 PM: 12 tablets ✅

Day 2: 12 tablets
  → Take at 8 AM: 11 tablets ✅
  → Take at 2 PM: 10 tablets ⚠️
  
  Notification: "Low Stock Alert! Only 10 tablets left"
  
Day 3: 10 tablets
  → Take at 8 AM: 9 tablets
  → Take at 2 PM: 8 tablets
  → Take at 8 PM: 7 tablets

Day 4: 7 tablets (still getting daily low stock alert)
  
Day 8: 0 tablets 🚫
  
  Notification: "Out of Stock! Please refill immediately"
```

### **Example 2: Expiring Medicine**

**Scenario:**
- Aspirin expires in 5 days
- Today is Monday

**Notification Schedule:**
```
Monday:
  8:00 AM  → "Aspirin expires in 5 days"
  12:00 PM → "Aspirin expires in 5 days"
  4:00 PM  → "Aspirin expires in 5 days"
  8:00 PM  → "Aspirin expires in 5 days"
  (No more today!)

Tuesday:
  8:00 AM  → "Aspirin expires in 4 days"
  12:00 PM → "Aspirin expires in 4 days"
  4:00 PM  → "Aspirin expires in 4 days"
  8:00 PM  → "Aspirin expires in 4 days"

... continues until expired or removed
```

---

## ⚙️ **CONFIGURATION**

### **Change Notification Times:**
In `stockMonitoringService.ts`, line 11:
```typescript
private readonly NOTIFICATION_INTERVALS = [8, 12, 16, 20];

// Change to:
private readonly NOTIFICATION_INTERVALS = [9, 13, 17, 21]; // 9AM, 1PM, 5PM, 9PM
// Or any hours you prefer
```

### **Change Daily Limit:**
In `stockMonitoringService.ts`, line 10:
```typescript
private readonly MAX_EXPIRY_NOTIFICATIONS_PER_DAY = 4;

// Change to:
private readonly MAX_EXPIRY_NOTIFICATIONS_PER_DAY = 6; // 6 per day
```

### **Change Low Stock Threshold:**
In `stockMonitoringService.ts`, line 171:
```typescript
else if (quantity <= 10) {

// Change to:
else if (quantity <= 20) { // Alert when 20 or less
```

---

## 🧪 **TESTING**

### **Test Expiry Notifications:**

#### **Method 1: Change Notification Times**
1. Set notification times to current hour
2. Edit medicine expiry to 5 days from now
3. Wait for next hour
4. Should get notification

#### **Method 2: Reset Trackers**
1. Open browser console (F12)
2. Type: `stockMonitoringService.resetAllTrackers()`
3. Refresh page
4. All notification limits reset

### **Test Stock Notifications:**

#### **Method 1: Set Low Stock**
1. Go to Medicines
2. Edit a medicine
3. Set quantity to 5
4. Save
5. Should see low stock notification

#### **Method 2: Mark as Taken**
1. Create schedule with medicine (quantity 10)
2. Mark as taken 10 times
3. Stock reaches 0
4. Should see out of stock notification

---

## 📋 **NOTIFICATION FREQUENCY**

| Notification Type | Frequency | Max Per Day | Time Restrictions |
|------------------|-----------|-------------|-------------------|
| **Expiry Warning** | 4x daily | 4 | 8 AM, 12 PM, 4 PM, 8 PM |
| **Expired** | 4x daily | 4 | 8 AM, 12 PM, 4 PM, 8 PM |
| **Low Stock** | 1x daily | 1 | Anytime (24h gap) |
| **Out of Stock** | 1x daily | 1 | Anytime (24h gap) |
| **Medicine Reminder** | Per schedule | Unlimited | Scheduled times |

---

## 💡 **TIPS & BEST PRACTICES**

### **For Users:**

1. **Refill Promptly**
   - Act on low stock alerts
   - Don't wait until out of stock
   - Keep buffer stock

2. **Accurate Dosages**
   - Use format: "1 tablet", "2 capsules"
   - System extracts the number
   - Affects stock tracking

3. **Regular Updates**
   - Update quantities when refilling
   - Edit medicine to increase stock
   - System tracks changes

4. **Monitor Dashboard**
   - Check stock alerts banner
   - Click "View & Refill"
   - Stay ahead of shortages

### **For Developers:**

1. **Notification Throttling**
   - Uses localStorage for persistence
   - Survives page refresh
   - Resets daily automatically

2. **Stock Decrement**
   - Regex extracts quantity: `/^(\d+)/`
   - Defaults to 1 if no match
   - Never goes below 0

3. **Database Updates**
   - Updates `quantity` field
   - Sets `updatedAt` timestamp
   - Triggers stock checks

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Still Getting Too Many Notifications**

**Check:**
1. Browser console for logs
2. localStorage trackers
3. Notification times match intervals

**Solution:**
```javascript
// In console:
localStorage.getItem('notificationTrackers')
// Check if tracking working

// Reset if needed:
stockMonitoringService.resetAllTrackers()
```

### **Issue: Stock Not Decreasing**

**Check:**
1. Dosage format: "1 tablet" not "Take 1"
2. Marking as "taken" not "skipped"
3. Console logs for decrements

**Solution:**
- Use correct dosage format
- Check browser console logs
- Verify medicine quantity field updates

### **Issue: No Low Stock Alerts**

**Check:**
1. Quantity actually ≤10
2. Notification permission granted
3. 24 hours passed since last alert

**Solution:**
- Edit medicine, check quantity
- Grant notifications in Settings
- Wait 24 hours or reset trackers

---

## ✅ **FEATURE SUMMARY**

### **What Was Fixed:**
- ✅ Expiry notifications limited to 4 per day
- ✅ Smart timing at 8 AM, 12 PM, 4 PM, 8 PM
- ✅ No more notification spam
- ✅ Daily reset at midnight

### **What Was Added:**
- ✅ Automatic stock tracking
- ✅ Low stock alerts (≤10 units)
- ✅ Out of stock alerts (0 units)
- ✅ Dashboard stock banner
- ✅ Stock statistics
- ✅ Auto-decrement when taken
- ✅ Notification throttling system

### **Files Created/Modified:**
1. **`stockMonitoringService.ts`** - New service
2. **`Dashboard.tsx`** - Stock alerts & stats
3. **`MedicineSchedule.tsx`** - Auto-decrement
4. **`useMedicineReminder.ts`** - Stock tracking

---

## 🚀 **YOU'RE ALL SET!**

Your medicine management system now has:
- ✅ Smart expiry notifications (max 4/day)
- ✅ Automatic stock tracking
- ✅ Low stock & out of stock alerts
- ✅ Dashboard stock monitoring
- ✅ No notification spam

**Check your dashboard now to see stock alerts!** 📦✨

---

**Last Updated**: October 2024  
**Version**: 3.3 (Stock Monitoring Added)  
**Status**: 🟢 Fully Operational
