// backend/controllers/authController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const { getEmailVerificationTemplate, getPasswordResetTemplate } = require('../utils/emailTemplates');
const User = require('../models/User');

// Use environment variable for JWT secret, with fallback for development only
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'your_jwt_secret');

// Validate JWT secret is available
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required in production!');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const { generateVerificationLink, generatePasswordResetLink } = require('../utils/emailLinkGenerator');

// Register a new user
exports.register = async (req, res) => {
  const { name, email, password, role, userId, academicYear, year, section, department } = req.body;
  
  try {
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, password, and role are required' 
      });
    }

    // Validate role
    if (!['Admin', 'Staff', 'Student'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be Admin, Staff, or Student' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Increased security

    let userData = {
      name,
      email,
      password: hashedPassword,
      role,
      userId,
      isVerified: false,
    };

    if (role === 'Student') {
      userData.academicYear = academicYear;
      userData.year = year;
      userData.section = section;
      userData.department = department;
      userData.isApproved = true; // Students are auto-approved
      userData.approvalStatus = 'approved';
    } else if (role === 'Staff') {
      userData.department = department;
      userData.isApproved = false; // Staff need admin approval
      userData.approvalStatus = 'pending';
    } else if (role === 'Admin') {
      userData.isApproved = true; // Admins are auto-approved
      userData.approvalStatus = 'approved';
    }

    const newUser = new User(userData);
    await newUser.save();

    console.log(`✅ User registered successfully: ${email} (${role})`);

    // Email verification with better error handling and no-reply
    try {
      const token = jwt.sign({ 
        userId: newUser._id, 
        role: newUser.role,
        email: newUser.email 
      }, JWT_SECRET, { expiresIn: '24h' }); // Extended to 24 hours
      
      const verificationUrl = generateVerificationLink(token);
      
      const emailContent = getEmailVerificationTemplate(verificationUrl, name);

      const emailResult = await sendEmail(newUser.email, 'Welcome to CHARISM - Verify Your Email', '', emailContent, true); // true = no-reply
      
      if (emailResult && emailResult.success) {
        console.log('Verification email sent successfully to:', newUser.email);
      } else {
        console.warn('Email service not configured, but user created successfully');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    let responseMessage = 'Registration successful, please verify your email';
    if (role === 'Staff') {
      responseMessage += '. Your account will be reviewed by an administrator.';
    }

    res.status(201).json({ message: responseMessage });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('Database not connected during login attempt');
      return res.status(500).json({ 
        message: 'Database connection not ready. Please try again.',
        error: 'Database not connected'
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email before logging in.' });

    // Check if staff user is approved
    if (user.role === 'Staff' && !user.isApproved) {
      return res.status(401).json({ 
        message: 'Your account is pending admin approval. Please wait for approval before logging in.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ 
      userId: user._id, 
      role: user.role,
      email: user.email 
    }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        academicYear: user.academicYear,
        year: user.year,
        section: user.section,
        department: user.department,
        userId: user.userId,
        isApproved: user.isApproved,
        approvalStatus: user.approvalStatus,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

// Verify user's email
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(200).json({ message: 'Email is already verified' });

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email successfully verified' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

// Forgot password with enhanced email and no-reply
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const token = jwt.sign({ 
      userId: user._id, 
      role: user.role,
      email: user.email 
    }, JWT_SECRET, { expiresIn: '1h' });
    
    const resetUrl = generatePasswordResetLink(token);
    
    const emailContent = getPasswordResetTemplate(resetUrl, user.name);

    try {
      const emailResult = await sendEmail(user.email, 'CHARISM - Password Reset Request', '', emailContent, true); // true = no-reply
      
      if (emailResult && emailResult.success) {
        console.log('Password reset email sent successfully to:', user.email);
        res.json({ message: 'Password reset email sent successfully. Please check your inbox.' });
      } else {
        console.warn('Email service not configured');
        res.status(500).json({ message: 'Email service not available. Please contact administrator.' });
      }
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error processing password reset request', error: err.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  // Accept token either from route param or request body for flexibility
  const tokenFromParams = req.params?.token;
  const tokenFromBody = req.body?.token;
  const token = tokenFromParams || tokenFromBody;

  // Accept password field as 'newPassword' or 'password' (frontend variations)
  const providedNewPassword = req.body?.newPassword || req.body?.password;

  if (!token) {
    return res.status(400).json({ message: 'Missing token' });
  }
  if (!providedNewPassword) {
    return res.status(400).json({ message: 'Missing new password' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedPassword = await bcrypt.hash(providedNewPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};