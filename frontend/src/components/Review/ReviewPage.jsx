import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { submitReview } from '../../services/reviewService'
import { Star, ArrowLeft, Send, CheckCircle, AlertCircle, FileText } from 'lucide-react'

export default function ReviewPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars')
      return
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setError('Please provide feedback with at least 10 characters')
      return
    }

    if (comment.length > 2000) {
      setError('Feedback must be less than 2000 characters')
      return
    }

    try {
      setLoading(true)
      await submitReview({
        rating,
        title: title.trim(),
        comment: comment.trim(),
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your review has been submitted successfully. We appreciate your feedback!
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">COA PDF Processor</h1>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Share Your Feedback</h2>
            <p className="text-gray-600 mt-2">
              Help us improve by sharing your experience with COA PDF Processor
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate your experience? <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-3 text-sm text-gray-600">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Review Title <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Summarize your experience in a few words"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">{title.length}/100 characters</p>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-field min-h-[150px] resize-y"
                placeholder="Tell us about your experience. What did you like? What could be improved?"
                maxLength={2000}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {comment.length}/2000 characters (minimum 10)
              </p>
            </div>

            {/* User info display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Submitting as:</span> {currentUser?.email}
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || rating === 0 || comment.trim().length < 10}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

