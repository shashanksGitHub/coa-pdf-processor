import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import pdf from 'pdf-parse';
import Jimp from 'jimp';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Maximum pages to process (to control API costs)
const MAX_PAGES = 10;

/**
 * Convert PDF to images for GPT-4 Vision processing
 * Converts ALL pages (up to MAX_PAGES limit)
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<Array<string>>} Array of base64 encoded images
 */
export async function convertPDFToImages(pdfPath) {
  try {
    const tempDir = path.join(__dirname, '../../temp', Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });

    // First, get the page count
    let pageCount = 1;
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdf(dataBuffer);
      pageCount = pdfData.numpages;
      console.log(`📄 PDF has ${pageCount} pages`);
    } catch (e) {
      console.log('⚠️ Could not determine page count, processing all pages');
    }

    // Limit pages to prevent excessive API costs
    const pagesToProcess = Math.min(pageCount, MAX_PAGES);
    if (pageCount > MAX_PAGES) {
      console.log(`⚠️ Limiting to first ${MAX_PAGES} pages (PDF has ${pageCount} pages)`);
    }

    // Use pdftocairo to convert ALL pages (remove -singlefile flag)
    const outputPrefix = path.join(tempDir, 'page');
    // -jpeg: output format
    // -r 150: resolution (good balance of quality and size)
    // -l [last]: limit to last page number
    const command = `pdftocairo -jpeg -r 150 -l ${pagesToProcess} "${pdfPath}" "${outputPrefix}"`;

    console.log(`🔄 Converting ${pagesToProcess} PDF page(s) to images...`);
    
    try {
      // Increase timeout for multi-page PDFs (10 seconds per page)
      const timeout = Math.max(30000, pagesToProcess * 10000);
      const { stdout, stderr } = await execPromise(command, { timeout });
      if (stderr) console.log('Conversion warnings:', stderr);
      console.log(`✅ PDF conversion complete`);
    } catch (error) {
      if (error.killed) {
        throw new Error(`PDF conversion timeout after processing`);
      }
      throw error;
    }

    // Read all generated images
    const files = await fs.readdir(tempDir);
    const imageFiles = files.filter(f => f.endsWith('.jpg'));
    
    if (imageFiles.length === 0) {
      throw new Error('No images were generated from PDF - conversion may have failed');
    }
    
    console.log(`✅ Generated ${imageFiles.length} images from ${pagesToProcess} pages`);

    // Sort files naturally (page-1.jpg, page-2.jpg, ..., page-10.jpg)
    const sortedFiles = imageFiles.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });

    // Convert images to base64
    const base64Images = [];
    for (const file of sortedFiles) {
      const imagePath = path.join(tempDir, file);
      const imageBuffer = await fs.readFile(imagePath);
      
      // Compress image to reduce size for API
      const image = await Jimp.read(imageBuffer);
      const compressedBuffer = await image
        .quality(70)
        .resize(1200, Jimp.AUTO) // Resize to max 1200px width
        .getBufferAsync(Jimp.MIME_JPEG);
      
      const base64 = compressedBuffer.toString('base64');
      base64Images.push(base64);
      
      console.log(`  📸 ${file}: ${(compressedBuffer.length / 1024).toFixed(0)}KB`);
    }

    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });

    console.log(`✅ Total: ${base64Images.length} images ready for Vision API`);
    return base64Images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}

/**
 * Extract text from PDF (fallback method)
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdf(dataBuffer);
    
    console.log(`📊 PDF Info: ${data.numpages} pages, ${data.text.length} characters extracted`);
    console.log(`First 200 chars: ${data.text.substring(0, 200)}`);
    
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

