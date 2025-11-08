import { useState } from 'react'
import { Building2, Upload, Image as ImageIcon, ArrowLeft } from 'lucide-react'

export default function CompanyInfoForm({ onSubmit, onBack }) {
  const [companyName, setCompanyName] = useState('')
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (file) {
      setLogo(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      name: companyName,
      logo: logoPreview
    })
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo (Optional)
          </label>
          
          {logoPreview ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-6 border-2 border-gray-200 rounded-xl bg-gray-50">
                <img
                  src={logoPreview}
                  alt="Company logo preview"
                  className="max-h-32 max-w-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setLogo(null)
                  setLogoPreview(null)
                }}
                className="btn-secondary w-full"
              >
                Remove Logo
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-all">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload logo
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, SVG up to 5MB
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          )}
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
            className="btn-primary flex-1"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}

