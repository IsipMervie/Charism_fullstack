// backend/models/AcademicYear.js

const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  year: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        // Validate format like "2021-2022" or "2021-2022-1" for semesters
        return /^\d{4}-\d{4}(-\d)?$/.test(v);
      },
      message: 'Academic year must be in format YYYY-YYYY or YYYY-YYYY-S'
    }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  description: { 
    type: String 
  },
  startDate: { 
    type: Date 
  },
  endDate: { 
    type: Date 
  }
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema); 