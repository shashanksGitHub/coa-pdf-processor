import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin (optional - only if you want to verify Firebase auth tokens)
let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized for auth verification');
  } else {
    console.warn('⚠️  Firebase credentials not found - auth middleware disabled');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
}

/**
 * Middleware to verify Firebase authentication token
 * This is optional - can be enabled/disabled based on environment
 */
export async function verifyFirebaseToken(req, res, next) {
  // Skip auth if Firebase is not initialized (for development/testing)
  if (!firebaseInitialized) {
    console.log('Auth verification skipped - Firebase not configured');
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided',
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid token',
    });
  }
}

/**
 * Optional auth middleware - only verifies if token is present
 */
export async function optionalAuth(req, res, next) {
  if (!firebaseInitialized) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    }

    next();
  } catch (error) {
    // Don't fail if token is invalid, just proceed without user
    next();
  }
}

export default { verifyFirebaseToken, optionalAuth };


