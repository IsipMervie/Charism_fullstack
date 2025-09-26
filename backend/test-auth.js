// Test version of authController to isolate the issue
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('./utils/sendEmail');
const { getEmailVerificationTemplate, getPasswordResetTemplate } = require('./utils/emailTemplates');
const User = require('./models/User');

console.log('✅ All dependencies loaded successfully');

// Test register function
exports.register = async (req, res) => {
  console.log('✅ Register function called');
  res.json({ message: 'Test register function works' });
};

console.log('✅ Register function defined');

// Test module exports
module.exports = {
  register: exports.register
};

console.log('✅ Module exports defined');
console.log('✅ Test auth controller loaded successfully');
