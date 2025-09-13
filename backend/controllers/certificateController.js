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

// Create a simple, clean certificate design
const createBeautifulCertificate = async (doc, user, eventList, totalHours) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 60;

  // Clean white background
  doc.rect(0, 0, pageWidth, pageHeight)
     .fill('#ffffff');

  // Simple border
  doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)
     .stroke('#000000', 2);

  // Header - University name
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fill('#000000')
     .text('UNIVERSITY OF THE ASSUMPTION', {
       x: pageWidth / 2,
       y: margin + 30,
       align: 'center'
     });

  doc.fontSize(12)
     .font('Helvetica')
     .fill('#666666')
     .text('Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission', {
       x: pageWidth / 2,
       y: margin + 55,
       align: 'center'
     });

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fill('#000000')
     .text('CHARISM', {
       x: pageWidth / 2,
       y: margin + 80,
       align: 'center'
     });

  // Certificate title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fill('#000000')
     .text('Certificate of Completion', {
       x: pageWidth / 2,
       y: margin + 120,
       align: 'center'
     });

  // Simple line
  doc.moveTo(pageWidth / 2 - 100, margin + 150)
     .lineTo(pageWidth / 2 + 100, margin + 150)
     .stroke('#000000', 1);

  // Certificate text
  doc.fontSize(14)
     .font('Helvetica')
     .fill('#000000')
     .text('This is to certify that', {
       x: pageWidth / 2,
       y: margin + 180,
       align: 'center'
     });

  // Student name
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fill('#000000')
     .text(sanitizeText(user.name), {
       x: pageWidth / 2,
       y: margin + 210,
       align: 'center'
     });

  // Simple line under name
  doc.moveTo(pageWidth / 2 - 120, margin + 240)
     .lineTo(pageWidth / 2 + 120, margin + 240)
     .stroke('#000000', 1);

  // Completion text
  doc.fontSize(14)
     .font('Helvetica')
     .fill('#000000')
     .text('has successfully completed', {
       x: pageWidth / 2,
       y: margin + 260,
       align: 'center'
     });

  // Hours
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fill('#000000')
     .text(`${totalHours} hours of Community Service`, {
       x: pageWidth / 2,
       y: margin + 290,
       align: 'center'
     });

  // Events section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fill('#000000')
     .text('Events Completed:', {
       x: pageWidth / 2,
       y: margin + 330,
       align: 'center'
     });

  // Events list - simple format
  let currentY = margin + 360;
  eventList.slice(0, 10).forEach((event, index) => {
    const eventText = `${index + 1}. ${event.name} - ${event.date} (${event.hours} hours)`;
    
    // Check if we need to wrap text
    const textWidth = doc.widthOfString(eventText, { fontSize: 10 });
    if (textWidth > pageWidth - 2 * margin - 40) {
      // Split long event names
      const eventName = event.name.length > 50 ? event.name.substring(0, 50) + '...' : event.name;
      const shortEventText = `${index + 1}. ${eventName} - ${event.date} (${event.hours} hours)`;
      
      doc.fontSize(10)
         .font('Helvetica')
         .fill('#000000')
         .text(shortEventText, {
           x: margin + 30,
           y: currentY,
           width: pageWidth - 2 * margin - 60
         });
    } else {
      doc.fontSize(10)
         .font('Helvetica')
         .fill('#000000')
         .text(eventText, {
           x: margin + 30,
           y: currentY,
           width: pageWidth - 2 * margin - 60
         });
    }
    
    currentY += 15;
  });

  // Show more events if needed
  if (eventList.length > 10) {
    doc.fontSize(10)
       .font('Helvetica-Italic')
       .fill('#666666')
       .text(`... and ${eventList.length - 10} more events`, {
         x: margin + 30,
         y: currentY + 10
       });
  }

  // Date
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fill('#000000')
     .text(`Date: ${new Date().toLocaleDateString()}`, {
       x: pageWidth / 2,
       y: pageHeight - margin - 80,
       align: 'center'
     });

  // Signature line
  doc.moveTo(pageWidth / 2 - 100, pageHeight - margin - 50)
     .lineTo(pageWidth / 2 + 100, pageHeight - margin - 50)
     .stroke('#000000', 1);

  // Signature label
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fill('#000000')
     .text('Authorized Signature', {
       x: pageWidth / 2,
       y: pageHeight - margin - 30,
       align: 'center'
     });
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