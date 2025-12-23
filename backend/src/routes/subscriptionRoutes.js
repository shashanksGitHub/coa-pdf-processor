import express from 'express';
import stripe from '../config/stripe.js';
import { firestore, isFirestoreAvailable } from '../config/firebase.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Subscription price: $39/month with 60 downloads
const SUBSCRIPTION_PRICE_CENTS = 3900;
const DOWNLOADS_PER_MONTH = 60;
const USERS_COLLECTION = 'users';

/**
 * POST /api/subscription/create-checkout-session
 * Create a Stripe Checkout session for subscription
 */
router.post('/create-checkout-session', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email;

    // Get or create Stripe customer
    let stripeCustomerId;
    
    if (isFirestoreAvailable()) {
      const userDoc = await firestore.collection(USERS_COLLECTION).doc(userId).get();
      if (userDoc.exists && userDoc.data().stripeCustomerId) {
        stripeCustomerId = userDoc.data().stripeCustomerId;
      }
    }

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUid: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to Firestore (create or update)
      if (isFirestoreAvailable()) {
        const userDocRef = firestore.collection(USERS_COLLECTION).doc(userId);
        const userDoc = await userDocRef.get();
        
        if (userDoc.exists) {
          await userDocRef.update({
            stripeCustomerId,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Create user document if it doesn't exist
          await userDocRef.set({
            uid: userId,
            email: userEmail,
            stripeCustomerId,
            accountType: 'free',
            subscriptionStatus: 'none',
            downloadsRemaining: 0,
            downloadsUsedThisMonth: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'COA Processor Pro',
              description: '60 watermark-free downloads per month',
            },
            unit_amount: SUBSCRIPTION_PRICE_CENTS,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'https://coa-pdf-processor.web.app'}?subscription=success`,
      cancel_url: `${req.headers.origin || 'https://coa-pdf-processor.web.app'}?subscription=canceled`,
      metadata: {
        firebaseUid: userId,
      },
      subscription_data: {
        metadata: {
          firebaseUid: userId,
        },
      },
    });

    console.log(`✅ Checkout session created for user: ${userId}`);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session',
    });
  }
});

/**
 * POST /api/subscription/create-portal-session
 * Create a Stripe Customer Portal session for managing subscription
 */
router.post('/create-portal-session', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    const userDoc = await firestore.collection(USERS_COLLECTION).doc(userId).get();
    
    if (!userDoc.exists || !userDoc.data().stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No subscription found',
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userDoc.data().stripeCustomerId,
      return_url: `${req.headers.origin || 'https://coa-pdf-processor.web.app'}`,
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create portal session',
    });
  }
});

/**
 * POST /api/subscription/webhook
 * Stripe webhook to handle subscription events
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For testing without webhook secret
      event = req.body;
      console.warn('⚠️ Webhook signature verification skipped (no secret configured)');
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCanceled(subscription);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  res.json({ received: true });
});

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutComplete(session) {
  const firebaseUid = session.metadata?.firebaseUid;
  
  if (!firebaseUid || !isFirestoreAvailable()) {
    console.warn('Cannot process checkout - missing UID or Firestore');
    return;
  }

  console.log(`✅ Checkout complete for user: ${firebaseUid}`);
  
  // Subscription details will be updated via subscription.created webhook
}

/**
 * Handle subscription created/updated event
 */
async function handleSubscriptionUpdate(subscription) {
  const firebaseUid = subscription.metadata?.firebaseUid;
  
  if (!firebaseUid || !isFirestoreAvailable()) {
    console.warn('Cannot update subscription - missing UID or Firestore');
    return;
  }

  const status = subscription.status;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  await firestore.collection(USERS_COLLECTION).doc(firebaseUid).update({
    accountType: status === 'active' ? 'subscriber' : 'free',
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart,
    currentPeriodEnd,
    // Reset downloads on new period
    downloadsRemaining: DOWNLOADS_PER_MONTH,
    downloadsUsedThisMonth: 0,
    updatedAt: new Date().toISOString(),
  });

  console.log(`✅ Subscription updated for user: ${firebaseUid}, status: ${status}`);
}

/**
 * Handle subscription canceled event
 */
async function handleSubscriptionCanceled(subscription) {
  const firebaseUid = subscription.metadata?.firebaseUid;
  
  if (!firebaseUid || !isFirestoreAvailable()) {
    console.warn('Cannot cancel subscription - missing UID or Firestore');
    return;
  }

  await firestore.collection(USERS_COLLECTION).doc(firebaseUid).update({
    accountType: 'free',
    subscriptionStatus: 'canceled',
    downloadsRemaining: 0,
    updatedAt: new Date().toISOString(),
  });

  console.log(`✅ Subscription canceled for user: ${firebaseUid}`);
}

/**
 * Handle invoice.paid event (subscription renewal)
 */
async function handleInvoicePaid(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const firebaseUid = subscription.metadata?.firebaseUid;

    if (!firebaseUid || !isFirestoreAvailable()) return;

    // Reset monthly downloads
    await firestore.collection(USERS_COLLECTION).doc(firebaseUid).update({
      downloadsRemaining: DOWNLOADS_PER_MONTH,
      downloadsUsedThisMonth: 0,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Monthly downloads reset for user: ${firebaseUid}`);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const firebaseUid = subscription.metadata?.firebaseUid;

    if (!firebaseUid || !isFirestoreAvailable()) return;

    await firestore.collection(USERS_COLLECTION).doc(firebaseUid).update({
      subscriptionStatus: 'past_due',
      updatedAt: new Date().toISOString(),
    });

    console.log(`⚠️ Payment failed for user: ${firebaseUid}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * GET /api/subscription/status
 * Get current subscription status (syncs with Stripe if needed)
 */
router.get('/status', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isFirestoreAvailable()) {
      return res.json({
        success: true,
        data: {
          isSubscribed: false,
          status: 'none',
        },
      });
    }

    const userId = req.user.uid;
    const userDocRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.json({
        success: true,
        data: {
          isSubscribed: false,
          status: 'none',
        },
      });
    }

    const userData = userDoc.data();
    
    // If user has a Stripe customer ID, check for active subscriptions directly with Stripe
    if (userData.stripeCustomerId && userData.subscriptionStatus !== 'active') {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: userData.stripeCustomerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

          // Update Firestore with subscription info
          await userDocRef.update({
            accountType: 'subscriber',
            subscriptionStatus: 'active',
            stripeSubscriptionId: subscription.id,
            currentPeriodStart,
            currentPeriodEnd,
            downloadsRemaining: DOWNLOADS_PER_MONTH,
            downloadsUsedThisMonth: 0,
            updatedAt: new Date().toISOString(),
          });

          console.log(`✅ Synced subscription for user: ${userId}`);

          return res.json({
            success: true,
            data: {
              isSubscribed: true,
              status: 'active',
              downloadsRemaining: DOWNLOADS_PER_MONTH,
              downloadsUsedThisMonth: 0,
              currentPeriodEnd,
            },
          });
        }
      } catch (stripeError) {
        console.error('Error checking Stripe subscription:', stripeError);
      }
    }

    res.json({
      success: true,
      data: {
        isSubscribed: userData.subscriptionStatus === 'active',
        status: userData.subscriptionStatus || 'none',
        downloadsRemaining: userData.downloadsRemaining ?? 0,
        downloadsUsedThisMonth: userData.downloadsUsedThisMonth ?? 0,
        currentPeriodEnd: userData.currentPeriodEnd || null,
      },
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

