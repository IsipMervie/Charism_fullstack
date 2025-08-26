// backend/controllers/authController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Register a new user
exports.register = async (req, res) => {
  const { name, email, password, role, userId, academicYear, year, section, department } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

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

    // Email verification
            const token = jwt.sign({ 
          userId: newUser._id, 
          role: newUser.role,
          email: newUser.email 
        }, JWT_SECRET, { expiresIn: '1h' });
    const verificationUrl = `${FRONTEND_URL}/verify-email/${token}`;
    
    let emailContent = `
      <p>Hello ${name},</p>
      <p>Welcome to CHARISM! Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `;

    if (role === 'Staff') {
      emailContent += `
        <p><strong>Note:</strong> Your account requires admin approval before you can access the system. 
        You will receive another email once your account has been approved.</p>
      `;
    }

    await sendEmail(newUser.email, 'Email Verification', 'Please verify your email', emailContent);

    let responseMessage = 'Registration successful, please verify your email';
    if (role === 'Staff') {
      responseMessage += '. Your account will be reviewed by an administrator.';
    }

    res.status(201).json({ message: responseMessage });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
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

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ 
      userId: user._id, 
      role: user.role,
      email: user.email 
    }, JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    const emailContent = `
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail(user.email, 'Password Reset', 'Reset your password', emailContent);

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending password reset email', error: err.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  // Accept token either from route param or request body for flexibility
  const tokenFromParams = req.params?.token;
  const tokenFromBody = req.body?.token;
  const token = tokenFromParams || tokenFromBody;

  // Accept password field as `newPassword` or `password` (frontend variations)
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