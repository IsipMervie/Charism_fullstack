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
 * Add logo and header to certificate PDF
 * @param {PDFDocument} doc - The PDF document instance
 * @param {string} studentName - Student name for the certificate
 * @param {string} eventTitle - Event title
 * @param {number} hours - Hours completed
 */
const addCertificateHeader = async (doc, studentName, eventTitle, hours) => {
  try {
    const logoPath = path.join(__dirname, '..', 'logo.png');
    
    // Add logo (if it exists) - positioned at top left
    try {
      await doc.image(logoPath, 60, 60, { 
        width: 80, 
        height: 80
      });
    } catch (logoError) {
      console.log('Logo not found, continuing without logo:', logoError.message);
    }
    
    // Add header text - positioned to the right of logo
    const headerY = 70;
    const headerX = 180; // Start after logo
    
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', { 
         x: headerX,
         y: headerY,
         width: 320,
         align: 'left'
       });
    
    // Add CHARISM subtitle
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#34495e')
       .text('CHARISM', { 
         x: headerX,
         y: headerY + 20,
         width: 320,
         align: 'left'
       });
    
    // Move down for main certificate content
    doc.y = 180;
    
    // Add certificate title - centered
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Certificate of Completion', { 
         align: 'center'
       });
    
    // Add spacing
    doc.moveDown(1.2);
    
    // Add certification text
    doc.fontSize(16).font('Helvetica').fillColor('#e74c3c')
       .text('This is to certify that', { 
         align: 'center'
       });
    
    doc.moveDown(0.8);
    
    // Add student name - prominent
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2c3e50')
       .text(studentName, { 
         align: 'center'
       });
    
    doc.moveDown(0.8);
    
    // Add completion text
    doc.fontSize(16).font('Helvetica').fillColor('#34495e')
       .text('has successfully completed', { 
         align: 'center'
       });
    
    doc.moveDown(0.5);
    
    // Add hours - highlighted
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#e74c3c')
       .text(`${hours} hours of Community Service`, { 
         align: 'center'
       });
    
    doc.moveDown(0.8);
    
    // Add additional text
    doc.fontSize(14).font('Helvetica').fillColor('#6c757d')
       .text(`through participation in approved events.`, { 
         align: 'center'
       });
    
    // Move cursor down for event details
    doc.moveDown(1.5);
    
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
