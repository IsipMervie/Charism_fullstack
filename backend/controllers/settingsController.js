// backend/controllers/settingsController.js

const SchoolSettings = require('../models/SchoolSettings');
const User = require('../models/User');
const Section = require('../models/Section');
const YearLevel = require('../models/YearLevel');
const Department = require('../models/Department');
const { getImageInfo, hasFile } = require('../utils/mongoFileStorage');

// Get school settings (Admin only)
exports.getSchoolSettings = async (req, res) => {
  try {
    console.log('=== Getting School Settings ===');
    
    let settings = await SchoolSettings.findOne();
    if (!settings) {
      console.log('No settings found, creating default...');
      // If not set, create default
      settings = new SchoolSettings({
        schoolName: 'UNIVERSITY OF THE ASSUMPTION',
        contactEmail: 'ceo@ua.edu.ph',
        logo: null,
        brandName: 'CHARISM'
      });
      await settings.save();
      console.log('Default settings created');
    }
    
    // Defensive fix for malformed logo data
    let safeLogo = settings.logo;
    if (typeof settings.logo === 'string') {
      console.log('⚠️  Logo field contains string, converting to null to prevent errors');
      safeLogo = null;
    }
    
    // Add full logo URL to the response
    const settingsWithUrl = settings.toObject();
    if (hasFile(safeLogo)) {
      settingsWithUrl.logoUrl = `/api/files/school-logo`;
    }
    
    // Ensure logo field is safe in response
    settingsWithUrl.logo = safeLogo;
    
    console.log('Settings retrieved successfully');
    res.json(settingsWithUrl);
  } catch (err) {
    console.error('Error in getSchoolSettings:', err);
    res.status(500).json({ 
      message: 'Error fetching school settings', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Update school settings (Admin only)
exports.updateSchoolSettings = async (req, res) => {
  try {
    console.log('=== Updating School Settings ===');
    
    let settings = await SchoolSettings.findOne();
    if (!settings) {
      console.log('No settings found, creating new...');
      settings = new SchoolSettings();
    }
    
    const { schoolName, contactEmail, brandName } = req.body;
    if (schoolName) settings.schoolName = schoolName;
    if (contactEmail) settings.contactEmail = contactEmail;
    if (brandName) settings.brandName = brandName;
    
    if (req.file) {
      console.log('Logo file received, updating...');
      // Store new logo data in MongoDB
      const logoInfo = getImageInfo(req.file);
      settings.logo = logoInfo;
    }
    
    await settings.save();
    console.log('Settings updated successfully');
    
    // Defensive fix for malformed logo data
    let safeLogo = settings.logo;
    if (typeof settings.logo === 'string') {
      console.log('⚠️  Logo field contains string, converting to null to prevent errors');
      safeLogo = null;
    }
    
    // Add full logo URL to the response
    const settingsWithUrl = settings.toObject();
    if (hasFile(safeLogo)) {
      settingsWithUrl.logoUrl = `/api/files/school-logo`;
    }
    
    // Ensure logo field is safe in response
    settingsWithUrl.logo = safeLogo;
    
    res.json({ message: 'School settings updated', settings: settingsWithUrl });
  } catch (err) {
    console.error('Error in updateSchoolSettings:', err);
    res.status(500).json({ 
      message: 'Error updating school settings', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get public school settings (for navbar, no auth required)
exports.getPublicSchoolSettings = async (req, res) => {
  try {
    console.log('=== Getting Public School Settings ===');
    
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    let isConnected = false;
    
    try {
      isConnected = await getLazyConnection();
    } catch (dbError) {
      console.log('Database connection check failed:', dbError.message);
      isConnected = false;
    }
    
    if (!isConnected) {
      console.log('Database not connected, returning default settings');
      return res.json({
        schoolName: 'UNIVERSITY OF THE ASSUMPTION',
        brandName: 'CHARISM',
        logo: null,
        logoUrl: null,
        contactEmail: 'ceo@ua.edu.ph'
      });
    }
    
    let settings = await SchoolSettings.findOne();
    if (!settings) {
      console.log('No settings found, creating default...');
      // If not set, create default
      settings = new SchoolSettings({
        schoolName: 'UNIVERSITY OF THE ASSUMPTION',
        contactEmail: 'ceo@ua.edu.ph',
        logo: null,
        brandName: 'CHARISM'
      });
      await settings.save();
      console.log('Default public settings created');
    }
    
    // Defensive fix for malformed logo data
    let safeLogo = settings.logo;
    if (typeof settings.logo === 'string') {
      console.log('⚠️  Logo field contains string, converting to null to prevent errors');
      safeLogo = null;
    }
    
    // Check if logo has actual data
    if (safeLogo && (!safeLogo.data || safeLogo.data.length === 0)) {
      console.log('⚠️  Logo field has no data, treating as null');
      safeLogo = null;
    }
    
    // Only return public fields
    const publicSettings = {
      schoolName: settings.schoolName,
      brandName: settings.brandName,
      logo: safeLogo,
      logoUrl: hasFile(safeLogo) ? `/api/files/school-logo` : null,
      contactEmail: settings.contactEmail
    };
    
    console.log('Public settings retrieved successfully');
    res.json(publicSettings);
  } catch (err) {
    console.error('Error in getPublicSchoolSettings:', err);
    
    // If database error, return default settings
    if (err.name === 'MongooseError' || err.message.includes('before initial connection') || err.message.includes('timeout')) {
      console.log('Database connection issue, returning default settings');
      return res.json({
        schoolName: 'UNIVERSITY OF THE ASSUMPTION',
        brandName: 'CHARISM',
        logo: null,
        logoUrl: null,
        contactEmail: 'ceo@ua.edu.ph'
      });
    }
    
    res.status(500).json({ 
      message: 'Error fetching school settings', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get all registration settings (Admin only)
exports.getSettings = async (req, res) => {
  try {
    console.log('=== Getting All Settings ===');
    console.log('Section model available:', !!Section);
    console.log('YearLevel model available:', !!YearLevel);
    console.log('Department model available:', !!Department);
    
    // Check if models are available
    if (!Section || !YearLevel || !Department) {
      console.error('Models not available');
      return res.status(500).json({ 
        message: 'Database models not available',
        models: {
          Section: !!Section,
          YearLevel: !!YearLevel,
          Department: !!Department
        }
      });
    }
    
    // Get all data
    const [sections, yearLevels, departments, academicYears] = await Promise.all([
      Section.find().sort('name'),
      YearLevel.find().sort('name'),
      Department.find().sort('name'),
      require('../models/AcademicYear').find().sort('-year')
    ]);
    
    console.log(`Retrieved: ${sections.length} sections, ${yearLevels.length} year levels, ${departments.length} departments, ${academicYears.length} academic years`);
    
    res.json({
      sections,
      yearLevels,
      departments,
      academicYears
    });
  } catch (err) {
    console.error('Error in getSettings:', err);
    res.status(500).json({ 
      message: 'Error fetching settings', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get public registration settings (for registration page, no auth required)
exports.getPublicSettings = async (req, res) => {
  try {
    console.log('=== Getting Public Settings ===');
    
    // Ensure database connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Database not connected for public settings');
      return res.status(503).json({ 
        message: 'Database connection unavailable',
        error: 'DATABASE_CONNECTION_FAILED'
      });
    }
    
    // Check if models are available
    if (!Section || !YearLevel || !Department) {
      console.error('Models not available for public settings');
      return res.status(500).json({ 
        message: 'Database models not available',
        models: {
          Section: !!Section,
          YearLevel: !!YearLevel,
          Department: !!Department
        }
      });
    }
    
    // Get all data with timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 25000)
    );
    
    const dataPromise = Promise.all([
      Section.find().sort('name'),
      YearLevel.find().sort('name'),
      Department.find().sort('name'),
      require('../models/AcademicYear').find().sort('-year')
    ]);
    
    const [sections, yearLevels, departments, academicYears] = await Promise.race([
      dataPromise,
      timeoutPromise
    ]);
    
    console.log(`Public settings retrieved: ${sections.length} sections, ${yearLevels.length} year levels, ${departments.length} departments, ${academicYears.length} academic years`);
    
    res.json({
      sections,
      yearLevels,
      departments,
      academicYears
    });
  } catch (err) {
    console.error('Error in getPublicSettings:', err);
    res.status(500).json({ 
      message: 'Error fetching public settings', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get user profile (for all authenticated users)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Set by auth middleware
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// Update user profile/settings (for all users)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Set by auth middleware
    // Only allow updating certain fields
    const allowedFields = [
      'name', 'email', 'userId', 'academicYear', 'year', 'section', 'department', 'emailNotifications'
      // Add more fields as needed
    ];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};



// Sections Management
exports.addSection = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Section name is required' });

    console.log('Adding section:', name);
    console.log('Section model available:', !!Section);
    console.log('Mongoose connection state:', require('mongoose').connection.readyState);

    // Check if model is available
    if (!Section) {
      console.error('Section model not available');
      return res.status(500).json({ message: 'Section model not available', error: 'Database model not loaded' });
    }

    // Check if section already exists
    const exists = await Section.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Section already exists' });

    const section = new Section({ name });
    await section.save();
    console.log('Section saved successfully');
    res.json({ message: 'Section added successfully', section });
  } catch (err) {
    console.error('Error adding section:', err);
    res.status(500).json({ message: 'Error adding section', error: err.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const section = await Section.findById(id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== section.name) {
      const exists = await Section.findOne({ name, _id: { $ne: id } });
      if (exists) return res.status(400).json({ message: 'Section already exists' });
    }

    if (name !== undefined) section.name = name;
    if (isActive !== undefined) section.isActive = isActive;

    await section.save();
    res.json({ message: 'Section updated successfully', section });
  } catch (err) {
    res.status(500).json({ message: 'Error updating section', error: err.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    await Section.findByIdAndDelete(id);
    res.json({ message: 'Section deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting section', error: err.message });
  }
};

// Year Levels Management
exports.addYearLevel = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Year level name is required' });

    console.log('Adding year level:', name);
    console.log('YearLevel model available:', !!YearLevel);
    console.log('Mongoose connection state:', require('mongoose').connection.readyState);

    // Check if model is available
    if (!YearLevel) {
      console.error('YearLevel model not available');
      return res.status(500).json({ message: 'YearLevel model not available', error: 'Database model not loaded' });
    }

    // Check if year level already exists
    const exists = await YearLevel.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Year level already exists' });

    const yearLevel = new YearLevel({ name });
    await yearLevel.save();
    console.log('Year level saved successfully');
    res.json({ message: 'Year level added successfully', yearLevel });
  } catch (err) {
    console.error('Error adding year level:', err);
    res.status(500).json({ message: 'Error adding year level', error: err.message });
  }
};

exports.updateYearLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const yearLevel = await YearLevel.findById(id);
    if (!yearLevel) return res.status(404).json({ message: 'Year level not found' });

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== yearLevel.name) {
      const exists = await YearLevel.findOne({ name, _id: { $ne: id } });
      if (exists) return res.status(400).json({ message: 'Year level already exists' });
    }

    if (name !== undefined) yearLevel.name = name;
    if (isActive !== undefined) yearLevel.isActive = isActive;

    await yearLevel.save();
    res.json({ message: 'Year level updated successfully', yearLevel });
  } catch (err) {
    res.status(500).json({ message: 'Error updating year level', error: err.message });
  }
};

exports.deleteYearLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const yearLevel = await YearLevel.findById(id);
    if (!yearLevel) return res.status(404).json({ message: 'Year level not found' });

    await YearLevel.findByIdAndDelete(id);
    res.json({ message: 'Year level deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting year level', error: err.message });
  }
};

// Departments Management
exports.addDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Department name is required' });

    console.log('Adding department:', name);
    console.log('Department model available:', !!Department);
    console.log('Mongoose connection state:', require('mongoose').connection.readyState);

    // Check if model is available
    if (!Department) {
      console.error('Department model not available');
      return res.status(500).json({ message: 'Department model not available', error: 'Database model not loaded' });
    }

    // Check if department already exists
    const exists = await Department.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Department already exists' });

    const department = new Department({ name });
    await department.save();
    console.log('Department saved successfully');
    res.json({ message: 'Department added successfully', department });
  } catch (err) {
    console.error('Error adding department:', err);
    res.status(500).json({ message: 'Error adding department', error: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const department = await Department.findById(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== department.name) {
      const exists = await Department.findOne({ name, _id: { $ne: id } });
      if (exists) return res.status(400).json({ message: 'Department already exists' });
    }

    if (name !== undefined) department.name = name;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();
    res.json({ message: 'Department updated successfully', department });
  } catch (err) {
    res.status(500).json({ message: 'Error updating department', error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    await Department.findByIdAndDelete(id);
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting department', error: err.message });
  }
};