import express from 'express';
import stripe from '../config/stripe.js';
import { firestore, isFirestoreAvailable } from '../config/firebase.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const PAYMENTS_COLLECTION = 'payments';
const USERS_COLLECTION = 'users';

/**
 * Create a payment intent for PDF download
 * POST /api/payment/create-payment-intent
 */
router.post('/create-payment-intent', verifyFirebaseToken, async (req, res) => {
  try {
    const { filename, amount = 100 } = req.body; // amount in cents ($1.00 = 100 cents)
    const userId = req.user?.uid;
    const userEmail = req.user?.email;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required',
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // $1.00 in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        filename,
        service: 'COA PDF Download',
        firebaseUid: userId || 'anonymous',
        userEmail: userEmail || 'unknown',
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent',
    });
  }
});

/**
 * Verify payment status and save to Firestore
 * POST /api/payment/verify-payment
 */
router.post('/verify-payment', verifyFirebaseToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user?.uid;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required',
      });
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Save payment record to Firestore
      if (isFirestoreAvailable() && userId) {
        try {
          const paymentRecord = {
            userId,
            userEmail: req.user?.email || paymentIntent.metadata.userEmail,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            filename: paymentIntent.metadata.filename,
            type: 'one_time_download',
            status: 'succeeded',
            createdAt: new Date().toISOString(),
          };

          // Save to payments collection
          await firestore.collection(PAYMENTS_COLLECTION).add(paymentRecord);
          console.log(`✅ Payment saved for user: ${userId}, amount: $${paymentIntent.amount / 100}`);

          // Update user's total purchases count
          const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            await userRef.update({
              totalPurchases: (userData.totalPurchases || 0) + 1,
              totalSpent: (userData.totalSpent || 0) + paymentIntent.amount,
              lastPurchaseAt: new Date().toISOString(),
            });
          }
        } catch (firestoreError) {
          console.error('Error saving payment to Firestore:', firestoreError);
          // Don't fail the request if Firestore save fails
        }
      }

      return res.json({
        success: true,
        paid: true,
        filename: paymentIntent.metadata.filename,
        amount: paymentIntent.amount,
      });
    }

    res.json({
      success: true,
      paid: false,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment',
    });
  }
});

/**
 * Get payment config (publishable key)
 * GET /api/payment/config
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

/**
 * Get payment history for current user
 * GET /api/payment/history
 */
router.get('/history', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!isFirestoreAvailable()) {
      return res.json({
        success: true,
        data: [],
        message: 'Firestore not available',
      });
    }

    // Get payments for this user
    const paymentsSnapshot = await firestore
      .collection(PAYMENTS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const payments = [];
    paymentsSnapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment history',
    });
  }
});

export default router;

