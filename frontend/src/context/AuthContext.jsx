import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../config/firebase'

// Create context with a default value
const AuthContext = createContext({
  currentUser: null,
  loading: true,
  signup: () => Promise.reject('AuthProvider not initialized'),
  login: () => Promise.reject('AuthProvider not initialized'),
  logout: () => Promise.reject('AuthProvider not initialized'),
})

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    // Save user to Firestore via backend API
    try {
      const token = await result.user.getIdToken()
      await fetch(`${import.meta.env.VITE_API_URL || 'https://urchin-app-uzvhp.ondigitalocean.app'}/api/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: result.user.email,
          uid: result.user.uid,
          displayName: result.user.displayName || '',
        }),
      })
      console.log('✅ User saved to Firestore')
    } catch (error) {
      console.error('Error saving user to Firestore:', error)
      // Don't fail signup if Firestore save fails
    }
    
    return result
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
