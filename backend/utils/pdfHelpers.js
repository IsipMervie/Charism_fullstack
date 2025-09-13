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
 * Add simple, clean certificate header like the example
 * @param {PDFDocument} doc - The PDF document instance
 * @param {string} studentName - Student name for the certificate
 * @param {string} eventTitle - Event title
 * @param {number} hours - Hours completed
 */
const addCertificateHeader = async (doc, studentName, eventTitle, hours) => {
  try {
    const logoPath = path.join(__dirname, '..', 'logo.png');
    
    // Simple white background
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill('#ffffff');
    
    // Simple double border like the example
    // Outer blue border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .stroke('#007bff');
    
    // Inner green border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(2)
       .stroke('#28a745');
    
    // Add logo on the left side with proper spacing
    try {
      const logoSize = 80;
      const logoX = 60;
      const logoY = 70;
      
      await doc.image(logoPath, logoX, logoY, { 
        width: logoSize, 
        height: logoSize
      });
    } catch (logoError) {
      console.log('Logo not found, continuing without logo:', logoError.message);
    }
    
    // Add header text - positioned to avoid overlap with logo
    doc.y = 80;
    
    // Institution name - positioned to the right of logo
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Center for the Holistic Advancement of Religious Instruction,', { 
         x: 160,
         y: 80
       });
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Spirituality, and Mission', { 
         x: 160,
         y: 95
       });
    
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#d4af37')
       .text('CHARISM', { 
         x: 160,
         y: 115
       });
    
    // Move down for certificate title
    doc.y = 160;
    
    // Certificate title - large and bold
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#333333')
       .text('Certificate of Completion', { 
         align: 'center'
       });
    
    doc.moveDown(2);
    
    // Certification text
    doc.fontSize(16).font('Helvetica').fillColor('#333333')
       .text('This is to certify that', { 
         align: 'center'
       });
    
    doc.moveDown(1);
    
    // Student name - prominent and underlined
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#007bff')
       .text(studentName, { 
         align: 'center'
       });
    
    // Simple underline
    const nameWidth = doc.widthOfString(studentName, { fontSize: 20 });
    const underlineX = (doc.page.width - nameWidth) / 2;
    doc.moveTo(underlineX, doc.y + 5)
       .lineTo(underlineX + nameWidth, doc.y + 5)
       .stroke('#007bff', 2);
    
    doc.moveDown(1.5);
    
    // Completion text
    doc.fontSize(16).font('Helvetica').fillColor('#333333')
       .text('has successfully completed', { 
         align: 'center'
       });
    
    doc.moveDown(1);
    
    // Hours - highlighted in green
    const hoursText = `${hours} hours of Community Service`;
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#28a745')
       .text(hoursText, { 
         align: 'center'
       });
    
    doc.moveDown(1);
    
    // Additional text
    doc.fontSize(14).font('Helvetica').fillColor('#333333')
       .text('through participation in approved events.', { 
         align: 'center'
       });
    
    // Move cursor down for event details
    doc.moveDown(2);
    
  } catch (error) {
    console.error('Error adding certificate header:', error);
    // Fallback: simple header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#333333')
       .text('Certificate of Completion', { align: 'center' });
    doc.moveDown(2);
  }
};

module.exports = {
  addLogoAndHeader,
  addCertificateHeader
};
