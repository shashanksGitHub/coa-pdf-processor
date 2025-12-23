import { storage } from '../config/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

/**
 * Upload company logo to Firebase Storage
 * @param {File} file - The logo file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} Download URL of the uploaded logo
 */
export async function uploadCompanyLogo(file, userId) {
  try {
    // Create a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `company_logos/${userId}/logo_${timestamp}.${fileExtension}`
    
    // Create storage reference
    const storageRef = ref(storage, fileName)
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file)
    console.log('Logo uploaded successfully:', snapshot.metadata.fullPath)
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading logo:', error)
    throw error
  }
}

/**
 * Upload custom background for Pro users
 * @param {File} file - The background image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} Download URL of the uploaded background
 */
export async function uploadCustomBackground(file, userId) {
  try {
    // Create a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `custom_backgrounds/${userId}/background_${timestamp}.${fileExtension}`
    
    // Create storage reference
    const storageRef = ref(storage, fileName)
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file)
    console.log('Background uploaded successfully:', snapshot.metadata.fullPath)
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading background:', error)
    throw error
  }
}

/**
 * Delete company logo from Firebase Storage
 * @param {string} logoUrl - The URL of the logo to delete
 */
export async function deleteCompanyLogo(logoUrl) {
  try {
    // Extract the path from the URL
    const urlObj = new URL(logoUrl)
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/)
    
    if (pathMatch && pathMatch[1]) {
      const filePath = decodeURIComponent(pathMatch[1])
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)
      console.log('Logo deleted successfully')
    }
  } catch (error) {
    console.error('Error deleting logo:', error)
    // Don't throw - logo deletion is not critical
  }
}

/**
 * Delete custom background from Firebase Storage
 * @param {string} backgroundUrl - The URL of the background to delete
 */
export async function deleteCustomBackground(backgroundUrl) {
  try {
    if (!backgroundUrl) return
    
    const urlObj = new URL(backgroundUrl)
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/)
    
    if (pathMatch && pathMatch[1]) {
      const filePath = decodeURIComponent(pathMatch[1])
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)
      console.log('Background deleted successfully')
    }
  } catch (error) {
    console.error('Error deleting background:', error)
    // Don't throw - background deletion is not critical
  }
}

/**
 * Convert file to base64 for local preview
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default {
  uploadCompanyLogo,
  uploadCustomBackground,
  deleteCompanyLogo,
  deleteCustomBackground,
  fileToBase64,
}




