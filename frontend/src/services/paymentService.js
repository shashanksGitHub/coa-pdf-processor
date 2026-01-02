import { auth } from '../config/firebase'

// Use environment variable or fallback to production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://urchin-app-uzvhp.ondigitalocean.app'

/**
 * Get the current user's auth token
 */
async function getAuthToken() {
  const user = auth.currentUser
  if (user) {
    return await user.getIdToken()
  }
  return null
}

/**
 * Get Stripe publishable key
 * @returns {Promise<string>} Stripe publishable key
 */
export async function getStripeConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/config`)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get Stripe config')
    }

    return result.publishableKey
  } catch (error) {
    console.error('Error getting Stripe config:', error)
    throw error
  }
}

/**
 * Create a payment intent for PDF download
 * @param {string} filename - The PDF filename to download
 * @param {number} amount - Amount in cents (default: 100 = $1.00)
 * @returns {Promise<Object>} Payment intent details
 */
export async function createPaymentIntent(filename, amount = 100) {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${API_BASE_URL}/api/payment/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename,
        amount,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create payment intent')
    }

    return result
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

/**
 * Verify payment status
 * @param {string} paymentIntentId - The payment intent ID
 * @returns {Promise<Object>} Payment verification result
 */
export async function verifyPayment(paymentIntentId) {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${API_BASE_URL}/api/payment/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentIntentId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to verify payment')
    }

    return result
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

export default {
  getStripeConfig,
  createPaymentIntent,
  verifyPayment,
}

