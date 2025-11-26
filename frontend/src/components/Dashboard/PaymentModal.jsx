import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { X, CreditCard, Lock, Check } from 'lucide-react'
import { getStripeConfig, createPaymentIntent } from '../../services/paymentService'

// Payment form component
function CheckoutForm({ onSuccess, onCancel, filename }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setMessage('')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message)
      setIsProcessing(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setPaymentSuccess(true)
      setMessage('Payment successful! Downloading PDF...')
      setTimeout(() => {
        onSuccess(paymentIntent)
      }, 1500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {message && (
        <div
          className={`p-4 rounded-lg ${
            paymentSuccess
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {paymentSuccess && <Check className="w-5 h-5" />}
            {message}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing || paymentSuccess}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isProcessing ? 'Processing...' : 'Pay $1.00'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Lock className="w-4 h-4" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  )
}

// Main payment modal component
export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, filename }) {
  const [stripePromise, setStripePromise] = useState(null)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentIntentId, setPaymentIntentId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load Stripe publishable key
    getStripeConfig().then((publishableKey) => {
      setStripePromise(loadStripe(publishableKey))
    }).catch(err => {
      console.error('Error loading Stripe:', err)
      setError('Failed to initialize payment system')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (isOpen && filename) {
      // Create payment intent when modal opens
      setLoading(true)
      setError('')
      
      createPaymentIntent(filename, 100) // $1.00 in cents
        .then((result) => {
          setClientSecret(result.clientSecret)
          setPaymentIntentId(result.paymentIntentId)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error creating payment intent:', err)
          setError('Failed to initialize payment')
          setLoading(false)
        })
    }
  }, [isOpen, filename])

  const handlePaymentSuccess = (paymentIntent) => {
    onPaymentSuccess({
      paymentIntentId: paymentIntent.id,
      filename,
    })
    onClose()
  }

  if (!isOpen) return null

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
                <p className="text-sm text-gray-600">Pay $1.00 to download your PDF</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">PDF Download</span>
              <span className="font-semibold text-gray-900">$1.00</span>
            </div>
            <div className="text-sm text-gray-500 truncate">{filename}</div>
          </div>

          {/* Payment Form */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Initializing payment...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {!loading && !error && clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                onSuccess={handlePaymentSuccess}
                onCancel={onClose}
                filename={filename}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}

