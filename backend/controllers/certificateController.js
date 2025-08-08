const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Event = require('../models/Event');

// Helper to sanitize text for PDF output
const sanitizeText = (text) => {
  if (!text) return '';
  return String(text).replace(/[^a-zA-Z0-9\s.,;!?@'"()\-\u00C0-\u024F]/g, '').trim();
};

// Helper function to calculate hours for all students efficiently
const calculateStudentsHours = async (students) => {
  try {
    const events = await Event.find({ 'attendance.status': 'Approved' });
    const studentHours = {};
    events.forEach(event => {
      event.attendance.forEach(attendance => {
        if (attendance.status === 'Approved') {
          const studentId = attendance.userId.toString();
          if (!studentHours[studentId]) {
            studentHours[studentId] = 0;
          }
          studentHours[studentId] += event.hours || 0;
        }
      });
    });
    return studentHours;
  } catch (error) {
    console.error('Error calculating students hours:', error);
    return {};
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
    let approvedEvents = 0;
    const eventList = [];

    events.forEach(event => {
      const attendance = event.attendance.find(a => 
        a.userId.toString() === user._id.toString() && a.status === 'Approved'
      );
      if (attendance) {
        totalHours += event.hours || 0;
        approvedEvents++;
        eventList.push({
          name: event.title,
          date: new Date(event.date).toLocaleDateString(),
          hours: event.hours || 0
        });
      }
    });

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${user.name}.pdf`);
    doc.pipe(res);

    // Background gradient effect (simple colored rectangles)
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill('#f8f9fa');
    
    // Top accent bar
    doc.rect(0, 0, doc.page.width, 20)
       .fill('#007bff');
    
    // Bottom accent bar
    doc.rect(0, doc.page.height - 20, doc.page.width, 20)
       .fill('#28a745');

    // Certificate border with colors
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(4)
       .stroke('#007bff');

    // Inner border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(2)
       .stroke('#28a745');

    // Corner decorations
    const cornerSize = 15;
    doc.rect(25, 25, cornerSize, cornerSize).fill('#007bff');
    doc.rect(doc.page.width - 40, 25, cornerSize, cornerSize).fill('#007bff');
    doc.rect(25, doc.page.height - 40, cornerSize, cornerSize).fill('#007bff');
    doc.rect(doc.page.width - 40, doc.page.height - 40, cornerSize, cornerSize).fill('#007bff');

    // Decorative line under title
    doc.moveDown(0.5);
    doc.rect(doc.page.width / 2 - 50, doc.y + 10, 100, 2).fill('#28a745');

    // Certificate content
    doc.fontSize(32)
       .font('Helvetica-Bold')
       .fill('#2c3e50')
       .text('Certificate of Completion', { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(18)
       .font('Helvetica')
       .fill('#6c757d')
       .text('This is to certify that', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fill('#007bff')
       .text(user.name, { align: 'center', underline: true });

    doc.moveDown(0.5);
    doc.fontSize(18)
       .font('Helvetica')
       .fill('#6c757d')
       .text('has successfully completed', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fill('#28a745')
       .text(`${totalHours} hours of Community Service`, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(16)
       .font('Helvetica')
       .fill('#6c757d')
       .text(`through participation in ${approvedEvents} approved events.`, { align: 'center' });

    // Event details
    if (eventList.length > 0) {
      doc.moveDown(2);
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fill('#495057')
         .text('Events Completed:', { align: 'center' });

      doc.moveDown(0.5);
      eventList.forEach((event, index) => {
        doc.fontSize(12)
           .font('Helvetica')
           .fill('#6c757d')
           .text(`${index + 1}. ${event.name} - ${event.date} (${event.hours} hours)`, { align: 'center' });
      });
    }

    // Date and signature
    doc.moveDown(3);
    const currentDate = new Date().toLocaleDateString();
    doc.fontSize(14)
       .font('Helvetica')
       .fill('#6c757d')
       .text(`Date: ${currentDate}`, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fill('#007bff')
       .text('_________________________', { align: 'center' });
    doc.fontSize(12)
       .font('Helvetica')
       .fill('#6c757d')
       .text('Authorized Signature', { align: 'center' });

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

    const studentHours = await calculateStudentsHours(students);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 25,
      layout: 'portrait'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=students-list${year ? `-${year}` : ''}.pdf`
    );
    doc.pipe(res);

    // Document title
    doc.fontSize(18).font('Helvetica-Bold').fill('#000')
      .text('CommunityLink Students List', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fill('#000')
      .text(`Academic Year: ${year || 'All Years'}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica').fill('#000')
      .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

    // Summary information
    doc.moveDown(1);
    const totalStudents = students.length;
    const studentsWith40Hours = Object.values(studentHours).filter(h => h >= 40).length;
    const totalHours = Object.values(studentHours).reduce((a, b) => a + b, 0);
    const averageHours = totalStudents > 0 ? (totalHours / totalStudents).toFixed(1) : 0;

    doc.fontSize(11).font('Helvetica-Bold').fill('#000').text('Summary:');
    doc.fontSize(10).font('Helvetica').fill('#000');
    doc.text(`Total Students: ${totalStudents}`);
    doc.text(`Students with 40 Hours: ${studentsWith40Hours}`);
  
    // Table with proper line design
    doc.moveDown(1.5);
    const tableTop = doc.y;
    const tableWidth = doc.page.width - 50;
    const tableLeft = 25;
    
    // Column definitions
    const columns = [
      { x: tableLeft + 5, width: 30, text: 'No.' },
      { x: tableLeft + 40, width: 100, text: 'Name' },
      { x: tableLeft + 145, width: 140, text: 'Email' },
      { x: tableLeft + 290, width: 80, text: 'Department' },
      { x: tableLeft + 375, width: 50, text: 'Hours' },
      { x: tableLeft + 430, width: 70, text: 'Status' }
    ];

    const rowHeight = 80;
    const headerHeight = 25;

    // Draw table border
    doc.rect(tableLeft, tableTop, tableWidth, headerHeight + (students.length * rowHeight)).stroke();

    // Draw header row
    doc.rect(tableLeft, tableTop, tableWidth, headerHeight).stroke();
    doc.fontSize(10).font('Helvetica-Bold').fill('#000');
    columns.forEach(col => {
      doc.text(col.text, col.x, tableTop + 8, { width: col.width });
    });

    // Draw data rows
    let currentY = tableTop + headerHeight;
    students.forEach((student, idx) => {
      // Check if we need a new page
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        
        // Redraw table header on new page
        const newTableTop = 30;
        doc.rect(tableLeft, newTableTop, tableWidth, headerHeight).stroke();
        doc.fontSize(10).font('Helvetica-Bold').fill('#000');
        columns.forEach(col => {
          doc.text(col.text, col.x, newTableTop + 8, { width: col.width });
        });
        currentY = newTableTop + headerHeight;
      }

      // Draw row border
      doc.rect(tableLeft, currentY, tableWidth, rowHeight).stroke();

      // Row content
      const hours = studentHours[student._id.toString()] || 0;
      const status = hours >= 40 ? 'COMPLETED' : 'IN PROGRESS';

      doc.fontSize(9).font('Helvetica').fill('#000');
      doc.text(idx + 1, columns[0].x, currentY + 6, { width: columns[0].width });
      doc.font('Helvetica-Bold').text(sanitizeText(student.name) || 'Unknown', columns[1].x, currentY + 6, { width: columns[1].width });
      doc.font('Helvetica').text(sanitizeText(student.email) || 'No email', columns[2].x, currentY + 6, { width: columns[2].width });
      doc.text(sanitizeText(student.department) || 'Unknown', columns[3].x, currentY + 6, { width: columns[3].width });
      doc.font('Helvetica-Bold').text(hours.toString(), columns[4].x, currentY + 6, { width: columns[4].width });
      doc.font('Helvetica').text(status, columns[5].x, currentY + 6, { width: columns[5].width });

      currentY += rowHeight;
    });

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error generating students list PDF',
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
};