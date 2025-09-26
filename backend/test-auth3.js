// Test to mimic the exact structure of authController
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('./utils/sendEmail');
const { getEmailVerificationTemplate, getPasswordResetTemplate } = require('./utils/emailTemplates');
const User = require('./models/User');

// Use environment variable for JWT secret, with fallback for development only
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? 'fallback_jwt_secret_for_production' : 'your_jwt_secret');

// Validate JWT secret is available
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required in production!');
  console.error('🚨 Using fallback JWT secret - this is not secure for production!');
}

const { generateVerificationLink, generatePasswordResetLink } = require('./utils/emailLinkGenerator');

console.log('✅ All dependencies loaded successfully');

// Register a new user
exports.register = async (req, res) => {
  console.log('✅ Register function called');
  res.json({ message: 'Test register function works' });
};

console.log('✅ Register function defined');

// Test module exports
module.exports = {
  register: exports.register,
  login: () => {},
  forgotPassword: () => {},
  resetPassword: () => {},
  verifyEmail: () => {},
  changePassword: () => {}
};

console.log('✅ Module exports defined');
console.log('✅ Test auth controller loaded successfully');
