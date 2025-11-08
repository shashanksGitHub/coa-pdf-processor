import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pdfRoutes from './routes/pdfRoutes.js';
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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

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
        error: 'File too large. Maximum size is 10MB.',
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
      console.log(`✅ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
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

