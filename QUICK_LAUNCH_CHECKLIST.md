# 🚀 Quick Production Launch Checklist

## ⚡ IMMEDIATE ACTIONS (Before Going Live)

### 1. Frontend Configuration ✅ DONE
- [x] Updated `frontend/src/config/firebase.js` to use environment variables

### 2. Create Frontend .env File
```bash
cd frontend
cat > .env << 'EOF'
VITE_FIREBASE_API_KEY=AIzaSyC_RPyX9MzebcwKkVc5R7k7x3urCjyTpBU
VITE_FIREBASE_AUTH_DOMAIN=coa-pdf-processor.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=coa-pdf-processor
VITE_FIREBASE_STORAGE_BUCKET=coa-pdf-processor.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=813892924411
VITE_FIREBASE_APP_ID=1:813892924411:web:318a2cfd51d6f4e390515e
VITE_API_URL=https://urchin-app-uzvhp.ondigitalocean.app
EOF
```

### 3. Update Backend CORS
Add your custom domain to allowed origins in `backend/src/server.js`:
```javascript
const allowedOrigins = [
  // ... existing origins ...
  'https://coaprocessor.com',
  'https://www.coaprocessor.com'
];
```

### 4. Install Security Packages (Backend)
```bash
cd backend
npm install helmet express-rate-limit
```

### 5. Switch Stripe to Live Mode
**Backend `.env` (on DigitalOcean):**
```
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

**Frontend:** Ensure Stripe publishable key is live version

### 6. Configure Backend Environment Variables
In DigitalOcean App Platform → Settings → Environment Variables:
```
NODE_ENV=production
PORT=5001
OPENAI_API_KEY=sk-YOUR-OPENAI-KEY
FIREBASE_PROJECT_ID=coa-pdf-processor
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@coa-pdf-processor.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 7. Set Up Firebase Security Rules
**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /companies/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /subscriptions/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

### 8. Configure Custom Domain DNS

**For Frontend (coaprocessor.com):**
1. Go to Firebase Console → Hosting → Add Custom Domain
2. Follow instructions to add DNS records

**For Backend API (api.coaprocessor.com):**
```
Type: CNAME
Name: api
Value: urchin-app-uzvhp.ondigitalocean.app
TTL: 3600
```

### 9. Deploy Frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### 10. Test Everything
- [ ] User signup/login
- [ ] PDF upload
- [ ] PDF extraction
- [ ] Payment processing (use Stripe test cards first!)
- [ ] Subscription webhook
- [ ] Download PDF
- [ ] Admin access

---

## 📋 PRODUCTION READINESS VERIFICATION

### Security ✅
- [ ] Firebase config uses environment variables
- [ ] CORS configured for production domains
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers
- [ ] Firebase security rules deployed
- [ ] Admin credentials secured

### Configuration ✅
- [ ] All environment variables set
- [ ] Stripe in live mode
- [ ] Backend URL updated in frontend
- [ ] Custom domains configured
- [ ] SSL certificates active

### Testing ✅
- [ ] End-to-end user flow tested
- [ ] Payment flow verified
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] Cross-browser tested

### Monitoring ✅
- [ ] Server logs accessible
- [ ] Error tracking setup (optional: Sentry)
- [ ] Billing alerts configured
- [ ] Health check endpoint working

---

## 🔗 Important URLs

**Production Frontend:** https://coaprocessor.com (or Firebase URL)
**Production API:** https://urchin-app-uzvhp.ondigitalocean.app
**Firebase Console:** https://console.firebase.google.com/project/coa-pdf-processor
**Stripe Dashboard:** https://dashboard.stripe.com/
**DigitalOcean:** https://cloud.digitalocean.com/

---

## 🆘 Emergency Rollback Plan

If something goes wrong:

1. **Frontend Issues:**
   ```bash
   firebase hosting:rollback
   ```

2. **Backend Issues:**
   - Revert environment variables in DigitalOcean
   - Redeploy previous version

3. **Stripe Issues:**
   - Switch back to test mode keys
   - Check webhook logs

---

## 📞 Post-Launch Monitoring (First 24 Hours)

- [ ] Check error logs every 2 hours
- [ ] Monitor OpenAI API usage
- [ ] Monitor Stripe transactions
- [ ] Check user feedback
- [ ] Verify all domains resolve correctly
- [ ] Monitor server performance metrics

---

## 💰 Cost Monitoring

**Set up billing alerts in:**
- OpenAI Dashboard (set limit: $100/month)
- Firebase Console (set budget alert: $50/month)
- Stripe Dashboard (monitor transaction fees)
- DigitalOcean (current plan cost tracking)

**Expected Monthly Costs:**
- OpenAI: ~$20-100 (depends on usage)
- Firebase: ~$0-25 (Spark → Blaze)
- DigitalOcean: ~$12-25
- Stripe: 2.9% + $0.30 per transaction
- Domain: ~$1/month ($12/year)
- **Total: ~$35-150/month**

---

## ✅ LAUNCH DAY CHECKLIST

Morning of Launch:
- [ ] All environment variables verified
- [ ] SSL certificates valid
- [ ] Domains resolving correctly
- [ ] Test user flow one more time
- [ ] Backup all configurations
- [ ] Team/stakeholders notified

During Launch:
- [ ] Monitor logs continuously
- [ ] Watch for user signups
- [ ] Check payment processing
- [ ] Monitor error rates
- [ ] Be ready to rollback

After Launch:
- [ ] Document any issues encountered
- [ ] Review first user feedback
- [ ] Check all costs/usage
- [ ] Plan improvements

---

**For detailed information, see:** `PRODUCTION_DEPLOYMENT_GUIDE.md`

**Status:** Ready to Launch 🚀
**Last Updated:** Dec 30, 2025


