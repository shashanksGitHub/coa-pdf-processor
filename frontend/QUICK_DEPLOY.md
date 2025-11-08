# Quick Firebase Deployment Guide

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd /Users/sauravshaw/coa-pdf-processor/frontend
npm install
```

### 2. Configure Firebase Project

Edit `.firebaserc` and replace with your Firebase project ID:

```json
{
  "projects": {
    "default": "YOUR-FIREBASE-PROJECT-ID"
  }
}
```

### 3. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual Firebase credentials
nano .env
```

### 4. Login to Firebase

```bash
firebase login
```

### 5. Deploy! 🎉

```bash
npm run deploy
```

That's it! Your app will be live at: `https://YOUR-PROJECT-ID.web.app`

---

## 📋 Commands Reference

| Command | What it does |
|---------|--------------|
| `npm run dev` | Run locally for development |
| `npm run build` | Build for production |
| `npm run deploy` | Build + Deploy to Firebase |
| `npm run deploy:preview` | Deploy to test preview channel |

---

## ⚠️ Important: Before Production Deploy

1. **Update Backend API URL** in `.env`:
   ```env
   VITE_API_URL=https://your-backend-url.com
   ```

2. **Enable Authentication** in Firebase Console:
   - Go to Authentication → Sign-in method
   - Enable Email/Password (or your preferred method)
   - Add your domain to authorized domains

3. **Test the build locally**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🆘 Troubleshooting

**Problem:** `firebase: command not found`
```bash
npm install -g firebase-tools
```

**Problem:** Build fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

**Problem:** Wrong project
```bash
firebase projects:list
# Then update .firebaserc with correct project ID
```

---

For detailed documentation, see [FIREBASE_DEPLOYMENT.md](./FIREBASE_DEPLOYMENT.md)

