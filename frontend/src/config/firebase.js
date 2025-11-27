import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyC_RPyX9MzebcwKkVc5R7k7x3urCjyTpBU",
  authDomain: "coa-pdf-processor.firebaseapp.com",
  projectId: "coa-pdf-processor",
  storageBucket: "coa-pdf-processor.firebasestorage.app",
  messagingSenderId: "813892924411",
  appId: "1:813892924411:web:318a2cfd51d6f4e390515e"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app)

export default app

