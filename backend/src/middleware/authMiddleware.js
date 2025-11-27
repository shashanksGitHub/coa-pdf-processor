import { admin } from '../config/firebase.js';

/**
 * Check if Firebase is properly initialized
 */
function isFirebaseInitialized() {
  return admin.apps.length > 0;
}

/**
 * Middleware to verify Firebase authentication token
 * Required for protected routes
 */
export async function verifyFirebaseToken(req, res, next) {
  // Skip auth if Firebase is not initialized (for development/testing)
  if (!isFirebaseInitialized()) {
    console.log('Auth verification skipped - Firebase not configured');
    // Set a dummy user for development
    req.user = { uid: 'dev-user', email: 'dev@test.com' };
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
 * Does not fail if no token provided
 */
export async function optionalAuth(req, res, next) {
  if (!isFirebaseInitialized()) {
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

// Also export as auth for shorter usage
export const auth = verifyFirebaseToken;

export default { verifyFirebaseToken, optionalAuth, auth };
