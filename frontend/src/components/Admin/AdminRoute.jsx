import { Navigate } from 'react-router-dom'
import { isAdminLoggedIn } from '../../services/adminService'

/**
 * Admin route guard - redirects to admin login if not authenticated
 */
export default function AdminRoute({ children }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin" replace />
  }
  
  return children
}

