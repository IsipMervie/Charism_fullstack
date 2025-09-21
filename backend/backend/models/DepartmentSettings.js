// backend/models/DepartmentSettings.js

const mongoose = require('mongoose');

const departmentSettingsSchema = new mongoose.Schema({
  departmentName: { type: String, required: true },
  head: { type: String }, // Name of department head
  contactEmail: { type: String },
  // Add more department-specific settings as needed
}, { timestamps: true });

module.exports = mongoose.model('DepartmentSettings', departmentSettingsSchema);