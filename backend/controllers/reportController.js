const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Event = require('../models/Event');

// Helper function to create a simple, aligned table with box borders
const createSimpleTable = (doc, headers, data, startY) => {
  const fontSize = 10;
  const rowPadding = 4;
  const colWidths = [30, 120, 100, 80, 60, 60, 60]; // Adjusted for 7 columns (removed time)
  const leftMargin = 50;
  let y = startY;

  // Draw header with boxes
  doc.fontSize(fontSize).font('Helvetica-Bold').fillColor('#2c3e50');
  let x = leftMargin;
  let headerHeight = fontSize + 2 * rowPadding;
  headers.forEach((header, i) => {
    doc.rect(x, y, colWidths[i], headerHeight).stroke();
    doc.text(header, x + rowPadding, y + rowPadding, { width: colWidths[i] - 2 * rowPadding, align: 'left' });
    x += colWidths[i];
  });
  y += headerHeight;

  // Draw rows with boxes
  doc.fontSize(fontSize).font('Helvetica').fillColor('#34495e');
  data.forEach(row => {
    x = leftMargin;
    // Find max lines in this row for height
    let maxLines = 1;
    row.forEach((cell, i) => {
      const lines = doc.heightOfString(cell || '', { width: colWidths[i] - 2 * rowPadding, align: 'left' }) / fontSize;
      if (lines > maxLines) maxLines = lines;
    });
    const rowHeight = fontSize * maxLines + 2 * rowPadding;

    // Page break if needed
    if (y + rowHeight > doc.page.height - 50) {
      doc.addPage();
      y = 60;
    }

    row.forEach((cell, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(cell || '', x + rowPadding, y + rowPadding, { width: colWidths[i] - 2 * rowPadding, align: 'left' });
      x += colWidths[i];
    });
    y += rowHeight;
  });

  return y;
};

// Helper function to create a simple list
const createSimpleList = (doc, items, startY) => {
  const fontSize = 11;
  const lineHeight = 16;
  const leftMargin = 60;
  
  doc.fontSize(fontSize).fillColor('#2c3e50');
  let currentY = startY;

  items.forEach((item) => {
    // Check if we need a new page
    if (currentY > doc.page.height - 120) {
      doc.addPage();
      currentY = 60;
    }

    doc.text(`• ${item}`, leftMargin, currentY);
    currentY += lineHeight;
  });

  return currentY;
};

// Students By Year PDF Report
const studentsByYearPDF = async (req, res) => {
  try {
    console.log('PDF Generation Request Query:', req.query);
    console.log('PDF Generation Request Headers:', req.headers);
    console.log('PDF Generation Request User:', req.user);
    console.log('User Role:', req.user?.role);
    console.log('User ID:', req.user?.id);
    
    const { year, department, yearLevel, section, only40Hours, hoursMin, hoursMax } = req.query;
    if (!year) {
      console.log('Missing year parameter');
      return res.status(400).json({ message: 'Year parameter is required' });
    }

    // Build query with filters
    let query = { 
      role: 'Student',
      academicYear: year,
      isVerified: true  // Only include students with verified emails
    };

    if (department) query.department = department;
    if (yearLevel) query.year = yearLevel;
    if (section) query.section = section;
    
    console.log('Database Query:', query);
    console.log('Filters applied:', { department, yearLevel, section, hoursMin, hoursMax });

    // Get students for the specific year with filters
    const students = await User.find(query).select('name email department academicYear year section').sort('name');
    console.log('Students found:', students.length);
    console.log('Sample student data:', students.slice(0, 2));
    console.log('Query used:', JSON.stringify(query, null, 2));

    if (!students.length) {
      console.log('No students found for query:', query);
      return res.status(404).json({ message: 'No students found for this year with the specified filters' });
    }

    // Calculate total hours for each student
    const studentsWithHours = await Promise.all(
      students.map(async (student) => {
        const events = await Event.find({
          'attendance.userId': student._id
        });

        let totalHours = 0;
        events.forEach(event => {
          const attendance = event.attendance.find(a => 
            a.userId.toString() === student._id.toString()
          );
          if (attendance && attendance.status === 'Approved') {
            totalHours += event.hours || 0;
          }
        });

        return {
          ...student.toObject(),
          totalHours
        };
      })
    );

    // Apply hours range filter
    let filteredStudents = studentsWithHours;
    
    console.log('Hours filters:', { hoursMin, hoursMax, type: typeof hoursMin, typeMax: typeof hoursMax });
    
    if (hoursMin && hoursMin !== '') {
      const minHours = parseInt(hoursMin);
      if (isNaN(minHours)) {
        console.log('Invalid hoursMin:', hoursMin);
        return res.status(400).json({ message: 'Invalid minimum hours value' });
      }
      filteredStudents = filteredStudents.filter(s => (s.totalHours || 0) >= minHours);
      console.log('Applied min hours filter:', minHours, 'Students remaining:', filteredStudents.length);
    }
    
    if (hoursMax && hoursMax !== '') {
      const maxHours = parseInt(hoursMax);
      if (isNaN(maxHours)) {
        console.log('Invalid hoursMax:', hoursMax);
        return res.status(400).json({ message: 'Invalid maximum hours value' });
      }
      filteredStudents = filteredStudents.filter(s => (s.totalHours || 0) <= maxHours);
      console.log('Applied max hours filter:', maxHours, 'Students remaining:', filteredStudents.length);
    }

    // Apply 40+ hours filter if requested (this takes precedence over hours range)
    if (only40Hours === 'true') {
      filteredStudents = filteredStudents.filter(s => s.totalHours >= 40);
    }

    console.log('Final filtered students count:', filteredStudents.length);
    
    if (!filteredStudents.length) {
      console.log('No students found after all filters');
      return res.status(404).json({ message: 'No students found matching the criteria' });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=students-by-year-${year}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('CHARISM', { align: 'center' });
    
    doc.moveDown(1);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2c3e50')
       .text(`Students Report - Academic Year ${year}`, { align: 'center' });

    doc.fontSize(12).font('Helvetica').fillColor('#7f8c8d')
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

    // Add filter information
    const filters = [];
    if (department) filters.push(`Department: ${department}`);
    if (yearLevel) filters.push(`Year Level: ${yearLevel}`);
    if (section) filters.push(`Section: ${section}`);
    if (hoursMin && hoursMax) {
      filters.push(`Hours Range: ${hoursMin}-${hoursMax}`);
    } else if (hoursMin) {
      filters.push(`Min Hours: ${hoursMin}+`);
    } else if (hoursMax) {
      filters.push(`Max Hours: ${hoursMax}`);
    }
    if (only40Hours === 'true') filters.push('40+ Hours Only');

    if (filters.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d')
         .text(`Filters: ${filters.join(', ')}`, { align: 'center' });
    }

    doc.moveDown(2);

    // Create table
    const tableHeaders = ['No.', 'Name', 'Email', 'Department', 'Year', 'Section', 'Hours'];
    const tableData = filteredStudents.map((student, index) => [
      (index + 1).toString(),
      student.name || 'N/A',
      student.email || 'N/A',
      student.department || 'N/A',
      student.year || 'N/A',
      student.section || 'N/A',
      (student.totalHours || 0).toString()
    ]);

    createSimpleTable(doc, tableHeaders, tableData, doc.y);

    doc.moveDown(10);

    const totalStudents = filteredStudents.length;
    const studentsWith40Hours = filteredStudents.filter(s => s.totalHours >= 40).length;
    const totalHours = filteredStudents.reduce((sum, s) => sum + s.totalHours, 0);
    const averageHours = totalStudents > 0 ? (totalHours / totalStudents).toFixed(1) : 0;

    const summaryItems = [
      `Total Students: ${totalStudents}`,
      `Total Hours: ${totalHours}`,
      `Students Completed: ${studentsWith40Hours}`,
      `Average Hours per Student: ${averageHours}`
    ];

    createSimpleList(doc, summaryItems, doc.y);

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor('#95a5a6')
       .text('', { align: 'center' });

    doc.end();

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error generating students by year PDF', 
        error: err.message 
      });
    } else {
      res.end();
    }
  }
};

// Students with 40+ Hours PDF Report
const students40HoursPDF = async (req, res) => {
  try {
    const { department, yearLevel, section, academicYear } = req.query;

    // Build query with filters
    let query = { role: 'Student' };
    if (department) query.department = department;
    if (yearLevel) query.year = yearLevel;
    if (section) query.section = section;
    if (academicYear) query.academicYear = academicYear;

    // Get all students with filters
    const students = await User.find(query)
      .select('name email department academicYear year section')
      .sort('name');

    // Calculate total hours for each student
    const studentsWithHours = await Promise.all(
      students.map(async (student) => {
        const events = await Event.find({
          'attendance.userId': student._id
        });

        let totalHours = 0;
        events.forEach(event => {
          const attendance = event.attendance.find(a => 
            a.userId.toString() === student._id.toString()
          );
          if (attendance && attendance.status === 'Approved') {
            totalHours += event.hours || 0;
          }
        });

        return {
          ...student.toObject(),
          totalHours
        };
      })
    );

    // Filter students with 40+ hours
    const students40Plus = studentsWithHours.filter(s => s.totalHours >= 40);

    if (!students40Plus.length) {
      return res.status(404).json({ message: 'No students with 40+ hours found matching the criteria' });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=students-40-plus-hours.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('CHARISM', { align: 'center' });
    
    doc.moveDown(1);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Students Report (Completed)', { align: 'center' });

    doc.fontSize(12).font('Helvetica').fillColor('#7f8c8d')
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

    // Add filter information
    const filters = [];
    if (department) filters.push(`Department: ${department}`);
    if (yearLevel) filters.push(`Year Level: ${yearLevel}`);
    if (section) filters.push(`Section: ${section}`);
    if (academicYear) filters.push(`Academic Year: ${academicYear}`);

    if (filters.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d')
         .text(`Filters: ${filters.join(', ')}`, { align: 'center' });
    }

    doc.moveDown(1);

    // Summary
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#27ae60')
       .text(`Total Students: ${students40Plus.length}`, { align: 'center' });

    doc.moveDown(2);

    // Create table
    const tableHeaders = ['No.', 'Name', 'Email', 'Department', 'Year', 'Section', 'Hours'];
    const tableData = students40Plus.map((student, index) => [
      (index + 1).toString(),
      student.name || 'N/A',
      student.email || 'N/A',
      student.department || 'N/A',
      student.year || 'N/A',
      student.section || 'N/A',
      (student.totalHours || 0).toString()
    ]);

    createSimpleTable(doc, tableHeaders, tableData, doc.y);

    doc.moveDown(2);

    const totalStudents = studentsWithHours.length;
    const totalHours = students40Plus.reduce((sum, s) => sum + s.totalHours, 0);
    const averageHours = students40Plus.length > 0 ? (totalHours / students40Plus.length).toFixed(1) : 0;
    const percentage = totalStudents > 0 ? ((students40Plus.length / totalStudents) * 100).toFixed(1) : 0;

    doc.end();

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error generating students 40+ hours PDF', 
        error: err.message 
      });
    } else {
      res.end();
    }
  }
};

// Event Attendance PDF Report
const eventAttendancePDF = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, department, yearLevel, section } = req.query;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Get event details
    const event = await Event.findById(eventId).populate('attendance.userId', 'name email department year section');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Filter attendance based on query parameters
    let attendedParticipants = event.attendance;

    // Filter by status
    if (status) {
      attendedParticipants = attendedParticipants.filter(a => a.status === status);
    } else {
      // Default: only approved/attended
      attendedParticipants = attendedParticipants.filter(a => 
        a.status === 'Approved' || a.status === 'Attended'
      );
    }

    // Filter by user attributes
    if (department || yearLevel || section) {
      attendedParticipants = attendedParticipants.filter(a => {
        const user = a.userId;
        if (!user) return false;
        
        if (department && user.department !== department) return false;
        if (yearLevel && user.year !== yearLevel) return false;
        if (section && user.section !== section) return false;
        
        return true;
      });
    }

    if (!attendedParticipants.length) {
      return res.status(404).json({ message: 'No participants found matching the criteria' });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=event-attendance-${eventId}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('CHARISM', { align: 'center' });
    

    doc.moveDown(1);

    // Event details
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Event Attendance Report', { align: 'center' });

    doc.fontSize(12).font('Helvetica').fillColor('#7f8c8d')
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

    // Add filter information
    const filters = [];
    if (status) filters.push(`Status: ${status}`);
    if (department) filters.push(`Department: ${department}`);
    if (yearLevel) filters.push(`Year Level: ${yearLevel}`);
    if (section) filters.push(`Section: ${section}`);

    if (filters.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d')
         .text(`Filters: ${filters.join(', ')}`, { align: 'center' });
    }

    doc.moveDown(1);

    // Event information
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('Event Information:');

    const eventInfo = [
      `Event Title: ${event.title || 'N/A'}`,
      `Date: ${event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}`,
      `Location: ${event.location || 'N/A'}`,
      `Hours: ${event.hours || 0}`,
      `Total Attended: ${attendedParticipants.length}`
    ];

    createSimpleList(doc, eventInfo, doc.y);

    doc.moveDown(2);

    // Attendance table (only attended participants)
    if (attendedParticipants.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
         .text('Attended Participants:');

      const tableHeaders = ['No.', 'Name', 'Email', 'Department', 'Year', 'Section', 'Status'];
      const tableData = attendedParticipants.map((attendance, index) => [
        (index + 1).toString(),
        attendance.userId?.name || 'N/A',
        attendance.userId?.email || 'N/A',
        attendance.userId?.department || 'N/A',
        attendance.userId?.year || 'N/A',
        attendance.userId?.section || 'N/A',
        attendance.status || 'Attended'
      ]);

      createSimpleTable(doc, tableHeaders, tableData, doc.y);
    } else {
      doc.fontSize(12).font('Helvetica').fillColor('#7f8c8d')
         .text('No attended participants found for this event.');
    }

    doc.end();

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error generating event attendance PDF', 
        error: err.message 
      });
    } else {
      res.end();
    }
  }
};

// Event Attendance CSV Report
const eventAttendanceCSV = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Get event details
    const event = await Event.findById(eventId).populate('attendance.userId', 'name email department year section');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Filter only attended/approved participants
    const attendedParticipants = event.attendance.filter(a => 
      a.status === 'Approved' || a.status === 'Attended'
    );

    // Create CSV content
    const csvHeaders = [
      'No.',
      'Name',
      'Email', 
      'Department',
      'Year',
      'Section',
      'Status',
      'Time In',
      'Time Out'
    ];

    const csvData = attendedParticipants.map((attendance, index) => [
      (index + 1).toString(),
      attendance.userId?.name || 'N/A',
      attendance.userId?.email || 'N/A',
      attendance.userId?.department || 'N/A',
      attendance.userId?.year || 'N/A',
      attendance.userId?.section || 'N/A',
      attendance.status || 'Attended',
      attendance.timeIn ? new Date(attendance.timeIn).toLocaleString() : 'N/A',
      attendance.timeOut ? new Date(attendance.timeOut).toLocaleString() : 'N/A'
    ]);

    // Convert to CSV format
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event-attendance-${eventId}.csv`);
    
    res.send(csvContent);

  } catch (err) {
    res.status(500).json({ 
      message: 'Error generating event attendance CSV', 
      error: err.message 
    });
  }
};

// Event List PDF Report
const eventListPDF = async (req, res) => {
  try {
    console.log('eventListPDF called with query:', req.query);
    const { status, dateFrom, dateTo, location, department } = req.query;

    // Build query with filters
    let query = {};
    
    if (location) query.location = { $regex: location, $options: 'i' };
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    console.log('MongoDB query:', query);
    const events = await Event.find(query).sort({ date: 1 });
    console.log('Found events:', events.length);

    if (!events.length) {
      return res.status(404).json({ message: 'No events found matching the criteria' });
    }

    // Helper function to determine event status (same as frontend)
    const getEventStatus = (event) => {
      // First check if admin has manually marked the event as completed
      if (event.status === 'Completed') {
        return 'completed';
      }
      
      const now = new Date();
      const eventDate = new Date(event.date);
      const eventStartTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
      const eventEndTime = new Date(`${eventDate.toDateString()} ${event.endTime || '23:59'}`);
      
      // Check if event time has completely passed
      if (eventEndTime < now) {
        // Event time has passed - automatically mark as completed
        return 'completed';
      } else if (eventStartTime > now) {
        // Event hasn't started yet - it's upcoming
        return 'upcoming';
      } else if (eventStartTime <= now && eventEndTime > now) {
        // Event is currently happening - it's ongoing
        return 'ongoing';
      } else {
        // Event date has passed but time logic didn't catch it - it's past
        return 'past';
      }
    };

    // Filter by status if specified
    let filteredEvents = events;
    if (status) {
      filteredEvents = events.filter(event => getEventStatus(event) === status);
    }

    // Filter by department if specified (check event department restrictions)
    if (department) {
      filteredEvents = filteredEvents.filter(event => {
        // Check if event is for all departments
        if (event.isForAllDepartments) {
          return true; // Event is accessible to all departments
        }
        
        // Check if event has specific departments array
        if (event.departments && event.departments.length > 0) {
          return event.departments.includes(department);
        }
        
        // Check if event has single department
        if (event.department) {
          return event.department === department;
        }
        
        // Event has no department restriction
        return true;
      });
    }

    if (!filteredEvents.length) {
      return res.status(404).json({ message: 'No events found matching the criteria' });
    }

    // Prepare table data
    const tableHeaders = [
      'No.', 'Title', 'Date', 'Location', 'Slots', 'Hours', 'Status'
    ];
    const tableData = filteredEvents.map((event, idx) => {
      const maxParticipants = typeof event.maxParticipants === 'number' ? event.maxParticipants : 0;
      const attendanceCount = Array.isArray(event.attendance) ? event.attendance.length : 0;
      const availableSlots = maxParticipants > 0 ? maxParticipants - attendanceCount : 0;
      const eventStatus = getEventStatus(event);

      return [
        (idx + 1).toString(),
        event.title || '',
        event.date ? new Date(event.date).toLocaleDateString() : '',
        event.location || '',
        availableSlots > 0 ? availableSlots : 'No slots',
        event.hours || '0',
        eventStatus.charAt(0).toUpperCase() + eventStatus.slice(1)
      ];
    });

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=event-list.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50')
      .text('CHARISM', { align: 'center' });
    doc.moveDown(1);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2c3e50')
      .text('Event List', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#7f8c8d')
      .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

    // Add filter information
    const filters = [];
    if (status) filters.push(`Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`);
    if (dateFrom) filters.push(`From: ${new Date(dateFrom).toLocaleDateString()}`);
    if (dateTo) filters.push(`To: ${new Date(dateTo).toLocaleDateString()}`);
    if (location) filters.push(`Location: ${location}`);
    if (department) filters.push(`Department: ${department}`);

    if (filters.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d')
         .text(`Filters: ${filters.join(', ')}`, { align: 'center' });
    }

    doc.moveDown(2);

    // Table
    createSimpleTable(doc, tableHeaders, tableData, doc.y);

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating event list PDF', error: err.message });
    } else {
      res.end();
    }
  }
};

// Export all report functions
module.exports = {
  studentsByYearPDF,
  students40HoursPDF,
  eventAttendancePDF,
  eventListPDF
};