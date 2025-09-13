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
    
    // Add logo (if it exists)
    try {
      await doc.image(logoPath, 50, 50, { 
        width: 80, 
        height: 80,
        align: 'center'
      });
    } catch (logoError) {
      console.log('Logo not found, continuing without logo:', logoError.message);
    }
    
    // Add header text
    const headerY = 80; // Position below logo
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', { 
         align: 'center',
         y: headerY
       });
    
    // Add CHARISM subtitle
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#34495e')
       .text('CHARISM', { 
         align: 'center',
         y: headerY + 25
       });
    
    // Add certificate title
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Certificate of Completion', { 
         align: 'center',
         y: headerY + 60
       });
    
    // Add student name
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#e74c3c')
       .text(`This is to certify that`, { 
         align: 'center',
         y: headerY + 100
       });
    
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2c3e50')
       .text(studentName, { 
         align: 'center',
         y: headerY + 130
       });
    
    doc.fontSize(16).font('Helvetica').fillColor('#34495e')
       .text(`has successfully completed`, { 
         align: 'center',
         y: headerY + 170
       });
    
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#e74c3c')
       .text(eventTitle, { 
         align: 'center',
         y: headerY + 200
       });
    
    doc.fontSize(16).font('Helvetica').fillColor('#34495e')
       .text(`with ${hours} hours of community service`, { 
         align: 'center',
         y: headerY + 230
       });
    
    // Move cursor down for signature area
    doc.y = headerY + 280;
    
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
