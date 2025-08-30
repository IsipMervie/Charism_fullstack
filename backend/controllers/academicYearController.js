// backend/controllers/academicYearController.js

const AcademicYear = require('../models/AcademicYear');

// Get all academic years
exports.getAcademicYears = async (req, res) => {
  try {
    console.log('Getting academic years...');
    
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('Database not connected, returning empty academic years list');
      return res.json([]);
    }

    console.log('AcademicYear model available:', !!AcademicYear);
    console.log('Mongoose connection state:', require('mongoose').connection.readyState);

    // Check if model is available
    if (!AcademicYear) {
      console.error('AcademicYear model not available');
      return res.status(500).json({ message: 'AcademicYear model not available', error: 'Database model not loaded' });
    }

    const academicYears = await AcademicYear.find().sort({ year: -1 });
    console.log('Academic years fetched successfully');
    res.json(academicYears);
  } catch (err) {
    console.error('Error fetching academic years:', err);
    res.status(500).json({ message: 'Error fetching academic years', error: err.message });
  }
};

// Get active academic years (for registration dropdown)
exports.getActiveAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.find({ isActive: true }).sort({ year: -1 });
    res.json(academicYears);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching active academic years', error: err.message });
  }
};

// Create new academic year
exports.createAcademicYear = async (req, res) => {
  try {
    const { year, description, startDate, endDate } = req.body;
    
    console.log('Creating academic year:', year);
    console.log('AcademicYear model available:', !!AcademicYear);
    console.log('Mongoose connection state:', require('mongoose').connection.readyState);

    // Check if model is available
    if (!AcademicYear) {
      console.error('AcademicYear model not available');
      return res.status(500).json({ message: 'AcademicYear model not available', error: 'Database model not loaded' });
    }
    
    // Check if academic year already exists
    const existingYear = await AcademicYear.findOne({ year });
    if (existingYear) {
      return res.status(400).json({ message: 'Academic year already exists' });
    }

    const academicYear = new AcademicYear({
      year,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: true
    });

    await academicYear.save();
    console.log('Academic year saved successfully');
    res.status(201).json({ message: 'Academic year created successfully', academicYear });
  } catch (err) {
    console.error('Error creating academic year:', err);
    res.status(500).json({ message: 'Error creating academic year', error: err.message });
  }
};

// Update academic year
exports.updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, description, startDate, endDate, isActive } = req.body;

    const academicYear = await AcademicYear.findById(id);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    // Check if year is being changed and if it already exists
    if (year && year !== academicYear.year) {
      const existingYear = await AcademicYear.findOne({ year });
      if (existingYear) {
        return res.status(400).json({ message: 'Academic year already exists' });
      }
    }

    academicYear.year = year || academicYear.year;
    academicYear.description = description || academicYear.description;
    academicYear.startDate = startDate ? new Date(startDate) : academicYear.startDate;
    academicYear.endDate = endDate ? new Date(endDate) : academicYear.endDate;
    academicYear.isActive = isActive !== undefined ? isActive : academicYear.isActive;

    await academicYear.save();
    res.json({ message: 'Academic year updated successfully', academicYear });
  } catch (err) {
    res.status(500).json({ message: 'Error updating academic year', error: err.message });
  }
};

// Delete academic year
exports.deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    
    const academicYear = await AcademicYear.findById(id);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    await AcademicYear.findByIdAndDelete(id);
    res.json({ message: 'Academic year deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting academic year', error: err.message });
  }
};

// Toggle academic year active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const academicYear = await AcademicYear.findById(id);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    academicYear.isActive = !academicYear.isActive;
    await academicYear.save();
    
    res.json({ 
      message: `Academic year ${academicYear.isActive ? 'activated' : 'deactivated'} successfully`, 
      academicYear 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling academic year status', error: err.message });
  }
}; 