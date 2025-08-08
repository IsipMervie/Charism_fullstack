// backend/controllers/eventController.js

const Event = require('../models/Event');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Get All Events
exports.getAllEvents = async (req, res) => {
  try {
    console.log('Fetching all events...');
    const events = await Event.find()
      .populate('createdBy', 'name')
      .populate('attendance.userId', 'name email department academicYear');
    console.log(`Found ${events.length} events`);
    res.json(events);
  } catch (err) {
    console.error('Error in getAllEvents:', err);
    res.status(500).json({ message: 'Error fetching events.', error: err.message });
  }
};

// Get Event Details
exports.getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('createdBy', 'name')
      .populate('attendance.userId', 'name email department academicYear');
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json(event);
  } catch (err) {
    console.error('Error in getEventDetails:', err);
    res.status(500).json({ message: 'Error fetching event.', error: err.message });
  }
};

// Create Event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, time, location, hours, maxParticipants, department } = req.body;
    
    const eventData = {
      title,
      description,
      date,
      time,
      location,
      hours: parseInt(hours) || 0,
      maxParticipants: parseInt(maxParticipants) || 0,
      department,
      createdBy: req.user.userId,
      status: 'Active'
    };

    // Handle image upload
    if (req.file) {
      eventData.image = req.file.filename;
    }

    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json(event);
  } catch (err) {
    console.error('Error in createEvent:', err);
    res.status(500).json({ message: 'Error creating event.', error: err.message });
  }
};

// Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, date, time, location, hours, maxParticipants, department, status } = req.body;
    
    const updateData = {
      title,
      description,
      date,
      time,
      location,
      hours: parseInt(hours) || 0,
      maxParticipants: parseInt(maxParticipants) || 0,
      department,
      status
    };

    // Handle image upload
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      updateData,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.json(event);
  } catch (err) {
    console.error('Error in updateEvent:', err);
    res.status(500).json({ message: 'Error updating event.', error: err.message });
  }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Delete associated image if exists
    if (event.image) {
      const imagePath = path.join(__dirname, '..', 'uploads', event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Error in deleteEvent:', err);
    res.status(500).json({ message: 'Error deleting event.', error: err.message });
  }
};

// Join Event
exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if event is active
    if (event.status !== 'Active') {
      return res.status(400).json({ message: 'Event is not active.' });
    }

    // Check if user is already registered
    const existingAttendance = event.attendance.find(
      a => a.userId.toString() === req.user.userId
    );

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already registered for this event.' });
    }

    // Check if event is full
    if (event.maxParticipants > 0 && event.attendance.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full.' });
    }

    // Add user to attendance
    event.attendance.push({
      userId: req.user.userId,
      status: 'Pending',
      registeredAt: new Date()
    });

    await event.save();
    res.json({ message: 'Successfully joined event.' });
  } catch (err) {
    console.error('Error in joinEvent:', err);
    res.status(500).json({ message: 'Error joining event.', error: err.message });
  }
};

// Time In
exports.timeIn = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    
    // Verify user is trying to time in for themselves
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Can only time in for yourself.' });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(
      a => a.userId.toString() === userId
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Not registered for this event.' });
    }

    if (attendance.timeIn) {
      return res.status(400).json({ message: 'Already timed in.' });
    }

    attendance.timeIn = new Date();
    await event.save();

    res.json({ message: 'Time in recorded successfully.' });
  } catch (err) {
    console.error('Error in timeIn:', err);
    res.status(500).json({ message: 'Error recording time in.', error: err.message });
  }
};

// Time Out
exports.timeOut = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    
    // Verify user is trying to time out for themselves
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Can only time out for yourself.' });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(
      a => a.userId.toString() === userId
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Not registered for this event.' });
    }

    if (!attendance.timeIn) {
      return res.status(400).json({ message: 'Must time in before timing out.' });
    }

    if (attendance.timeOut) {
      return res.status(400).json({ message: 'Already timed out.' });
    }

    attendance.timeOut = new Date();
    await event.save();

    res.json({ message: 'Time out recorded successfully.' });
  } catch (err) {
    console.error('Error in timeOut:', err);
    res.status(500).json({ message: 'Error recording time out.', error: err.message });
  }
};

// Get Event Participants
exports.getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email department academicYear');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.json(event.attendance);
  } catch (err) {
    console.error('Error in getEventParticipants:', err);
    res.status(500).json({ message: 'Error fetching participants.', error: err.message });
  }
};

// Approve Attendance
exports.approveAttendance = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(a => a.userId.toString() === userId);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // Check if student has timed out
    if (!attendance.timeOut) {
      return res.status(400).json({ 
        message: 'Cannot approve attendance. Student has not timed out yet.' 
      });
    }

    // Check if student has uploaded a reflection (either text or attachment)
    const hasReflection = attendance.reflection && attendance.reflection.trim() !== '';
    const hasAttachment = attendance.attachment && attendance.attachment.trim() !== '';
    
    if (!hasReflection && !hasAttachment) {
      return res.status(400).json({ 
        message: 'Cannot approve attendance. Student has not uploaded a reflection or attachment yet.' 
      });
    }

    attendance.status = 'Approved';
    attendance.approvedBy = req.user.userId;
    attendance.approvedAt = new Date();

    // Calculate hours for community service
    const approvedUser = await User.findById(userId);
    if (approvedUser) {
      approvedUser.communityServiceHours = (approvedUser.communityServiceHours || 0) + event.hours;
      await approvedUser.save();
    }

    await event.save();
    res.json({ message: 'Attendance approved successfully.' });
  } catch (err) {
    console.error('Error in approveAttendance:', err);
    res.status(500).json({ message: 'Error approving attendance.', error: err.message });
  }
};


// Disapprove Attendance
exports.disapproveAttendance = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { reason } = req.body; // Get the reason from the request body
    
    // Check if the reason is provided
    if (!reason) {
      return res.status(400).json({ message: 'Reason for disapproval is required.' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(
      a => a.userId.toString() === userId
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    attendance.status = 'Disapproved';
    attendance.reason = reason; // Store the reason for disapproval
    attendance.approvedBy = req.user.userId;
    attendance.approvedAt = new Date();

    await event.save();
    res.json({ message: 'Attendance disapproved successfully.' });
  } catch (err) {
    console.error('Error in disapproveAttendance:', err);
    res.status(500).json({ message: 'Error disapproving attendance.', error: err.message });
  }
};

// Upload Reflection/Attachment
exports.uploadReflection = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { reflection } = req.body;
    const file = req.file ? req.file.filename : null;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    // Check if user has joined the event
    const attendance = event.attendance.find(a => a.userId && a.userId.toString() === userId);
    if (!attendance) {
      return res.status(404).json({ message: 'User not joined.' });
    }
    
    // Update reflection and attachment
    attendance.reflection = reflection;
    if (file) {
      attendance.attachment = file;
    }
    
    await event.save();
    res.json({ 
      message: 'Reflection/attachment uploaded successfully.',
      attachment: file || null
    });
    
  } catch (err) {
    console.error('Error in uploadReflection:', err);
    
    // Handle multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum file size is 50MB.' 
      });
    }
    
    if (err.message && err.message.includes('File type')) {
      return res.status(400).json({ 
        message: err.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Error uploading reflection/attachment. Please try again.' 
    });
  }
};

// Download Reflection/Attachment
exports.downloadReflection = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    
    const attendance = event.attendance.find(a => a.userId && a.userId.toString() === userId);
    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found.' });
    }
    
    // Handle reflection text download (when no attachment exists)
    if (attendance.reflection && attendance.reflection.trim() !== '' && (!attendance.attachment || attendance.attachment.trim() === '')) {
      const reflectionText = attendance.reflection;
      
      // Create a proper text file with UTF-8 encoding and proper line endings
      const textContent = `Reflection Text\n================\n\n${reflectionText}\n\nGenerated on: ${new Date().toLocaleString()}`;
      const buffer = Buffer.from(textContent, 'utf8');
      
      console.log('Downloading reflection text:', {
        length: buffer.length,
        content: textContent.substring(0, 100) + '...'
      });
      
      res.setHeader('Content-Disposition', 'attachment; filename="reflection.txt"');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
      return;
    }
    
    // Handle attachment download (prioritize attachment over reflection text)
    if (!attendance.attachment || attendance.attachment.trim() === '') {
      return res.status(404).json({ message: 'No attachment found.' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', attendance.attachment);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server.' });
    }

    // Get file stats for better error handling
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return res.status(400).json({ message: 'File is empty.' });
    }

    // Set proper headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${attendance.attachment}"`);
    res.setHeader('Content-Length', stats.size);
    
    // Set appropriate MIME type based on file extension
    const ext = path.extname(attendance.attachment).toLowerCase();
    const mimeTypes = {
      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      '.odt': 'application/vnd.oasis.opendocument.text',
      
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      
      // Videos
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      
      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      
      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      
      // Spreadsheets
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
      
      // Presentations
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Code files
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.py': 'text/x-python',
      '.java': 'text/x-java-source',
      '.cpp': 'text/x-c++src',
      '.c': 'text/x-csrc',
      '.php': 'application/x-httpd-php',
      '.sql': 'application/sql',
      
      // Other common formats
      '.md': 'text/markdown',
      '.log': 'text/plain',
      '.ini': 'text/plain',
      '.conf': 'text/plain',
      '.config': 'text/plain'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Handle stream errors
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file.' });
      }
    });

  } catch (err) {
    console.error('Error in downloadReflection:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error downloading attachment.' });
    }
  }
};

// Toggle Event Availability
exports.toggleEventAvailability = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    event.status = event.status === 'Active' ? 'Completed' : 'Active';
    await event.save();

    res.json({ 
      message: `Event ${event.status.toLowerCase()} successfully.`,
      status: event.status
    });
  } catch (err) {
    console.error('Error in toggleEventAvailability:', err);
    res.status(500).json({ message: 'Error toggling event status.', error: err.message });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    // Get basic counts with error handling
    const totalUsers = await User.countDocuments().catch(() => 0);
    const totalEvents = await Event.countDocuments().catch(() => 0);
    
    // Calculate attendance with better error handling
    let totalAttendance = 0;
    try {
      const events = await Event.find({}, 'attendance');
      totalAttendance = events.reduce((sum, event) => {
        if (event.attendance && Array.isArray(event.attendance)) {
          return sum + event.attendance.length;
        }
        return sum;
      }, 0);
    } catch (attendanceError) {
      console.log('Error calculating attendance:', attendanceError);
      totalAttendance = 0;
    }

    // Get additional analytics
    let studentsCount = 0;
    let staffCount = 0;
    let adminCount = 0;
    
    try {
      studentsCount = await User.countDocuments({ role: 'Student' });
      staffCount = await User.countDocuments({ role: 'Staff' });
      adminCount = await User.countDocuments({ role: 'Admin' });
    } catch (roleError) {
      console.log('Error counting users by role:', roleError);
    }

    // Get events by status
    let activeEvents = 0;
    let completedEvents = 0;
    
    try {
      activeEvents = await Event.countDocuments({ status: 'Active' });
      completedEvents = await Event.countDocuments({ status: 'Completed' });
    } catch (eventStatusError) {
      console.log('Error counting events by status:', eventStatusError);
    }

    // Get approved attendance count
    let approvedAttendance = 0;
    try {
      const eventsWithAttendance = await Event.find({ 'attendance.status': 'Approved' });
      approvedAttendance = eventsWithAttendance.reduce((sum, event) => {
        if (event.attendance && Array.isArray(event.attendance)) {
          return sum + event.attendance.filter(att => att.status === 'Approved').length;
        }
        return sum;
      }, 0);
    } catch (approvedError) {
      console.log('Error calculating approved attendance:', approvedError);
    }

    // Get total hours from approved events
    let totalHours = 0;
    try {
      const approvedEvents = await Event.find({ 'attendance.status': 'Approved' });
      totalHours = approvedEvents.reduce((sum, event) => {
        if (event.hours && event.attendance) {
          const approvedCount = event.attendance.filter(att => att.status === 'Approved').length;
          return sum + (event.hours * approvedCount);
        }
        return sum;
      }, 0);
    } catch (hoursError) {
      console.log('Error calculating total hours:', hoursError);
    }

    // Get recent activity (last 30 days)
    let recentEvents = 0;
    let recentUsers = 0;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      recentEvents = await Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
      recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    } catch (recentError) {
      console.log('Error calculating recent activity:', recentError);
    }

    res.json({
      // Basic counts
      totalUsers,
      totalEvents,
      totalAttendance,
      
      // User breakdown
      studentsCount,
      staffCount,
      adminCount,
      
      // Event breakdown
      activeEvents,
      completedEvents,
      
      // Attendance analytics
      approvedAttendance,
      totalHours,
      
      // Recent activity
      recentEvents,
      recentUsers,
      
      // Success flag
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data.',
      message: err.message,
      success: false,
      timestamp: new Date().toISOString()
    });
  }
};

// Students By Year
exports.getStudentsByYear = async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' });
    
    // Calculate total hours for each student
    const studentsWithHours = await Promise.all(
      students.map(async (student) => {
        // Find all events where this student has approved attendance
        const events = await Event.find({
          'attendance.userId': student._id,
          'attendance.status': 'Approved'
        });

        let totalHours = 0;
        events.forEach(event => {
          const attendance = event.attendance.find(a => 
            a.userId.toString() === student._id.toString() && a.status === 'Approved'
          );
          if (attendance) {
            totalHours += event.hours || 0;
          }
        });

        return {
          ...student.toObject(),
          totalHours
        };
      })
    );

    // Group by year
    const byYear = {};
    studentsWithHours.forEach(student => {
      const year = student.academicYear || 'Unknown';
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(student);
    });
    
    res.json(byYear);
  } catch (err) {
    console.error('Error in getStudentsByYear:', err);
    res.status(500).json({ message: 'Error fetching students by year.', error: err.message });
  }
};

// Students with 40+ Hours
exports.getStudents40Hours = async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' });
    
    // Calculate total hours for each student
    const studentsWithHours = await Promise.all(
      students.map(async (student) => {
        // Find all events where this student has approved attendance
        const events = await Event.find({
          'attendance.userId': student._id,
          'attendance.status': 'Approved'
        });

        let totalHours = 0;
        events.forEach(event => {
          const attendance = event.attendance.find(a => 
            a.userId.toString() === student._id.toString() && a.status === 'Approved'
          );
          if (attendance) {
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
    const result = studentsWithHours.filter(s => s.totalHours >= 40);
    res.json(result);
  } catch (err) {
    console.error('Error in getStudents40Hours:', err);
    res.status(500).json({ message: 'Error fetching students with 40 hours.', error: err.message });
  }
};
