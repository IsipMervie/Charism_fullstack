const path = require('path');

/**
 * Add logo and header to PDF document
 * @param {PDFDocument} doc - The PDF document instance
 * @param {string} title - The main title for the document
 * @param {string} subtitle - Optional subtitle
 * @param {Object} options - Additional options
 */
const addLogoAndHeader = async (doc, title, subtitle = '', options = {}) => {
  try {
    const logoPath = path.join(__dirname, '..', 'logo.png');
    
    // Add logo (if it exists)
    try {
      await doc.image(logoPath, 50, 50, { 
        width: 60, 
        height: 60,
        align: 'center'
      });
    } catch (logoError) {
      console.log('Logo not found, continuing without logo:', logoError.message);
    }
    
    // Add header text
    const headerY = 70; // Position below logo
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', { 
         align: 'center',
         y: headerY
       });
    
    // Add CHARISM subtitle
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#34495e')
       .text('CHARISM', { 
         align: 'center',
         y: headerY + 25
       });
    
    // Add main title
    if (title) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#2c3e50')
         .text(title, { 
           align: 'center',
           y: headerY + 50
         });
    }
    
    // Add subtitle if provided
    if (subtitle) {
      doc.fontSize(12).font('Helvetica').fillColor('#7f8c8d')
         .text(subtitle, { 
           align: 'center',
           y: headerY + 75
         });
    }
    
    // Add generation date
    doc.fontSize(10).font('Helvetica').fillColor('#95a5a6')
       .text(`Generated: ${new Date().toLocaleDateString()}`, { 
         align: 'center',
         y: headerY + 95
       });
    
    // Move cursor down for content
    doc.y = headerY + 120;
    
  } catch (error) {
    console.error('Error adding logo and header:', error);
    // Fallback: just add text header
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', { align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#34495e')
       .text('CHARISM', { align: 'center' });
    if (title) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#2c3e50')
         .text(title, { align: 'center' });
    }
    doc.moveDown(2);
  }
};

/**
 * Add beautiful certificate header with modern design
 * @param {PDFDocument} doc - The PDF document instance
 * @param {string} studentName - Student name for the certificate
 * @param {string} eventTitle - Event title
 * @param {number} hours - Hours completed
 */
const addCertificateHeader = async (doc, studentName, eventTitle, hours) => {
  try {
    const logoPath = path.join(__dirname, '..', 'logo.png');
    
    // Create beautiful gradient background
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill('#f8fafc');
    
    // Add elegant border with multiple layers
    // Outer gold border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(4)
       .stroke('#d4af37');
    
    // Inner blue border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(2)
       .stroke('#1e40af');
    
    // Innermost decorative border
    doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
       .lineWidth(1)
       .stroke('#3b82f6');
    
    // Add corner decorations
    const cornerSize = 25;
    const cornerColor = '#d4af37';
    
    // Top-left corner
    doc.polygon([20, 20], [45, 20], [20, 45])
       .fill(cornerColor);
    
    // Top-right corner
    doc.polygon([doc.page.width - 20, 20], [doc.page.width - 45, 20], [doc.page.width - 20, 45])
       .fill(cornerColor);
    
    // Bottom-left corner
    doc.polygon([20, doc.page.height - 20], [45, doc.page.height - 20], [20, doc.page.height - 45])
       .fill(cornerColor);
    
    // Bottom-right corner
    doc.polygon([doc.page.width - 20, doc.page.height - 20], [doc.page.width - 45, doc.page.height - 20], [doc.page.width - 20, doc.page.height - 45])
       .fill(cornerColor);
    
    // Add logo with elegant frame
    try {
      const logoSize = 80;
      const logoX = doc.page.width / 2 - logoSize / 2;
      const logoY = 60;
      
      // Logo background circle
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5)
         .fill('#ffffff')
         .stroke('#d4af37', 3);
      
      await doc.image(logoPath, logoX, logoY, { 
        width: logoSize, 
        height: logoSize
      });
    } catch (logoError) {
      console.log('Logo not found, continuing without logo:', logoError.message);
    }
    
    // Add header text with beautiful styling
    doc.y = 160;
    
    // Institution name with elegant styling
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', { 
         align: 'center'
       });
    
    doc.moveDown(0.5);
    
    // CHARISM with special styling
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#d4af37')
       .text('CHARISM', { 
         align: 'center'
       });
    
    doc.moveDown(1);
    
    // Elegant decorative line
    doc.moveTo(doc.page.width / 2 - 80, doc.y)
       .lineTo(doc.page.width / 2 + 80, doc.y)
       .stroke('#d4af37', 3);
    
    doc.moveTo(doc.page.width / 2 - 60, doc.y + 3)
       .lineTo(doc.page.width / 2 + 60, doc.y + 3)
       .stroke('#1e40af', 1);
    
    doc.moveDown(1.5);
    
    // Certificate title with beautiful styling
    doc.fontSize(36).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Certificate of Completion', { 
         align: 'center'
       });
    
    doc.moveDown(2);
    
    // Certification text with elegant styling
    doc.fontSize(20).font('Helvetica').fillColor('#6b7280')
       .text('This is to certify that', { 
         align: 'center'
       });
    
    doc.moveDown(1.5);
    
    // Student name with beautiful highlight
    const nameBoxWidth = doc.widthOfString(studentName, { fontSize: 32 }) + 60;
    const nameBoxX = (doc.page.width - nameBoxWidth) / 2;
    
    // Name background with gradient effect
    doc.rect(nameBoxX, doc.y - 10, nameBoxWidth, 60)
       .fill('#f0f9ff')
       .stroke('#1e40af', 2);
    
    doc.fontSize(32).font('Helvetica-Bold').fillColor('#1e40af')
       .text(studentName, { 
         align: 'center',
         y: doc.y
       });
    
    // Elegant underline
    doc.moveTo(nameBoxX + 20, doc.y + 35)
       .lineTo(nameBoxX + nameBoxWidth - 20, doc.y + 35)
       .stroke('#d4af37', 2);
    
    doc.y += 60;
    doc.moveDown(1.5);
    
    // Completion text
    doc.fontSize(20).font('Helvetica').fillColor('#6b7280')
       .text('has successfully completed', { 
         align: 'center'
       });
    
    doc.moveDown(1);
    
    // Hours achievement with beautiful styling
    const hoursText = `${hours} hours of Community Service`;
    const hoursBoxWidth = doc.widthOfString(hoursText, { fontSize: 28 }) + 80;
    const hoursBoxX = (doc.page.width - hoursBoxWidth) / 2;
    
    // Hours background with gold accent
    doc.rect(hoursBoxX, doc.y - 15, hoursBoxWidth, 70)
       .fill('#fef3c7')
       .stroke('#d4af37', 3);
    
    // Inner highlight
    doc.rect(hoursBoxX + 5, doc.y - 10, hoursBoxWidth - 10, 60)
       .fill('#ffffff')
       .stroke('#f59e0b', 1);
    
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#dc2626')
       .text(hoursText, { 
         align: 'center',
         y: doc.y
       });
    
    doc.y += 70;
    doc.moveDown(1);
    
    // Additional text with elegant styling
    doc.fontSize(18).font('Helvetica').fillColor('#6b7280')
       .text('through participation in approved events.', { 
         align: 'center'
       });
    
    // Move cursor down for event details
    doc.moveDown(2.5);
    
  } catch (error) {
    console.error('Error adding certificate header:', error);
    // Fallback: simple header
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
       .text('CHARISM', { align: 'center' });
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Certificate of Completion', { align: 'center' });
    doc.moveDown(2);
  }
};

module.exports = {
  addLogoAndHeader,
  addCertificateHeader
};
