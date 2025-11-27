import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin (singleton)
let firebaseApp = null;
let db = null;

function initializeFirebase() {
  if (firebaseApp) {
    return { app: firebaseApp, db };
  }

  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Check if already initialized
      if (admin.apps.length === 0) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
        console.log('✅ Firebase Admin initialized');
      } else {
        firebaseApp = admin.app();
      }
      
      // Initialize Firestore
      db = admin.firestore();
      console.log('✅ Firestore initialized');
      
      return { app: firebaseApp, db };
    } else {
      console.warn('⚠️  Firebase credentials not found');
      return { app: null, db: null };
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    return { app: null, db: null };
  }
}

// Initialize on import
const { app, db: firestore } = initializeFirebase();

export { admin, firestore };
export default app;

