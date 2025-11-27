import express from 'express';
import { firestore, isFirestoreAvailable } from '../config/firebase.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Collection name for users
const USERS_COLLECTION = 'users';

/**
 * POST /api/users/create
 * Create or update user in Firestore when they sign up
 */
router.post('/create', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      console.warn('⚠️ Firestore not available - skipping user creation');
      return res.json({
        success: true,
        message: 'User creation skipped - Firestore not configured',
      });
    }

    const { email, uid, displayName } = req.body;
    const userId = req.user?.uid || uid;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const userData = {
      uid: userId,
      email: email || req.user?.email || '',
      displayName: displayName || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use set with merge to create or update
    const docRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const existingDoc = await docRef.get();
    
    if (existingDoc.exists) {
      // Update existing user (don't overwrite createdAt)
      await docRef.update({
        ...userData,
        createdAt: existingDoc.data().createdAt, // Keep original createdAt
      });
      console.log(`✅ User updated in Firestore: ${userId}`);
    } else {
      // Create new user
      await docRef.set(userData);
      console.log(`✅ User created in Firestore: ${userId}`);
    }

    res.json({
      success: true,
      message: 'User saved successfully',
      data: userData,
    });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/users/me
 * Get current user's data from Firestore
 */
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.json({
        success: true,
        data: null,
        message: 'Firestore not configured',
      });
    }

    const userId = req.user.uid;
    const docRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        success: true,
        data: null,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/users/me
 * Update current user's profile data
 */
router.put('/me', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    const userId = req.user.uid;
    const { displayName, photoURL } = req.body;

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;

    const docRef = firestore.collection(USERS_COLLECTION).doc(userId);
    await docRef.update(updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

