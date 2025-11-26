import PDFDocument from 'pdfkit';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Generate a formatted COA PDF with company branding
 * @param {Object} extractedData - Data extracted from the original PDF
 * @param {Object} companyInfo - Company name, logo, theme, and layout
 * @returns {Promise<string>} Path to the generated PDF file
 */
export async function generateFormattedPDF(extractedData, companyInfo = {}) {
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
      
      console.log(`📄 Generating PDF with theme: ${theme.primaryColor}/${theme.secondaryColor}, layout: ${layoutId}`);

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = doc.pipe(fs.createWriteStream(outputPath));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      let yPosition = margin;

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

      // Add company logo if provided
      if (companyInfo.logo) {
        try {
          const logoBuffer = Buffer.from(companyInfo.logo.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          
          // Logo position based on layout
          let logoX;
          if (layout.logoPosition === 'left') {
            logoX = margin;
          } else {
            logoX = (pageWidth - 100) / 2;
          }
          
          doc.image(logoBuffer, logoX, yPosition, { width: 100, height: 70 });
          yPosition += 80;
        } catch (error) {
          console.error('Error adding logo:', error);
          yPosition += 20;
        }
      } else {
        yPosition += 20;
      }

      // Text alignment based on layout
      const textAlign = layout.textAlign;

      // Company Name (if provided) - explicit color reset
      if (companyInfo.name) {
        doc.fillColor(theme.primaryColor)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(companyInfo.name, margin, yPosition, {
            align: textAlign,
            width: pageWidth - 2 * margin,
          });
        yPosition += 18;
      }

      // Company Address (if provided)
      if (companyInfo.address) {
        doc.fillColor('#333333')
          .fontSize(9)
          .font('Helvetica')
          .text(companyInfo.address, margin, yPosition, {
            align: textAlign,
            width: pageWidth - 2 * margin,
          });
        yPosition += 15;
      }

      // Title - Certificate of Analysis (explicit color reset)
      doc.fillColor(theme.primaryColor)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Certificate of Analysis', margin, yPosition, {
          align: textAlign,
          width: pageWidth - 2 * margin,
        });
      yPosition += 28;

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
 * Draw professional bordered table with clean design
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

  // Determine if we have structured specifications
  if (extractedData.specifications && extractedData.specifications.length > 0) {
    // Table header - style based on layout
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
    yPosition += headerHeight;

    // Table rows with clean borders
    doc.lineWidth(borderWidth)
      .strokeColor(borderColor)
      .fillColor('#000000')
      .font('Helvetica');

    // Calculate max rows that fit - be very conservative
    const maxYPosition = pageHeight - 60; // Minimal footer space
    
    extractedData.specifications.forEach((spec, index) => {
      // Hard stop if we're running out of space
      if (yPosition + rowHeight > maxYPosition) {
        console.log(`⚠️  Skipping row ${index + 1} to prevent page 2`);
        return;
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

    // Table header - style based on layout
    doc.save();
    
    if (layout.tableHeaderStyle === 'filled') {
      doc.rect(margin, yPosition, tableWidth, headerHeight)
        .fillAndStroke(headerBg, headerBg);
      doc.fillColor('#FFFFFF');
    } else {
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
      yPosition += headerHeight;

      // Table rows
      doc.lineWidth(borderWidth)
      .strokeColor(borderColor)
        .fillColor('#000000')
        .font('Helvetica');

      analysisData.forEach((data) => {
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

