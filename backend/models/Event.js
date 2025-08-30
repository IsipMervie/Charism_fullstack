const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Attended', 'Approved', 'Disapproved'], default: 'Pending' },
  timeIn: { type: Date },
  timeOut: { type: Date },
  registeredAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  reason: { type: String, required: false }, // Reason for disapproval
  registrationApproved: { type: Boolean, default: false }, // New field for registration approval
  registrationApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who approved registration
  registrationApprovedAt: { type: Date }, // When registration was approved
  // File upload fields for documentation
  documentation: {
    files: [{
      data: { type: Buffer, required: true },           // The actual file data
      contentType: { type: String, required: true },    // "application/pdf", "application/msword", etc.
      filename: { type: String, required: true },       // Stored filename
      originalName: { type: String, required: true },   // Original filename
      fileSize: { type: Number, required: true },
      uploadDate: { type: Date, default: Date.now },
      description: { type: String, default: '' }
    }],
    lastUpdated: { type: Date, default: Date.now }
  },
  privacySettings: {
    isAnonymous: { type: Boolean, default: false },
    shareWithStaff: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, required: true },
  hours: { type: Number, required: true },
  maxParticipants: { type: Number, default: 0 },
  department: { type: String }, // Single department for backward compatibility
  departments: [{ type: String }], // New field for multiple departments
  isForAllDepartments: { type: Boolean, default: false }, // New field to indicate if event is for all departments
  image: {
    data: { type: Buffer },           // The actual image file data
    contentType: { type: String },    // "image/png", "image/jpeg", etc.
    filename: { type: String },       // Stored filename
    uploadedAt: { type: Date, default: Date.now }
  },
  status: { type: String, enum: ['Active', 'Completed', 'Cancelled', 'Disabled'], default: 'Active' },
  isVisibleToStudents: { type: Boolean, default: true }, // New field to control visibility to students
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendance: [attendanceSchema],
  requiresApproval: { type: Boolean, default: true }, // New field to control if registration requires approval
  publicRegistrationToken: { type: String, unique: true, sparse: true }, // Unique token for public registration links
  isPublicRegistrationEnabled: { type: Boolean, default: false }, // Enable/disable public registration
}, { timestamps: true });

// Generate unique registration token before saving
eventSchema.pre('save', function(next) {
  if (!this.publicRegistrationToken) {
    this.publicRegistrationToken = this.generateRegistrationToken();
  }
  next();
});

// Method to generate unique registration token
eventSchema.methods.generateRegistrationToken = function() {
  return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

module.exports = mongoose.model('Event', eventSchema);
