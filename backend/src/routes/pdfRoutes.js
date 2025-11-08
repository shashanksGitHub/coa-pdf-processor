import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { convertPDFToImages, extractTextFromPDF } from '../services/pdfToImageService.js';
import { extractDataWithGPTVision, extractDataWithGPT4Text } from '../services/openaiService.js';
import { generateFormattedPDF } from '../services/pdfGeneratorService.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

/**
 * POST /api/extract-and-generate
 * Upload PDF, extract data with GPT-4 Vision, and generate formatted PDF
 */
router.post('/extract-and-generate', optionalAuth, upload.single('pdfFile'), async (req, res) => {
  let pdfPath = null;
  let generatedPdfPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded',
      });
    }

    console.log(`\n🔄 Processing PDF: ${req.file.originalname}`);
    pdfPath = req.file.path;

    // Parse company info from request body
    let companyInfo = {};
    if (req.body.companyInfo) {
      try {
        companyInfo = JSON.parse(req.body.companyInfo);
      } catch (e) {
        console.warn('Invalid companyInfo JSON, using defaults');
      }
    }

    let extractedData = null;

    // Step 1: Try text extraction first (fast & cheap)
    try {
      console.log('📄 Attempting text extraction...');
      const pdfText = await extractTextFromPDF(pdfPath);
      
      if (pdfText && pdfText.trim().length > 100) {
        console.log(`✅ Extracted ${pdfText.length} characters of text`);
        console.log('🤖 Sending to GPT-4 Turbo...');
        extractedData = await extractDataWithGPT4Text(pdfText);
        console.log('✅ Text-based extraction successful! ⚡');
      } else {
        throw new Error('Insufficient text - using Vision');
      }
    } catch (textError) {
      // Step 2: Fallback to Vision
      console.log('🔄 Using GPT-4 Vision fallback...');
      console.log('📸 Converting PDF to images...');
      const base64Images = await convertPDFToImages(pdfPath);
      console.log(`✅ Converted to ${base64Images.length} images`);
      console.log('🤖 Extracting data with GPT-4 Vision...');
      extractedData = await extractDataWithGPTVision(base64Images);
      console.log('✅ Vision extraction complete');
    }

    // Step 3: Generate formatted PDF
    console.log('📄 Generating formatted PDF...');
    generatedPdfPath = await generateFormattedPDF(extractedData, companyInfo);
    console.log('✅ Formatted PDF generated');

    // Read the generated PDF as buffer for sending
    const pdfBuffer = await fs.readFile(generatedPdfPath);
    
    // Log PDF size for debugging
    console.log(`📊 Generated PDF size: ${(pdfBuffer.length / 1024).toFixed(2)}KB`);
    
    const base64Pdf = pdfBuffer.toString('base64');

    // Cleanup uploaded file
    await fs.unlink(pdfPath);

    // Return both extracted data and generated PDF
    res.json({
      success: true,
      data: extractedData,
      generatedPdf: {
        filename: path.basename(generatedPdfPath),
        base64: base64Pdf,
        downloadUrl: `/api/download/${path.basename(generatedPdfPath)}`,
      },
      message: 'PDF processed successfully',
    });

    console.log('✅ Request completed successfully\n');
  } catch (error) {
    console.error('❌ Error processing PDF:', error);

    // Cleanup files on error
    if (pdfPath) {
      try {
        await fs.unlink(pdfPath);
      } catch (e) {
        console.error('Error cleaning up uploaded file:', e);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process PDF',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * POST /api/extract-only
 * Upload PDF and extract data without generating new PDF
 * Uses hybrid approach: Text extraction (fast) with Vision fallback (slow)
 */
router.post('/extract-only', optionalAuth, upload.single('pdfFile'), async (req, res) => {
  let pdfPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded',
      });
    }

    console.log(`\n🔄 Processing: ${req.file.originalname}`);
    pdfPath = req.file.path;

    let extractedData = null;
    let extractionMethod = 'unknown';

    // STEP 1: Try text extraction first (fast & cheap)
    try {
      console.log('📄 Attempting text extraction...');
      const pdfText = await extractTextFromPDF(pdfPath);
      
      // Check if we got meaningful text (> 50 characters indicates real content)
      if (pdfText && pdfText.trim().length > 50) {
        console.log(`✅ Extracted ${pdfText.length} characters of text`);
        console.log('🤖 Sending to GPT-4 Turbo for analysis...');
        
        extractedData = await extractDataWithGPT4Text(pdfText);
        extractionMethod = 'gpt-4-turbo-text';
        
        console.log('✅ Text-based extraction successful! ⚡ Fast & cheap');
      } else {
        throw new Error('Insufficient text extracted - likely an image-based PDF');
      }
    } catch (textError) {
      // STEP 2: Fallback to Vision (slower but works with scanned PDFs)
      console.log('⚠️  Text extraction failed:', textError.message);
      console.log('🔄 Falling back to GPT-4 Vision (slower but works with images)...');
      
      console.log('📸 Converting PDF to images...');
      const base64Images = await convertPDFToImages(pdfPath);
      console.log(`✅ Converted to ${base64Images.length} images`);
      
      console.log('🤖 Analyzing with GPT-4 Vision...');
      extractedData = await extractDataWithGPTVision(base64Images);
      extractionMethod = 'gpt-4-vision';
      
      console.log('✅ Vision-based extraction successful! 🖼️');
    }

    // Cleanup uploaded file
    await fs.unlink(pdfPath);

    res.json({
      success: true,
      data: extractedData,
      method: extractionMethod,
      message: 'Data extraction complete',
    });

    console.log(`✅ Extraction completed successfully using ${extractionMethod}\n`);
  } catch (error) {
    console.error('❌ Error extracting data:', error);

    if (pdfPath) {
      try {
        await fs.unlink(pdfPath);
      } catch (e) {
        console.error('Error cleaning up uploaded file:', e);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract data from PDF',
    });
  }
});

/**
 * GET /api/download/:filename
 * Download a generated PDF file
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), 'output', filename);

    // Check if file exists
    await fs.access(filepath);

    // Send file
    res.download(filepath, filename, async (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download file',
          });
        }
      }

      // Optional: Delete file after download
      // await fs.unlink(filepath);
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(404).json({
      success: false,
      error: 'File not found',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'COA PDF Processor API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

