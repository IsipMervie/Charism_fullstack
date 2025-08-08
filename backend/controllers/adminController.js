// backend/controllers/adminController.js

const User = require('../models/User');
const Event = require('../models/Event');
const Message = require('../models/Message');

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
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard analytics', error: err.message });
  }
};

// Get all users (with optional search/filter)
exports.getAllUsers = async (req, res) => {
  try {
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
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (err) {
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
    const students = await User.find({ role: 'Student' })
      .select('name email department academicYear year section')
      .sort('academicYear name');

    // Compute total approved hours per student
    const studentsWithHours = await Promise.all(
      students.map(async (student) => {
        const events = await Event.find({ 'attendance.userId': student._id }).select('hours attendance');
        let totalHours = 0;
        events.forEach((event) => {
          const attendance = event.attendance.find((a) => a.userId.toString() === student._id.toString());
          if (attendance && attendance.status === 'Approved') {
            totalHours += event.hours || 0;
          }
        });
        return { ...student.toObject(), totalHours };
      })
    );

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

// Get students with 40+ hours
exports.getStudents40Hours = async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' })
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

// Get all events (with optional search/filter)
exports.getAllEvents = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const events = await Event.find(query);
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
    }).select('-password').sort({ createdAt: -1 });
    
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
    const emailContent = `
      <p>Hello ${staffMember.name},</p>
      <p>Your CommunityLink account has been approved by an administrator.</p>
      <p>You can now log in to your account and access the system.</p>
      ${approvalNotes ? `<p><strong>Notes:</strong> ${approvalNotes}</p>` : ''}
      <p>Thank you for your patience.</p>
    `;

    await sendEmail(staffMember.email, 'Account Approved', 'Your account has been approved', emailContent);

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
    const emailContent = `
      <p>Hello ${staffMember.name},</p>
      <p>Your CommunityLink account application has been reviewed and unfortunately, it has been rejected.</p>
      ${approvalNotes ? `<p><strong>Reason:</strong> ${approvalNotes}</p>` : ''}
      <p>If you believe this is an error, please contact the administrator.</p>
    `;

    await sendEmail(staffMember.email, 'Account Application Rejected', 'Your account application has been rejected', emailContent);

    res.json({ message: 'Staff member rejected successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting staff member', error: err.message });
  }
};