import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pdfRoutes from './routes/pdfRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
// Configure CORS to allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  'https://coa-pdf-processor.web.app',
  'https://coa-pdf-processor.firebaseapp.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
}));

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Create necessary directories
async function initializeDirectories() {
  const dirs = ['uploads', 'output', 'temp'];
  for (const dir of dirs) {
    const dirPath = path.join(__dirname, '..', dir);
    await fs.mkdir(dirPath, { recursive: true });
  }
  console.log('✅ Directories initialized');
}

// Routes
app.use('/api', pdfRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'COA PDF Processor API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      extractAndGenerate: 'POST /api/extract-and-generate',
      extractOnly: 'POST /api/extract-only',
      download: 'GET /api/download/:filename',
      createPayment: 'POST /api/payment/create-payment-intent',
      verifyPayment: 'POST /api/payment/verify-payment',
      paymentConfig: 'GET /api/payment/config',
      getCompanyInfo: 'GET /api/company/info',
      saveCompanyInfo: 'POST /api/company/info',
      deleteCompanyInfo: 'DELETE /api/company/info',
      createUser: 'POST /api/users/create',
      getUser: 'GET /api/users/me',
      updateUser: 'PUT /api/users/me',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.',
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
async function startServer() {
  try {
    // Initialize directories
    await initializeDirectories();

    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('\n🚀 COA PDF Processor API Server');
      console.log('================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ CORS enabled for:`);
      allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
      console.log(`✅ OpenAI API configured`);
      console.log('\n📚 API Documentation:');
      console.log(`   Health Check: GET http://localhost:${PORT}/api/health`);
      console.log(`   Extract & Generate: POST http://localhost:${PORT}/api/extract-and-generate`);
      console.log(`   Extract Only: POST http://localhost:${PORT}/api/extract-only`);
      console.log('\n================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

