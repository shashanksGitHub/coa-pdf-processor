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

/**
 * Convert PDF to images for GPT-4 Vision processing
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<Array<string>>} Array of base64 encoded images
 */
export async function convertPDFToImages(pdfPath) {
  try {
    const tempDir = path.join(__dirname, '../../temp', Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });

    // Use direct pdftocairo command (much faster and more reliable)
    const outputPrefix = path.join(tempDir, 'page');
    const command = `pdftocairo -jpeg -singlefile -scale-to 800 "${pdfPath}" "${outputPrefix}"`;

    console.log(`Converting PDF first page to image using pdftocairo...`);
    
    try {
      const { stdout, stderr } = await execPromise(command, { timeout: 10000 }); // 10 second timeout
      if (stderr) console.log('Conversion warnings:', stderr);
      console.log(`✅ PDF conversion complete`);
    } catch (error) {
      if (error.killed) {
        throw new Error('PDF conversion timeout after 10 seconds');
      }
      throw error;
    }

    // Read all generated images
    const files = await fs.readdir(tempDir);
    const imageFiles = files.filter(f => f.endsWith('.jpg'));
    
    if (imageFiles.length === 0) {
      throw new Error('No images were generated from PDF - conversion may have failed');
    }
    
    console.log(`Generated ${imageFiles.length} images`);

    // Convert images to base64
    const base64Images = [];
    for (const file of imageFiles.sort()) {
      const imagePath = path.join(tempDir, file);
      const imageBuffer = await fs.readFile(imagePath);
      
      // Compress image to reduce size (quality 70 for faster processing)
      const image = await Jimp.read(imageBuffer);
      const compressedBuffer = await image
        .quality(70)
        .resize(1200, Jimp.AUTO) // Resize to max 1200px width
        .getBufferAsync(Jimp.MIME_JPEG);
      
      const base64 = compressedBuffer.toString('base64');
      base64Images.push(base64);
      
      console.log(`Compressed image ${file}: ${(compressedBuffer.length / 1024).toFixed(0)}KB`);
    }

    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });

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

