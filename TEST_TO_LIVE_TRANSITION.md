# Reset Test Users Before Going Live

## 🔄 Cleaning Up Test Data in Firebase

Before switching to Live mode, you should reset test user accounts to avoid confusion.

### Option 1: Manual Cleanup in Firebase Console

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/project/coa-pdf-processor/firestore

2. **Navigate to Collections:**
   - Click on **Firestore Database**

3. **Find Test Users:**
   - Go to `users` collection
   - Identify test users (look for test emails)

4. **Reset Their Subscription Status:**
   For each test user, update:
   ```
   accountType: "free"
   subscriptionStatus: "none"
   downloadsRemaining: 0
   stripeCustomerId: [delete this field]
   stripeSubscriptionId: [delete this field]
   ```

---

### Option 2: Quick Script to Reset All Users

Create a simple script to reset everyone:

**File: `backend/scripts/resetTestUsers.js`**

```javascript
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function resetAllTestUsers() {
  console.log('🔄 Resetting all test users...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    
    const batch = db.batch();
    let count = 0;
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Only reset if they have test subscription data
      if (data.stripeCustomerId || data.subscriptionStatus === 'active') {
        batch.update(doc.ref, {
          accountType: 'free',
          subscriptionStatus: 'none',
          downloadsRemaining: 0,
          downloadsUsedThisMonth: 0,
          stripeCustomerId: admin.firestore.FieldValue.delete(),
          stripeSubscriptionId: admin.firestore.FieldValue.delete(),
          currentPeriodStart: admin.firestore.FieldValue.delete(),
          currentPeriodEnd: admin.firestore.FieldValue.delete(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    });
    
    await batch.commit();
    
    console.log(`✅ Reset ${count} test users`);
    console.log('🎉 All users are now ready for production!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAllTestUsers();
```

**To run:**
```bash
cd backend
node scripts/resetTestUsers.js
```

---

### Option 3: Just Start Fresh

**The simplest approach:**

1. **Do nothing with test data**
2. **Switch to Live mode**
3. **Test users won't see their test subscriptions**
4. **They can subscribe again (for real)**

**This is perfectly fine!** ✅

---

## 🎯 **Recommended Workflow**

### **Day Before Launch:**

```bash
☐ Cancel all test subscriptions in Stripe (Test mode)
☐ Reset test user accounts in Firebase (set to 'free')
☐ Verify test data won't interfere
```

### **Launch Day:**

```bash
☐ Update DigitalOcean with Live Stripe keys
☐ Add STRIPE_PRICE_ID (live product)
☐ Create Live webhook
☐ Redeploy backend
☐ Test with ONE real subscription
☐ Cancel and refund test
☐ Go live! 🚀
```

### **After Launch:**

```bash
☐ Monitor new subscriptions
☐ All new users get Live subscriptions
☐ Test users can subscribe again (as real customers)
```

---

## 🔍 **How to Identify Test vs Live Subscriptions**

### In Stripe Dashboard:

**Test Mode:**
- Toggle shows "Test mode"
- Payments use test cards (4242...)
- Subscriptions have test Price IDs

**Live Mode:**
- Toggle shows "Live mode"
- Payments use real cards
- Subscriptions have live Price IDs

### In Your App:

**After switching to Live:**
- App only queries Live Stripe data
- Test subscriptions become invisible
- Users with test subscriptions appear as "free" users

---

## ⚠️ **Common Pitfall to Avoid**

### **DON'T Mix Test and Live Keys:**

❌ **Wrong:**
```bash
STRIPE_SECRET_KEY=sk_live_...  # Live key
STRIPE_PRICE_ID=price_test_... # Test Price ID
```

✅ **Correct:**
```bash
# All keys from same mode
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID=price_1SkKLKPZvi5BTzsbZPoPQXEi  # Live Price ID
STRIPE_WEBHOOK_SECRET=whsec_... # Live webhook
```

---

## 📊 **Summary**

### What to Do:

1. **✅ Recommended:** Leave test subscriptions alone
   - They don't affect Live mode
   - You can still test in Test mode

2. **✅ Optional:** Clean up Stripe dashboard
   - Cancel test subscriptions
   - Delete test customers
   - Purely cosmetic

3. **✅ Optional:** Reset Firebase test users
   - Clear their subscription status
   - They start fresh in Live mode

4. **✅ Critical:** Use ALL Live keys when going live
   - Secret key
   - Publishable key
   - Price ID
   - Webhook secret

---

## 🎯 **My Recommendation:**

**Just leave everything as-is!**

When you switch to Live mode:
- ✅ Test subscriptions stay in Test mode (harmless)
- ✅ Live subscriptions go to Live mode (what you want)
- ✅ No cleanup needed
- ✅ Can still test in Test mode later

**The only thing that matters:** Make sure ALL your environment variables use Live keys/IDs when you deploy! ✅

---

**Questions about the transition?** Let me know! 🚀

