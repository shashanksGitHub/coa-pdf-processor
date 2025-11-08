import PDFDocument from 'pdfkit';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a formatted COA PDF with company branding
 * @param {Object} extractedData - Data extracted from the original PDF
 * @param {Object} companyInfo - Company name and logo
 * @returns {Promise<string>} Path to the generated PDF file
 */
export async function generateFormattedPDF(extractedData, companyInfo = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create output directory if it doesn't exist
      const outputDir = path.join(__dirname, '../../output');
      await fsPromises.mkdir(outputDir, { recursive: true });

      const fileName = `COA_${extractedData.productName || 'formatted'}_${Date.now()}.pdf`;
      const outputPath = path.join(outputDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = doc.pipe(fs.createWriteStream(outputPath));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      let yPosition = margin;

      // Green header bar
      doc.rect(0, 0, pageWidth, 40)
        .fill('#568259');

      yPosition = 60;

      // Add company logo if provided
      if (companyInfo.logo) {
        try {
          // Assuming logo is base64 or buffer
          const logoBuffer = Buffer.from(companyInfo.logo.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(logoBuffer, (pageWidth - 100) / 2, yPosition, { width: 100, height: 70 });
          yPosition += 80;
        } catch (error) {
          console.error('Error adding logo:', error);
          yPosition += 20;
        }
      } else {
        yPosition += 20;
      }

      // Title - Certificate of Analysis (Navy blue, smaller)
      doc.fontSize(20)
        .fillColor('#1A376B')
        .font('Helvetica-Bold')
        .text('Certificate of Analysis', margin, yPosition, {
          align: 'center',
          width: pageWidth - 2 * margin,
        });
      yPosition += 28;

      // Product Name (smaller)
      doc.fontSize(12)
        .fillColor('#1A376B')
        .font('Helvetica-Bold')
        .text(`Product Name: ${extractedData.productName || 'Product Name Not Found'}`, margin, yPosition, {
          align: 'center',
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

      // Draw professional table
      const finalYPosition = drawProfessionalTable(doc, extractedData, pageWidth, pageHeight, margin, yPosition);

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
 * Draw professional bordered table with clean design (like reference)
 */
function drawProfessionalTable(doc, extractedData, pageWidth, pageHeight, margin, startY) {
  let yPosition = startY;

  // Table styling - 3 columns with cleaner design
  const tableWidth = pageWidth - 2 * margin;
  const col1Width = tableWidth * 0.35;  // Item
  const col2Width = tableWidth * 0.325; // Standard
  const col3Width = tableWidth * 0.325; // Result

  const rowHeight = 28;  // Compact rows
  const headerHeight = 32; // Compact header

  // Navy blue color for borders (matching reference)
  const navyBlue = '#1A376B';
  const borderWidth = 2;

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
    // Table header with navy blue background
    doc.save();
    doc.rect(margin, yPosition, tableWidth, headerHeight)
      .fillAndStroke(navyBlue, navyBlue);

    doc.fontSize(11)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Item', margin + 10, yPosition + 15, { width: col1Width - 20, align: 'center' })
      .text('Standard', margin + col1Width + 10, yPosition + 15, { width: col2Width - 20, align: 'center' })
      .text('Result', margin + col1Width + col2Width + 10, yPosition + 15, { width: col3Width - 20, align: 'center' });

    doc.restore();
    yPosition += headerHeight;

    // Table rows with clean borders
    doc.lineWidth(borderWidth)
      .strokeColor(navyBlue)
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
    // If no specifications, show basic analysis results
    const analysisData = [];

    if (extractedData.appearance) {
      analysisData.push({ item: 'APPEARANCE', standard: '-', result: extractedData.appearance });
    }
    if (extractedData.purity) {
      analysisData.push({ item: 'PURITY', standard: '-', result: extractedData.purity });
    }
    if (extractedData.casNo) {
      analysisData.push({ item: 'CAS NO', standard: '-', result: extractedData.casNo });
    }
    if (extractedData.lotNo || extractedData.batchNo) {
      analysisData.push({ item: 'LOT/BATCH NO', standard: '-', result: extractedData.lotNo || extractedData.batchNo });
    }
    if (extractedData.date) {
      analysisData.push({ item: 'DATE', standard: '-', result: extractedData.date });
    }

    if (analysisData.length > 0) {
      const navyBlue = '#1A376B';
      const borderWidth = 2;
      
      // Table header
      doc.save();
      doc.rect(margin, yPosition, tableWidth, headerHeight)
        .fillAndStroke(navyBlue, navyBlue);

      doc.fontSize(11)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('Item', margin + 10, yPosition + 15, { width: col1Width - 20, align: 'center' })
        .text('Standard', margin + col1Width + 10, yPosition + 15, { width: col2Width - 20, align: 'center' })
        .text('Result', margin + col1Width + col2Width + 10, yPosition + 15, { width: col3Width - 20, align: 'center' });

      doc.restore();
      yPosition += headerHeight;

      // Table rows
      doc.lineWidth(borderWidth)
        .strokeColor(navyBlue)
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
  }

  return yPosition;
}

export default { generateFormattedPDF };

