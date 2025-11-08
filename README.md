# COA PDF Processor

A full-stack application for processing Certificate of Analysis (COA) PDFs using AI-powered data extraction and generating standardized COA documents.

## 🚀 Live Demo

- **Frontend:** https://coa-pdf-processor.web.app
- **Backend API:** Your deployed backend URL

## ✨ Features

- 📄 **PDF Upload & Processing** - Upload COA PDFs for automated data extraction
- 🤖 **AI-Powered Extraction** - Uses GPT-4 Vision to extract data from PDF images
- 📝 **Standardized COA Generation** - Generates formatted COA documents
- 🔐 **Firebase Authentication** - Secure user authentication
- 📱 **Responsive UI** - Modern, mobile-friendly interface built with React
- ⚡ **Real-time Preview** - Preview generated PDFs before downloading

## 🏗️ Tech Stack

### Frontend
- **React** 18.2.0 - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Firebase** - Authentication & Hosting
- **React Router** - Client-side routing
- **React Dropzone** - File upload
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **OpenAI GPT-4 Vision** - AI-powered data extraction
- **PDFKit** - PDF generation
- **pdf-poppler** - PDF to image conversion
- **Multer** - File upload handling
- **Firebase Admin** - Authentication verification

## 📁 Project Structure

```
coa-pdf-processor/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/           # Authentication components
│   │   │   └── Dashboard/      # Dashboard components
│   │   ├── config/             # Firebase configuration
│   │   ├── context/            # React context (Auth)
│   │   └── services/           # API services
│   ├── firebase.json           # Firebase hosting config
│   ├── .firebaserc            # Firebase project config
│   └── package.json
│
└── backend/                     # Node.js backend
    ├── src/
    │   ├── config/             # Configuration files
    │   ├── middleware/         # Express middleware
    │   ├── routes/             # API routes
    │   └── services/           # Business logic
    │       ├── openaiService.js
    │       ├── pdfGeneratorService.js
    │       └── pdfToImageService.js
    ├── uploads/                # Temporary PDF uploads
    ├── output/                 # Generated PDFs
    ├── temp/                   # Temporary image files
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- OpenAI API key
- Poppler (for PDF to image conversion)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/shashanksGitHub/coa-pdf-processor.git
cd coa-pdf-processor
```

2. **Install Frontend Dependencies**

```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**

```bash
cd ../backend
npm install
```

### Configuration

#### Frontend Setup

1. Create `.env` file in the `frontend` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API URL
VITE_API_URL=http://localhost:5001
```

#### Backend Setup

1. Create `.env` file in the `backend` directory:

```env
PORT=5001
OPENAI_API_KEY=your-openai-api-key

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

2. Install Poppler (required for PDF to image conversion):

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**Windows:**
Download from https://github.com/oschwartz10612/poppler-windows/releases/

## 🏃 Running the Application

### Development Mode

1. **Start Backend Server**

```bash
cd backend
npm start
```

Backend will run on `http://localhost:5001`

2. **Start Frontend Dev Server**

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

### Production Mode

#### Deploy Frontend to Firebase

```bash
cd frontend
npm run deploy
```

#### Deploy Backend

Deploy your backend to your preferred hosting service (Heroku, Railway, AWS, etc.)

## 📚 API Documentation

### Endpoints

#### `POST /api/extract-and-generate`
Extract data from PDF and generate standardized COA

**Request:**
- `pdfFile`: PDF file (multipart/form-data)
- `companyInfo`: JSON object with company information

**Response:**
```json
{
  "success": true,
  "extractedData": { ... },
  "generatedPdfUrl": "http://...",
  "filename": "COA_ProductName_timestamp.pdf"
}
```

#### `POST /api/extract-only`
Extract data from PDF only (no generation)

**Request:**
- `pdfFile`: PDF file (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "extractedData": { ... }
}
```

#### `GET /api/download/:filename`
Download generated PDF

#### `GET /api/health`
Health check endpoint

## 🔐 Authentication

The app uses Firebase Authentication. Users must be authenticated to access the dashboard and API endpoints.

## 🎨 Features in Detail

### PDF Upload
- Drag & drop interface
- File validation
- Progress indicators

### AI Data Extraction
- Converts PDF pages to images
- Uses GPT-4 Vision to analyze and extract:
  - Product information
  - Test parameters and results
  - Batch details
  - Company information

### PDF Generation
- Standardized COA format
- Professional layout
- Company branding
- Parameter tables with specifications

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Shashank** - [GitHub](https://github.com/shashanksGitHub)

## 🙏 Acknowledgments

- OpenAI for GPT-4 Vision API
- Firebase for authentication and hosting
- React and Vite communities
- All contributors and supporters

## 📧 Contact

For any inquiries, please reach out through GitHub issues.

---

**Made with ❤️ for better COA processing**

