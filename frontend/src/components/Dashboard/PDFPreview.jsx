import { useState, useEffect } from 'react'
import { 
  Download, ArrowLeft, CheckCircle, Loader, CreditCard, 
  X, Edit2, Plus, Save, Maximize2, Minimize2, Eye,
  FileText, ChevronDown, ChevronUp, Trash2
} from 'lucide-react'
import PaymentModal from './PaymentModal'
import DownloadOptionsModal from './DownloadOptionsModal'

export default function PDFPreview({ extractedData: initialData, companyInfo, uploadedFile, onReset, onBack }) {
  // Editable data state
  const [editableData, setEditableData] = useState({})
  const [specifications, setSpecifications] = useState([])
  const [editingField, setEditingField] = useState(null)
  const [editingSpecIndex, setEditingSpecIndex] = useState(null)
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [showAddField, setShowAddField] = useState(false)
  
  // Preview state
  const [showOriginalPdf, setShowOriginalPdf] = useState(false)
  const [originalPdfUrl, setOriginalPdfUrl] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDataExpanded, setIsDataExpanded] = useState(true)
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(true)
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [generatedFilename, setGeneratedFilename] = useState('')
  const [pendingDownloadType, setPendingDownloadType] = useState(null)

  // Initialize editable data from props
  useEffect(() => {
    if (initialData) {
      const { specifications: specs, fullText, _metadata, additionalInfo, ...rest } = initialData
      setEditableData(rest)
      setSpecifications(specs || [])
    }
  }, [initialData])

  // Create URL for original PDF preview
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile)
      setOriginalPdfUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [uploadedFile])

  // Field management functions
  const updateField = (key, value) => {
    setEditableData(prev => ({ ...prev, [key]: value }))
  }

  const deleteField = (key) => {
    setEditableData(prev => {
      const newData = { ...prev }
      delete newData[key]
      return newData
    })
  }

  const addField = () => {
    if (newFieldKey.trim() && newFieldValue.trim()) {
      const key = newFieldKey.trim().replace(/\s+/g, '')
      setEditableData(prev => ({ ...prev, [key]: newFieldValue.trim() }))
      setNewFieldKey('')
      setNewFieldValue('')
      setShowAddField(false)
    }
  }

  // Specification management functions
  const updateSpec = (index, field, value) => {
    setSpecifications(prev => {
      const newSpecs = [...prev]
      newSpecs[index] = { ...newSpecs[index], [field]: value }
      return newSpecs
    })
  }

  const deleteSpec = (index) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index))
  }

  const addSpec = () => {
    setSpecifications(prev => [...prev, { parameter: '', specification: '', result: '' }])
    setEditingSpecIndex(specifications.length)
  }

  // Format key for display
  const formatKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').trim()
  }

  // Open download options modal
  function handleDownloadClick() {
    setShowDownloadOptions(true)
  }

  // Handle download with specific type
  async function handleDownload(downloadType) {
    setError('')
    setGenerating(true)
    
    try {
      const { extractAndGeneratePDF } = await import('../../services/apiService')
      
      // Merge edited data with specifications
      const finalData = {
        ...editableData,
        specifications: specifications
      }
      
      // Generate PDF with the specified download type
      const response = await extractAndGeneratePDF(uploadedFile, companyInfo, finalData, downloadType)
      
      if (response.generatedPdf && response.generatedPdf.base64) {
        const base64 = response.generatedPdf.base64
        const filename = response.generatedPdf.filename || 'COA_formatted.pdf'
        
        const byteCharacters = atob(base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        setGeneratedFilename(filename)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error('No PDF data received from server')
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      setError(err.message || 'Failed to prepare PDF. Please try again.')
      throw err
    } finally {
      setGenerating(false)
    }
  }

  // Handle paid download - opens payment modal first
  function handlePaymentRequired() {
    // First generate the file to get filename, then show payment
    handlePrepareForPayment()
  }

  // Prepare PDF and show payment modal
  async function handlePrepareForPayment() {
    setError('')
    setGenerating(true)
    
    try {
      const { extractAndGeneratePDF } = await import('../../services/apiService')
      
      const finalData = {
        ...editableData,
        specifications: specifications
      }
      
      // Generate with 'paid' type to prepare the file
      const response = await extractAndGeneratePDF(uploadedFile, companyInfo, finalData, 'paid')
      
      if (response.generatedPdf && response.generatedPdf.filename) {
        setGeneratedFilename(response.generatedPdf.filename)
        setPendingDownloadType('paid')
        setShowPaymentModal(true)
      } else {
        throw new Error('No filename received from server')
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      setError(err.message || 'Failed to prepare PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePaymentSuccess({ filename }) {
    setGenerating(true)
    setSuccess(false)
    setError('')
    setShowPaymentModal(false)

    try {
      // Download with 'paid' type after successful payment
      await handleDownload('paid')
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      setError(err.message || 'Failed to generate PDF. Please try again.')
    } finally {
      setGenerating(false)
      setPendingDownloadType(null)
    }
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto p-6' : 'card'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
      <button
        onClick={onBack}
          className="btn-secondary flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOriginalPdf(!showOriginalPdf)}
            className={`btn-secondary flex items-center gap-2 ${showOriginalPdf ? 'bg-primary-100 border-primary-300' : ''}`}
          >
            <Eye className="w-4 h-4" />
            <span>{showOriginalPdf ? 'Hide' : 'Show'} Original</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-secondary p-2"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Review & Edit Extracted Data</h2>
        <p className="text-gray-600 text-sm mt-1">Click on any field to edit, or use ✕ to delete</p>
      </div>

      {/* Main Content - Side by Side when original is shown */}
      <div className={`${showOriginalPdf ? 'flex gap-6' : ''}`}>
        
        {/* Original PDF Preview */}
        {showOriginalPdf && (
          <div className="w-1/2 flex-shrink-0">
            <div className="bg-gray-100 rounded-lg overflow-hidden sticky top-4 border-2 border-gray-800">
              <div className="bg-gray-200 px-4 py-2 flex items-center gap-2 border-b border-gray-800">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Original PDF</span>
              </div>
              <div style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
                {originalPdfUrl && (
                  <iframe
                    src={originalPdfUrl}
                    className="w-full h-full border-0"
                    title="Original PDF"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editable Data Section */}
        <div className={`space-y-6 ${showOriginalPdf ? 'w-1/2 flex-shrink-0' : ''}`}>
          {/* Company Info (read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>Company Information</span>
              <span className="text-xs text-gray-500 font-normal">(from previous step)</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{companyInfo.name || 'Not provided'}</span>
              </div>
              {companyInfo.address && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-right max-w-xs">{companyInfo.address}</span>
                </div>
              )}
              {companyInfo.logo && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Logo:</span>
                  <img src={companyInfo.logo} alt="Logo" className="h-8 object-contain" />
              </div>
            )}
          </div>
        </div>

          {/* Editable COA Data */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="bg-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setIsDataExpanded(!isDataExpanded)}
            >
              <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Extracted COA Data
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  {Object.keys(editableData).length} fields
                    </span>
              </h3>
              {isDataExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
            
            {isDataExpanded && (
            <div className="p-4 space-y-2">
              {Object.entries(editableData).map(([key, value]) => (
                <div 
                  key={key} 
                  className="group flex items-start py-2 px-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                >
                  <span className="text-sm font-medium text-gray-700 capitalize flex-shrink-0 w-24 sm:w-28">
                    {formatKey(key)}:
                  </span>
                  
                  {editingField === key ? (
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => updateField(key, e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingField(null)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1 ml-2 justify-end min-w-0">
                      <span 
                        className={`text-sm text-right break-words cursor-pointer hover:text-primary-600 flex-1 min-w-0 ${
                          value === null || value === 'null' ? 'text-gray-400 italic' : 'text-gray-900'
                        }`}
                        onClick={() => setEditingField(key)}
                        title={value === null || value === 'null' ? 'Click to edit' : String(value)}
                      >
                        {value === null || value === 'null' ? 'null (click to edit)' : String(value)}
                      </span>
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <button
                          onClick={() => setEditingField(key)}
                          className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteField(key)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                      </div>
                    ))}

              {/* Add New Field */}
              {showAddField ? (
                <div className="flex items-center gap-2 py-2 px-3 bg-primary-50 rounded-lg border border-primary-200">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    className="w-32 px-2 py-1 text-sm border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                  <button onClick={addField} className="p-1 text-green-600 hover:bg-green-100 rounded">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowAddField(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddField(true)}
                  className="flex items-center gap-2 w-full py-2 px-3 text-sm text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-primary-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Field
                </button>
              )}
            </div>
            )}
          </div>

          {/* Editable Specifications */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="bg-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
            >
              <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Specifications
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {specifications.length} items
                </span>
              </h3>
              {isSpecsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            
            {isSpecsExpanded && (
            <div className="p-4">
              {specifications.length > 0 ? (
                <div className="space-y-2 overflow-x-auto">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-1 text-xs font-semibold text-gray-600 uppercase px-2 py-1 bg-gray-50 rounded min-w-0">
                    <div className="col-span-4">Parameter</div>
                    <div className="col-span-3">Specification</div>
                    <div className="col-span-4">Result</div>
                    <div className="col-span-1 text-center">Act</div>
                  </div>
                  
                  {/* Table Rows */}
                  {specifications.map((spec, index) => (
                    <div 
                      key={index} 
                      className="group grid grid-cols-12 gap-1 items-start py-2 px-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    >
                      {editingSpecIndex === index ? (
                        <>
                          <input
                            type="text"
                            value={spec.parameter || ''}
                            onChange={(e) => updateSpec(index, 'parameter', e.target.value)}
                            className="col-span-4 px-2 py-1 text-sm border rounded"
                            placeholder="Parameter"
                          />
                          <input
                            type="text"
                            value={spec.specification || ''}
                            onChange={(e) => updateSpec(index, 'specification', e.target.value)}
                            className="col-span-3 px-2 py-1 text-sm border rounded"
                            placeholder="Specification"
                          />
                          <input
                            type="text"
                            value={spec.result || ''}
                            onChange={(e) => updateSpec(index, 'result', e.target.value)}
                            className="col-span-4 px-2 py-1 text-sm border rounded"
                            placeholder="Result"
                          />
                          <div className="col-span-1 flex justify-center gap-1">
                            <button
                              onClick={() => setEditingSpecIndex(null)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div 
                            className="col-span-4 text-sm font-medium text-gray-900 cursor-pointer hover:text-primary-600 break-words"
                            onClick={() => setEditingSpecIndex(index)}
                          >
                            {spec.parameter || '-'}
                          </div>
                          <div 
                            className="col-span-3 text-sm text-gray-700 cursor-pointer hover:text-primary-600 break-words"
                            onClick={() => setEditingSpecIndex(index)}
                          >
                            {spec.specification || '-'}
                          </div>
                          <div 
                            className="col-span-4 text-sm text-gray-700 cursor-pointer hover:text-primary-600 break-words"
                            onClick={() => setEditingSpecIndex(index)}
                          >
                            {spec.result || '-'}
                          </div>
                          <div className="col-span-1 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingSpecIndex(index)}
                              className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteSpec(index)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">No specifications extracted</p>
              )}
              
              {/* Add New Specification */}
              <button
                onClick={addSpec}
                className="flex items-center gap-2 w-full py-2 px-3 mt-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Specification
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-sm text-green-800 font-medium">PDF downloaded successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4 mt-6">
        <button onClick={onReset} className="btn-secondary flex-1">
          Start Over
        </button>
        <button
          onClick={handleDownloadClick}
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

      {/* Download Options Modal */}
      <DownloadOptionsModal
        isOpen={showDownloadOptions}
        onClose={() => setShowDownloadOptions(false)}
        onDownload={handleDownload}
        onPaymentRequired={handlePaymentRequired}
        filename={generatedFilename}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        filename={generatedFilename}
      />
    </div>
  )
}
