import { useState, useEffect } from 'react'
import { getReviews } from '../../services/adminService'
import AdminLayout from './AdminLayout'
import { 
  Star,
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalReviews: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedReview, setExpandedReview] = useState(null)

  async function loadReviews(page = 1) {
    try {
      setLoading(true)
      setError('')
      const data = await getReviews(page, 20)
      setReviews(data.reviews || [])
      setPagination(data.pagination || { page: 1, totalPages: 1, totalReviews: 0 })
    } catch (err) {
      setError(err.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadReviews(newPage)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function renderStars(rating) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    )
  }

  function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
            <p className="text-slate-600">User feedback and ratings</p>
          </div>
          <button
            onClick={() => loadReviews(pagination.page)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Reviews Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Comment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-40"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-48"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                      </td>
                    </tr>
                  ))
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No reviews yet</p>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500">
                          {review.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">{review.userEmail}</span>
                      </td>
                      <td className="px-6 py-4">
                        {renderStars(review.rating)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {review.title || <span className="text-slate-400 italic">No title</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {review.comment && review.comment.length > 100 ? (
                          <div>
                            <p className="text-sm text-slate-700">
                              {expandedReview === review.id 
                                ? review.comment 
                                : truncateText(review.comment, 100)
                              }
                            </p>
                            <button
                              onClick={() => setExpandedReview(
                                expandedReview === review.id ? null : review.id
                              )}
                              className="text-xs text-primary-600 hover:text-primary-700 mt-1 flex items-center gap-1"
                            >
                              {expandedReview === review.id ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  Show more
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-700">{review.comment}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {formatDate(review.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && reviews.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.totalReviews)} of {pagination.totalReviews} reviews
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

