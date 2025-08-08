const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Attended', 'Approved', 'Disapproved'], default: 'Pending' },
  timeIn: { type: Date },
  timeOut: { type: Date },
  reflection: { type: String },
  attachment: { type: String }, // filename of uploaded file
  registeredAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  reason: { type: String, required: false }, // Reason for disapproval
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  hours: { type: Number, required: true },
  maxParticipants: { type: Number, default: 0 },
  department: { type: String },
  image: { type: String }, // filename of event image
  status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendance: [attendanceSchema],
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
