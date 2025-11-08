# Firebase Hosting Deployment Guide

This guide will help you deploy your COA PDF Processor frontend to Firebase Hosting.

## Prerequisites

1. A Firebase project (create one at https://console.firebase.google.com)
2. Firebase CLI installed globally
3. Node.js and npm installed

## Step 1: Install Firebase Tools

If you haven't already installed Firebase CLI globally:

```bash
npm install -g firebase-tools
```

Or install locally (already added to package.json):

```bash
npm install
```

## Step 2: Configure Firebase Project

1. **Update `.firebaserc` file:**
   
   Replace `your-firebase-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

## Step 3: Set Up Environment Variables

1. **Create `.env` file** (copy from `.env.example`):

```bash
cp .env.example .env
```

2. **Update `.env` with your Firebase configuration:**

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Update this to your deployed backend API URL
VITE_API_URL=https://your-backend-api.com
```

You can find these values in:
- Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

## Step 4: Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

## Step 5: Initialize Firebase (Optional)

If you want to reconfigure, run:

```bash
firebase init hosting
```

Select:
- ✅ Use an existing project
- Choose your Firebase project
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds with GitHub: `No` (optional)

## Step 6: Build Your Application

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Step 7: Deploy to Firebase Hosting

### Option A: Full Deploy (Production)

```bash
npm run deploy
```

Or manually:

```bash
firebase deploy --only hosting
```

### Option B: Preview Deploy (Test Channel)

```bash
npm run deploy:preview
```

This creates a temporary preview URL for testing before deploying to production.

## Step 8: Verify Deployment

After deployment, you'll see output like:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-project.web.app
```

Visit your Hosting URL to verify the deployment.

## Important Notes

### Backend API Configuration

⚠️ **Important:** Make sure to update `VITE_API_URL` in your `.env` file to point to your deployed backend API before building for production.

```env
# Local development
VITE_API_URL=http://localhost:5001

# Production
VITE_API_URL=https://your-backend-api.com
```

### Firebase Authentication Rules

Ensure your Firebase Authentication is properly configured:

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable your desired authentication methods (Email/Password, Google, etc.)
3. Add your hosting domain to authorized domains

### Security Rules

Update your Firebase security rules if using Firestore or Storage:

```javascript
// Firestore rules example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to Firebase Hosting |
| `npm run deploy:preview` | Deploy to preview channel |
| `firebase serve` | Test locally with Firebase |
| `firebase hosting:channel:list` | List all preview channels |
| `firebase hosting:channel:delete <channelId>` | Delete a preview channel |

## Continuous Deployment (Optional)

### GitHub Actions

Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
        
      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
          entryPoint: ./frontend
```

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working

- Ensure all environment variables start with `VITE_`
- Restart the dev server after changing `.env`
- Check that `.env` is in the `frontend` folder

### Deployment Fails

```bash
# Check if you're logged in
firebase login --reauth

# Verify project
firebase projects:list

# Check Firebase configuration
cat .firebaserc
```

### 404 Errors on Refresh

The `rewrites` in `firebase.json` handle this. If you still see 404s, verify:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

## Support

For issues or questions:
- Check Firebase Console for deployment logs
- Review browser console for runtime errors
- Verify environment variables are correctly set

