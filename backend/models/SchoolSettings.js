// backend/models/SchoolSettings.js

const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
  schoolName: { type: String, required: true, default: 'CHARISM School' },
  contactEmail: { type: String, required: true, default: 'info@charism.edu' },
  logo: { type: String }, // logo filename for local storage
  brandName: { type: String, required: true, default: 'CHARISM' }, // Brand name for navbar
  
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