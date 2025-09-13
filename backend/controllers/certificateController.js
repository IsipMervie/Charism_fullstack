const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Event = require('../models/Event');
const { addCertificateHeader, addLogoAndHeader } = require('../utils/pdfHelpers');

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

// Helper function to add simple events list like the example
const addEventsWithPagination = async (doc, eventList) => {
  const eventsPerPage = 8; // More events per page for simple layout
  const totalPages = Math.ceil(eventList.length / eventsPerPage);
  
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    // Add new page if not the first page
    if (pageIndex > 0) {
      doc.addPage();
      
      // Simple page header for continuation pages
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fill('#333333')
         .text('Events Completed (continued)', { align: 'center', y: 50 });
      
      doc.moveDown(2);
    }
    
    // Simple section title
    const titleText = pageIndex === 0 ? 'Events Completed:' : `Events Completed (Page ${pageIndex + 1} of ${totalPages}):`;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fill('#333333')
       .text(titleText, { align: 'center' });
    
    doc.moveDown(1);
    
    // Get events for this page
    const startIndex = pageIndex * eventsPerPage;
    const endIndex = Math.min(startIndex + eventsPerPage, eventList.length);
    const pageEvents = eventList.slice(startIndex, endIndex);
    
    // Simple list of events
    pageEvents.forEach((event, index) => {
      const eventDate = new Date(event.date).toLocaleDateString();
      const globalIndex = startIndex + index;
      
      // Simple event entry
      doc.fontSize(14)
         .font('Helvetica')
         .fill('#333333')
         .text(`${globalIndex + 1}. ${event.name} - ${eventDate} (${event.hours} hours)`, { 
           align: 'center'
         });
      
      doc.moveDown(0.5);
    });
    
    // Add spacing after events
    doc.moveDown(1);
  }
};

// Helper function to add beautiful signature area
const addSignatureArea = async (doc) => {
  // Ensure we're on the last page
  // If current page doesn't have enough space, add a new page
  if (doc.y + 200 > doc.page.height - 50) {
    doc.addPage();
  }
  
  // Add elegant spacing before signature area
  doc.moveDown(2);
  
  // Add beautiful decorative separator
  doc.moveTo(80, doc.y)
     .lineTo(doc.page.width - 80, doc.y)
     .stroke('#d4af37', 3);
  
  doc.moveTo(100, doc.y + 3)
     .lineTo(doc.page.width - 100, doc.y + 3)
     .stroke('#1e40af', 1);
  
  doc.moveDown(2);
  
  // Beautiful date section
  const currentDate = new Date().toLocaleDateString();
  const dateText = `Date: ${currentDate}`;
  const dateWidth = doc.widthOfString(dateText, { fontSize: 16 });
  const dateBoxWidth = dateWidth + 50;
  const dateBoxX = (doc.page.width - dateBoxWidth) / 2;
  
  // Draw beautiful date background
  doc.rect(dateBoxX, doc.y - 8, dateBoxWidth, 35)
     .fill('#f0f9ff')
     .stroke('#1e40af', 2);
  
  // Inner highlight
  doc.rect(dateBoxX + 3, doc.y - 5, dateBoxWidth - 6, 29)
     .fill('#ffffff')
     .stroke('#d4af37', 1);
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fill('#1e40af')
     .text(dateText, { align: 'center', y: doc.y });
  
  doc.y += 35;
  doc.moveDown(2);

  // Beautiful signature area
  const signatureBoxWidth = 300;
  const signatureBoxHeight = 80;
  const signatureBoxX = (doc.page.width - signatureBoxWidth) / 2;
  
  // Draw beautiful signature background
  doc.rect(signatureBoxX, doc.y, signatureBoxWidth, signatureBoxHeight)
     .fill('#f8fafc')
     .stroke('#1e40af', 2);
  
  // Inner highlight
  doc.rect(signatureBoxX + 3, doc.y + 3, signatureBoxWidth - 6, signatureBoxHeight - 6)
     .fill('#ffffff')
     .stroke('#d4af37', 1);
  
  // Signature line
  doc.moveTo(signatureBoxX + 30, doc.y + 40)
     .lineTo(signatureBoxX + signatureBoxWidth - 30, doc.y + 40)
     .stroke('#1e40af', 2);
  
  // Decorative dots
  const dotSpacing = 20;
  const dotStartX = signatureBoxX + 40;
  for (let i = 0; i < 5; i++) {
    const dotX = dotStartX + (i * dotSpacing);
    doc.circle(dotX, doc.y + 40, 2)
       .fill('#d4af37');
  }
  
  // Signature label with beautiful styling
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fill('#1e40af')
     .text('Authorized Signature', { 
       x: signatureBoxX, 
       y: doc.y + 55,
       width: signatureBoxWidth,
       align: 'center'
     });
  
  // Add decorative corner
  doc.polygon([signatureBoxX + signatureBoxWidth - 20, doc.y], [signatureBoxX + signatureBoxWidth, doc.y], [signatureBoxX + signatureBoxWidth, doc.y + 20])
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

    // Create a new PDF document - use portrait for better event listing
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 50
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${user.name}.pdf`);
    doc.pipe(res);

    // Beautiful background and borders are now handled in the header function

    // Add logo and certificate header
    await addCertificateHeader(doc, user.name, `${totalHours} hours of Community Service`, totalHours);

    // Event details section with pagination support
    if (eventList.length > 0) {
      // Add events with proper pagination
      await addEventsWithPagination(doc, eventList);
    }

    // Add signature area only on the last page
    await addSignatureArea(doc);

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