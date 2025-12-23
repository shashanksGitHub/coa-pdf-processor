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
 * Get current user's account status including subscription info
 */
export async function getAccountStatus() {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      console.log('No auth token available')
      return { 
        accountType: 'free',
        subscriptionStatus: 'none',
        downloadsRemaining: 0,
        downloadsUsedThisMonth: 0,
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/users/account-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch account status')
    }

    const data = await response.json()
    return data.data || { 
      accountType: 'free',
      subscriptionStatus: 'none',
      downloadsRemaining: 0,
      downloadsUsedThisMonth: 0,
    }
  } catch (error) {
    console.error('Error fetching account status:', error)
    return { 
      accountType: 'free',
      subscriptionStatus: 'none',
      downloadsRemaining: 0,
      downloadsUsedThisMonth: 0,
    }
  }
}

/**
 * Use one download credit (for subscribers)
 */
export async function useDownloadCredit() {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${API_BASE_URL}/api/users/use-download-credit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to use download credit')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error using download credit:', error)
    throw error
  }
}

/**
 * Create a checkout session for subscription
 */
export async function createSubscriptionCheckout() {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${API_BASE_URL}/api/subscription/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create checkout session')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating subscription checkout:', error)
    throw error
  }
}

/**
 * Create a portal session for managing subscription
 */
export async function createPortalSession() {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${API_BASE_URL}/api/subscription/create-portal-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create portal session')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus() {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      return { isSubscribed: false, status: 'none' }
    }

    const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get subscription status')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error getting subscription status:', error)
    return { isSubscribed: false, status: 'none' }
  }
}

export default {
  getAccountStatus,
  useDownloadCredit,
  createSubscriptionCheckout,
  createPortalSession,
  getSubscriptionStatus,
}





