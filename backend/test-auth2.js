// Test to isolate the register function issue
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('./utils/sendEmail');
const { getEmailVerificationTemplate, getPasswordResetTemplate } = require('./utils/emailTemplates');
const User = require('./models/User');
const { generateVerificationLink, generatePasswordResetLink } = require('./utils/emailLinkGenerator');

console.log('✅ All dependencies loaded successfully');

// Test register function with minimal code
exports.register = async (req, res) => {
  console.log('✅ Register function called');
  try {
    console.log('✅ Inside try block');
    res.json({ message: 'Test register function works' });
  } catch (err) {
    console.log('❌ Error in register function:', err.message);
    res.status(500).json({ message: 'Error in register function', error: err.message });
  }
};

console.log('✅ Register function defined');

// Test module exports
module.exports = {
  register: exports.register
};

console.log('✅ Module exports defined');
console.log('✅ Test auth controller loaded successfully');
