import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, FileText, Crown, CheckCircle, X } from 'lucide-react'
import PDFUploader from './PDFUploader'
import CompanyInfoForm from './CompanyInfoForm'
import PDFPreview from './PDFPreview'
import { getAccountStatus } from '../../services/userService'

export default function Dashboard() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [uploadedPDF, setUploadedPDF] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    logo: null,
    address: '',
    theme: null,
    layout: 'classic',
    customBackground: null
  })
  const [step, setStep] = useState(1) // 1: Upload, 2: Company Info, 3: Preview
  const [isSubscriber, setIsSubscriber] = useState(false)
  const [downloadsRemaining, setDownloadsRemaining] = useState(0)
  const [toast, setToast] = useState(null) // { type: 'success' | 'error', message: string }

  // Show toast notification
  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  // Check for subscription success/cancel from URL (runs once on mount)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const subscriptionParam = urlParams.get('subscription')
    
    if (subscriptionParam === 'success') {
      // Clear URL params first to prevent re-triggering
      window.history.replaceState({}, '', window.location.pathname)
      // Show success toast immediately
      showToast('success', '🎉 Subscription successful! Activating your Pro account...')
    } else if (subscriptionParam === 'canceled') {
      window.history.replaceState({}, '', window.location.pathname)
      showToast('error', 'Subscription was canceled.')
    }
  }, [])

  // Load account status
  useEffect(() => {
    async function loadAccountStatus() {
      if (currentUser) {
        try {
          const status = await getAccountStatus()
          const wasSubscriber = isSubscriber
          setIsSubscriber(status.subscriptionStatus === 'active')
          setDownloadsRemaining(status.downloadsRemaining || 0)
          
          // If just became a subscriber, show welcome toast
          if (!wasSubscriber && status.subscriptionStatus === 'active') {
            showToast('success', '✅ Welcome to Pro! You now have 60 downloads per month.')
          }
          return status
        } catch (error) {
          console.error('Error loading account status:', error)
        }
      }
      return null
    }
    
    loadAccountStatus()
    
    // Poll for subscription activation if coming from checkout
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('subscription') === 'success') {
      // Poll every 2 seconds for up to 10 seconds
      const interval = setInterval(async () => {
        const status = await loadAccountStatus()
        if (status?.subscriptionStatus === 'active') {
          clearInterval(interval)
        }
      }, 2000)
      
      // Stop polling after 10 seconds
      setTimeout(() => clearInterval(interval), 10000)
      
      return () => clearInterval(interval)
    }
  }, [currentUser])

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  function handlePDFUpload(file, data) {
    setUploadedPDF(file)
    setExtractedData(data)
    setStep(2)
  }

  function handleCompanyInfo(info) {
    setCompanyInfo(info)
    setStep(3)
  }

  function handleReset() {
    setUploadedPDF(null)
    setExtractedData(null)
    setCompanyInfo({ name: '', logo: null, address: '', theme: null, layout: 'classic', customBackground: null })
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md animate-slide-in ${
          toast.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        } border rounded-xl shadow-lg p-4 flex items-start gap-3`}>
          <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
            toast.type === 'success' ? 'text-green-500' : 'text-red-500'
          }`} />
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button 
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">COA PDF Processor</h1>
                  {isSubscriber && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-amber-500 text-white">
                      <Crown className="w-3 h-3" />
                      PRO
                      <span className="opacity-75">({downloadsRemaining})</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <Step number={1} label="Upload PDF" active={step >= 1} current={step === 1} />
            <Divider active={step >= 2} />
            <Step number={2} label="Company Info" active={step >= 2} current={step === 2} />
            <Divider active={step >= 3} />
            <Step number={3} label="Preview & Download" active={step >= 3} current={step === 3} />
          </div>
        </div>

        {/* Content based on step */}
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <PDFUploader onUpload={handlePDFUpload} />
          )}

          {step === 2 && (
            <CompanyInfoForm 
              onSubmit={handleCompanyInfo} 
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <PDFPreview
              extractedData={extractedData}
              companyInfo={companyInfo}
              uploadedFile={uploadedPDF}
              onReset={handleReset}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function Step({ number, label, active, current }) {
  return (
    <div className="flex items-center">
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-full font-semibold
        ${current ? 'bg-primary-600 text-white' : active ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}
      `}>
        {number}
      </div>
      <span className={`ml-2 font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}

function Divider({ active }) {
  return (
    <div className={`h-0.5 w-16 ${active ? 'bg-primary-600' : 'bg-gray-200'}`} />
  )
}

