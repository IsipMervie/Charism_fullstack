// backend/models/SchoolSettings.js

const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
  schoolName: { type: String, required: true, default: 'CommunityLink School' },
  contactEmail: { type: String, required: true, default: 'info@communitylink.edu' },
  logo: { type: String }, // filename of uploaded logo image
  brandName: { type: String, required: true, default: 'CommunityLink' }, // Brand name for navbar
  
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