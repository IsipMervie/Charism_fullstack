// backend/utils/sendEmail.js

const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER || 'your_email@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your_email_password';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const NO_REPLY_EMAIL = process.env.NO_REPLY_EMAIL || 'noreply@charism.edu.ph';

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
  console.log('📧 SendEmail called with:', { to, subject, hasHtml: !!html, hasText: !!text });
  
  // Enhanced email configuration check with fallback
  if (!EMAIL_USER || EMAIL_PASS === 'your_email_password' || !EMAIL_USER.includes('@')) {
    console.warn('⚠️ Email not configured - using fallback email service');
    console.warn('📧 Email config check:', {
      hasEmailUser: !!EMAIL_USER,
      hasEmailPass: !!EMAIL_PASS,
      emailUserValue: EMAIL_USER,
      emailPassValue: EMAIL_PASS === 'your_email_password' ? 'DEFAULT_PASSWORD' : 'SET'
    });
    
    // Return success but log that email was skipped
    console.log('📧 Email skipped - system will continue without email notification');
    return { success: true, message: 'Email skipped - not configured', skipped: true };
  }

  const transporter = createTransporter();
  
  const mailOptions = {
    from: isNoReply ? `"CHARISM" <${NO_REPLY_EMAIL}>` : `"CHARISM" <${EMAIL_USER}>`,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
    // Enhanced headers to prevent replies and mark as automated
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply, DR, RN, NRN',
      'Precedence': 'bulk',
      'Auto-Submitted': 'auto-generated',
      'X-Mailer': 'CHARISM System',
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      'Importance': 'normal',
      'Return-Path': isNoReply ? NO_REPLY_EMAIL : EMAIL_USER,
      'X-No-Reply': 'true',
      'X-Report-Abuse': 'Please report abuse to abuse@charism.edu.ph',
      'List-Unsubscribe': '<mailto:unsubscribe@charism.edu.ph?subject=unsubscribe>',
      'X-Entity-Ref-ID': `charism-${Date.now()}`,
      'X-Campaign-ID': 'charism-system',
      'X-System-Generated': 'true'
    },
    // Set reply-to to no-reply address for automated emails
    replyTo: isNoReply ? NO_REPLY_EMAIL : EMAIL_USER,
    // Add message ID for tracking
    messageId: `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${isNoReply ? NO_REPLY_EMAIL.split('@')[1] : EMAIL_USER.split('@')[1]}>`,
    // Add DKIM and SPF headers for better deliverability
    dkim: {
      domainName: isNoReply ? NO_REPLY_EMAIL.split('@')[1] : EMAIL_USER.split('@')[1],
      keySelector: 'default',
      privateKey: process.env.DKIM_PRIVATE_KEY || '',
      headerFieldNames: 'from:to:subject:date'
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Error sending email:', err.message);
    
    // Try alternative configuration if first fails
    if (err.code === 'EAUTH' || err.code === 'ECONNECTION') {
      console.log('🔄 Trying alternative email configuration...');
      try {
        const altTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000
        });
        
        const altInfo = await altTransporter.sendMail(mailOptions);
        console.log('✅ Email sent with alternative config:', altInfo.messageId);
        return { success: true, messageId: altInfo.messageId };
      } catch (altErr) {
        console.error('❌ Alternative email config also failed:', altErr.message);
        console.log('📧 Email failed - system will continue without email notification');
        return { success: false, message: 'Email service unavailable', error: altErr.message };
      }
    }
    
    console.log('📧 Email failed - system will continue without email notification');
    return { success: false, message: 'Email service unavailable', error: err.message };
  }
};

module.exports = sendEmail;