// backend/controllers/adminController.js

const User = require('../models/User');
const Event = require('../models/Event');
const Message = require('../models/Message');

// Send admin notification
const sendAdminNotification = async (subject, message, adminEmail = null) => {
  try {
    const sendEmail = require('../utils/sendEmail');
    
    const emailContent = `
      <h2>Admin Notification</h2>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${message}
      </div>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
    `;
    
    const targetEmail = adminEmail || process.env.ADMIN_EMAIL || 'admin@charism.edu.ph';
    await sendEmail(targetEmail, `Admin Notification: ${subject}`, '', emailContent, true);
    
    console.log(`✅ Admin notification sent: ${subject}`);
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

// Send system alert
const sendSystemAlert = async (alertType, message, severity = 'medium') => {
  try {
    const sendEmail = require('../utils/sendEmail');
    
    const severityColors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };
    
    const color = severityColors[severity] || '#ffc107';
    
    const emailContent = `
      <h2 style="color: ${color};">System Alert - ${alertType}</h2>
      <p><strong>Severity:</strong> <span style="color: ${color}; font-weight: bold;">${severity.toUpperCase()}</span></p>
      <p><strong>Alert Type:</strong> ${alertType}</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid ${color};">
        ${message}
      </div>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>System:</strong> CHARISM Community Service Management System</p>
    `;
    
    await sendEmail(
      process.env.ADMIN_EMAIL || 'admin@charism.edu.ph',
      `System Alert: ${alertType} - ${severity.toUpperCase()}`,
      '',
      emailContent,
      true
    );
    
    console.log(`✅ System alert sent: ${alertType} (${severity})`);
  } catch (error) {
    console.error('Error sending system alert:', error);
  }
};

// Admin Dashboard Analytics
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalAttendance = await Event.aggregate([
      { $unwind: '$attendance' },
      { $count: 'total' }
    ]);
    const totalMessages = await Message.countDocuments();

    res.json({
      totalUsers,
      totalEvents,
      totalAttendance: totalAttendance[0]?.total || 0,
      totalMessages
    });
    
    // Send admin notification for dashboard access
    await sendAdminNotification(
      'Admin Dashboard Accessed',
      `Admin dashboard was accessed by user ID: ${req.user.id} at ${new Date().toLocaleString()}`
    );
  } catch (err) {
    // Send system alert for errors
    await sendSystemAlert(
      'Admin Dashboard Error',
      `Error fetching dashboard analytics: ${err.message}`,
      'high'
    );
    
    res.status(500).json({ message: 'Error fetching dashboard analytics', error: err.message });
  }
};

// Add systemAlert trigger function
exports.triggerSystemAlert = async (req, res) => {
  try {
    const { alertType, message, severity } = req.body;
    
    await sendSystemAlert(alertType, message, severity);
    
    res.json({ message: 'System alert sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending system alert', error: err.message });
  }
};

// Get all users (with optional search/filter)
exports.getAllUsers = async (req, res) => {
  try {
    console.log('🔍 Admin getAllUsers requested');
    
    // Check database connection first
    const { mongoose } = require('../config/db');
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not ready, attempting to connect...');
      await mongoose.connection.asPromise();
    }
    
    const { search, role } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }
    
    console.log('📊 Fetching users with query:', query);
    const users = await User.find(query).select('-password').lean();
    console.log(`✅ Found ${users.length} users`);
    
    res.json(users);
  } catch (err) {
    console.error('❌ Error in getAllUsers:', err);
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};

// Update a user by ID (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

// Get students by year (with total approved hours)
exports.getStudentsByYear = async (req, res) => {
  try {
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('Database not connected, returning empty data');
      return res.json({});
    }

    const students = await User.find({ 
      role: 'Student',
      isVerified: true  // Only include students with verified emails
    })
      .select('name email department academicYear year section')
      .sort('academicYear name');

    // Compute total approved hours per student - OPTIMIZED VERSION
    const studentIds = students.map(s => s._id);
    
    // Single aggregation query to get all student hours at once
    const studentHoursData = await Event.aggregate([
      {
        $match: {
          'attendance.userId': { $in: studentIds },
          'attendance.status': 'Approved'
        }
      },
      {
        $unwind: '$attendance'
      },
      {
        $match: {
          'attendance.userId': { $in: studentIds },
          'attendance.status': 'Approved'
        }
      },
      {
        $group: {
          _id: '$attendance.userId',
          totalHours: { $sum: '$hours' }
        }
      }
    ]);

    // Create a map for quick lookup
    const hoursMap = {};
    studentHoursData.forEach(item => {
      hoursMap[item._id.toString()] = item.totalHours || 0;
    });

    // Map students with their hours
    const studentsWithHours = students.map(student => ({
      ...student.toObject(),
      totalHours: hoursMap[student._id.toString()] || 0
    }));

    // Group by academic year and include totalHours
    const studentsByYear = {};
    studentsWithHours.forEach((student) => {
      const year = student.academicYear || 'Unknown';
      if (!studentsByYear[year]) {
        studentsByYear[year] = [];
      }
      studentsByYear[year].push(student);
    });

    res.json(studentsByYear);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students by year', error: err.message });
  }
};

// Get filter options from existing student data for Students by Year page
exports.getStudentsByYearFilterOptions = async (req, res) => {
  try {
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('Database not connected, returning empty filter options');
      return res.json({
        departments: [],
        years: [],
        sections: [],
        academicYears: []
      });
    }

    const students = await User.find({ 
      role: 'Student',
      isVerified: true  // Only include students with verified emails
    })
      .select('department year section academicYear')
      .lean();

    const departments = [...new Set(students.map(s => s.department).filter(Boolean))].sort();
    const years = [...new Set(students.map(s => s.year).filter(Boolean))].sort();
    const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();
    const academicYears = [...new Set(students.map(s => s.academicYear).filter(Boolean))].sort();

    res.json({
      departments,
      years,
      sections,
      academicYears
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching filter options', error: err.message });
  }
};

// Get students with 40+ hours
exports.getStudents40Hours = async (req, res) => {
  try {
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('Database not connected, returning empty data');
      return res.json([]);
    }

    const students = await User.find({ role: 'Student' })
      .select('name email department academicYear year section')
      .sort('name');
    
    // Calculate total hours for each student - OPTIMIZED VERSION
    const studentIds = students.map(s => s._id);
    
    // Single aggregation query to get all student hours at once
    const studentHoursData = await Event.aggregate([
      {
        $match: {
          'attendance.userId': { $in: studentIds },
          'attendance.status': 'Approved'
        }
      },
      {
        $unwind: '$attendance'
      },
      {
        $match: {
          'attendance.userId': { $in: studentIds },
          'attendance.status': 'Approved'
        }
      },
      {
        $group: {
          _id: '$attendance.userId',
          totalHours: { $sum: '$hours' }
        }
      }
    ]);

    // Create a map for quick lookup
    const hoursMap = {};
    studentHoursData.forEach(item => {
      hoursMap[item._id.toString()] = item.totalHours || 0;
    });

    // Map students with their hours
    const studentsWithHours = students.map(student => ({
      ...student.toObject(),
      totalHours: hoursMap[student._id.toString()] || 0
    }));

    // Filter students with 40+ hours
    const students40Plus = studentsWithHours.filter(s => s.totalHours >= 40);
    
    res.json(students40Plus);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students with 40+ hours', error: err.message });
  }
};

// Get all messages (contact us)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting message', error: err.message });
  }
};

// Get events with populated user data for admin documentation
exports.getEventsWithUserData = async (req, res) => {
  try {
    console.log('🔍 Admin getEventsWithUserData requested');
    
    // Check database connection first
    const { mongoose } = require('../config/db');
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not ready, attempting to connect...');
      await mongoose.connection.asPromise();
    }
    
    // Get events with populated user data in attendance
    const events = await Event.find({})
      .populate('attendance.userId', 'name email firstName lastName department year section')
      .select('title description date startTime endTime time location hours maxParticipants department departments isForAllDepartments status isVisibleToStudents requiresApproval publicRegistrationToken isPublicRegistrationEnabled createdAt attendance')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Found ${events.length} events with populated user data`);
    
    // Debug: Check if user data is populated
    if (events.length > 0 && events[0].attendance && events[0].attendance.length > 0) {
      console.log('🔍 Sample attendance user data:', events[0].attendance[0].userId);
      console.log('🔍 User data type:', typeof events[0].attendance[0].userId);
    }
    
    res.json(events);
  } catch (err) {
    console.error('❌ Error in getEventsWithUserData:', err);
    res.status(500).json({ message: 'Error fetching events with user data', error: err.message });
  }
};

// Get all events (with optional search/filter)
exports.getAllEvents = async (req, res) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add pagination and optimization
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 100); // Cap at 100 items
    
    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort({ date: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean() for better performance
      
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
};

// Get pending staff approvals
exports.getPendingStaffApprovals = async (req, res) => {
  try {
    const pendingStaff = await User.find({ 
      role: 'Staff', 
      approvalStatus: 'pending' 
    })
    .select('name email userId department createdAt')
    .sort({ createdAt: -1 })
    .lean(); // Use lean() for better performance
    
    res.json(pendingStaff);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending staff approvals', error: err.message });
  }
};

// Approve staff member
exports.approveStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { approvalNotes } = req.body;
    const adminId = req.user.id;

    const staffMember = await User.findById(userId);
    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    if (staffMember.role !== 'Staff') {
      return res.status(400).json({ message: 'User is not a staff member' });
    }

    staffMember.isApproved = true;
    staffMember.approvalStatus = 'approved';
    staffMember.approvalDate = new Date();
    staffMember.approvedBy = adminId;
    staffMember.approvalNotes = approvalNotes || '';

    await staffMember.save();

    // Send approval email
    const sendEmail = require('../utils/sendEmail');
    const { getStaffApprovalTemplate } = require('../utils/emailTemplates');
    
    const emailContent = getStaffApprovalTemplate(staffMember.name, true);
    await sendEmail(staffMember.email, 'Account Approved - CHARISM', '', emailContent, true);

    // Send userApproval notification to admin
    try {
      const adminNotificationContent = `
        <h2>User Approval Notification</h2>
        <p>A staff member has been approved:</p>
        <ul>
          <li><strong>Name:</strong> ${staffMember.name}</li>
          <li><strong>Email:</strong> ${staffMember.email}</li>
          <li><strong>Role:</strong> ${staffMember.role}</li>
          <li><strong>Approved By:</strong> Admin</li>
          <li><strong>Approval Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      `;
      
      await sendEmail(
        process.env.ADMIN_EMAIL || 'admin@charism.edu.ph',
        'User Approval Notification - CHARISM',
        '',
        adminNotificationContent,
        true
      );
    } catch (emailError) {
      console.error('Error sending userApproval notification:', emailError);
    }

    res.json({ message: 'Staff member approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error approving staff member', error: err.message });
  }
};

// Reject staff member
exports.rejectStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { approvalNotes } = req.body;
    const adminId = req.user.id;

    const staffMember = await User.findById(userId);
    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    if (staffMember.role !== 'Staff') {
      return res.status(400).json({ message: 'User is not a staff member' });
    }

    staffMember.isApproved = false;
    staffMember.approvalStatus = 'rejected';
    staffMember.approvalDate = new Date();
    staffMember.approvedBy = adminId;
    staffMember.approvalNotes = approvalNotes || '';

    await staffMember.save();

    // Send rejection email
    const sendEmail = require('../utils/sendEmail');
    const { getStaffApprovalTemplate } = require('../utils/emailTemplates');
    
    const emailContent = getStaffApprovalTemplate(staffMember.name, false);
    await sendEmail(staffMember.email, 'Account Application Rejected - CHARISM', '', emailContent, true);

    res.json({ message: 'Staff member rejected successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting staff member', error: err.message });
  }
};

// Approve user account
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { approvalData } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user status
    user.status = 'approved';
    user.approvedBy = req.user.userId || req.user.id || req.user._id;
    user.approvedAt = new Date();
    
    if (approvalData && approvalData.role) {
      user.role = approvalData.role;
    }
    
    await user.save();
    
    // Send approval email
    const sendEmail = require('../utils/sendEmail');
    const { getRegistrationTemplate } = require('../utils/emailTemplates');
    
    const emailContent = getRegistrationTemplate(user.name, 'Account Approved', new Date().toLocaleDateString());
    await sendEmail(user.email, 'Account Approved - CHARISM', '', emailContent, true);
    
    res.json({ message: 'User approved successfully' });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ message: 'Error approving user', error: err.message });
  }
};