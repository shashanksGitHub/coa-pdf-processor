import { useState, useEffect } from 'react'
import { Building2, Upload, Image as ImageIcon, ArrowLeft, Save, History, MapPin, Loader, Cloud, Check, Palette, Layout, Crown, Sparkles, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { uploadCompanyLogo, deleteCompanyLogo, uploadCustomBackground, deleteCustomBackground, fileToBase64 } from '../../services/storageService'
import { getCompanyInfo, saveCompanyInfo as saveCompanyToFirestore, deleteCompanyInfo } from '../../services/companyService'
import { getAccountStatus } from '../../services/userService'

// Predefined color themes
const COLOR_THEMES = [
  { id: 'navy-green', name: 'Navy & Green', primary: '#1A376B', secondary: '#568259', label: 'Classic' },
  { id: 'blue-light', name: 'Ocean Blue', primary: '#0369a1', secondary: '#0ea5e9', label: 'Modern' },
  { id: 'red-dark', name: 'Corporate Red', primary: '#991b1b', secondary: '#dc2626', label: 'Bold' },
  { id: 'purple', name: 'Royal Purple', primary: '#581c87', secondary: '#7c3aed', label: 'Elegant' },
  { id: 'teal', name: 'Teal Fresh', primary: '#115e59', secondary: '#14b8a6', label: 'Fresh' },
  { id: 'black', name: 'Monochrome', primary: '#18181b', secondary: '#3f3f46', label: 'Minimal' },
]

// Layout templates
const LAYOUT_TEMPLATES = [
  { id: 'classic', name: 'Classic', description: 'Traditional COA layout with centered header' },
  { id: 'modern', name: 'Modern', description: 'Clean design with left-aligned elements' },
  { id: 'minimal', name: 'Minimal', description: 'Simple layout with minimal borders' },
]

export default function CompanyInfoForm({ onSubmit, onBack }) {
  const { currentUser } = useAuth()
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null) // Firebase Storage URL
  const [logoBase64, setLogoBase64] = useState(null) // For PDF generation
  const [hasSavedInfo, setHasSavedInfo] = useState(false)
  const [saveInfo, setSaveInfo] = useState(true)
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [savingInfo, setSavingInfo] = useState(false)
  
  // Theme and layout state
  const [selectedTheme, setSelectedTheme] = useState('navy-green')
  const [selectedLayout, setSelectedLayout] = useState('classic')
  
  // Subscription state
  const [isSubscriber, setIsSubscriber] = useState(false)
  const [downloadsRemaining, setDownloadsRemaining] = useState(0)
  const [loadingAccountStatus, setLoadingAccountStatus] = useState(true)
  
  // Custom background state (Pro feature)
  const [customBackground, setCustomBackground] = useState(null)
  const [backgroundPreview, setBackgroundPreview] = useState(null)
  const [backgroundUrl, setBackgroundUrl] = useState(null)
  const [backgroundBase64, setBackgroundBase64] = useState(null)
  const [uploadingBackground, setUploadingBackground] = useState(false)

  // Load account status on mount
  useEffect(() => {
    async function loadAccountStatus() {
      if (!currentUser) {
        setLoadingAccountStatus(false)
        return
      }
      
      try {
        const status = await getAccountStatus()
        setIsSubscriber(status.subscriptionStatus === 'active')
        setDownloadsRemaining(status.downloadsRemaining || 0)
        console.log('Account status loaded:', status)
      } catch (error) {
        console.error('Error loading account status:', error)
        setIsSubscriber(false)
      } finally {
        setLoadingAccountStatus(false)
      }
    }
    
    loadAccountStatus()
  }, [currentUser])

  // Load saved company info from Firestore on mount
  useEffect(() => {
    async function loadCompanyInfo() {
      if (!currentUser) {
        setLoadingInfo(false)
        return
      }

      try {
        const savedInfo = await getCompanyInfo()
        if (savedInfo) {
          setCompanyName(savedInfo.companyName || '')
          setCompanyAddress(savedInfo.companyAddress || '')
          // Load logo URL from Firebase Storage
          if (savedInfo.logoUrl) {
            setLogoUrl(savedInfo.logoUrl)
            setLogoPreview(savedInfo.logoUrl)
          }
          // Load custom background URL (Pro feature)
          if (savedInfo.customBackgroundUrl) {
            setBackgroundUrl(savedInfo.customBackgroundUrl)
            setBackgroundPreview(savedInfo.customBackgroundUrl)
          }
          // Load theme and layout
          if (savedInfo.theme) setSelectedTheme(savedInfo.theme)
          if (savedInfo.layout) setSelectedLayout(savedInfo.layout)
          setHasSavedInfo(true)
        }
      } catch (error) {
        console.error('Error loading company info from Firestore:', error)
        // Fallback to localStorage if API fails
        try {
          const storageKey = `companyInfo_${currentUser.uid}`
          const localInfo = localStorage.getItem(storageKey)
          if (localInfo) {
            const parsed = JSON.parse(localInfo)
            setCompanyName(parsed.name || '')
            setCompanyAddress(parsed.address || '')
            if (parsed.logoUrl) {
              setLogoUrl(parsed.logoUrl)
              setLogoPreview(parsed.logoUrl)
              setLogoBase64(parsed.logoBase64 || null)
            }
            if (parsed.backgroundUrl) {
              setBackgroundUrl(parsed.backgroundUrl)
              setBackgroundPreview(parsed.backgroundUrl)
            }
            if (parsed.theme) setSelectedTheme(parsed.theme)
            if (parsed.layout) setSelectedLayout(parsed.layout)
            setHasSavedInfo(true)
          }
        } catch (localError) {
          console.error('Error loading from localStorage fallback:', localError)
        }
      } finally {
        setLoadingInfo(false)
      }
    }

    loadCompanyInfo()
  }, [currentUser])

  // Save company info to Firestore
  async function handleSaveCompanyInfo(logoDownloadUrl, backgroundDownloadUrl) {
    if (!currentUser) {
      console.warn('Cannot save company info - user not logged in')
      return
    }

    setSavingInfo(true)
    try {
      await saveCompanyToFirestore({
        companyName: companyName.trim(),
        companyAddress: companyAddress.trim(),
        logoUrl: logoDownloadUrl || logoUrl,
        theme: selectedTheme,
        layout: selectedLayout,
        customBackgroundUrl: isSubscriber ? (backgroundDownloadUrl || backgroundUrl) : null,
      })
      setHasSavedInfo(true)
      setShowSavedMessage(true)
      setTimeout(() => setShowSavedMessage(false), 2000)
      console.log('Company info saved to Firestore')
    } catch (error) {
      console.error('Error saving company info to Firestore:', error)
      // Fallback to localStorage
      const storageKey = `companyInfo_${currentUser.uid}`
      const infoToSave = {
        name: companyName,
        address: companyAddress,
        logoUrl: logoDownloadUrl || logoUrl,
        logoBase64: logoBase64,
        backgroundUrl: isSubscriber ? (backgroundDownloadUrl || backgroundUrl) : null,
        backgroundBase64: isSubscriber ? backgroundBase64 : null,
        theme: selectedTheme,
        layout: selectedLayout,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(infoToSave))
      setHasSavedInfo(true)
      setShowSavedMessage(true)
      setTimeout(() => setShowSavedMessage(false), 2000)
    } finally {
      setSavingInfo(false)
    }
  }

  // Clear saved info from Firestore
  async function clearSavedInfo() {
    setSavingInfo(true)
    try {
      // Delete logo from Firebase Storage
      if (logoUrl) {
        await deleteCompanyLogo(logoUrl)
      }
      
      // Delete custom background from Firebase Storage
      if (backgroundUrl) {
        await deleteCustomBackground(backgroundUrl)
      }
      
      // Delete from Firestore
      if (currentUser) {
        await deleteCompanyInfo()
        // Also clear localStorage fallback
        const storageKey = `companyInfo_${currentUser.uid}`
        localStorage.removeItem(storageKey)
      }
      
      setCompanyName('')
      setCompanyAddress('')
      setLogoPreview(null)
      setLogoUrl(null)
      setLogoBase64(null)
      setLogo(null)
      setBackgroundPreview(null)
      setBackgroundUrl(null)
      setBackgroundBase64(null)
      setCustomBackground(null)
      setSelectedTheme('navy-green')
      setSelectedLayout('classic')
      setHasSavedInfo(false)
    } catch (error) {
      console.error('Error clearing company info:', error)
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    setUploadError('')
    setUploadingLogo(true)
      setLogo(file)
      
    try {
      // Create local preview immediately
      const base64 = await fileToBase64(file)
      setLogoPreview(base64)
      setLogoBase64(base64)

      // Upload to Firebase Storage
      if (currentUser) {
        const downloadUrl = await uploadCompanyLogo(file, currentUser.uid)
        setLogoUrl(downloadUrl)
        console.log('Logo uploaded to Firebase Storage:', downloadUrl)
      }
    } catch (error) {
      console.error('Error handling logo:', error)
      setUploadError('Failed to upload logo. Please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleRemoveLogo() {
    // Delete from Firebase Storage
    if (logoUrl) {
      await deleteCompanyLogo(logoUrl)
    }
    
    setLogo(null)
    setLogoPreview(null)
    setLogoUrl(null)
    setLogoBase64(null)
  }

  // Handle custom background upload (Pro feature)
  async function handleBackgroundChange(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 10MB for backgrounds)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Background file must be less than 10MB')
      return
    }

    setUploadError('')
    setUploadingBackground(true)
    setCustomBackground(file)
    
    try {
      // Create local preview immediately
      const base64 = await fileToBase64(file)
      setBackgroundPreview(base64)
      setBackgroundBase64(base64)

      // Upload to Firebase Storage
      if (currentUser) {
        const downloadUrl = await uploadCustomBackground(file, currentUser.uid)
        setBackgroundUrl(downloadUrl)
        console.log('Background uploaded to Firebase Storage:', downloadUrl)
      }
    } catch (error) {
      console.error('Error handling background:', error)
      setUploadError('Failed to upload background. Please try again.')
    } finally {
      setUploadingBackground(false)
    }
  }

  async function handleRemoveBackground() {
    // Delete from Firebase Storage
    if (backgroundUrl) {
      await deleteCustomBackground(backgroundUrl)
    }
    
    setCustomBackground(null)
    setBackgroundPreview(null)
    setBackgroundUrl(null)
    setBackgroundBase64(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    // Save info if checkbox is checked
    if (saveInfo) {
      handleSaveCompanyInfo(logoUrl, backgroundUrl)
    }
    
    // Get the selected theme colors
    const theme = COLOR_THEMES.find(t => t.id === selectedTheme) || COLOR_THEMES[0]
    
    // Pass base64 logo for PDF generation (backend needs base64)
    onSubmit({
      name: companyName,
      address: companyAddress,
      logo: logoBase64 || logoPreview,
      theme: {
        id: selectedTheme,
        primaryColor: theme.primary,
        secondaryColor: theme.secondary,
      },
      layout: selectedLayout,
      // Custom background for subscribers
      customBackground: isSubscriber ? (backgroundBase64 || backgroundPreview) : null,
    })
  }

  // Show loading state while fetching company info
  if (loadingInfo || loadingAccountStatus) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-8 h-8 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading company info...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <button
        onClick={onBack}
        className="btn-secondary mb-6 flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Building2 className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
        <p className="text-gray-600 mt-2">Add your company details to customize the PDF</p>
      </div>

      {/* Saved Info Indicator */}
      {hasSavedInfo && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Saved company info loaded automatically
              </span>
              <Cloud className="w-4 h-4 text-green-600" />
            </div>
            <button
              type="button"
              onClick={clearSavedInfo}
              disabled={savingInfo}
              className="text-sm text-green-700 hover:text-green-900 underline disabled:opacity-50"
            >
              {savingInfo ? 'Clearing...' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      {/* Save Success Message */}
      {showSavedMessage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Save className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Company info saved to cloud!</span>
          <Cloud className="w-4 h-4 text-blue-600" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="input-field"
            placeholder="Enter your company name"
            required
          />
        </div>

        <div>
          <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Company Address
            </div>
          </label>
          <textarea
            id="companyAddress"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            className="input-field min-h-[80px] resize-none"
            placeholder="Enter your company address"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo (Optional)
          </label>
          
          {uploadError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {uploadError}
            </div>
          )}
          
          {logoPreview ? (
            <div className="space-y-4">
              <div className="relative flex items-center justify-center p-6 border-2 border-gray-200 rounded-xl bg-gray-50">
                <img
                  src={logoPreview}
                  alt="Company logo preview"
                  className="max-h-32 max-w-full object-contain"
                />
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
                    <div className="flex items-center gap-2 text-primary-600">
                      <Loader className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Uploading to cloud...</span>
                    </div>
                  </div>
                )}
                {logoUrl && !uploadingLogo && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                    <Cloud className="w-3 h-3" />
                    <span>Saved</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={uploadingLogo}
                className="btn-secondary w-full disabled:opacity-50"
              >
                Remove Logo
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-all ${uploadingLogo ? 'pointer-events-none opacity-50' : ''}`}>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                {uploadingLogo ? (
                  <Loader className="w-6 h-6 text-primary-500 animate-spin" />
                ) : (
                <ImageIcon className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {uploadingLogo ? 'Uploading...' : 'Click to upload logo'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, SVG up to 5MB
              </p>
              <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Saved securely in cloud
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                disabled={uploadingLogo}
              />
            </label>
          )}
        </div>

        {/* PDF Theme Selection */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">PDF Style & Layout</h3>
          </div>
          
          {/* Color Theme */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    selectedTheme === theme.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: theme.secondary }}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-900">{theme.label}</p>
                  {selectedTheme === theme.id && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Layout Template
              </div>
            </label>
            <div className="space-y-2">
              {LAYOUT_TEMPLATES.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setSelectedLayout(layout.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedLayout === layout.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{layout.name}</p>
                      <p className="text-xs text-gray-500">{layout.description}</p>
                    </div>
                    {selectedLayout === layout.id && (
                      <Check className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscriber Features Section */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">Subscriber Features</h3>
            </div>
            {isSubscriber ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-amber-500 text-white">
                  <Sparkles className="w-3 h-3" />
                  SUBSCRIBED
                </span>
                <span className="text-xs text-gray-500">{downloadsRemaining}/60 left</span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <Lock className="w-3 h-3" />
                Free Account
              </span>
            )}
          </div>

          {isSubscriber ? (
            /* Custom Background Upload - Subscriber Feature */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Custom PDF Background
                </div>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload a custom background image for your PDFs (will appear faded behind content)
              </p>
              
              {backgroundPreview ? (
                <div className="space-y-3">
                  <div className="relative flex items-center justify-center p-4 border-2 border-amber-200 rounded-xl bg-amber-50">
                    <img
                      src={backgroundPreview}
                      alt="Background preview"
                      className="max-h-24 max-w-full object-contain opacity-60"
                    />
                    {uploadingBackground && (
                      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Loader className="w-5 h-5 animate-spin" />
                          <span className="text-sm font-medium">Uploading...</span>
                        </div>
                      </div>
                    )}
                    {backgroundUrl && !uploadingBackground && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">
                        <Cloud className="w-3 h-3" />
                        <span>Saved</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    disabled={uploadingBackground}
                    className="btn-secondary w-full disabled:opacity-50 text-sm"
                  >
                    Remove Background
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all ${uploadingBackground ? 'pointer-events-none opacity-50' : ''}`}>
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                    {uploadingBackground ? (
                      <Loader className="w-5 h-5 text-amber-500 animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {uploadingBackground ? 'Uploading...' : 'Upload Background Image'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundChange}
                    className="hidden"
                    disabled={uploadingBackground}
                  />
                </label>
              )}
            </div>
          ) : (
            /* Subscription prompt for free users */
            <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Subscribe for $39/month</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Get 60 watermark-free downloads per month plus exclusive features.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 mb-3">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      60 watermark-free downloads/month
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      Custom background images
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      Save $21 vs pay-per-download
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500">
                    Subscribe when downloading your PDF
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save for next time checkbox */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="saveInfo"
            checked={saveInfo}
            onChange={(e) => setSaveInfo(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <label htmlFor="saveInfo" className="text-sm text-gray-700 cursor-pointer">
            <span className="font-medium">Save company info to cloud</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Access from any device with your account
            </span>
          </label>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex-1"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={savingInfo}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {savingInfo ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
