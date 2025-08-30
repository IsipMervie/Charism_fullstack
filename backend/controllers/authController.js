// backend/controllers/authController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
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
      
      let emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #667eea; margin: 0;">🎉 Welcome to CHARISM!</h2>
            <p style="color: #6c757d; margin: 10px 0;">Your account has been created successfully</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2d3748; margin-bottom: 20px;">Hello ${name},</h3>
            <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
              Welcome to CHARISM Community Link! To complete your registration and start using the platform, 
              please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                ✅ Verify Email Address
              </a>
            </div>
            
            <p style="color: #718096; font-size: 14px; margin-bottom: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all; background: #f7fafc; padding: 15px; border-radius: 5px;">
              ${verificationUrl}
            </p>
          </div>
          
          ${role === 'Staff' ? `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Important Notice</h4>
            <p style="color: #856404; margin: 0; line-height: 1.5;">
              As a Staff member, your account requires admin approval before you can access the system. 
              You will receive another email once your account has been approved.
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; color: #6c757d; font-size: 14px;">
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p style="margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #667eea;">
              <strong>⚠️ This is an automated email. Please do not reply to this message.</strong><br>
              If you need assistance, please contact support through the CHARISM platform.
            </p>
          </div>
        </div>
      `;

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
    // Check if database is connected
    const { mongoose } = require('../config/db');
    if (mongoose.connection.readyState !== 1) {
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
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #667eea; margin: 0;">🔐 Password Reset Request</h2>
          <p style="color: #6c757d; margin: 10px 0;">CHARISM Community Link</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin-bottom: 20px;">Hello ${user.name},</h3>
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your CHARISM account. 
            Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                      font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🔑 Reset Password
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="color: #667eea; font-size: 14px; word-break: break-all; background: #f7fafc; padding: 15px; border-radius: 5px;">
            ${resetUrl}
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Security Notice</h4>
            <p style="color: #856404; margin: 0; line-height: 1.5;">
              This link will expire in 1 hour for security reasons. If you didn't request this password reset, 
              please ignore this email and your password will remain unchanged.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; color: #6c757d; font-size: 14px;">
          <p>If you have any questions, please contact the system administrator.</p>
          <p style="margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #667eea;">
            <strong>⚠️ This is an automated email. Please do not reply to this message.</strong><br>
            If you need assistance, please contact support through the CHARISM platform.
          </p>
        </div>
      </div>
    `;

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