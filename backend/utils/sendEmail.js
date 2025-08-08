// backend/utils/sendEmail.js

const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER || 'your_email@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your_email_password';

// Create a transporter using Gmail SMTP (or your preferred provider)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Send an email
/**
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text version (optional)
 * @param {string} html - HTML version (optional)
 */
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
  };

  try {
    await transporter.sendMail(mailOptions);
    // Optionally log or return info
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};

module.exports = sendEmail;