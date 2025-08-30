// Comprehensive validation utility for the CommunityLink system
// This ensures all data is properly validated before processing

const mongoose = require('mongoose');

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate phone number (basic)
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

// Validate date format
const isValidDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

// Validate file size
const isValidFileSize = (fileSize, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

// Validate file type
const isValidFileType = (mimeType, allowedTypes = []) => {
  const defaultAllowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const typesToCheck = allowedTypes.length > 0 ? allowedTypes : defaultAllowedTypes;
  return typesToCheck.includes(mimeType);
};

// Validate role
const isValidRole = (role) => {
  const validRoles = ['Admin', 'Staff', 'Student'];
  return validRoles.includes(role);
};

// Validate academic year format (e.g., "2025-2026")
const isValidAcademicYear = (year) => {
  const yearRegex = /^\d{4}-\d{4}$/;
  if (!yearRegex.test(year)) return false;
  
  const [startYear, endYear] = year.split('-').map(Number);
  return endYear === startYear + 1;
};

// Validate time format (HH:MM)
const isValidTime = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Validate event status
const isValidEventStatus = (status) => {
  const validStatuses = ['Active', 'Completed', 'Cancelled', 'Disabled'];
  return validStatuses.includes(status);
};

// Validate attendance status
const isValidAttendanceStatus = (status) => {
  const validStatuses = ['Pending', 'Attended', 'Approved', 'Disapproved'];
  return validStatuses.includes(status);
};

// Validate approval status
const isValidApprovalStatus = (status) => {
  const validStatuses = ['pending', 'approved', 'rejected'];
  return validStatuses.includes(status);
};

// Sanitize string input
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

// Sanitize HTML content
const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Validate pagination parameters
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum))
  };
};

// Validate search query
const validateSearchQuery = (query) => {
  if (typeof query !== 'string') return '';
  return query.trim().substring(0, 100); // Limit search query length
};

// Validate date range
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  return start <= end;
};

// Validate coordinates (for location)
const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  return !isNaN(latitude) && !isNaN(longitude) &&
         latitude >= -90 && latitude <= 90 &&
         longitude >= -180 && longitude <= 180;
};

// Validate URL
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate file upload
const validateFileUpload = (file, options = {}) => {
  const {
    maxSizeMB = 10,
    allowedTypes = [],
    required = false
  } = options;
  
  if (required && !file) {
    return { isValid: false, error: 'File is required' };
  }
  
  if (!file) {
    return { isValid: true, error: null };
  }
  
  if (!isValidFileSize(file.size, maxSizeMB)) {
    return { 
      isValid: false, 
      error: `File size must be less than ${maxSizeMB}MB` 
    };
  }
  
  if (!isValidFileType(file.mimetype, allowedTypes)) {
    return { 
      isValid: false, 
      error: 'File type not allowed' 
    };
  }
  
  return { isValid: true, error: null };
};

// Validate user registration data
const validateUserRegistration = (userData) => {
  const errors = [];
  
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!isValidEmail(userData.email)) {
    errors.push('Invalid email format');
  }
  
  if (!isValidPassword(userData.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
  }
  
  if (!isValidRole(userData.role)) {
    errors.push('Invalid role');
  }
  
  if (userData.role === 'Student') {
    if (!userData.academicYear || !isValidAcademicYear(userData.academicYear)) {
      errors.push('Valid academic year is required for students');
    }
    if (!userData.department || userData.department.trim().length < 2) {
      errors.push('Department is required for students');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate event data
const validateEventData = (eventData) => {
  const errors = [];
  
  if (!eventData.title || eventData.title.trim().length < 5) {
    errors.push('Event title must be at least 5 characters long');
  }
  
  if (!eventData.description || eventData.description.trim().length < 10) {
    errors.push('Event description must be at least 10 characters long');
  }
  
  if (!isValidDate(eventData.date)) {
    errors.push('Valid event date is required');
  }
  
  if (!isValidTime(eventData.startTime)) {
    errors.push('Valid start time is required (HH:MM format)');
  }
  
  if (!isValidTime(eventData.endTime)) {
    errors.push('Valid end time is required (HH:MM format)');
  }
  
  if (!eventData.location || eventData.location.trim().length < 3) {
    errors.push('Event location is required');
  }
  
  if (!eventData.hours || eventData.hours < 0) {
    errors.push('Valid event hours are required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  // Basic validators
  isValidObjectId,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidDate,
  isValidFileSize,
  isValidFileType,
  isValidRole,
  isValidAcademicYear,
  isValidTime,
  isValidEventStatus,
  isValidAttendanceStatus,
  isValidApprovalStatus,
  isValidURL,
  
  // Sanitizers
  sanitizeString,
  sanitizeHTML,
  
  // Complex validators
  validatePagination,
  validateSearchQuery,
  validateDateRange,
  validateCoordinates,
  validateFileUpload,
  validateUserRegistration,
  validateEventData
};
