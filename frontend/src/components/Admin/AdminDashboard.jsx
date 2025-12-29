import { useState, useEffect } from 'react'
import { getDashboardData } from '../../services/adminService'
import AdminLayout from './AdminLayout'
import { 
  DollarSign, 
  Users, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  UserCheck, 
  UserX,
  Download,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    try {
      setLoading(true)
      setError('')
      const dashboardData = await getDashboardData()
      setData(dashboardData)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Overview of your application metrics</p>
          </div>
          <button
            onClick={loadDashboard}
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

        {/* Loading State */}
        {loading && !data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Metrics Grid */}
        {data && (
          <>
            {/* Revenue & Users Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={`$${data.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
                icon={DollarSign}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
              />
              <MetricCard
                title="Total Users"
                value={data.totalUsers || 0}
                icon={Users}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
              />
              <MetricCard
                title="Total Customers"
                value={data.totalCustomers || 0}
                subtitle="Users with subscription history"
                icon={TrendingUp}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
              />
              <MetricCard
                title="Total Reviews"
                value={data.totalReviews || 0}
                icon={MessageSquare}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
              />
            </div>

            {/* Subscription Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Active Subscribers"
                value={data.activeSubscribers || 0}
                icon={UserCheck}
                iconBg="bg-green-100"
                iconColor="text-green-600"
              />
              <MetricCard
                title="Canceled Subscribers"
                value={data.canceledSubscribers || 0}
                icon={UserX}
                iconBg="bg-red-100"
                iconColor="text-red-600"
              />
              <MetricCard
                title="Free Users"
                value={data.freeUsers || 0}
                icon={Users}
                iconBg="bg-slate-100"
                iconColor="text-slate-600"
              />
              <MetricCard
                title="Avg. Rating"
                value={data.avgRating?.toFixed(1) || '0.0'}
                subtitle="out of 5 stars"
                icon={Star}
                iconBg="bg-yellow-100"
                iconColor="text-yellow-600"
              />
            </div>

            {/* Downloads Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Downloads This Month"
                value={data.totalDownloadsUsed || 0}
                subtitle="Total downloads used"
                icon={Download}
                iconBg="bg-indigo-100"
                iconColor="text-indigo-600"
              />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Subscription Breakdown</h3>
                <div className="space-y-4">
                  <ProgressBar 
                    label="Active Subscribers" 
                    value={data.activeSubscribers || 0} 
                    total={data.totalUsers || 1} 
                    color="bg-green-500" 
                  />
                  <ProgressBar 
                    label="Canceled Subscribers" 
                    value={data.canceledSubscribers || 0} 
                    total={data.totalUsers || 1} 
                    color="bg-red-500" 
                  />
                  <ProgressBar 
                    label="Free Users" 
                    value={data.freeUsers || 0} 
                    total={data.totalUsers || 1} 
                    color="bg-slate-500" 
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <QuickStat label="Conversion Rate" value={
                    data.totalUsers > 0 
                      ? `${((data.activeSubscribers / data.totalUsers) * 100).toFixed(1)}%`
                      : '0%'
                  } />
                  <QuickStat label="Churn Rate" value={
                    data.totalCustomers > 0 
                      ? `${((data.canceledSubscribers / data.totalCustomers) * 100).toFixed(1)}%`
                      : '0%'
                  } />
                  <QuickStat label="Monthly Revenue (Est.)" value={
                    `$${((data.activeSubscribers || 0) * 39).toLocaleString()}`
                  } />
                  <QuickStat label="Reviews per User" value={
                    data.totalUsers > 0 
                      ? (data.totalReviews / data.totalUsers).toFixed(2)
                      : '0'
                  } />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function MetricCard({ title, value, subtitle, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{value} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

function QuickStat({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

