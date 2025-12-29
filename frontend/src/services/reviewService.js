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
 * Submit a new review
 * @param {Object} reviewData - { rating, title, comment }
 * @returns {Promise<Object>} Response with created review
 */
export async function submitReview(reviewData) {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit review')
    }

    return result
  } catch (error) {
    console.error('Error submitting review:', error)
    throw error
  }
}

/**
 * Get current user's reviews
 * @returns {Promise<Array>} List of user's reviews
 */
export async function getMyReviews() {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      return []
    }

    const response = await fetch(`${API_BASE_URL}/api/reviews/my-reviews`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch reviews')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

export default {
  submitReview,
  getMyReviews,
}

