// backend/models/SchoolSettings.js

const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
  schoolName: { type: String, required: true, default: 'CHARISM School' },
  contactEmail: { type: String, required: true, default: 'info@charism.edu' },
  logo: {
    data: { type: Buffer },           // The actual logo file data
    contentType: { type: String },    // "image/png", "image/jpeg", etc.
    filename: { type: String },       // Stored filename
    uploadedAt: { type: Date }
  },
  

  
  // Academic Years management
  academicYears: [{
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Sections management
  sections: [{
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Year Levels management
  yearLevels: [{
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Departments management
  departments: [{
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Add more global settings as needed
}, { timestamps: true });

module.exports = mongoose.model('SchoolSettings', schoolSettingsSchema);