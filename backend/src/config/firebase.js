import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin (singleton)
let firebaseApp = null;
let db = null;
let initialized = false;

function initializeFirebase() {
  if (initialized) {
    return { app: firebaseApp, db, initialized: firebaseApp !== null };
  }

  initialized = true;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️  Firebase credentials not found - Firestore features disabled');
      console.warn('   Missing:', 
        !projectId ? 'FIREBASE_PROJECT_ID' : '',
        !clientEmail ? 'FIREBASE_CLIENT_EMAIL' : '',
        !privateKey ? 'FIREBASE_PRIVATE_KEY' : ''
      );
      return { app: null, db: null, initialized: false };
    }

    // Check if already initialized
    if (admin.apps.length === 0) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin initialized');
    } else {
      firebaseApp = admin.app();
      console.log('✅ Firebase Admin already initialized');
    }
    
    // Initialize Firestore
    db = admin.firestore();
    console.log('✅ Firestore initialized');
    
    return { app: firebaseApp, db, initialized: true };
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    firebaseApp = null;
    db = null;
    return { app: null, db: null, initialized: false };
  }
}

// Initialize on import
const result = initializeFirebase();
const firestore = result.db;
const isFirestoreAvailable = () => firestore !== null;

export { admin, firestore, isFirestoreAvailable };
export default result.app;
