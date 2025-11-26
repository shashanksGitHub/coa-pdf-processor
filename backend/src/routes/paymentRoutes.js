import express from 'express';
import stripe from '../config/stripe.js';

const router = express.Router();

/**
 * Create a payment intent for PDF download
 * POST /api/payment/create-payment-intent
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { filename, amount = 100 } = req.body; // amount in cents ($1.00 = 100 cents)

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
 * Verify payment status
 * POST /api/payment/verify-payment
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required',
      });
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
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

export default router;

