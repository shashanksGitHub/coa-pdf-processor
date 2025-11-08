import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Loader } from 'lucide-react'
import { extractDataOnly } from '../../services/apiService'

export default function PDFUploader({ onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setError('')
      setUploading(true)

      try {
        // Extract data from PDF using backend API with GPT-4
        setProgress('📤 Uploading PDF to server...')
        
        setTimeout(() => setProgress('📄 Extracting text from PDF...'), 1000)
        setTimeout(() => setProgress('🤖 AI is analyzing your document...'), 3000)
        setTimeout(() => setProgress('⚡ Almost done...'), 8000)
        
        const response = await extractDataOnly(file)
        setProgress('✅ Success!')
        
        // Show which method was used
        const method = response.method === 'gpt-4-turbo-text' ? '⚡ Fast extraction' : '🖼️ Vision extraction'
        console.log(`Extraction method: ${method}`)
        
        onUpload(file, response.data)
      } catch (err) {
        setProgress('')
        setError(err.message || 'Failed to process PDF file. Please make sure it\'s a valid COA document.')
        console.error(err)
      } finally {
        setUploading(false)
        setProgress('')
      }
    }
  })

  return (
    <div className="card">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Upload Certificate of Analysis</h2>
        <p className="text-gray-600 mt-2">Upload a COA PDF to process and reformat</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          {uploading ? (
            <>
              <Loader className="w-16 h-16 text-primary-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900">Processing with AI...</p>
              <p className="text-sm text-gray-600 mt-2">{progress || 'Starting...'}</p>
              <p className="text-xs text-gray-500 mt-3">⏱️ Usually takes 5-15 seconds</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                {isDragActive ? (
                  <FileText className="w-8 h-8 text-primary-600" />
                ) : (
                  <Upload className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
              <div className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                <FileText className="w-4 h-4 mr-2" />
                PDF files only
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">Supported Documents:</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Certificate of Analysis (COA)</li>
          <li>• Chemical test reports</li>
          <li>• Quality assurance documents</li>
        </ul>
      </div>
    </div>
  )
}

