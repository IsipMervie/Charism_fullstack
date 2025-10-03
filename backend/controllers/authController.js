const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const { getEmailVerificationTemplate, getPasswordResetTemplate, getRegistrationTemplate, getLoginTemplate } = require('../utils/emailTemplates');
const User = require('../models/User');
const { generateVerificationLink, generatePasswordResetLink } = require('../utils/emailLinkGenerator');

console.log('✅ All dependencies loaded');

// Register function
const register = async (req, res) => {
  try {
    // CORS handled by main middleware - no conflicting headers
    
    const { name, email, password, userId, academicYear, year, section, department, role } = req.body;
    
    // Enhanced security validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Security checks
    if (name.length > 100 || email.length > 255 || userId.length > 50) {
      return res.status(400).json({ message: 'Input too long' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    console.log('🔍 Registration attempt:', { name, email, userId, role });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      userId,
      academicYear,
      year,
      section,
      department,
      role: role || 'Student',
      approvalStatus: 'pending'
    });

    // Save user to database
    const savedUser = await user.save();
    console.log('✅ User created successfully:', savedUser._id);
    
    // Generate verification token
    let verificationToken;
    try {
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET not configured for verification token');
      } else {
        verificationToken = jwt.sign(
          { userId: savedUser._id, email: savedUser.email },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
      }
    } catch (jwtError) {
      console.error('JWT verification token generation failed:', jwtError.message);
    }
    
    // Send emails in background (non-blocking)
    if (verificationToken) {
      const verificationLink = `${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}/verify-email?token=${verificationToken}`;
      
      setImmediate(() => {
        sendEmail(email, 'Verify Your Email - CHARISM', '', getEmailVerificationTemplate(verificationLink, name), true)
          .then(() => console.log('✅ Email verification sent to:', email))
          .catch(err => console.error('❌ Failed to send verification email:', err.message));

        sendEmail(email, 'Welcome to CHARISM Community Service', '', getRegistrationTemplate(name, 'Welcome to CHARISM', new Date().toLocaleDateString()), true)
          .then(() => console.log('✅ Registration email sent to:', email))
          .catch(err => console.error('❌ Failed to send registration email:', err.message));
      });
    }
    
    // Send success response AFTER user is saved
    res.status(201).json({ 
      message: 'Registration successful', 
      user: { 
        id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login function
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified (optional - can be disabled for testing)
    if (process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && !user.isVerified) {
      return res.status(403).json({ 
        message: 'Email not verified', 
        error: 'EMAIL_NOT_VERIFIED',
        details: 'Please verify your email before logging in. Check your inbox for the verification link.'
      });
    }

    // Generate JWT token with error handling
    let token;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }
      
      token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    } catch (jwtError) {
      console.error('JWT token generation failed:', jwtError.message);
      return res.status(500).json({ 
        message: 'Authentication service error', 
        error: 'Token generation failed',
        details: process.env.NODE_ENV === 'development' ? jwtError.message : 'Internal error'
      });
    }

    // Send login notification email
    try {
      const loginTime = new Date().toLocaleString();
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const emailContent = getLoginTemplate(user.name, loginTime, ipAddress);
      await sendEmail(user.email, 'Login Notification - CHARISM', '', emailContent, true);
      console.log('✅ Login notification email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send login notification email:', emailError);
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Forgot password function
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save({ maxTimeMS: 5000 });

    // Send password reset email
    try {
      const resetLink = generatePasswordResetLink(resetToken);
      const emailContent = getPasswordResetTemplate(user.name, resetLink);
      await sendEmail(user.email, 'Password Reset - CHARISM', '', emailContent, true);
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email', error: error.message });
  }
};

// Reset password function
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.resetToken !== token || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save({ maxTimeMS: 5000 });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};

// Verify email function
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Mark email as verified
    user.emailVerified = true;
    await user.save({ maxTimeMS: 5000 });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed', error: error.message });
  }
};

// Change password function
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    await user.save({ maxTimeMS: 5000 });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Password change failed', error: error.message });
  }
};

console.log('✅ All functions defined');

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword
};