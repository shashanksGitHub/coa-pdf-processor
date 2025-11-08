import { auth } from '../config/firebase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

/**
 * Get Firebase auth token
 */
async function getAuthToken() {
  try {
    const user = auth.currentUser
    if (user) {
      return await user.getIdToken()
    }
    return null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Upload PDF and extract data using GPT-4 Vision
 * @param {File} pdfFile - The PDF file to upload
 * @param {Object} companyInfo - Company information
 * @returns {Promise<Object>} Response with extracted data and generated PDF
 */
export async function extractAndGeneratePDF(pdfFile, companyInfo = {}) {
  try {
    const formData = new FormData()
    formData.append('pdfFile', pdfFile)
    formData.append('companyInfo', JSON.stringify(companyInfo))

    const token = await getAuthToken()
    const headers = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/api/extract-and-generate`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to process PDF')
    }

    return result
  } catch (error) {
    console.error('Error in extractAndGeneratePDF:', error)
    throw error
  }
}

/**
 * Upload PDF and only extract data (no PDF generation)
 * @param {File} pdfFile - The PDF file to upload
 * @returns {Promise<Object>} Response with extracted data only
 */
export async function extractDataOnly(pdfFile) {
  try {
    const formData = new FormData()
    formData.append('pdfFile', pdfFile)

    const token = await getAuthToken()
    const headers = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/api/extract-only`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to extract data from PDF')
    }

    return result
  } catch (error) {
    console.error('Error in extractDataOnly:', error)
    throw error
  }
}

/**
 * Download a generated PDF file
 * @param {string} filename - The filename to download
 * @returns {Promise<Blob>} PDF file blob
 */
export async function downloadPDF(filename) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/download/${filename}`)
    
    if (!response.ok) {
      throw new Error('Failed to download PDF')
    }

    return await response.blob()
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw error
  }
}

/**
 * Check API health
 * @returns {Promise<Object>} Health check response
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    return await response.json()
  } catch (error) {
    console.error('Error checking API health:', error)
    throw error
  }
}

export default {
  extractAndGeneratePDF,
  extractDataOnly,
  downloadPDF,
  checkHealth,
}

