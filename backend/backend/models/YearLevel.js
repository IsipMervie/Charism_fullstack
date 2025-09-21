// backend/models/YearLevel.js

const mongoose = require('mongoose');

const yearLevelSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('YearLevel', yearLevelSchema); 