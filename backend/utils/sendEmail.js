// backend/utils/sendEmail.js

const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER || 'your_email@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your_email_password';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';

// Create a transporter with better configuration
const createTransporter = () => {
  // For Gmail, use OAuth2 or App Password
  if (EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  // For other services like Outlook, Yahoo, etc.
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send an email with better error handling and no-reply headers
/**
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text version (optional)
 * @param {string} html - HTML version (optional)
 * @param {boolean} isNoReply - Whether this is a no-reply email (default: true)
 */
const sendEmail = async (to, subject, text, html, isNoReply = true) => {
  if (!EMAIL_USER || EMAIL_PASS === 'your_email_password') {
    console.warn('Email credentials not configured. Skipping email send.');
    return { success: false, message: 'Email not configured' };
  }

  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"CHARISM Community Link" <${EMAIL_USER}>`,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
    // Add headers to prevent replies and mark as automated
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',
      'Auto-Submitted': 'auto-generated',
      'X-Mailer': 'CHARISM Community Link System',
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      'Importance': 'normal',
      'Return-Path': EMAIL_USER,
      'X-No-Reply': 'true'
    },
    // Set reply-to to prevent replies
    replyTo: isNoReply ? EMAIL_USER : EMAIL_USER,
    // Add message ID for tracking
    messageId: `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${EMAIL_USER.split('@')[1]}>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending email:', err);
    
    // Try alternative configuration if first fails
    if (err.code === 'EAUTH') {
      try {
        const altTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        
        const altInfo = await altTransporter.sendMail(mailOptions);
        console.log('Email sent with alternative config:', altInfo.messageId);
        return { success: true, messageId: altInfo.messageId };
      } catch (altErr) {
        console.error('Alternative email config also failed:', altErr);
      }
    }
    
    throw err;
  }
};

module.exports = sendEmail;