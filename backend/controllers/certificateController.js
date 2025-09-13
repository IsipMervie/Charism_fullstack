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

    // Elegant border design with decorative elements
    // Main border
    doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
       .lineWidth(3)
       .stroke('#1e3a8a');
    
    // Inner decorative border
    doc.rect(50, 50, doc.page.width - 100, doc.page.height - 100)
       .lineWidth(1)
       .stroke('#3b82f6');

    // Corner decorations with gradient effect
    const cornerSize = 20;
    
    // Top-left corner
    doc.rect(40, 40, cornerSize, cornerSize)
       .fill('#1e3a8a');
    doc.rect(45, 45, cornerSize - 10, cornerSize - 10)
       .fill('#3b82f6');
    
    // Top-right corner
    doc.rect(doc.page.width - 60, 40, cornerSize, cornerSize)
       .fill('#1e3a8a');
    doc.rect(doc.page.width - 55, 45, cornerSize - 10, cornerSize - 10)
       .fill('#3b82f6');
    
    // Bottom-left corner
    doc.rect(40, doc.page.height - 60, cornerSize, cornerSize)
       .fill('#1e3a8a');
    doc.rect(45, doc.page.height - 55, cornerSize - 10, cornerSize - 10)
       .fill('#3b82f6');
    
    // Bottom-right corner
    doc.rect(doc.page.width - 60, doc.page.height - 60, cornerSize, cornerSize)
       .fill('#1e3a8a');
    doc.rect(doc.page.width - 55, doc.page.height - 55, cornerSize - 10, cornerSize - 10)
       .fill('#3b82f6');


    // Add logo and certificate header
    await addCertificateHeader(doc, user.name, `${totalHours} hours of Community Service`, totalHours);

    // Event details section - beautifully designed
    if (eventList.length > 0) {
      doc.moveDown(1);
      
      // Add decorative separator with gradient
      doc.moveTo(100, doc.y)
         .lineTo(doc.page.width - 100, doc.y)
         .stroke('#1e3a8a', 2);
      
      doc.moveTo(120, doc.y + 2)
         .lineTo(doc.page.width - 120, doc.y + 2)
         .stroke('#3b82f6', 1);
      
      doc.moveDown(1.5);
      
      // Add section title with decorative background
      const titleText = 'Events Completed';
      const titleWidth = doc.widthOfString(titleText, { fontSize: 18 });
      const titleBoxWidth = titleWidth + 40;
      const titleBoxX = (doc.page.width - titleBoxWidth) / 2;
      
      // Draw title background
      doc.rect(titleBoxX, doc.y - 8, titleBoxWidth, 35)
         .fill('#f8fafc')
         .stroke('#1e3a8a', 2);
      
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fill('#1e3a8a')
         .text(titleText, { align: 'center', y: doc.y });
      
      doc.y += 35;
      doc.moveDown(1);
      
      // Handle different numbers of events with beautiful layouts
      if (eventList.length <= 4) {
        // For few events, use elegant single column with cards
        eventList.forEach((event, index) => {
          const eventDate = new Date(event.date).toLocaleDateString();
          const cardY = doc.y;
          const cardWidth = doc.page.width - 120;
          const cardX = 60;
          
          // Draw event card
          doc.rect(cardX, cardY, cardWidth, 45)
             .fill('#f8fafc')
             .stroke('#e5e7eb', 1);
          
          // Add decorative left border
          doc.rect(cardX, cardY, 5, 45)
             .fill('#1e3a8a');
          
          // Event number
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .fill('#1e3a8a')
             .text(`${index + 1}.`, { 
               x: cardX + 15, 
               y: cardY + 8
             });
          
          // Event name
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .fill('#1f2937')
             .text(event.name, { 
               x: cardX + 35, 
               y: cardY + 8,
               width: cardWidth - 100,
               align: 'left'
             });
          
          // Event details
          doc.fontSize(12)
             .font('Helvetica')
             .fill('#6b7280')
             .text(`${eventDate}`, { 
               x: cardX + 35, 
               y: cardY + 25,
               width: cardWidth - 100,
               align: 'left'
             });
          
          // Hours badge
          doc.rect(cardX + cardWidth - 60, cardY + 8, 50, 20)
             .fill('#dc2626')
             .stroke('#dc2626', 1);
          
          doc.fontSize(11)
             .font('Helvetica-Bold')
             .fill('#ffffff')
             .text(`${event.hours}h`, { 
               x: cardX + cardWidth - 35, 
               y: cardY + 15,
               align: 'center'
             });
          
          doc.y += 55;
        });
      } else {
        // For many events, use compact 2-column layout with cards
        const eventsPerRow = 2;
        const cardWidth = (doc.page.width - 140) / eventsPerRow;
        
        for (let i = 0; i < eventList.length; i += eventsPerRow) {
          const rowEvents = eventList.slice(i, i + eventsPerRow);
          
          rowEvents.forEach((event, index) => {
            const eventX = 70 + (index * (cardWidth + 20));
            const eventDate = new Date(event.date).toLocaleDateString();
            const cardY = doc.y;
            
            // Draw compact event card
            doc.rect(eventX, cardY, cardWidth, 40)
               .fill('#f8fafc')
               .stroke('#e5e7eb', 1);
            
            // Add decorative left border
            doc.rect(eventX, cardY, 4, 40)
               .fill('#1e3a8a');
            
            // Event number and name
            const shortName = event.name.length > 20 ? event.name.substring(0, 20) + '...' : event.name;
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fill('#1f2937')
               .text(`${i + index + 1}. ${shortName}`, { 
                 x: eventX + 10, 
                 y: cardY + 8,
                 width: cardWidth - 50,
                 align: 'left'
               });
            
            // Event date
            doc.fontSize(9)
               .font('Helvetica')
               .fill('#6b7280')
               .text(eventDate, { 
                 x: eventX + 10, 
                 y: cardY + 22,
                 width: cardWidth - 50,
                 align: 'left'
               });
            
            // Hours badge
            doc.rect(eventX + cardWidth - 35, cardY + 8, 25, 15)
               .fill('#dc2626')
               .stroke('#dc2626', 1);
            
            doc.fontSize(9)
               .font('Helvetica-Bold')
               .fill('#ffffff')
               .text(`${event.hours}h`, { 
                 x: eventX + cardWidth - 22, 
                 y: cardY + 13,
                 align: 'center'
               });
          });
          
          // Move to next row
          doc.y += 50;
        }
      }
    }

    // Add spacing before signature area
    doc.moveDown(1.5);
    
    // Add decorative separator
    doc.moveTo(100, doc.y)
       .lineTo(doc.page.width - 100, doc.y)
       .stroke('#1e3a8a', 2);
    
    doc.moveTo(120, doc.y + 2)
       .lineTo(doc.page.width - 120, doc.y + 2)
       .stroke('#3b82f6', 1);
    
    doc.moveDown(1.5);
    
    // Date with decorative background
    const currentDate = new Date().toLocaleDateString();
    const dateText = `Date: ${currentDate}`;
    const dateWidth = doc.widthOfString(dateText, { fontSize: 14 });
    const dateBoxWidth = dateWidth + 30;
    const dateBoxX = (doc.page.width - dateBoxWidth) / 2;
    
    // Draw date background
    doc.rect(dateBoxX, doc.y - 5, dateBoxWidth, 25)
       .fill('#f8fafc')
       .stroke('#1e3a8a', 1);
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fill('#1e3a8a')
       .text(dateText, { align: 'center', y: doc.y });
    
    doc.y += 25;
    doc.moveDown(1.5);

    // Signature area with elegant design
    const signatureBoxWidth = 200;
    const signatureBoxX = (doc.page.width - signatureBoxWidth) / 2;
    
    // Draw signature box
    doc.rect(signatureBoxX, doc.y, signatureBoxWidth, 60)
       .fill('#f8fafc')
       .stroke('#1e3a8a', 2);
    
    // Signature line
    doc.moveTo(signatureBoxX + 20, doc.y + 30)
       .lineTo(signatureBoxX + signatureBoxWidth - 20, doc.y + 30)
       .stroke('#1e3a8a', 2);
    
    // Signature label
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fill('#1e3a8a')
       .text('Authorized Signature', { 
         x: signatureBoxX, 
         y: doc.y + 45,
         width: signatureBoxWidth,
         align: 'center'
       });

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