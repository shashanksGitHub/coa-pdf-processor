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
 * Get company info for the current user from the backend API
 */
export async function getCompanyInfo() {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      console.log('No auth token available, skipping company info fetch')
      return null
    }

    const response = await fetch(`${API_BASE_URL}/api/company/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch company info')
    }

    const data = await response.json()
    return data.data // Returns null if no company info exists
  } catch (error) {
    console.error('Error fetching company info:', error)
    throw error
  }
}

/**
 * Save company info for the current user to the backend API
 */
export async function saveCompanyInfo(companyData) {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      throw new Error('Authentication required to save company info')
    }

    const response = await fetch(`${API_BASE_URL}/api/company/info`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to save company info')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error saving company info:', error)
    throw error
  }
}

/**
 * Delete company info for the current user from the backend API
 */
export async function deleteCompanyInfo() {
  try {
    const token = await getAuthToken()
    
    if (!token) {
      throw new Error('Authentication required to delete company info')
    }

    const response = await fetch(`${API_BASE_URL}/api/company/info`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete company info')
    }

    return true
  } catch (error) {
    console.error('Error deleting company info:', error)
    throw error
  }
}






