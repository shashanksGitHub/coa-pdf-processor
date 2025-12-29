// Use environment variable or fallback to production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://urchin-app-uzvhp.ondigitalocean.app'

// Admin token storage key
const ADMIN_TOKEN_KEY = 'coa_admin_token'

/**
 * Get stored admin token
 */
export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

/**
 * Set admin token
 */
export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

/**
 * Clear admin token (logout)
 */
export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

/**
 * Check if admin is logged in
 */
export function isAdminLoggedIn() {
  return !!getAdminToken()
}

/**
 * Login as admin
 * @param {string} secret - Admin secret key
 * @returns {Promise<Object>} Login response
 */
export async function adminLogin(secret) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ secret }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Invalid admin credentials')
    }

    // Store the token
    setAdminToken(result.token)

    return result
  } catch (error) {
    console.error('Admin login error:', error)
    throw error
  }
}

/**
 * Logout admin
 */
export function adminLogout() {
  clearAdminToken()
}

/**
 * Get dashboard metrics
 * @returns {Promise<Object>} Dashboard data
 */
export async function getDashboardData() {
  try {
    const token = getAdminToken()
    
    if (!token) {
      throw new Error('Admin authentication required')
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        clearAdminToken()
      }
      throw new Error(result.error || 'Failed to fetch dashboard data')
    }

    return result.data
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    throw error
  }
}

/**
 * Get users list with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search query
 * @returns {Promise<Object>} Users data with pagination
 */
export async function getUsers(page = 1, limit = 20, search = '') {
  try {
    const token = getAdminToken()
    
    if (!token) {
      throw new Error('Admin authentication required')
    }

    const params = new URLSearchParams({ page, limit })
    if (search) params.append('search', search)

    const response = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        clearAdminToken()
      }
      throw new Error(result.error || 'Failed to fetch users')
    }

    return result.data
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * Get reviews list with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Reviews data with pagination
 */
export async function getReviews(page = 1, limit = 20) {
  try {
    const token = getAdminToken()
    
    if (!token) {
      throw new Error('Admin authentication required')
    }

    const params = new URLSearchParams({ page, limit })

    const response = await fetch(`${API_BASE_URL}/api/admin/reviews?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        clearAdminToken()
      }
      throw new Error(result.error || 'Failed to fetch reviews')
    }

    return result.data
  } catch (error) {
    console.error('Error fetching reviews:', error)
    throw error
  }
}

export default {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  isAdminLoggedIn,
  adminLogin,
  adminLogout,
  getDashboardData,
  getUsers,
  getReviews,
}

