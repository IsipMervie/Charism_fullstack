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
    
    // Add logo on the LEFT side
    try {
      const logoSize = 100;
      const logoX = 50;
      const logoY = 30;
      
      await doc.image(logoPath, logoX, logoY, { 
        width: logoSize, 
        height: logoSize
      });
    } catch (logoError) {
      console.log('Logo not found, continuing without logo:', logoError.message);
    }
    
    // Add ALL text on the RIGHT side - completely separate from logo
    doc.y = 30;
    
    // Institution name - positioned on the RIGHT side with MORE space from logo
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Center for the Holistic Advancement of Religious Instruction,', { 
         x: 220,
         y: 30
       });
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Spirituality, and Mission', { 
         x: 220,
         y: 50
       });
    
    // Add main title - positioned on the RIGHT side with MORE space from logo
    if (title) {
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e40af')
         .text(title, { 
           x: 220,
           y: 80
         });
    }
    
    // Add subtitle if provided
    if (subtitle) {
      doc.fontSize(12).font('Helvetica').fillColor('#7f8c8d')
         .text(subtitle, { 
           x: 220,
           y: 110
         });
    }
    
    // Add generation date
    doc.fontSize(10).font('Helvetica').fillColor('#95a5a6')
       .text(`Generated: ${new Date().toLocaleDateString()}`, { 
         x: 220,
         y: 130
       });
    
    // Move cursor down for content
    doc.y = 160;
    
  } catch (error) {
    console.error('Error adding logo and header:', error);
    // Fallback: just add text header
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Center for the Holistic Advancement of Religious Instruction,', { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Spirituality, and Mission', { align: 'center' });
    if (title) {
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e40af')
         .text(title, { align: 'center' });
    }
    doc.fontSize(10).font('Helvetica').fillColor('#95a5a6')
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
  }
};

/**
 * Add logo and header to certificate PDF
 * @param {PDFDocument} doc - The PDF document instance
 * @param {string} studentName - Student name for the certificate
 * @param {string} eventTitle - Event title
 * @param {number} hours - Hours completed
 */
const addCertificateHeader = async (doc, studentName, eventTitle, hours) => {
  try {
    const logoPath = path.join(__dirname, '..', 'logo.png');
    
    // Add decorative background elements
    // Top decorative line
    doc.rect(0, 0, doc.page.width, 8)
       .fill('#1e3a8a');
    
    // Bottom decorative line
    doc.rect(0, doc.page.height - 8, doc.page.width, 8)
       .fill('#1e3a8a');
    
    // Add logo (if it exists) - centered at top
    try {
      await doc.image(logoPath, doc.page.width / 2 - 50, 30, { 
        width: 100, 
        height: 100
      });
    } catch (logoError) {
      console.log('Logo not found, continuing without logo:', logoError.message);
    }
    
    // Add header text - centered below logo
    doc.y = 150;
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a')
       .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', { 
         align: 'center'
       });
    
    // Add CHARISM subtitle
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
       .text('CHARISM', { 
         align: 'center'
       });
    
    // Move down for main certificate content
    doc.moveDown(1.5);
    
    // Add decorative line
    doc.moveTo(doc.page.width / 2 - 100, doc.y)
       .lineTo(doc.page.width / 2 + 100, doc.y)
       .stroke('#1e3a8a', 2);
    
    doc.moveDown(1);
    
    // Add certificate title - centered
    doc.fontSize(32).font('Helvetica-Bold').fillColor('#1e3a8a')
       .text('Certificate of Completion', { 
         align: 'center'
       });
    
    // Add spacing
    doc.moveDown(1.5);
    
    // Add certification text
    doc.fontSize(18).font('Helvetica').fillColor('#dc2626')
       .text('This is to certify that', { 
         align: 'center'
       });
    
    doc.moveDown(1);
    
    // Add student name - prominent with decorative underline
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#1e3a8a')
       .text(studentName, { 
         align: 'center'
       });
    
    // Add decorative underline
    doc.moveTo(doc.page.width / 2 - 120, doc.y + 5)
       .lineTo(doc.page.width / 2 + 120, doc.y + 5)
       .stroke('#dc2626', 2);
    
    doc.moveDown(1.2);
    
    // Add completion text
    doc.fontSize(18).font('Helvetica').fillColor('#374151')
       .text('has successfully completed', { 
         align: 'center'
       });
    
    doc.moveDown(0.8);
    
    // Add hours - simple text without background
    const hoursText = `${hours} hours of Community Service`;
    
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#dc2626')
       .text(hoursText, { 
         align: 'center'
       });
    
    doc.moveDown(0.8);
    doc.moveDown(0.8);
    
    // Add additional text
    doc.fontSize(16).font('Helvetica').fillColor('#6b7280')
       .text(`through participation in approved events.`, { 
         align: 'center'
       });
    
    // Move cursor down for event details
    doc.moveDown(2);
    
  } catch (error) {
    console.error('Error adding certificate header:', error);
    // Fallback: just add text header
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#34495e')
       .text('CHARISM', { align: 'center' });
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Certificate of Completion', { align: 'center' });
    doc.moveDown(2);
  }
};

module.exports = {
  addLogoAndHeader,
  addCertificateHeader
};
