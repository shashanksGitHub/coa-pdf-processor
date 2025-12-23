import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Crown, 
  CreditCard, 
  Calendar, 
  Download, 
  Settings,
  Loader,
  CheckCircle,
  XCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { getAccountStatus, createCustomerPortalSession, getPaymentHistory } from '../../services/userService'

export default function Profile() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [accountStatus, setAccountStatus] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [status, payments] = await Promise.all([
        getAccountStatus(),
        getPaymentHistory()
      ])
      setAccountStatus(status)
      setPaymentHistory(payments)
    } catch (err) {
      console.error('Error loading account data:', err)
      setError('Failed to load account information')
    } finally {
      setLoading(false)
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const result = await createCustomerPortalSession()
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError(err.message || 'Failed to open subscription management')
    } finally {
      setPortalLoading(false)
    }
  }

  const isSubscriber = accountStatus?.subscriptionStatus === 'active'
  const downloadsRemaining = accountStatus?.downloadsRemaining ?? 0
  const downloadsUsed = accountStatus?.downloadsUsedThisMonth ?? 0
  const totalPurchases = accountStatus?.totalPurchases ?? 0
  const totalSpent = accountStatus?.totalSpent ?? 0

  // Format date helper
  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadAccountStatus}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Account Information</h2>
                    <p className="text-sm text-gray-500">Your account details</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{currentUser?.email || 'Not available'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(currentUser?.metadata?.creationTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Card */}
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${
              isSubscriber 
                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isSubscriber ? 'bg-amber-100' : 'bg-gray-100'}`}>
                      <Crown className={`w-6 h-6 ${isSubscriber ? 'text-amber-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">Subscription</h2>
                        {isSubscriber && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-white">
                            <Sparkles className="w-3 h-3" />
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {isSubscriber ? 'Pro subscription active' : 'No active subscription'}
                      </p>
                    </div>
                  </div>
                  {isSubscriber ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Inactive</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {isSubscriber ? (
                  <div className="space-y-6">
                    {/* Downloads Progress */}
                    <div className="bg-white rounded-xl p-5 border border-amber-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Download className="w-5 h-5 text-amber-600" />
                          <span className="font-medium text-gray-900">Monthly Downloads</span>
                        </div>
                        <span className={`font-bold text-lg ${downloadsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {downloadsRemaining} / 60
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${(downloadsRemaining / 60) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {downloadsUsed} downloads used this billing period
                      </p>
                    </div>

                    {/* Subscription Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-amber-200">
                        <p className="text-sm text-gray-500 mb-1">Plan</p>
                        <p className="font-bold text-gray-900">Pro Monthly</p>
                        <p className="text-amber-600 font-medium">$39/month</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-amber-200">
                        <p className="text-sm text-gray-500 mb-1">Next Billing Date</p>
                        <p className="font-bold text-gray-900">
                          {formatDate(accountStatus?.currentPeriodEnd)}
                        </p>
                      </div>
                    </div>

                    {/* Manage Subscription Button */}
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {portalLoading ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Settings className="w-5 h-5" />
                          Manage Subscription
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <p className="text-xs text-center text-gray-500">
                      Update payment method, view invoices, or cancel subscription
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Upgrade to Pro
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                      Get 60 watermark-free downloads per month for just $39/month
                    </p>
                    <ul className="text-left max-w-xs mx-auto space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        60 watermark-free downloads/month
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Custom background uploads
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Priority support
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Cancel anytime
                      </li>
                    </ul>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Subscribe Now - $39/mo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Purchase History Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Purchase History</h2>
                      <p className="text-sm text-gray-500">Your one-time download purchases</p>
                    </div>
                  </div>
                  {totalPurchases > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Spent</p>
                      <p className="text-lg font-bold text-green-600">${(totalSpent / 100).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {paymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {paymentHistory.slice(0, 10).map((payment) => (
                      <div 
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Download className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
                              {payment.filename || 'PDF Download'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(payment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ${(payment.amount / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-green-600 font-medium">Paid</p>
                        </div>
                      </div>
                    ))}
                    {paymentHistory.length > 10 && (
                      <p className="text-center text-sm text-gray-500 pt-2">
                        Showing 10 of {paymentHistory.length} purchases
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No purchase history</p>
                    <p className="text-sm">Pay-per-download purchases will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Portal Card (for subscribers) */}
            {isSubscriber && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Settings className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Billing Portal</h2>
                      <p className="text-sm text-gray-500">Manage subscription and payment methods</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-500 mb-4 text-sm">
                    View invoices, update payment method, or cancel your subscription through the Stripe customer portal.
                  </p>
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {portalLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Open Billing Portal
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

