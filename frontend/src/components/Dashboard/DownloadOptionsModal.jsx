import { useState, useEffect } from 'react'
import { X, Download, CreditCard, Crown, Loader, Check, AlertCircle, Sparkles } from 'lucide-react'
import { getAccountStatus, useDownloadCredit, createSubscriptionCheckout } from '../../services/userService'

export default function DownloadOptionsModal({ 
  isOpen, 
  onClose, 
  onDownload, // (downloadType: 'free' | 'paid' | 'subscription') => void
  onPaymentRequired, // () => void - opens payment modal
  filename 
}) {
  const [accountStatus, setAccountStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadAccountStatus()
    }
  }, [isOpen])

  async function loadAccountStatus() {
    setLoading(true)
    setError('')
    try {
      const status = await getAccountStatus()
      setAccountStatus(status)
    } catch (err) {
      console.error('Error loading account status:', err)
      setError('Failed to load account status')
    } finally {
      setLoading(false)
    }
  }

  async function handleFreeDownload() {
    setProcessing(true)
    try {
      await onDownload('free')
      onClose()
    } catch (err) {
      setError(err.message || 'Download failed')
    } finally {
      setProcessing(false)
    }
  }

  async function handlePaidDownload() {
    setProcessing(true)
    try {
      onPaymentRequired()
      onClose()
    } catch (err) {
      setError(err.message || 'Payment initialization failed')
    } finally {
      setProcessing(false)
    }
  }

  async function handleSubscriptionDownload() {
    setProcessing(true)
    setError('')
    try {
      // Use one download credit
      await useDownloadCredit()
      // Then download without watermark
      await onDownload('subscription')
      // Refresh account status
      await loadAccountStatus()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to use subscription credit')
    } finally {
      setProcessing(false)
    }
  }

  async function handleSubscribe() {
    setProcessing(true)
    setError('')
    try {
      const result = await createSubscriptionCheckout()
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError(err.message || 'Failed to start subscription')
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen) return null

  const isSubscriber = accountStatus?.subscriptionStatus === 'active'
  const downloadsRemaining = accountStatus?.downloadsRemaining ?? 0
  const hasCredits = downloadsRemaining > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Download Options</h2>
                <p className="text-sm text-gray-600">Choose how you want to download</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Option 1: Free Download with Watermark */}
              <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Download className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Free Download</h3>
                      <p className="text-sm text-gray-500">With watermark</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">FREE</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Download your COA with a "COA Processor - Free Version" watermark.
                </p>
                <button
                  onClick={handleFreeDownload}
                  disabled={processing}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download Free
                </button>
              </div>

              {/* Option 2: Pay $1 */}
              <div className="border-2 border-blue-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-blue-50/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Pay Per Download</h3>
                      <p className="text-sm text-gray-500">No watermark, one-time</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-blue-600">$1.00</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Pay once for a clean, professional PDF without any watermarks.
                </p>
                <button
                  onClick={handlePaidDownload}
                  disabled={processing}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Pay $1 & Download
                </button>
              </div>

              {/* Option 3: Subscription */}
              <div className={`border-2 rounded-xl p-4 transition-colors ${
                isSubscriber 
                  ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSubscriber ? 'bg-amber-100' : 'bg-gray-100'}`}>
                      <Crown className={`w-5 h-5 ${isSubscriber ? 'text-amber-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">Pro Subscription</h3>
                        {isSubscriber && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400 text-white">
                            <Sparkles className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">60 downloads/month</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-600">$39/mo</span>
                </div>

                {isSubscriber ? (
                  <>
                    <div className="mb-3 p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Downloads remaining</span>
                        <span className={`font-bold ${hasCredits ? 'text-green-600' : 'text-red-600'}`}>
                          {downloadsRemaining} / 60
                        </span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                          style={{ width: `${(downloadsRemaining / 60) * 100}%` }}
                        />
                      </div>
                    </div>
                    {hasCredits ? (
                      <button
                        onClick={handleSubscriptionDownload}
                        disabled={processing}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Use 1 Credit & Download
                      </button>
                    ) : (
                      <div className="text-center py-2 text-sm text-red-600 font-medium">
                        No credits remaining this month
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <ul className="text-xs text-gray-500 space-y-1 mb-3">
                      <li className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-500" />
                        60 watermark-free downloads/month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-500" />
                        Save $21 vs pay-per-download
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-500" />
                        Cancel anytime
                      </li>
                    </ul>
                    <button
                      onClick={handleSubscribe}
                      disabled={processing}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? <Loader className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                      Subscribe Now
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

