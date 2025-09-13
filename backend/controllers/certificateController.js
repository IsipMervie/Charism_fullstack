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

// Helper function to add ALL events on ONE PAGE ONLY
const addEventsWithPagination = async (doc, eventList) => {
  // NO PAGINATION - ALL EVENTS ON ONE PAGE
  
  // Simple section title
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fill('#333333')
     .text('Events Completed:', { align: 'center' });
  
  doc.moveDown(0.5);
  
  // Calculate font size based on number of events to fit on one page
  let fontSize = 12;
  let lineSpacing = 0.3;
  
  // Adjust font size for many events
  if (eventList.length > 20) {
    fontSize = 8;
    lineSpacing = 0.2;
  } else if (eventList.length > 10) {
    fontSize = 10;
    lineSpacing = 0.25;
  }
  
  // Add ALL events in compact format on ONE PAGE
  eventList.forEach((event, index) => {
    const eventDate = new Date(event.date).toLocaleDateString();
    
    // Very compact event entry
    doc.fontSize(fontSize)
       .font('Helvetica')
       .fill('#333333')
       .text(`${index + 1}. ${event.name} - ${eventDate} (${event.hours}h)`, { 
         align: 'center'
       });
    
    doc.moveDown(lineSpacing);
  });
  
  // Add small spacing after events
  doc.moveDown(0.5);
};

// Helper function to add simple signature line
const addSignatureArea = async (doc) => {
  // Add spacing before signature area
  doc.moveDown(2);
  
  // Simple date
  const currentDate = new Date().toLocaleDateString();
  doc.fontSize(12)
     .font('Helvetica')
     .fill('#333333')
     .text(`Date: ${currentDate}`, { align: 'center' });
  
  doc.moveDown(2);

  // Just a simple line for signature
  doc.moveTo(doc.page.width / 2 - 100, doc.y)
     .lineTo(doc.page.width / 2 + 100, doc.y)
     .stroke('#333333', 1);
  
  doc.moveDown(0.5);
  
  // Simple signature label
  doc.fontSize(12)
     .font('Helvetica')
     .fill('#333333')
     .text('Authorized Signature', { align: 'center' });
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