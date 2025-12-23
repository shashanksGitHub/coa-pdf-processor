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
      // Subscription & Credits
      accountType: 'free', // 'free', 'subscriber'
      subscriptionStatus: 'none', // 'none', 'active', 'canceled', 'past_due'
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      // Download credits
      downloadsRemaining: 0, // For subscribers: 60/month
      downloadsUsedThisMonth: 0,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use set with merge to create or update
    const docRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const existingDoc = await docRef.get();
    
    if (existingDoc.exists) {
      // Update existing user (preserve subscription data)
      const existingData = existingDoc.data();
      await docRef.update({
        email: email || req.user?.email || existingData.email,
        displayName: displayName || existingData.displayName,
        updatedAt: new Date().toISOString(),
        // Preserve all subscription-related fields
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

/**
 * POST /api/users/upgrade-to-pro
 * Upgrade user to Pro account (should be called after successful payment)
 */
router.post('/upgrade-to-pro', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    const userId = req.user.uid;
    const { paymentId } = req.body; // Optional: for tracking payment

    const docRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const existingDoc = await docRef.get();

    if (!existingDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    await docRef.update({
      isPro: true,
      accountType: 'pro',
      upgradedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(paymentId && { lastPaymentId: paymentId }),
    });

    console.log(`✅ User upgraded to Pro: ${userId}`);

    res.json({
      success: true,
      message: 'Account upgraded to Pro successfully',
      data: {
        isPro: true,
        accountType: 'pro',
      },
    });
  } catch (error) {
    console.error('Error upgrading user:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/users/account-status
 * Get current user's account status and subscription info
 */
router.get('/account-status', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.json({
        success: true,
        data: {
          accountType: 'free',
          subscriptionStatus: 'none',
          downloadsRemaining: 0,
          downloadsUsedThisMonth: 0,
        },
        message: 'Firestore not configured - defaulting to free',
      });
    }

    const userId = req.user.uid;
    const docRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        success: true,
        data: {
          accountType: 'free',
          subscriptionStatus: 'none',
          downloadsRemaining: 0,
          downloadsUsedThisMonth: 0,
        },
      });
    }

    const userData = doc.data();
    
    // Check if subscription period needs reset
    let downloadsRemaining = userData.downloadsRemaining ?? 0;
    let downloadsUsedThisMonth = userData.downloadsUsedThisMonth ?? 0;
    
    if (userData.currentPeriodEnd && new Date(userData.currentPeriodEnd) < new Date()) {
      // Period has ended, might need reset (handled by webhook usually)
      downloadsRemaining = 0;
    }

    res.json({
      success: true,
      data: {
        accountType: userData.accountType ?? 'free',
        subscriptionStatus: userData.subscriptionStatus ?? 'none',
        downloadsRemaining,
        downloadsUsedThisMonth,
        currentPeriodEnd: userData.currentPeriodEnd || null,
        stripeCustomerId: userData.stripeCustomerId || null,
      },
    });
  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/users/use-download-credit
 * Use one download credit (for subscribers)
 */
router.post('/use-download-credit', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    const userId = req.user.uid;
    const docRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = doc.data();

    // Check if user is an active subscriber
    if (userData.subscriptionStatus !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required',
      });
    }

    // Check if user has remaining downloads
    if ((userData.downloadsRemaining ?? 0) <= 0) {
      return res.status(403).json({
        success: false,
        error: 'No download credits remaining this month',
      });
    }

    // Deduct one credit
    await docRef.update({
      downloadsRemaining: (userData.downloadsRemaining ?? 0) - 1,
      downloadsUsedThisMonth: (userData.downloadsUsedThisMonth ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Download credit used by user: ${userId}`);

    res.json({
      success: true,
      data: {
        downloadsRemaining: (userData.downloadsRemaining ?? 0) - 1,
        downloadsUsedThisMonth: (userData.downloadsUsedThisMonth ?? 0) + 1,
      },
    });
  } catch (error) {
    console.error('Error using download credit:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;


