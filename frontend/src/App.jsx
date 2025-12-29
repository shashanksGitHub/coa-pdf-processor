import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Dashboard from './components/Dashboard/Dashboard'
import Profile from './components/Profile/Profile'
import PrivateRoute from './components/Auth/PrivateRoute'
import ReviewPage from './components/Review/ReviewPage'
import AdminLogin from './components/Admin/AdminLogin'
import AdminRoute from './components/Admin/AdminRoute'
import AdminDashboard from './components/Admin/AdminDashboard'
import AdminUsers from './components/Admin/AdminUsers'
import AdminReviews from './components/Admin/AdminReviews'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected User Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/review" 
            element={
              <PrivateRoute>
                <ReviewPage />
              </PrivateRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/reviews" 
            element={
              <AdminRoute>
                <AdminReviews />
              </AdminRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

