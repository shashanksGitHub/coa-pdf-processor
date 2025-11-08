# COA PDF Processor

An intelligent web application that processes Certificate of Analysis (COA) PDFs using **GPT-4 Vision** to extract structured data and generate beautifully formatted output PDFs with company branding.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)

## ✨ Features

- 🤖 **AI-Powered Extraction** - Uses GPT-4 Vision to intelligently extract data from COAs
- 📄 **PDF Processing** - Handles both text-based and scanned/image-based PDFs
- 🎨 **Custom Branding** - Add company logo and information to generated PDFs
- 🔒 **Secure Authentication** - Firebase authentication with protected routes
- 📱 **Responsive Design** - Beautiful UI built with React and Tailwind CSS
- ⚡ **Fast Processing** - Efficient backend API with Express.js

## 🏗️ Architecture

This project consists of two main parts:

### Frontend (React + Vite)
- Modern React application with Vite
- Drag-and-drop PDF upload
- Step-by-step wizard interface
- Real-time preview of extracted data
- Tailwind CSS for styling

### Backend (Node.js + Express)
- RESTful API for PDF processing
- GPT-4 Vision integration for data extraction
- PDF generation with PDFKit
- Firebase authentication middleware
- File upload handling with Multer

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenAI API Key (for GPT-4 Vision)
- Firebase project (for authentication)
- Poppler utils (for PDF processing)

### Installing Poppler

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**Windows:**
Download from: http://blog.alivate.com.au/poppler-windows/

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd coa-pdf-processor
```

### 2. Set Up Frontend

```bash
# Install frontend dependencies
npm install

# Create .env file in root directory
echo "VITE_API_URL=http://localhost:5000" > .env

# Start frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create .env file with your credentials
cp .env.example .env
# Edit .env and add your OpenAI API key and other credentials

# Start backend server
npm run dev
```

The backend API will run on `http://localhost:5000`

### 4. Configure Environment Variables

**Frontend `.env`:**
```bash
VITE_API_URL=http://localhost:5000
```

**Backend `.env`:**
```bash
OPENAI_API_KEY=your-openai-api-key-here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=10485760
```

See `backend/.env.example` for full configuration options.

## 📖 Usage

1. **Upload PDF**: Drag and drop or click to upload a COA PDF
2. **Data Extraction**: AI automatically extracts structured data using GPT-4 Vision
3. **Company Info**: Add your company name and logo (optional)
4. **Generate PDF**: Download a beautifully formatted PDF with extracted data

## 🔧 Development

### Frontend Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
```

## 📦 Project Structure

```
coa-pdf-processor/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── Auth/                 # Authentication components
│   │   └── Dashboard/            # Dashboard components
│   ├── config/                   # Firebase configuration
│   ├── context/                  # React context providers
│   ├── services/                 # API service layer
│   └── utils/                    # Utility functions
├── backend/                      # Backend source
│   ├── src/
│   │   ├── server.js             # Express server
│   │   ├── config/               # Configuration
│   │   ├── services/             # Business logic
│   │   ├── middleware/           # Express middleware
│   │   └── routes/               # API routes
│   ├── uploads/                  # Temporary uploads
│   └── output/                   # Generated PDFs
├── public/                       # Static assets
└── README.md
```

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/extract-and-generate` | POST | Extract data and generate PDF |
| `/api/extract-only` | POST | Extract data without generating PDF |
| `/api/download/:filename` | GET | Download generated PDF |

## 💰 Cost Estimates

**OpenAI API (GPT-4o with Vision):**
- ~$0.05-0.10 per PDF page
- Average 2-page COA: ~$0.10-0.20
- 1000 PDFs/month: ~$100-200

**Hosting:**
- Frontend: Free (Vercel/Netlify)
- Backend: $5-10/month (Railway/Render)

## 🚢 Deployment

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Backend Deployment (Render)

1. Create new Web Service on Render.com
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Add environment variables
5. Deploy

## 🔒 Security

- API key is stored securely on backend (never exposed to frontend)
- Firebase authentication for user management
- CORS protection enabled
- File size limits enforced
- Automatic cleanup of temporary files

## 🐛 Troubleshooting

**PDF conversion fails:**
- Ensure poppler-utils is installed
- Check PDF file is not corrupted

**OpenAI API errors:**
- Verify your API key is correct
- Check you have sufficient credits
- Ensure OPENAI_API_KEY is set in backend .env

**CORS errors:**
- Verify CORS_ORIGIN in backend .env matches frontend URL
- Check backend is running on correct port

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-4 Vision API
- Firebase for authentication services
- React and Vite communities
- Express.js team

## 📧 Support

For support, email your-email@example.com or open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, and GPT-4 Vision**
