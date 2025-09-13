const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Event = require('../models/Event');

// Helper to sanitize text for PDF output
const sanitizeText = (text) => {
  if (!text) return '';
  return String(text).replace(/[^a-zA-Z0-9\s.,;!?@'"()\-\u00C0-\u024F]/g, '').trim();
};

// Calculate total hours for a student
const calculateStudentsHours = async (userId) => {
  try {
    const events = await Event.find({
      'attendance.userId': userId,
      'attendance.status': 'Approved'
    });

    let totalHours = 0;
    events.forEach(event => {
      const attendance = event.attendance.find(a => 
        a.userId.toString() === userId.toString() && a.status === 'Approved'
      );
      if (attendance) {
        totalHours += event.hours || 0;
      }
    });

    return totalHours;
  } catch (error) {
    console.error('Error calculating hours:', error);
    return 0;
  }
};

// Create a beautiful single-page certificate
const createBeautifulCertificate = async (doc, user, eventList, totalHours) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 40;

  // Beautiful gradient-like background
  doc.rect(0, 0, pageWidth, pageHeight)
     .fill('#f8fafc');

  // Main decorative border
  doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)
     .stroke('#1e40af', 4);
  
  // Inner gold border
  doc.rect(margin + 10, margin + 10, pageWidth - 2 * margin - 20, pageHeight - 2 * margin - 20)
     .stroke('#d4af37', 2);

  // Header section with logo area
  const headerHeight = 120;
  doc.rect(margin + 20, margin + 20, pageWidth - 2 * margin - 40, headerHeight)
     .fill('#1e40af');

  // Logo placeholder (circular)
  const logoX = pageWidth / 2;
  const logoY = margin + 20 + headerHeight / 2;
  doc.circle(logoX, logoY, 25)
     .fill('#ffffff')
     .stroke('#d4af37', 2);

  // University text around logo
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fill('#d4af37')
     .text('UNIVERSITY OF THE ASSUMPTION', {
       x: logoX,
       y: logoY - 35,
       align: 'center',
       width: 200
     });

  // Center text
  doc.fontSize(8)
     .font('Helvetica')
     .fill('#ffffff')
     .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', {
       x: logoX,
       y: logoY + 15,
       align: 'center',
       width: 200
     });

  // CHARISM text
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fill('#d4af37')
     .text('CHARISM', {
       x: logoX,
       y: logoY + 35,
       align: 'center'
     });

  // Certificate title
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fill('#1e40af')
     .text('Certificate of Completion', {
       x: pageWidth / 2,
       y: margin + headerHeight + 60,
       align: 'center'
     });

  // Subtitle
  doc.fontSize(14)
     .font('Helvetica')
     .fill('#64748b')
     .text('This is to certify that', {
       x: pageWidth / 2,
       y: margin + headerHeight + 100,
       align: 'center'
     });

  // Student name
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fill('#1e40af')
     .text(sanitizeText(user.name), {
       x: pageWidth / 2,
       y: margin + headerHeight + 130,
       align: 'center'
     });

  // Decorative line under name
  doc.moveTo(pageWidth / 2 - 100, margin + headerHeight + 160)
     .lineTo(pageWidth / 2 + 100, margin + headerHeight + 160)
     .stroke('#d4af37', 2);

  // Completion text
  doc.fontSize(14)
     .font('Helvetica')
     .fill('#64748b')
     .text('has successfully completed', {
       x: pageWidth / 2,
       y: margin + headerHeight + 180,
       align: 'center'
     });

  // Hours highlight box
  const hoursBoxY = margin + headerHeight + 210;
  doc.rect(pageWidth / 2 - 120, hoursBoxY, 240, 40)
     .fill('#fef3c7')
     .stroke('#d4af37', 2);

  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fill('#dc2626')
     .text(`${totalHours} hours of Community Service`, {
       x: pageWidth / 2,
       y: hoursBoxY + 10,
       align: 'center'
     });

  // Events section - compact design
  const eventsStartY = hoursBoxY + 80;
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fill('#1e40af')
     .text('Events Completed', {
       x: pageWidth / 2,
       y: eventsStartY,
       align: 'center'
     });

  // Events list - compact table format
  const eventsTableY = eventsStartY + 40;
  const eventsTableHeight = Math.min(200, eventList.length * 25 + 40);
  
  // Table background
  doc.rect(margin + 60, eventsTableY, pageWidth - 2 * margin - 120, eventsTableHeight)
     .fill('#ffffff')
     .stroke('#1e40af', 1);

  // Table header
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fill('#1e40af');
  
  doc.text('#', margin + 70, eventsTableY + 10, { width: 30 });
  doc.text('Event Name', margin + 110, eventsTableY + 10, { width: 300 });
  doc.text('Date', margin + 420, eventsTableY + 10, { width: 100 });
  doc.text('Hours', margin + 530, eventsTableY + 10, { width: 60 });

  // Header line
  doc.moveTo(margin + 60, eventsTableY + 30)
     .lineTo(pageWidth - margin - 60, eventsTableY + 30)
     .stroke('#d4af37', 1);

  // Events rows
  eventList.slice(0, 8).forEach((event, index) => { // Limit to 8 events to fit on page
    const rowY = eventsTableY + 40 + (index * 20);
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.rect(margin + 60, rowY - 5, pageWidth - 2 * margin - 120, 20)
         .fill('#f8fafc');
    }

    doc.fontSize(10)
       .font('Helvetica')
       .fill('#1f2937');
    
    doc.text(`${index + 1}`, margin + 70, rowY, { width: 30 });
    
    const eventName = event.name.length > 35 ? event.name.substring(0, 35) + '...' : event.name;
    doc.text(eventName, margin + 110, rowY, { width: 300 });
    doc.text(event.date, margin + 420, rowY, { width: 100 });
    doc.text(`${event.hours}`, margin + 530, rowY, { width: 60 });
  });

  // Show "..." if more events
  if (eventList.length > 8) {
    doc.fontSize(10)
       .font('Helvetica-Italic')
       .fill('#64748b')
       .text(`... and ${eventList.length - 8} more events`, {
         x: pageWidth / 2,
         y: eventsTableY + eventsTableHeight - 20,
         align: 'center'
       });
  }

  // Signature section
  const signatureY = eventsTableY + eventsTableHeight + 40;
  
  // Date
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fill('#1e40af')
     .text(`Date: ${new Date().toLocaleDateString()}`, {
       x: pageWidth / 2,
       y: signatureY,
       align: 'center'
     });

  // Signature line
  const signatureLineY = signatureY + 40;
  doc.moveTo(pageWidth / 2 - 150, signatureLineY)
     .lineTo(pageWidth / 2 + 150, signatureLineY)
     .stroke('#1e40af', 2);

  // Signature label
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fill('#1e40af')
     .text('Authorized Signature', {
       x: pageWidth / 2,
       y: signatureLineY + 10,
       align: 'center'
     });

  // Decorative elements
  // Corner decorations
  const cornerSize = 20;
  doc.polygon([margin + 20, margin + 20], [margin + 20 + cornerSize, margin + 20], [margin + 20, margin + 20 + cornerSize])
     .fill('#d4af37');
  
  doc.polygon([pageWidth - margin - 20, margin + 20], [pageWidth - margin - 20 - cornerSize, margin + 20], [pageWidth - margin - 20, margin + 20 + cornerSize])
     .fill('#d4af37');
     
  doc.polygon([margin + 20, pageHeight - margin - 20], [margin + 20 + cornerSize, pageHeight - margin - 20], [margin + 20, pageHeight - margin - 20 - cornerSize])
     .fill('#d4af37');
     
  doc.polygon([pageWidth - margin - 20, pageHeight - margin - 20], [pageWidth - margin - 20 - cornerSize, pageHeight - margin - 20], [pageWidth - margin - 20, pageHeight - margin - 20 - cornerSize])
     .fill('#d4af37');
};

// Generate Individual Certificate
exports.generateCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get user's approved events for certificate details
    const events = await Event.find({
      'attendance.userId': user._id,
      'attendance.status': 'Approved'
    });

    let totalHours = 0;
    const eventList = [];

    events.forEach(event => {
      const attendance = event.attendance.find(a => 
        a.userId.toString() === user._id.toString() && a.status === 'Approved'
      );
      if (attendance) {
        totalHours += event.hours || 0;
        eventList.push({
          name: event.title,
          date: new Date(event.date).toLocaleDateString(),
          hours: event.hours || 0
        });
      }
    });

    // Create a new PDF document - single page design
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 0
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${user.name.replace(/\s+/g, '-')}.pdf`);
    doc.pipe(res);

    // Create beautiful single-page certificate
    await createBeautifulCertificate(doc, user, eventList, totalHours);

    doc.end();
  } catch (err) {
    console.error('Error generating certificate:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating certificate', error: err.message });
    }
  }
};

// Generate Bulk Certificates (for future implementation)
exports.generateBulkCertificates = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // For now, just return a success message
    // Future implementation would generate multiple certificates
    res.json({ 
      message: 'Bulk certificate generation feature coming soon',
      requestedUsers: userIds.length 
    });
  } catch (err) {
    console.error('Error generating bulk certificates:', err);
    res.status(500).json({ message: 'Error generating bulk certificates', error: err.message });
  }
};

// Students list PDF with proper line-based information design
exports.generateStudentsListPDF = async (req, res) => {
  try {
    const { year } = req.query;
    const query = { role: 'Student' };
    if (year) query.academicYear = year;

    const students = await User.find(query)
      .select('name email department academicYear')
      .sort('name');

    if (!students.length) {
      return res.status(404).json({ message: 'No students found' });
    }

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=students-list-${year || 'all'}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fill('#1e40af')
       .text('Students List', { align: 'center', y: 50 });

    if (year) {
      doc.fontSize(14)
         .font('Helvetica')
         .fill('#64748b')
         .text(`Academic Year: ${year}`, { align: 'center', y: 80 });
    }

    // Table headers
    const startY = 120;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fill('#1e40af');

    doc.text('No.', 50, startY, { width: 40 });
    doc.text('Name', 100, startY, { width: 200 });
    doc.text('Email', 320, startY, { width: 200 });
    doc.text('Department', 540, startY, { width: 150 });
    doc.text('Academic Year', 710, startY, { width: 100 });

    // Header line
    doc.moveTo(50, startY + 20)
       .lineTo(doc.page.width - 50, startY + 20)
       .stroke('#1e40af', 1);

    // Student rows
    students.forEach((student, index) => {
      const y = startY + 40 + (index * 25);
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(50, y - 10, doc.page.width - 100, 25)
           .fill('#f8fafc');
      }

      doc.fontSize(10)
         .font('Helvetica')
         .fill('#1f2937');

      doc.text(`${index + 1}`, 50, y, { width: 40 });
      doc.text(sanitizeText(student.name), 100, y, { width: 200 });
      doc.text(student.email, 320, y, { width: 200 });
      doc.text(student.department || 'N/A', 540, y, { width: 150 });
      doc.text(student.academicYear || 'N/A', 710, y, { width: 100 });
    });

    doc.end();
  } catch (err) {
    console.error('Error generating students list PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating students list PDF', error: err.message });
    }
  }
};

// Students with 40+ hours PDF
exports.generateStudents40HoursPDF = async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' })
      .select('name email department academicYear')
      .sort('name');

    const studentsWithHours = [];

    for (const student of students) {
      const totalHours = await calculateStudentsHours(student._id);
      if (totalHours >= 40) {
        studentsWithHours.push({
          ...student.toObject(),
          totalHours
        });
      }
    }

    if (!studentsWithHours.length) {
      return res.status(404).json({ message: 'No students found with 40+ hours' });
    }

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=students-40-hours.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fill('#1e40af')
       .text('Students with 40+ Community Service Hours', { align: 'center', y: 50 });

    // Table headers
    const startY = 120;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fill('#1e40af');

    doc.text('No.', 50, startY, { width: 40 });
    doc.text('Name', 100, startY, { width: 200 });
    doc.text('Email', 320, startY, { width: 200 });
    doc.text('Department', 540, startY, { width: 120 });
    doc.text('Academic Year', 680, startY, { width: 80 });
    doc.text('Total Hours', 780, startY, { width: 80 });

    // Header line
    doc.moveTo(50, startY + 20)
       .lineTo(doc.page.width - 50, startY + 20)
       .stroke('#1e40af', 1);

    // Student rows
    studentsWithHours.forEach((student, index) => {
      const y = startY + 40 + (index * 25);
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(50, y - 10, doc.page.width - 100, 25)
           .fill('#f8fafc');
      }

      doc.fontSize(10)
         .font('Helvetica')
         .fill('#1f2937');

      doc.text(`${index + 1}`, 50, y, { width: 40 });
      doc.text(sanitizeText(student.name), 100, y, { width: 200 });
      doc.text(student.email, 320, y, { width: 200 });
      doc.text(student.department || 'N/A', 540, y, { width: 120 });
      doc.text(student.academicYear || 'N/A', 680, y, { width: 80 });
      doc.text(`${student.totalHours}`, 780, y, { width: 80 });
    });

    doc.end();
  } catch (err) {
    console.error('Error generating students 40+ hours PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating students 40+ hours PDF', error: err.message });
    }
  }
};