// backend/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['Admin', 'Staff', 'Student'], required: true },
  userId: { type: String }, // school ID or similar
  academicYear: { type: String }, // for students
  year: { type: String }, // for students (1st Year, 2nd Year, etc.)
  section: { type: String }, // for students
  department: { type: String },   // for students/staff
  emailNotifications: { type: Boolean, default: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false }, // for staff approval
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }, // for staff approval
  approvalDate: { type: Date }, // when staff was approved/rejected
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who approved/rejected
  approvalNotes: { type: String }, // notes from admin about approval/rejection
  profilePicture: {
    data: { type: Buffer },           // The actual image file data
    contentType: { type: String },    // "image/png", "image/jpeg", etc.
    filename: { type: String },       // Original filename
    uploadedAt: { type: Date }
  },
  // Hours tracking for students
  totalHours: { type: Number, default: 0 }, // Total community service hours
  attendanceHours: [{ 
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    hours: { type: Number },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  // Add more fields as needed for your profile
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);