import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../../services/adminService'
import { Shield, AlertCircle, Lock } from 'lucide-react'

export default function AdminLogin() {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!secret.trim()) {
      setError('Please enter the admin access key')
      return
    }

    try {
      setLoading(true)
      await adminLogin(secret)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-slate-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-600 mt-2">Enter the admin access key to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Access Key
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter admin key"
                autoComplete="off"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Access Admin Panel</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

