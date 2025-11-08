import { useState } from 'react'
import { Download, ArrowLeft, CheckCircle, Loader } from 'lucide-react'

export default function PDFPreview({ extractedData, companyInfo, uploadedFile, onReset, onBack }) {
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setGenerating(true)
    setSuccess(false)
    setError('')

    try {
      // Import the API service dynamically
      const { extractAndGeneratePDF } = await import('../../services/apiService')
      
      // Call backend to generate PDF with company info
      const response = await extractAndGeneratePDF(uploadedFile, companyInfo)
      
      // Download the generated PDF
      if (response.generatedPdf && response.generatedPdf.base64) {
        const base64 = response.generatedPdf.base64
        const filename = response.generatedPdf.filename || 'COA_formatted.pdf'
        
        // Convert base64 to blob and download
        const byteCharacters = atob(base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        setSuccess(true)
        
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error('No PDF data received from server')
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      setError(err.message || 'Failed to generate PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Ready to Generate PDF</h2>
        <p className="text-gray-600 mt-2">Review the extracted data and download your formatted PDF</p>
      </div>

      {/* Preview Section */}
      <div className="space-y-6 mb-8">
        {/* Company Info */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Company Name:</span>
              <span className="text-sm text-gray-900">{companyInfo.name || 'Not provided'}</span>
            </div>
            {companyInfo.logo && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Logo:</span>
                <img 
                  src={companyInfo.logo} 
                  alt="Company logo" 
                  className="h-12 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Extracted Data Preview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted COA Data</h3>
          {extractedData && Object.keys(extractedData).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(extractedData).map(([key, value]) => {
                // Skip these in main preview
                if (key === 'specifications' || key === 'fullText' || key === '_metadata' || key === 'additionalInfo') {
                  return null
                }
                
                // Handle null/undefined values
                const displayValue = value === null || value === undefined ? 'null' : String(value)
                
                return (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-sm text-gray-900 text-right max-w-xs truncate" title={displayValue}>
                      {displayValue}
                    </span>
                  </div>
                )
              })}
              
              {/* Display specifications separately if they exist */}
              {extractedData.specifications && extractedData.specifications.length > 0 && (
                <div className="pt-4 mt-4 border-t-2 border-gray-300">
                  <span className="text-sm font-bold text-gray-900 block mb-3">
                    Specifications ({extractedData.specifications.length} items):
                  </span>
                  <div className="space-y-2 ml-4">
                    {extractedData.specifications.map((spec, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        <span className="font-medium">{spec.parameter}:</span>{' '}
                        <span className="text-gray-600">{spec.specification || spec.result || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No specific data extracted. The PDF will include raw content.</p>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-sm text-green-800 font-medium">PDF downloaded successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onReset}
          className="btn-secondary flex-1"
        >
          Start Over
        </button>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="btn-primary flex-1 flex items-center justify-center space-x-2"
        >
          {generating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

