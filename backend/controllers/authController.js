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

    // Check if user already exists (with timeout)
    const existingUser = await User.findOne({ email }).maxTimeMS(10000);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
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
      role: role || 'Student', // Use provided role or default to Student
      approvalStatus: 'pending'
    });

    try {
      await user.save({ maxTimeMS: 15000 });
      console.log('✅ User created successfully:', user._id);
    } catch (saveError) {
      console.error('❌ User save error:', saveError);
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.values(saveError.errors).map(err => err.message);
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: validationErrors 
        });
      }
      if (saveError.name === 'MongoTimeoutError') {
        return res.status(408).json({ 
          message: 'Registration timeout - please try again' 
        });
      }
      throw saveError;
    }

    // Send email verification
    try {
      const verificationToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      const verificationLink = `${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}/verify-email?token=${verificationToken}`;
      const emailContent = getEmailVerificationTemplate(verificationLink, name);
      await sendEmail(email, 'Verify Your Email - CHARISM', '', emailContent, true);
      console.log('✅ Email verification sent to:', email);
    } catch (emailError) {
      console.error('Failed to send email verification:', emailError);
    }

    // Send registration confirmation email
    try {
      const emailContent = getRegistrationTemplate(name, 'Welcome to CHARISM', new Date().toLocaleDateString());
      await sendEmail(email, 'Welcome to CHARISM Community Service', '', emailContent, true);
      console.log('✅ Registration email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
    }

    res.status(201).json({ message: 'Registration successful', user: { id: user._id, email: user.email } });
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
    await user.save();

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
    await user.save();

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
    await user.save();

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
    await user.save();

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