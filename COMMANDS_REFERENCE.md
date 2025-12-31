# 🚀 COA PDF Processor - Production Launch Commands

## Quick Command Reference

### 1️⃣ Initial Setup (Run Once)

```bash
# Create frontend environment file
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
cd ..

# Run automated setup
./setup-production.sh
```

### 2️⃣ Install Security Packages (Backend)

```bash
cd backend
npm install helmet express-rate-limit
cd ..
```

### 3️⃣ Test Local Build

```bash
# Frontend
cd frontend
npm run build
npm run preview  # Test production build locally
cd ..

# Backend
cd backend
npm start
```

### 4️⃣ Deploy Frontend

```bash
cd frontend

# Build
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Or deploy to preview channel first
firebase hosting:channel:deploy preview
```

### 5️⃣ Deploy Backend

```bash
# If using Git deployment to DigitalOcean
git add .
git commit -m "Production ready deployment"
git push origin main

# DigitalOcean will auto-deploy from main branch
```

### 6️⃣ Verify Deployment

```bash
# Check frontend
curl https://coa-pdf-processor.web.app

# Check backend health
curl https://urchin-app-uzvhp.ondigitalocean.app/api/health

# Check CORS (replace with your frontend URL)
curl -H "Origin: https://coaprocessor.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://urchin-app-uzvhp.ondigitalocean.app/api/extract-only
```

### 7️⃣ Firebase Rules Deployment

```bash
# Deploy all Firebase rules
firebase deploy --only firestore:rules,storage:rules

# Or deploy individually
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 8️⃣ Rollback (If Something Goes Wrong)

```bash
# Rollback frontend
firebase hosting:rollback

# Rollback backend (in DigitalOcean console)
# Apps → Your App → Settings → Revert to previous deployment
```

### 9️⃣ View Logs

```bash
# Frontend logs (in browser console)
# Or Firebase Console → Hosting → Usage

# Backend logs
# DigitalOcean → Apps → Your App → Runtime Logs

# Firebase logs (if using Cloud Functions)
firebase functions:log
```

### 🔟 Testing Commands

```bash
# Test Stripe webhook locally (requires Stripe CLI)
stripe listen --forward-to localhost:5001/api/subscription/webhook

# Test PDF processing locally
curl -X POST http://localhost:5001/api/health

# Test with sample PDF
curl -X POST http://localhost:5001/api/extract-only \
  -F "pdfFile=@path/to/sample.pdf" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## 🌐 Environment-Specific URLs

### Development
```
Frontend: http://localhost:5173
Backend:  http://localhost:5001
```

### Production (Current)
```
Frontend: https://coa-pdf-processor.web.app
          https://coa-pdf-processor.firebaseapp.com
Backend:  https://urchin-app-uzvhp.ondigitalocean.app
```

### Production (Custom Domain)
```
Frontend: https://coaprocessor.com
          https://www.coaprocessor.com
Backend:  https://api.coaprocessor.com (after DNS setup)
```

---

## 🔑 Environment Variables Quick Reference

### Frontend (.env)
```bash
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=your-backend-url
```

### Backend (DigitalOcean App Platform)
```bash
NODE_ENV=production
PORT=5001
OPENAI_API_KEY=sk-...
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🛠️ Troubleshooting Commands

### Check Node/NPM versions
```bash
node --version  # Should be v18+
npm --version
```

### Clear caches
```bash
# Frontend
cd frontend
rm -rf node_modules dist .vite
npm install
npm run build

# Backend
cd backend
rm -rf node_modules
npm install
```

### Check Firebase authentication
```bash
firebase login
firebase projects:list
firebase use coa-pdf-processor
```

### Check Poppler installation
```bash
# macOS
brew list poppler

# Linux
dpkg -l | grep poppler

# Test
pdfimages -v
```

### Monitor real-time logs
```bash
# Firebase (if using Cloud Functions)
firebase functions:log --follow

# DigitalOcean
# Use web console: Apps → Runtime Logs → Real-time
```

---

## 📊 Useful Monitoring Commands

### Check disk space (backend)
```bash
df -h
du -sh backend/uploads backend/output backend/temp
```

### Check API response time
```bash
time curl https://urchin-app-uzvhp.ondigitalocean.app/api/health
```

### Monitor Firebase usage
```bash
# Via Firebase CLI
firebase projects:list
firebase apps:list

# Or use Firebase Console for detailed metrics
```

### Check SSL certificate
```bash
# Frontend
openssl s_client -connect coaprocessor.com:443 -servername coaprocessor.com

# Backend
openssl s_client -connect urchin-app-uzvhp.ondigitalocean.app:443
```

---

## 🔄 Update Workflow

### For code changes:
```bash
# 1. Make changes locally
# 2. Test locally
npm run dev  # Frontend or backend

# 3. Build
npm run build  # Frontend

# 4. Deploy
firebase deploy --only hosting  # Frontend
git push origin main  # Backend (auto-deploys)
```

### For config changes:
```bash
# Frontend env vars → Rebuild and redeploy
cd frontend
npm run build
firebase deploy --only hosting

# Backend env vars → Update in DigitalOcean console
# Apps → Settings → Environment Variables → Save → Redeploy
```

---

## 🚨 Emergency Commands

### Kill all node processes (local dev)
```bash
pkill -f node
```

### Clear all temporary files (backend)
```bash
cd backend
rm -rf uploads/* output/* temp/*
```

### Reset Firebase deployment
```bash
firebase hosting:sites:delete preview  # Delete preview channel
firebase hosting:rollback  # Rollback to previous version
```

---

## 📱 Quick Links

- **Firebase Console:** https://console.firebase.google.com/project/coa-pdf-processor
- **DigitalOcean:** https://cloud.digitalocean.com/
- **Stripe Dashboard:** https://dashboard.stripe.com/
- **OpenAI Dashboard:** https://platform.openai.com/
- **DNS/Domain:** (Your registrar)

---

**Last Updated:** December 30, 2025
**Quick Start:** Run `./setup-production.sh`
**Full Guide:** See `PRODUCTION_DEPLOYMENT_GUIDE.md`


