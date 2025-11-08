import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, FileText } from 'lucide-react'
import PDFUploader from './PDFUploader'
import CompanyInfoForm from './CompanyInfoForm'
import PDFPreview from './PDFPreview'

export default function Dashboard() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [uploadedPDF, setUploadedPDF] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    logo: null
  })
  const [step, setStep] = useState(1) // 1: Upload, 2: Company Info, 3: Preview

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
    setCompanyInfo({ name: '', logo: null })
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

