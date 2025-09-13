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

// Create a professional certificate design
const createBeautifulCertificate = async (doc, user, eventList, totalHours) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 50;

  // Professional background with subtle pattern
  doc.rect(0, 0, pageWidth, pageHeight)
     .fill('#fefefe');

  // Main decorative border - triple border design
  doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)
     .stroke('#2c3e50', 3);
  
  // Inner decorative border
  doc.rect(margin + 15, margin + 15, pageWidth - 2 * margin - 30, pageHeight - 2 * margin - 30)
     .stroke('#8b4513', 1);
     
  // Outermost decorative border
  doc.rect(margin + 25, margin + 25, pageWidth - 2 * margin - 50, pageHeight - 2 * margin - 50)
     .stroke('#d4af37', 2);

  // Professional header section
  const headerY = margin + 40;
  
  // University seal/logo area (circular)
  const sealX = pageWidth / 2;
  const sealY = headerY + 40;
  const sealRadius = 35;
  
  // Outer ring
  doc.circle(sealX, sealY, sealRadius)
     .fill('#ffffff')
     .stroke('#2c3e50', 3);
     
  // Inner ring
  doc.circle(sealX, sealY, sealRadius - 8)
     .stroke('#d4af37', 2);
     
  // Center area
  doc.circle(sealX, sealY, sealRadius - 15)
     .fill('#f8f9fa');

  // University name around seal
  doc.fontSize(11)
     .font('Times-Bold')
     .fill('#2c3e50')
     .text('UNIVERSITY OF THE ASSUMPTION', {
       x: sealX,
       y: sealY - 25,
       align: 'center',
       width: 180
     });

  // Center text inside seal
  doc.fontSize(7)
     .font('Times-Roman')
     .fill('#2c3e50')
     .text('CHARISM', {
       x: sealX,
       y: sealY - 5,
       align: 'center'
     });
     
  doc.fontSize(6)
     .font('Times-Roman')
     .fill('#666666')
     .text('Est. 1963', {
       x: sealX,
       y: sealY + 8,
       align: 'center'
     });

  // Official certificate title
  doc.fontSize(32)
     .font('Times-Bold')
     .fill('#2c3e50')
     .text('CERTIFICATE OF COMPLETION', {
       x: pageWidth / 2,
       y: headerY + 120,
       align: 'center'
     });

  // Decorative line under title
  doc.moveTo(pageWidth / 2 - 120, headerY + 155)
     .lineTo(pageWidth / 2 + 120, headerY + 155)
     .stroke('#d4af37', 3);

  // Official certification text
  doc.fontSize(16)
     .font('Times-Roman')
     .fill('#2c3e50')
     .text('This is to certify that', {
       x: pageWidth / 2,
       y: headerY + 180,
       align: 'center'
     });

  // Student name with decorative underline
  doc.fontSize(28)
     .font('Times-Bold')
     .fill('#2c3e50')
     .text(sanitizeText(user.name), {
       x: pageWidth / 2,
       y: headerY + 220,
       align: 'center'
     });

  // Decorative line under name
  doc.moveTo(pageWidth / 2 - 150, headerY + 250)
     .lineTo(pageWidth / 2 + 150, headerY + 250)
     .stroke('#d4af37', 2);

  // Completion text
  doc.fontSize(16)
     .font('Times-Roman')
     .fill('#2c3e50')
     .text('has successfully completed', {
       x: pageWidth / 2,
       y: headerY + 270,
       align: 'center'
     });

  // Hours achievement box - professional design
  const achievementY = headerY + 310;
  const boxWidth = 320;
  const boxHeight = 50;
  const boxX = (pageWidth - boxWidth) / 2;
  
  // Shadow effect
  doc.rect(boxX + 3, achievementY + 3, boxWidth, boxHeight)
     .fill('#e0e0e0');
     
  // Main box
  doc.rect(boxX, achievementY, boxWidth, boxHeight)
     .fill('#ffffff')
     .stroke('#2c3e50', 2);
     
  // Inner highlight
  doc.rect(boxX + 2, achievementY + 2, boxWidth - 4, boxHeight - 4)
     .stroke('#d4af37', 1);

  doc.fontSize(22)
     .font('Times-Bold')
     .fill('#c41e3a')
     .text(`${totalHours} HOURS OF COMMUNITY SERVICE`, {
       x: pageWidth / 2,
       y: achievementY + 15,
       align: 'center'
     });

  // Events section - professional table
  const eventsStartY = achievementY + 90;
  
  // Section title
  doc.fontSize(18)
     .font('Times-Bold')
     .fill('#2c3e50')
     .text('COMMUNITY SERVICE EVENTS', {
       x: pageWidth / 2,
       y: eventsStartY,
       align: 'center'
     });

  // Professional table
  const tableY = eventsStartY + 40;
  const tableWidth = pageWidth - 2 * margin - 40;
  const tableX = margin + 20;
  const rowHeight = 18;
  const maxRows = 8;
  
  // Table header
  doc.rect(tableX, tableY, tableWidth, rowHeight + 10)
     .fill('#2c3e50');
     
  doc.fontSize(11)
     .font('Times-Bold')
     .fill('#ffffff');
     
  doc.text('No.', tableX + 10, tableY + 8, { width: 30 });
  doc.text('Event Name', tableX + 50, tableY + 8, { width: 280 });
  doc.text('Date', tableX + 340, tableY + 8, { width: 80 });
  doc.text('Hours', tableX + 430, tableY + 8, { width: 50 });

  // Table rows
  eventList.slice(0, maxRows).forEach((event, index) => {
    const rowY = tableY + rowHeight + 10 + (index * rowHeight);
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.rect(tableX, rowY, tableWidth, rowHeight)
         .fill('#f8f9fa');
    }

    doc.fontSize(9)
       .font('Times-Roman')
       .fill('#2c3e50');
    
    doc.text(`${index + 1}.`, tableX + 10, rowY + 3, { width: 30 });
    
    const eventName = event.name.length > 40 ? event.name.substring(0, 40) + '...' : event.name;
    doc.text(eventName, tableX + 50, rowY + 3, { width: 280 });
    doc.text(event.date, tableX + 340, rowY + 3, { width: 80 });
    doc.text(`${event.hours}`, tableX + 430, rowY + 3, { width: 50 });
  });

  // Show additional events count if more than 8
  if (eventList.length > maxRows) {
    const additionalY = tableY + rowHeight + 10 + (maxRows * rowHeight) + 5;
    doc.fontSize(9)
       .font('Times-Italic')
       .fill('#666666')
       .text(`... and ${eventList.length - maxRows} additional events`, {
         x: pageWidth / 2,
         y: additionalY,
         align: 'center'
       });
  }

  // Professional signature section
  const signatureY = eventsStartY + 250;
  
  // Date section
  doc.fontSize(12)
     .font('Times-Bold')
     .fill('#2c3e50')
     .text(`Date of Issue: ${new Date().toLocaleDateString('en-US', { 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric' 
     })}`, {
       x: pageWidth / 2,
       y: signatureY,
       align: 'center'
     });

  // Signature area
  const signatureAreaY = signatureY + 50;
  const signatureWidth = 250;
  const signatureX = pageWidth - margin - signatureWidth - 20;
  
  // Signature line
  doc.moveTo(signatureX, signatureAreaY)
     .lineTo(signatureX + signatureWidth, signatureAreaY)
     .stroke('#2c3e50', 2);

  // Signature label
  doc.fontSize(11)
     .font('Times-Bold')
     .fill('#2c3e50')
     .text('Authorized Signature', {
       x: signatureX + signatureWidth / 2,
       y: signatureAreaY + 8,
       align: 'center'
     });

  // Official seal area (bottom left)
  const officialSealY = signatureAreaY - 10;
  const officialSealX = margin + 30;
  
  doc.circle(officialSealX, officialSealY, 25)
     .fill('#ffffff')
     .stroke('#d4af37', 2);
     
  doc.fontSize(8)
     .font('Times-Bold')
     .fill('#2c3e50')
     .text('OFFICIAL', {
       x: officialSealX,
       y: officialSealY - 5,
       align: 'center'
     });
     
  doc.fontSize(7)
     .font('Times-Roman')
     .fill('#666666')
     .text('SEAL', {
       x: officialSealX,
       y: officialSealY + 5,
       align: 'center'
     });

  // Professional corner decorations
  const cornerSize = 25;
  const cornerColor = '#d4af37';
  
  // Top-left corner
  doc.polygon([margin + 30, margin + 30], [margin + 30 + cornerSize, margin + 30], [margin + 30, margin + 30 + cornerSize])
     .fill(cornerColor);
     
  // Top-right corner  
  doc.polygon([pageWidth - margin - 30, margin + 30], [pageWidth - margin - 30 - cornerSize, margin + 30], [pageWidth - margin - 30, margin + 30 + cornerSize])
     .fill(cornerColor);
     
  // Bottom-left corner
  doc.polygon([margin + 30, pageHeight - margin - 30], [margin + 30 + cornerSize, pageHeight - margin - 30], [margin + 30, pageHeight - margin - 30 - cornerSize])
     .fill(cornerColor);
     
  // Bottom-right corner
  doc.polygon([pageWidth - margin - 30, pageHeight - margin - 30], [pageWidth - margin - 30 - cornerSize, pageHeight - margin - 30], [pageWidth - margin - 30, pageHeight - margin - 30 - cornerSize])
     .fill(cornerColor);

  // Professional border patterns
  // Top border pattern
  for (let i = margin + 50; i < pageWidth - margin - 50; i += 20) {
    doc.circle(i, margin + 35, 2)
       .fill(cornerColor);
  }
  
  // Bottom border pattern
  for (let i = margin + 50; i < pageWidth - margin - 50; i += 20) {
    doc.circle(i, pageHeight - margin - 35, 2)
       .fill(cornerColor);
  }
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