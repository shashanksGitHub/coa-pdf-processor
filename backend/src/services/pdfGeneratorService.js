import PDFDocument from 'pdfkit';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch image from URL and return as buffer
 * @param {string} url - The image URL
 * @returns {Promise<Buffer>} Image buffer
 */
async function fetchImageAsBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching image from URL:', error);
    throw error;
  }
}

/**
 * Get logo buffer from base64 string or URL
 * @param {string} logo - Base64 string or URL
 * @returns {Promise<Buffer|null>} Logo buffer or null if failed
 */
async function getLogoBuffer(logo) {
  if (!logo) return null;
  
  try {
    // Check if it's a URL (starts with http/https)
    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      console.log('📷 Fetching logo from URL...');
      return await fetchImageAsBuffer(logo);
    }
    
    // Check if it's a base64 data URL
    if (logo.startsWith('data:image/')) {
      console.log('📷 Decoding logo from base64...');
      return Buffer.from(logo.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }
    
    // Assume it's raw base64
    console.log('📷 Decoding logo from raw base64...');
    return Buffer.from(logo, 'base64');
  } catch (error) {
    console.error('Error processing logo:', error);
    return null;
  }
}

/**
 * Get image dimensions from buffer (supports PNG, JPEG, GIF)
 * @param {Buffer} buffer - Image buffer
 * @returns {{ width: number, height: number } | null} Image dimensions or null
 */
function getImageDimensions(buffer) {
  try {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      // PNG: width at offset 16-19, height at offset 20-23 (big endian)
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      console.log(`📐 PNG dimensions: ${width}x${height}`);
      return { width, height };
    }
    
    // JPEG signature: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        // SOF0 (0xC0) through SOF2 (0xC2) contain dimensions
        if (marker >= 0xC0 && marker <= 0xC2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          console.log(`📐 JPEG dimensions: ${width}x${height}`);
          return { width, height };
        }
        // Skip marker segment
        const segmentLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + segmentLength;
      }
    }
    
    // GIF signature: 47 49 46 38 (GIF8)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      console.log(`📐 GIF dimensions: ${width}x${height}`);
      return { width, height };
    }
    
    console.log('⚠️ Unknown image format, using defaults');
    return null;
  } catch (error) {
    console.error('Error reading image dimensions:', error);
    return null;
  }
}

/**
 * Calculate logo dimensions preserving aspect ratio
 * @param {Buffer} logoBuffer - The logo image buffer
 * @param {number} maxWidth - Maximum width allowed
 * @param {number} maxHeight - Maximum height allowed
 * @returns {{ width: number, height: number }} Calculated dimensions
 */
function calculateLogoDimensions(logoBuffer, maxWidth = 150, maxHeight = 80) {
  const dimensions = getImageDimensions(logoBuffer);
  
  if (!dimensions) {
    // Fallback to default dimensions if we can't read the image
    return { width: 100, height: 70 };
  }
  
  const { width: origWidth, height: origHeight } = dimensions;
  const aspectRatio = origWidth / origHeight;
  
  let finalWidth = origWidth;
  let finalHeight = origHeight;
  
  // Scale down if exceeds max dimensions while preserving aspect ratio
  if (finalWidth > maxWidth) {
    finalWidth = maxWidth;
    finalHeight = finalWidth / aspectRatio;
  }
  
  if (finalHeight > maxHeight) {
    finalHeight = maxHeight;
    finalWidth = finalHeight * aspectRatio;
  }
  
  console.log(`📐 Logo scaled: ${origWidth}x${origHeight} → ${Math.round(finalWidth)}x${Math.round(finalHeight)}`);
  return { width: Math.round(finalWidth), height: Math.round(finalHeight) };
}

// Default theme colors
const DEFAULT_THEME = {
  primaryColor: '#1A376B',  // Navy blue
  secondaryColor: '#568259', // Green
};

// Layout configurations
const LAYOUTS = {
  classic: {
    headerStyle: 'banner',      // Full-width top banner
    logoPosition: 'center',      // Centered logo
    textAlign: 'center',         // Center-aligned text
    tableBorderWidth: 2,         // Bold borders
    tableHeaderStyle: 'filled',  // Filled header row
  },
  modern: {
    headerStyle: 'minimal',      // Thin accent line
    logoPosition: 'left',        // Left-aligned logo
    textAlign: 'left',           // Left-aligned text
    tableBorderWidth: 1,         // Thin borders
    tableHeaderStyle: 'filled',  // Filled header
  },
  minimal: {
    headerStyle: 'none',         // No header decoration
    logoPosition: 'center',      // Centered logo
    textAlign: 'center',         // Center text
    tableBorderWidth: 0.5,       // Very thin borders
    tableHeaderStyle: 'outline', // Just outline, no fill
  },
};

/**
 * Generate a clean, professional filename for the PDF
 * Format: CompanyName_ProductName_LotNo_COA.pdf (or shorter variants)
 */
function generateFileName(extractedData, companyInfo) {
  // Helper to sanitize text for filename (remove special chars, limit length)
  const sanitize = (text, maxLen = 20) => {
    if (!text) return '';
    return text
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')            // Replace spaces with hyphens
      .substring(0, maxLen)            // Limit length
      .replace(/-+$/, '');             // Remove trailing hyphens
  };

  const parts = [];

  // Add company name (shortened)
  if (companyInfo.name) {
    const companyShort = sanitize(companyInfo.name, 15);
    if (companyShort) parts.push(companyShort);
  }

  // Add product name (shortened)
  if (extractedData.productName) {
    const productShort = sanitize(extractedData.productName, 25);
    if (productShort) parts.push(productShort);
  }

  // Add lot or batch number
  const lotOrBatch = extractedData.lotNo || extractedData.batchNo;
  if (lotOrBatch) {
    const lotShort = sanitize(lotOrBatch, 15);
    if (lotShort) parts.push(lotShort);
  }

  // Always add COA suffix
  parts.push('COA');

  // If no meaningful parts, use fallback with short timestamp
  if (parts.length === 1) {
    const shortId = Date.now().toString(36).toUpperCase();
    return `COA_${shortId}.pdf`;
  }

  return `${parts.join('_')}.pdf`;
}

/**
 * Draw watermark on a PDF page (for non-Pro users)
 * @param {PDFDocument} doc - The PDFKit document
 * @param {number} pageWidth - Page width
 * @param {number} pageHeight - Page height
 */
function drawWatermark(doc, pageWidth, pageHeight) {
  doc.save();
  
  // Semi-transparent gray watermark (darker for better visibility)
  doc.fillColor('#999999')
    .opacity(0.25);
  
  // Draw diagonal watermark text multiple times
  const watermarkText = 'COA Processor - Free Version';
  doc.fontSize(24)
    .font('Helvetica-Bold');
  
  // Rotate and position watermarks diagonally across the page
  const positions = [
    { x: pageWidth * 0.3, y: pageHeight * 0.3 },
    { x: pageWidth * 0.5, y: pageHeight * 0.5 },
    { x: pageWidth * 0.7, y: pageHeight * 0.7 },
  ];
  
  positions.forEach(({ x, y }) => {
    doc.save();
    doc.translate(x, y);
    doc.rotate(-45);
    doc.text(watermarkText, -100, 0, { width: 300, align: 'center' });
    doc.restore();
  });
  
  doc.restore();
  // Reset opacity for subsequent content
  doc.opacity(1);
}

/**
 * Draw custom header on PDF (for Pro users)
 * This replaces the company name and address section with a custom header image
 * @param {PDFDocument} doc - The PDFKit document
 * @param {Buffer} headerBuffer - The custom header image buffer
 * @param {number} pageWidth - Page width
 * @param {number} margin - Page margin
 * @param {number} startY - Starting Y position
 * @returns {number} New Y position after header
 */
function drawCustomHeader(doc, headerBuffer, pageWidth, margin, startY) {
  try {
    // Get header dimensions
    const dimensions = getImageDimensions(headerBuffer);
    const maxWidth = pageWidth - (2 * margin);
    const maxHeight = 120; // Maximum header height
    
    let headerWidth = maxWidth;
    let headerHeight = 80; // Default height
    
    if (dimensions) {
      const aspectRatio = dimensions.width / dimensions.height;
      headerHeight = Math.min(maxWidth / aspectRatio, maxHeight);
      headerWidth = headerHeight * aspectRatio;
      
      // If width exceeds max, scale down
      if (headerWidth > maxWidth) {
        headerWidth = maxWidth;
        headerHeight = headerWidth / aspectRatio;
      }
    }
    
    // Center the header
    const headerX = (pageWidth - headerWidth) / 2;
    
    doc.image(headerBuffer, headerX, startY, { 
      width: headerWidth, 
      height: headerHeight
    });
    
    console.log(`✅ Custom header applied: ${Math.round(headerWidth)}x${Math.round(headerHeight)}`);
    return startY + headerHeight + 15; // Return new Y position with padding
  } catch (error) {
    console.error('Error drawing custom header:', error);
    return startY + 20; // Fallback position
  }
}

/**
 * Generate a formatted COA PDF with company branding
 * @param {Object} extractedData - Data extracted from the original PDF
 * @param {Object} companyInfo - Company name, logo, theme, and layout
 * @param {Object} userInfo - User info including isPro status
 * @returns {Promise<string>} Path to the generated PDF file
 */
export async function generateFormattedPDF(extractedData, companyInfo = {}, userInfo = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create output directory if it doesn't exist
      const outputDir = path.join(__dirname, '../../output');
      await fsPromises.mkdir(outputDir, { recursive: true });

      const fileName = generateFileName(extractedData, companyInfo);
      const outputPath = path.join(outputDir, fileName);

      // Get theme colors (use custom or defaults)
      const theme = {
        primaryColor: companyInfo.theme?.primaryColor || DEFAULT_THEME.primaryColor,
        secondaryColor: companyInfo.theme?.secondaryColor || DEFAULT_THEME.secondaryColor,
      };
      
      // Get layout configuration
      const layoutId = companyInfo.layout || 'classic';
      const layout = LAYOUTS[layoutId] || LAYOUTS.classic;
      
      // Check Pro status
      const isPro = userInfo.isPro || false;
      
      console.log(`📄 Generating PDF with theme: ${theme.primaryColor}/${theme.secondaryColor}, layout: ${layoutId}, isPro: ${isPro}`);

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = doc.pipe(fs.createWriteStream(outputPath));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      let yPosition = margin;

      // Add watermark for free users (Pro users don't get watermark)
      if (!isPro) {
        drawWatermark(doc, pageWidth, pageHeight);
      }

      // Check if custom header is provided (Pro feature)
      // Custom header REPLACES company name, address, logo, and header style
      const hasCustomHeader = isPro && companyInfo.customBackground;
      
      if (hasCustomHeader) {
        // Use custom header - this replaces ALL header elements
        try {
          const headerBuffer = await getLogoBuffer(companyInfo.customBackground);
          if (headerBuffer) {
            yPosition = drawCustomHeader(doc, headerBuffer, pageWidth, margin, yPosition);
            console.log('📋 Using custom header - skipping company name/address');
          } else {
            console.warn('⚠️ Custom header buffer is null, falling back to normal header');
            yPosition = 60;
          }
        } catch (error) {
          console.error('Error applying custom header:', error);
          yPosition = 60;
        }
      } else {
        // Normal header flow - use layout style, logo, company name, address
        
        // Header style based on layout (isolated graphics state)
        doc.save();
        if (layout.headerStyle === 'banner') {
          // Full-width banner (Classic)
          doc.rect(0, 0, pageWidth, 40).fill(theme.secondaryColor);
          yPosition = 60;
        } else if (layout.headerStyle === 'minimal') {
          // Thin accent line (Modern)
          doc.rect(0, 0, pageWidth, 8).fill(theme.secondaryColor);
          doc.rect(0, 8, pageWidth, 3).fill(theme.primaryColor);
          yPosition = 30;
        } else {
          // No header (Minimal)
          yPosition = 30;
        }
        doc.restore();

        // Add company logo if provided (supports both base64 and URL)
        const logoSource = companyInfo.logo || companyInfo.logoUrl;
        if (logoSource) {
          try {
            const logoBuffer = await getLogoBuffer(logoSource);
            
            if (logoBuffer) {
              // Calculate dimensions preserving original aspect ratio
              const logoDimensions = calculateLogoDimensions(logoBuffer, 150, 80);
              
              // Logo position based on layout
              let logoX;
              if (layout.logoPosition === 'left') {
                logoX = margin;
              } else {
                logoX = (pageWidth - logoDimensions.width) / 2;
              }
              
              doc.image(logoBuffer, logoX, yPosition, { 
                width: logoDimensions.width, 
                height: logoDimensions.height 
              });
              yPosition += logoDimensions.height + 10;
            } else {
              console.warn('⚠️ Logo buffer is null, skipping logo');
              yPosition += 20;
            }
          } catch (error) {
            console.error('Error adding logo:', error);
            yPosition += 20;
          }
        } else {
          yPosition += 20;
        }

        // Company Name (if provided) - explicit color reset
        if (companyInfo.name) {
          doc.fillColor(theme.primaryColor)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(companyInfo.name, margin, yPosition, {
              align: layout.textAlign,
              width: pageWidth - 2 * margin,
            });
          yPosition += 20;
        }

        // Company Address (if provided) - calculate actual height for multiline
        if (companyInfo.address) {
          doc.fillColor('#333333')
            .fontSize(9)
            .font('Helvetica');
          
          // Calculate the height of the address text
          const addressHeight = doc.heightOfString(companyInfo.address, {
            width: pageWidth - 2 * margin,
          });
          
          doc.text(companyInfo.address, margin, yPosition, {
              align: layout.textAlign,
              width: pageWidth - 2 * margin,
            });
          
          // Add actual text height plus some padding
          yPosition += addressHeight + 10;
        }
      }

      // Text alignment for content below header
      const textAlign = layout.textAlign;

      // Add spacing before title
      yPosition += 10;

      // Title - Certificate of Analysis (explicit color reset)
      doc.fillColor(theme.primaryColor)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Certificate of Analysis', margin, yPosition, {
          align: textAlign,
          width: pageWidth - 2 * margin,
        });
      yPosition += 30;

      // Product Name (explicit color reset)
      doc.fillColor(theme.primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Product Name: ${extractedData.productName || 'Product Name Not Found'}`, margin, yPosition, {
          align: textAlign,
          width: pageWidth - 2 * margin,
        });
      yPosition += 20;

      // Add additional info section (compact)
      doc.fontSize(8)
        .fillColor('#000000')
        .font('Helvetica');

      const truncate = (text, maxLength = 50) => {
        if (!text) return '';
        const str = String(text);
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
      };

      const infoLines = [];
      
      if (extractedData.lotNo) {
        infoLines.push(`LOT NO: ${truncate(extractedData.lotNo, 25)}`);
      }
      if (extractedData.batchNo && !extractedData.lotNo) {
        infoLines.push(`BATCH NO: ${truncate(extractedData.batchNo, 25)}`);
      }
      if (extractedData.date) {
        infoLines.push(`DATE: ${truncate(extractedData.date, 25)}`);
      }

      if (infoLines.length > 0) {
        const infoText = infoLines.join('  |  ');
        doc.text(infoText, margin, yPosition, {
          align: 'center',
          width: pageWidth - 2 * margin,
        });
        yPosition += 12;
      }

      if (extractedData.supplier) {
        doc.fontSize(7.5)
          .text(`Supplier: ${truncate(extractedData.supplier, 70)}`, margin, yPosition, {
            align: 'center',
            width: pageWidth - 2 * margin,
          });
        yPosition += 10;
      }

      yPosition += 5;

      // Draw professional table with theme and layout
      const finalYPosition = drawProfessionalTable(doc, extractedData, pageWidth, pageHeight, margin, yPosition, theme, layout);

      // Check page count before footer
      let pageCount = doc.bufferedPageRange().count;
      console.log(`📄 Before footer: ${pageCount} page(s), final Y position: ${finalYPosition}`);

      // CRITICAL: Do not draw footer - it's creating a second page
      // Just end the document here
      
      console.log(`📄 Ending PDF without footer to prevent page 2`);
      
      // Finalize PDF immediately without footer
      doc.end();

      stream.on('finish', () => {
        console.log(`✅ PDF generated successfully: ${fileName}`);
        resolve(outputPath);
      });

      stream.on('error', (err) => {
        console.error('Error writing PDF:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

/**
 * Draw table header
 * @param {Object} doc - PDFKit document
 * @param {number} yPosition - Starting Y position
 * @param {Object} params - Table parameters
 * @returns {number} New Y position after header
 */
function drawTableHeader(doc, yPosition, { margin, tableWidth, col1Width, col2Width, col3Width, headerHeight, headerBg, borderColor, layout }) {
  doc.save();
  
  if (layout.tableHeaderStyle === 'filled') {
    // Filled header with theme color
    doc.rect(margin, yPosition, tableWidth, headerHeight)
      .fillAndStroke(headerBg, headerBg);
    doc.fillColor('#FFFFFF');
  } else {
    // Outline only (minimal)
    doc.rect(margin, yPosition, tableWidth, headerHeight)
      .stroke(borderColor);
    doc.fillColor(borderColor);
  }

  doc.fontSize(11)
    .font('Helvetica-Bold')
    .text('Item', margin + 10, yPosition + 15, { width: col1Width - 20, align: 'center' })
    .text('Standard', margin + col1Width + 10, yPosition + 15, { width: col2Width - 20, align: 'center' })
    .text('Result', margin + col1Width + col2Width + 10, yPosition + 15, { width: col3Width - 20, align: 'center' });

  doc.restore();
  return yPosition + headerHeight;
}

/**
 * Draw professional bordered table with clean design
 * Supports multi-page tables when specifications exceed one page
 * @param {Object} theme - Theme colors { primaryColor, secondaryColor }
 * @param {Object} layout - Layout configuration
 */
function drawProfessionalTable(doc, extractedData, pageWidth, pageHeight, margin, startY, theme, layout) {
  let yPosition = startY;

  // Table styling - 3 columns with cleaner design
  const tableWidth = pageWidth - 2 * margin;
  const col1Width = tableWidth * 0.35;  // Item
  const col2Width = tableWidth * 0.325; // Standard
  const col3Width = tableWidth * 0.325; // Result

  const rowHeight = 28;  // Compact rows
  const headerHeight = 32; // Compact header

  // Use theme colors for borders
  const borderColor = theme.primaryColor;
  const headerBg = theme.primaryColor;
  const borderWidth = layout.tableBorderWidth;

  // Table header params for reuse across pages
  const headerParams = { margin, tableWidth, col1Width, col2Width, col3Width, headerHeight, headerBg, borderColor, layout };

  // Helper function to clean special characters
  function cleanText(text) {
    if (!text) return '';
    return String(text)
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/℃/g, 'degC')
      .replace(/±/g, '+/-')
      .replace(/°/g, ' deg');
  }

  // Maximum Y position before needing a new page (leave space for footer)
  const maxYPosition = pageHeight - 60;

  // Determine if we have structured specifications
  if (extractedData.specifications && extractedData.specifications.length > 0) {
    // Draw initial table header
    yPosition = drawTableHeader(doc, yPosition, headerParams);

    // Table rows with clean borders
    doc.lineWidth(borderWidth)
      .strokeColor(borderColor)
      .fillColor('#000000')
      .font('Helvetica');

    console.log(`📊 Drawing table with ${extractedData.specifications.length} specifications`);
    
    extractedData.specifications.forEach((spec, index) => {
      // Check if we need a new page
      if (yPosition + rowHeight > maxYPosition) {
        console.log(`📄 Adding new page for row ${index + 1}`);
        doc.addPage();
        yPosition = margin;
        
        // Redraw table header on new page
        yPosition = drawTableHeader(doc, yPosition, headerParams);
        
        // Reset drawing state for rows
        doc.lineWidth(borderWidth)
          .strokeColor(borderColor)
          .fillColor('#000000')
          .font('Helvetica');
      }

      // Draw cell borders (no fill, just outlines like reference)
      doc.rect(margin, yPosition, col1Width, rowHeight).stroke();
      doc.rect(margin + col1Width, yPosition, col2Width, rowHeight).stroke();
      doc.rect(margin + col1Width + col2Width, yPosition, col3Width, rowHeight).stroke();

      // Split specification by pipe separator
      const item = cleanText(spec.parameter || spec.item || '');
      const specParts = (spec.specification || '').split('|').map(s => s.trim()).filter(s => s);

      let standard = '';
      let result = '';

      if (spec.result) {
        // If we have a separate result field, use it
        standard = cleanText(spec.specification || '');
        result = cleanText(spec.result);
      } else if (specParts.length === 1) {
        standard = cleanText(specParts[0]);
        result = '-';
      } else if (specParts.length === 2) {
        standard = cleanText(specParts[0]);
        result = cleanText(specParts[1]);
      } else {
        const midPoint = Math.floor(specParts.length / 2);
        standard = cleanText(specParts.slice(0, midPoint).join(' '));
        result = cleanText(specParts.slice(midPoint).join(' '));
      }

      // Add text with better vertical centering
      const textY = yPosition + (rowHeight / 2) - 4;
      
      doc.fontSize(8.5)  // Slightly smaller to fit more
        .fillColor('#000000')
        .text(item.toUpperCase(), margin + 10, textY, { width: col1Width - 20, align: 'left', ellipsis: true })
        .text(standard, margin + col1Width + 10, textY, { width: col2Width - 20, align: 'center', ellipsis: true })
        .text(result, margin + col1Width + col2Width + 10, textY, { width: col3Width - 20, align: 'center', ellipsis: true });

      yPosition += rowHeight;
    });
    
    console.log(`✅ All ${extractedData.specifications.length} specifications rendered`);
  } else {
    // If no specifications, show ALL extracted data as a table
    const analysisData = [];

    // Fields to exclude from the table (already shown above or internal)
    const excludeFields = ['productName', 'supplier', 'fullText', '_metadata', 'additionalInfo'];
    
    // Add all available data fields
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value && !excludeFields.includes(key) && typeof value !== 'object') {
        // Format key for display (camelCase to Title Case)
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        analysisData.push({ item: formattedKey, standard: '-', result: String(value) });
      }
    });

    // Always show table even if minimal data
    if (analysisData.length === 0) {
      // Add a placeholder row if no data at all
      analysisData.push({ item: 'Product Information', standard: '-', result: 'See above' });
    }

    // Draw initial table header
    yPosition = drawTableHeader(doc, yPosition, headerParams);

    // Table rows
    doc.lineWidth(borderWidth)
      .strokeColor(borderColor)
      .fillColor('#000000')
      .font('Helvetica');

    analysisData.forEach((data, index) => {
      // Check if we need a new page
      if (yPosition + rowHeight > maxYPosition) {
        console.log(`📄 Adding new page for analysis row ${index + 1}`);
        doc.addPage();
        yPosition = margin;
        
        // Redraw table header on new page
        yPosition = drawTableHeader(doc, yPosition, headerParams);
        
        // Reset drawing state for rows
        doc.lineWidth(borderWidth)
          .strokeColor(borderColor)
          .fillColor('#000000')
          .font('Helvetica');
      }

      doc.rect(margin, yPosition, col1Width, rowHeight).stroke();
      doc.rect(margin + col1Width, yPosition, col2Width, rowHeight).stroke();
      doc.rect(margin + col1Width + col2Width, yPosition, col3Width, rowHeight).stroke();

      const textY = yPosition + (rowHeight / 2) - 5;

      doc.fontSize(9)
        .fillColor('#000000')
        .text(cleanText(data.item).toUpperCase(), margin + 10, textY, { width: col1Width - 20, align: 'left' })
        .text(cleanText(data.standard), margin + col1Width + 10, textY, { width: col2Width - 20, align: 'center' })
        .text(cleanText(data.result), margin + col1Width + col2Width + 10, textY, { width: col3Width - 20, align: 'center' });

      yPosition += rowHeight;
    });
  }

  return yPosition;
}

export default { generateFormattedPDF };

