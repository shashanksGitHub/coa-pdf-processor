# 🚀 Production Deployment Guide - COA PDF Processor

## ⚠️ CRITICAL SECURITY FIXES REQUIRED

### 1. **Firebase API Keys - FIXED ✅**

The hardcoded Firebase config has been moved to environment variables in `frontend/src/config/firebase.js`.

**Action Required:** Create `.env` file in `frontend/` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC_RPyX9MzebcwKkVc5R7k7x3urCjyTpBU
VITE_FIREBASE_AUTH_DOMAIN=coa-pdf-processor.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=coa-pdf-processor
VITE_FIREBASE_STORAGE_BUCKET=coa-pdf-processor.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=813892924411
VITE_FIREBASE_APP_ID=1:813892924411:web:318a2cfd51d6f4e390515e

# Backend API URL - UPDATE THIS FOR PRODUCTION
VITE_API_URL=https://your-production-backend-url.com
```

### 2. **Update Backend CORS Configuration**

Update your production backend URL in `backend/src/server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  'https://coa-pdf-processor.web.app',
  'https://coa-pdf-processor.firebaseapp.com',
  'https://coaprocessor.com',  // ADD YOUR CUSTOM DOMAIN
  'https://www.coaprocessor.com'  // ADD WWW VERSION IF NEEDED
];
```

---

## 📋 COMPLETE PRODUCTION CHECKLIST

### **A. Environment Variables Setup**

#### Frontend Environment Variables (`frontend/.env`)
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id

# Backend API URL - CRITICAL: Update for production
VITE_API_URL=https://your-backend-api.com
```

#### Backend Environment Variables (`backend/.env`)
```env
# Server Configuration
PORT=5001
NODE_ENV=production

# OpenAI API Key - REQUIRED
OPENAI_API_KEY=sk-your-openai-api-key

# Firebase Admin SDK - REQUIRED
FIREBASE_PROJECT_ID=coa-pdf-processor
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@coa-pdf-processor.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Stripe Configuration - SWITCH TO LIVE KEYS
STRIPE_SECRET_KEY=sk_live_your-live-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_live_your-live-publishable-key

# Admin Configuration
ADMIN_EMAIL=admin@coaprocessor.com
ADMIN_PASSWORD=your-very-secure-password
```

---

### **B. Stripe Configuration**

#### Switch from Test to Live Mode

1. **Update Stripe Keys:**
   - Go to Stripe Dashboard → Developers → API Keys
   - Switch from "Test mode" to "Live mode"
   - Copy the Live Secret Key and Publishable Key
   - Update backend `.env` with live keys

2. **Update Frontend Stripe Config:**
   - Check any hardcoded Stripe publishable keys
   - Ensure they're using environment variables or fetching from backend

3. **Webhook Configuration:**
   - Set up webhook endpoint: `https://your-backend.com/api/subscription/webhook`
   - Copy the webhook signing secret
   - Update `STRIPE_WEBHOOK_SECRET` in backend `.env`

---

### **C. Firebase Security Rules**

#### Firestore Rules
Update your Firestore rules to secure data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Company info - users can only access their own company data
    match /companies/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reviews - authenticated users can create, users can read their own
    match /reviews/{reviewId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update, delete: if false;
    }
    
    // Subscriptions - users can read their own
    match /subscriptions/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only backend should write
    }
    
    // Admin collection - only for admin access
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email == 'admin@coaprocessor.com';
    }
  }
}
```

#### Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /company-logos/{userId}/{fileName} {
      allow read: if true; // Public read for logos
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

### **D. Backend Deployment**

#### Option 1: DigitalOcean App Platform (Current)

1. **Environment Variables:**
   - Go to DigitalOcean App Console
   - Settings → App-Level Environment Variables
   - Add all backend environment variables from `.env`

2. **Build Settings:**
   ```yaml
   build_command: npm install
   run_command: npm start
   ```

3. **Health Check:**
   - Path: `/api/health`
   - Port: 5001

4. **Install Poppler:**
   - Add to `Aptfile` in backend:
   ```
   poppler-utils
   ```

#### Option 2: Railway, Heroku, or AWS

Similar process - add environment variables in their respective dashboards.

---

### **E. Frontend Deployment**

#### Deploy to Firebase Hosting

1. **Update Production API URL:**
   ```bash
   cd frontend
   # Set production environment variable
   echo "VITE_API_URL=https://your-backend-api.com" > .env.production
   ```

2. **Build and Deploy:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

3. **Custom Domain Setup:**
   - Firebase Console → Hosting → Add Custom Domain
   - Follow DNS configuration instructions
   - Add domain to CORS allowed origins in backend

---

### **F. DNS Configuration for coaprocessor.com**

#### Frontend (Firebase Hosting)
```
Type: A
Name: @
Value: (Firebase will provide IP addresses)

Type: A
Name: www
Value: (Firebase will provide IP addresses)
```

#### Backend API (DigitalOcean)
```
Type: A
Name: api
Value: (Your DigitalOcean App IP)

OR

Type: CNAME
Name: api
Value: urchin-app-uzvhp.ondigitalocean.app
```

#### SSL Certificate (ACME Challenge) - Already configured ✅
```
Type: TXT
Name: _acme-challenge
Value: uogWb-p3JQmhXpQMMdl0z9dMoISWsosuNkRWR-eprlU
```

---

### **G. Security Hardening**

#### 1. Enable Rate Limiting (Backend)

Install and configure rate limiting:
```bash
cd backend
npm install express-rate-limit
```

Add to `server.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### 2. Helmet.js for Security Headers

```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

#### 3. Environment Variable Validation

Add validation at server startup in `server.js`:
```javascript
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
```

#### 4. HTTPS Only

Ensure your hosting platforms force HTTPS:
- Firebase Hosting: Automatically enforced
- DigitalOcean: Enable "Force HTTPS" in settings

---

### **H. Monitoring & Logging**

#### 1. Error Tracking

Consider adding services like:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Datadog** for infrastructure monitoring

#### 2. OpenAI Usage Monitoring

Add usage tracking in `openaiService.js`:
```javascript
console.log(`OpenAI API call - Tokens used: ${response.usage.total_tokens}`);
```

#### 3. Stripe Webhook Logging

Ensure webhook events are logged for debugging:
```javascript
console.log(`Stripe webhook received: ${event.type}`);
```

---

### **I. Performance Optimization**

#### 1. Frontend Build Optimization

Already configured in `vite.config.js`, verify:
```javascript
build: {
  minify: 'terser',
  sourcemap: false, // Disable for production
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom']
      }
    }
  }
}
```

#### 2. Backend Caching

Consider implementing:
- Redis for session storage
- CDN for static PDF downloads (CloudFront, Cloudflare)

#### 3. File Upload Limits

Already configured to 50MB in `server.js`:
```javascript
app.use(express.json({ limit: '50mb' }));
```

---

### **J. Testing Before Go-Live**

#### Pre-Launch Checklist

- [ ] Test user registration and login
- [ ] Test PDF upload and extraction
- [ ] Test PDF generation and download
- [ ] Test payment flow with Stripe test cards
- [ ] Test subscription webhook handling
- [ ] Test admin dashboard access
- [ ] Verify CORS works from production domain
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Run security scan (OWASP ZAP, Burp Suite)
- [ ] Check all environment variables are set
- [ ] Verify SSL certificates are valid
- [ ] Test error handling and user feedback
- [ ] Check API response times
- [ ] Review server logs for errors

---

### **K. Post-Launch Monitoring**

#### Week 1 Checklist

- [ ] Monitor error rates
- [ ] Check OpenAI API usage and costs
- [ ] Review Stripe transactions
- [ ] Monitor server performance
- [ ] Check user feedback and reviews
- [ ] Review Firebase Auth logs
- [ ] Check storage usage (Firebase Storage, backend storage)
- [ ] Monitor DNS propagation
- [ ] Review SEO and analytics setup

---

### **L. Backup Strategy**

#### 1. Database Backups (Firestore)

- Enable automatic backups in Firebase Console
- Export data regularly: `gcloud firestore export gs://[BUCKET_NAME]`

#### 2. Generated PDFs

- Consider moving to cloud storage (AWS S3, Google Cloud Storage)
- Implement cleanup policy for old files

#### 3. Environment Variables

- Keep secure backup of all `.env` files in password manager
- Document all API keys and their purposes

---

### **M. Cost Management**

#### Monitor Monthly Costs

1. **OpenAI API:** ~$0.01-0.03 per image + ~$0.03-0.12 per 1K tokens
2. **Firebase:** Free tier → $25/month Blaze plan (typical usage)
3. **Stripe:** 2.9% + $0.30 per transaction
4. **DigitalOcean:** $5-25/month for backend app
5. **Domain:** ~$12/year

**Set up billing alerts** in:
- OpenAI Dashboard
- Firebase Console
- Stripe Dashboard
- DigitalOcean Billing

---

## 🎯 IMMEDIATE ACTION ITEMS

### Critical (Do Now)
1. ✅ Update frontend Firebase config to use environment variables (DONE)
2. ⚠️ Create frontend `.env` file with production backend URL
3. ⚠️ Update backend CORS to include `coaprocessor.com`
4. ⚠️ Switch Stripe from test to live keys
5. ⚠️ Set up Firebase Security Rules
6. ⚠️ Configure backend environment variables in hosting platform

### High Priority (Before Launch)
7. Add rate limiting and Helmet.js
8. Set up error tracking (Sentry)
9. Configure custom domain DNS
10. Test entire flow end-to-end
11. Set up monitoring and alerts

### Medium Priority (Post-Launch)
12. Implement Redis caching
13. Set up CDN for PDF downloads
14. Add analytics (Google Analytics, Mixpanel)
15. Implement automated testing
16. Create user documentation

---

## 📞 Support Checklist

- [ ] Create support email (support@coaprocessor.com)
- [ ] Set up FAQ/Help Center
- [ ] Create Terms of Service
- [ ] Create Privacy Policy
- [ ] GDPR compliance (if serving EU users)
- [ ] Refund policy

---

## 🔗 Quick Links

- Firebase Console: https://console.firebase.google.com/
- Stripe Dashboard: https://dashboard.stripe.com/
- OpenAI Dashboard: https://platform.openai.com/
- DigitalOcean: https://cloud.digitalocean.com/
- Domain Registrar: (Your DNS provider)

---

**Last Updated:** December 30, 2025
**Version:** 1.0.0
**Status:** Ready for Production Deployment



