const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Event = require('../models/Event');
const { addCertificateHeader, addLogoAndHeader } = require('../utils/pdfHelpers');

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

    // Create a new PDF document - use portrait for better event listing
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
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

    // Professional border design
    // Outer border
    doc.rect(50, 50, doc.page.width - 100, doc.page.height - 100)
       .lineWidth(2)
       .stroke('#2c3e50');
    
    // Inner border
    doc.rect(60, 60, doc.page.width - 120, doc.page.height - 120)
       .lineWidth(1)
       .stroke('#bdc3c7');

    // Corner decorations
    const cornerSize = 15;
    const cornerColor = '#3498db';
    
    // Top-left corner
    doc.rect(50, 50, cornerSize, cornerSize)
       .fill(cornerColor);
    
    // Top-right corner
    doc.rect(doc.page.width - 65, 50, cornerSize, cornerSize)
       .fill(cornerColor);
    
    // Bottom-left corner
    doc.rect(50, doc.page.height - 65, cornerSize, cornerSize)
       .fill(cornerColor);
    
    // Bottom-right corner
    doc.rect(doc.page.width - 65, doc.page.height - 65, cornerSize, cornerSize)
       .fill(cornerColor);


    // Add logo and certificate header
    await addCertificateHeader(doc, user.name, `${totalHours} hours of Community Service`, totalHours);

    // Event details section - handle multiple events properly
    if (eventList.length > 0) {
      doc.moveDown(1);
      
      // Add a subtle line separator
      doc.moveTo(120, doc.y)
         .lineTo(doc.page.width - 120, doc.y)
         .stroke('#e0e0e0');
      
      doc.moveDown(1);
      
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fill('#495057')
         .text('Events Completed:', { align: 'center' });

      doc.moveDown(0.8);
      
      // Handle different numbers of events with appropriate layouts
      if (eventList.length <= 6) {
        // For few events, use 2-column layout
        const eventsPerRow = 2;
        const startX = 120;
        const eventWidth = (doc.page.width - 240) / eventsPerRow;
        
        for (let i = 0; i < eventList.length; i += eventsPerRow) {
          const rowEvents = eventList.slice(i, i + eventsPerRow);
          
          rowEvents.forEach((event, index) => {
            const eventX = startX + (index * eventWidth);
            const eventDate = new Date(event.date).toLocaleDateString();
            
            // Event name
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fill('#2c3e50')
               .text(`${i + index + 1}. ${event.name}`, { 
                 x: eventX, 
                 y: doc.y,
                 width: eventWidth - 10,
                 align: 'left'
               });
            
            // Event details
            doc.fontSize(10)
               .font('Helvetica')
               .fill('#6c757d')
               .text(`${eventDate} • ${event.hours} hours`, { 
                 x: eventX, 
                 y: doc.y + 15,
                 width: eventWidth - 10,
                 align: 'left'
               });
          });
          
          // Move to next row
          doc.y += 35;
        }
      } else {
        // For many events, use compact 3-column layout
        const eventsPerRow = 3;
        const startX = 100;
        const eventWidth = (doc.page.width - 200) / eventsPerRow;
        
        for (let i = 0; i < eventList.length; i += eventsPerRow) {
          const rowEvents = eventList.slice(i, i + eventsPerRow);
          
          rowEvents.forEach((event, index) => {
            const eventX = startX + (index * eventWidth);
            const eventDate = new Date(event.date).toLocaleDateString();
            
            // Event name (shorter)
            const shortName = event.name.length > 25 ? event.name.substring(0, 25) + '...' : event.name;
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fill('#2c3e50')
               .text(`${i + index + 1}. ${shortName}`, { 
                 x: eventX, 
                 y: doc.y,
                 width: eventWidth - 5,
                 align: 'left'
               });
            
            // Event details (compact)
            doc.fontSize(9)
               .font('Helvetica')
               .fill('#6c757d')
               .text(`${eventDate}`, { 
                 x: eventX, 
                 y: doc.y + 12,
                 width: eventWidth - 5,
                 align: 'left'
               });
            
            doc.fontSize(9)
               .font('Helvetica')
               .fill('#6c757d')
               .text(`${event.hours}h`, { 
                 x: eventX, 
                 y: doc.y + 22,
                 width: eventWidth - 5,
                 align: 'left'
               });
          });
          
          // Move to next row
          doc.y += 35;
        }
      }
    }

    // Add spacing before signature area
    doc.moveDown(1.5);
    
    // Add another subtle line separator
    doc.moveTo(120, doc.y)
       .lineTo(doc.page.width - 120, doc.y)
       .stroke('#e0e0e0');
    
    doc.moveDown(1);
    
    // Date
    const currentDate = new Date().toLocaleDateString();
    doc.fontSize(12)
       .font('Helvetica')
       .fill('#6c757d')
       .text(`Date: ${currentDate}`, { align: 'center' });

    // Signature area
    doc.moveDown(1.5);
    
    // Signature line
    doc.moveTo(doc.page.width / 2 - 60, doc.y)
       .lineTo(doc.page.width / 2 + 60, doc.y)
       .stroke('#007bff');
    
    doc.moveDown(0.3);
    
    doc.fontSize(10)
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

    // Add logo and header
    await addLogoAndHeader(doc, 'CHARISM Students List', `Academic Year: ${year || 'All Years'}`);

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