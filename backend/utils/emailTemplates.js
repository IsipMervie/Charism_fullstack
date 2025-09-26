// Email templates with no-reply configuration
const NO_REPLY_EMAIL = process.env.NO_REPLY_EMAIL || 'noreply@charism.edu.ph';

// Common email footer with no-reply warning
const getNoReplyFooter = () => `
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
    <p style="margin: 0; color: #dc3545; font-weight: bold;">
      ⚠️ IMPORTANT: This is an automated message. Please do not reply to this email.
    </p>
    <p style="margin: 5px 0 0 0; color: #6c757d;">
      Replies to this email address will not be received or processed.
    </p>
  </div>
  
  <p style="margin: 0 0 10px 0;">
    <strong>CHARISM</strong><br>
    This email was sent from an automated system and cannot receive replies.
  </p>
  
  <p style="margin: 0 0 10px 0; font-size: 11px;">
    If you need assistance, please contact the school administration directly or visit our website.
  </p>
  
  <p style="margin: 0; font-size: 10px; color: #999;">
    This email was sent from: ${NO_REPLY_EMAIL}<br>
    Sent by: CHARISM 
  </p>
</div>
`;

// Email verification template
const getEmailVerificationTemplate = (verificationLink, userName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - CHARISM </title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM </h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Email Verification Required</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName || 'there'},</p>
      <p>Thank you for registering with CHARISM. To complete your registration, please verify your email address by clicking the button below:</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Verify Email Address
      </a>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #6c757d;">
        <strong>Note:</strong> This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    
    <div style="margin-top: 20px;">
      <p style="margin: 0; font-size: 14px;">
        If the button doesn't work, you can copy and paste this link into your browser:
      </p>
      <p style="margin: 10px 0; word-break: break-all;">
        <a href="${verificationLink}" style="color: #3498db;">${verificationLink}</a>
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Password reset template
const getPasswordResetTemplate = (resetLink, userName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - CHARISM </title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Password Reset Request</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName || 'there'},</p>
      <p>We received a request to reset your password for your CHARISM Link account. Click the button below to create a new password:</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
      </p>
    </div>
    
    <div style="margin-top: 20px;">
      <p style="margin: 0; font-size: 14px;">
        If the button doesn't work, you can copy and paste this link into your browser:
      </p>
      <p style="margin: 10px 0; word-break: break-all;">
        <a href="${resetLink}" style="color: #e74c3c;">${resetLink}</a>
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Event registration approval template
const getEventRegistrationApprovalTemplate = (userName, eventTitle, eventDate, eventLocation, eventHours) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Registration Approved - CHARISM</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    .email-container {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .email-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }
    .email-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #27ae60, #2ecc71);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      position: relative;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .tagline {
      color: #7f8c8d;
      font-size: 16px;
      font-weight: 400;
      margin: 0;
    }
    .success-badge {
      display: inline-flex;
      align-items: center;
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 8px 20px rgba(39, 174, 96, 0.3);
    }
    .success-badge::before {
      content: '🎉';
      margin-right: 8px;
      font-size: 18px;
    }
    .event-card {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border: none;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .event-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      border-radius: 0 2px 2px 0;
    }
    .event-title {
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px 0;
      letter-spacing: -0.3px;
    }
    .event-detail {
      display: flex;
      align-items: center;
      margin: 8px 0;
      font-size: 15px;
    }
    .event-detail-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      opacity: 0.7;
    }
    .next-steps {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      border: none;
    }
    .next-steps h3 {
      color: #1976d2;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
    }
    .next-steps h3::before {
      content: '📋';
      margin-right: 8px;
    }
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
      color: #424242;
    }
    .next-steps li {
      margin: 8px 0;
      font-size: 15px;
    }
    .confirmation-banner {
      background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
      border: none;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .confirmation-banner p {
      margin: 0;
      color: #27ae60;
      font-weight: 600;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .confirmation-banner p::before {
      content: '✅';
      margin-right: 8px;
      font-size: 18px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
      transition: all 0.3s ease;
      margin: 20px 0;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(52, 152, 219, 0.4);
    }
    .footer-message {
      text-align: center;
      margin: 32px 0;
      color: #7f8c8d;
      font-size: 16px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <div class="logo">CHARISM</div>
        <p class="tagline">Community Service Management System</p>
        <div class="success-badge">Registration Approved</div>
      </div>
      
      <p style="font-size: 16px; color: #2c3e50; margin-bottom: 24px;">
        Hello <strong>${userName || 'there'}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #555; margin-bottom: 32px;">
        Great news! Your registration for the following community service event has been <strong style="color: #27ae60;">approved</strong>:
      </p>
      
      <div class="event-card">
        <h3 class="event-title">${eventTitle}</h3>
        <div class="event-detail">
          <span class="event-detail-icon">📅</span>
          <strong>Date:</strong> ${eventDate}
        </div>
        <div class="event-detail">
          <span class="event-detail-icon">📍</span>
          <strong>Location:</strong> ${eventLocation || 'TBD'}
        </div>
        <div class="event-detail">
          <span class="event-detail-icon">⏱️</span>
          <strong>Service Hours:</strong> ${eventHours} hours
        </div>
      </div>
      
      <div class="confirmation-banner">
        <p>Your registration is confirmed! You can now participate in this event.</p>
      </div>
      
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>Make sure to arrive on time for the event</li>
          <li>Bring any required materials or documentation</li>
          <li>Check the event details for any specific requirements</li>
          <li>Remember to time in and time out during the event</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}" class="cta-button">
          View Event Details
        </a>
      </div>
      
      <div class="footer-message">
        Thank you for your commitment to community service! 🌟
      </div>
      
      ${getNoReplyFooter()}
    </div>
  </div>
</body>
</html>
`;
};

// Event registration disapproval template
const getEventRegistrationDisapprovalTemplate = (userName, eventTitle, eventDate, reason) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Registration Update - CHARISM</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    .email-container {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      min-height: 100vh;
    }
    .email-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }
    .email-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #e74c3c, #c0392b);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      position: relative;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .tagline {
      color: #7f8c8d;
      font-size: 16px;
      font-weight: 400;
      margin: 0;
    }
    .update-badge {
      display: inline-flex;
      align-items: center;
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 8px 20px rgba(243, 156, 18, 0.3);
    }
    .update-badge::before {
      content: '📝';
      margin-right: 8px;
      font-size: 18px;
    }
    .event-card {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border: none;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .event-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      border-radius: 0 2px 2px 0;
    }
    .event-title {
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px 0;
      letter-spacing: -0.3px;
    }
    .event-detail {
      display: flex;
      align-items: center;
      margin: 8px 0;
      font-size: 15px;
    }
    .event-detail-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      opacity: 0.7;
    }
    .status-banner {
      background: linear-gradient(135deg, #fdf2f2, #fce4e4);
      border: none;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .status-banner h3 {
      color: #e74c3c;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .status-banner h3::before {
      content: '❌';
      margin-right: 8px;
      font-size: 20px;
    }
    .status-banner p {
      margin: 0;
      color: #e74c3c;
      font-weight: 600;
      font-size: 16px;
    }
    .reason-card {
      background: linear-gradient(135deg, #fff5f5, #ffeaea);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      border-left: 4px solid #e74c3c;
    }
    .reason-card h3 {
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
    }
    .reason-card h3::before {
      content: '💬';
      margin-right: 8px;
    }
    .reason-text {
      color: #555;
      font-size: 15px;
      margin: 0;
      padding: 12px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 8px;
    }
    .next-steps {
      background: linear-gradient(135deg, #fff3cd, #ffeaa7);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      border: none;
    }
    .next-steps h3 {
      color: #856404;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
    }
    .next-steps h3::before {
      content: '🚀';
      margin-right: 8px;
    }
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
      color: #856404;
    }
    .next-steps li {
      margin: 8px 0;
      font-size: 15px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
      transition: all 0.3s ease;
      margin: 20px 0;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(52, 152, 219, 0.4);
    }
    .footer-message {
      text-align: center;
      margin: 32px 0;
      color: #7f8c8d;
      font-size: 16px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <div class="logo">CHARISM</div>
        <p class="tagline">Community Service Management System</p>
        <div class="update-badge">Registration Update</div>
      </div>
      
      <p style="font-size: 16px; color: #2c3e50; margin-bottom: 24px;">
        Hello <strong>${userName || 'there'}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #555; margin-bottom: 32px;">
        We wanted to inform you about an update regarding your registration for the following community service event:
      </p>
      
      <div class="event-card">
        <h3 class="event-title">${eventTitle}</h3>
        <div class="event-detail">
          <span class="event-detail-icon">📅</span>
          <strong>Date:</strong> ${eventDate}
        </div>
      </div>
      
      <div class="status-banner">
        <h3>Registration Status</h3>
        <p>Your registration for this event has been disapproved.</p>
      </div>
      
      <div class="reason-card">
        <h3>Reason for Disapproval</h3>
        <p class="reason-text">${reason}</p>
      </div>
      
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>You can register for other available community service events</li>
          <li>Make sure to meet all requirements before registering for future events</li>
          <li>Contact the event organizer if you have any questions</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}" class="cta-button">
          View Other Events
        </a>
      </div>
      
      <div class="footer-message">
        We encourage you to continue participating in community service opportunities! 💪
      </div>
      
      ${getNoReplyFooter()}
    </div>
  </div>
</body>
</html>
`;
};

// Staff approval template
const getStaffApprovalTemplate = (userName, isApproved) => {
  const status = isApproved ? 'Approved' : 'Rejected';
  const color = isApproved ? '#27ae60' : '#e74c3c';
  const message = isApproved 
    ? 'Your staff account application has been approved. You can now log in to the system.'
    : 'Your staff account application has been reviewed and unfortunately cannot be approved at this time.';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staff Application ${status} - CHARISM </title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM </h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Staff Application ${status}</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName},</p>
      <p>${message}</p>
    </div>
    
    <div style="background-color: ${color}15; border: 1px solid ${color}; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: ${color}; font-weight: bold;">
        Status: ${status}
      </p>
    </div>
    
    ${isApproved ? `
    <div style="margin-top: 20px;">
      <p style="margin: 0; font-size: 14px;">
        You can now access the system at: 
        <a href="https://charism-ucb4.onrender.com" style="color: #3498db;">https://charism-ucb4.onrender.com</a>
      </p>
    </div>
    ` : ''}
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Feedback response template
const getFeedbackResponseTemplate = (userName, subject, adminResponse, adminName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Response - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Feedback Response</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName},</p>
      <p>Thank you for your feedback. An administrator has responded to your submission:</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
      <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Your Original Feedback</h3>
      <p style="margin: 0; font-weight: bold; color: #34495e;">Subject: ${subject}</p>
    </div>
    
    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
      <h3 style="color: #27ae60; margin: 0 0 15px 0;">Administrator Response</h3>
      <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #d5d5d5;">
        ${adminResponse.replace(/\n/g, '<br>')}
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">
        <strong>Responded by:</strong> ${adminName} (Administrator)
      </p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Note:</strong> If you have any follow-up questions or concerns, please contact the school administration directly.
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Feedback status update template
const getFeedbackStatusUpdateTemplate = (userName, subject, oldStatus, newStatus, adminName) => {
  const statusColors = {
    'pending': '#f39c12',
    'working-on-it': '#3498db', 
    'resolve': '#27ae60'
  };
  
  const statusLabels = {
    'pending': 'Pending',
    'working-on-it': 'In Progress',
    'resolve': 'Resolved'
  };
  
  const color = statusColors[newStatus] || '#7f8c8d';
  const newStatusLabel = statusLabels[newStatus] || newStatus;
  const oldStatusLabel = statusLabels[oldStatus] || oldStatus;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Status Update - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Feedback Status Update</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName},</p>
      <p>Your feedback status has been updated:</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
      <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Your Feedback</h3>
      <p style="margin: 0; font-weight: bold; color: #34495e;">Subject: ${subject}</p>
    </div>
    
    <div style="background-color: ${color}15; border: 1px solid ${color}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: ${color}; margin: 0 0 15px 0;">Status Update</h3>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <span style="background-color: #e0e0e0; color: #666; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${oldStatusLabel}</span>
        <span style="color: #666;">→</span>
        <span style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${newStatusLabel}</span>
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">
        <strong>Updated by:</strong> ${adminName} (Administrator)
      </p>
    </div>
    
    <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #0c5460;">
        <strong>What this means:</strong> 
        ${newStatus === 'pending' ? 'Your feedback is being reviewed and will be addressed soon.' : 
          newStatus === 'working-on-it' ? 'We are actively working on your feedback and will provide updates as we progress.' :
          newStatus === 'resolve' ? 'Your feedback has been resolved. Thank you for helping us improve!' : 
          'Your feedback status has been updated.'}
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Feedback submission confirmation template
const getFeedbackSubmissionTemplate = (userName, subject, message, category, priority, feedbackId) => {
  const priorityColors = {
    'low': '#28a745',
    'medium': '#ffc107', 
    'high': '#fd7e14',
    'urgent': '#dc3545'
  };
  
  const priorityLabels = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  };
  
  const categoryLabels = {
    'general': 'General',
    'bug': 'Bug Report',
    'feature': 'Feature Request',
    'complaint': 'Complaint',
    'suggestion': 'Suggestion',
    'other': 'Other'
  };
  
  const priorityColor = priorityColors[priority] || '#ffc107';
  const priorityLabel = priorityLabels[priority] || 'Medium';
  const categoryLabel = categoryLabels[category] || 'General';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Received - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Feedback Received</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName},</p>
      <p>Thank you for taking the time to share your feedback with us. We have received your submission and will review it carefully.</p>
    </div>
    
    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
      <h3 style="color: #27ae60; margin: 0 0 15px 0;">Your Feedback Details</h3>
      <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #d5d5d5;">
        <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
        <p style="margin: 0 0 10px 0;"><strong>Category:</strong> ${categoryLabel}</p>
        <p style="margin: 0 0 10px 0;"><strong>Priority:</strong> <span style="background-color: ${priorityColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${priorityLabel}</span></p>
        <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
        <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">
        <strong>Reference ID:</strong> ${feedbackId}
      </p>
    </div>
    
    <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0;">What happens next?</h4>
      <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
        <li>Your feedback will be reviewed by our administration team</li>
        <li>We will update the status as we work on your request</li>
        <li>You will receive email notifications for any updates or responses</li>
        <li>We aim to respond to all feedback within 2-3 business days</li>
      </ul>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Important:</strong> Please keep this email for your records. You can use the Reference ID above if you need to follow up on your feedback.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin: 0; font-size: 16px; color: #2c3e50;">
        Thank you for helping us improve CHARISM!
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Contact form submission confirmation template
const getContactSubmissionTemplate = (name, email, message, messageId) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Message Received - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Contact Message Received</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Dear ${name},</p>
      <p>Thank you for reaching out to us! We have received your message and will get back to you as soon as possible.</p>
    </div>
    
    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
      <h3 style="color: #27ae60; margin: 0 0 15px 0;">Your Message Details</h3>
      <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #d5d5d5;">
        <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${name}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
        <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">
        <strong>Reference ID:</strong> ${messageId}
      </p>
    </div>
    
    <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0;">What happens next?</h4>
      <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
        <li>Your message will be reviewed by our administration team</li>
        <li>We typically respond within 24-48 hours</li>
        <li>You will receive our response at this email address</li>
        <li>For urgent matters, please don't hesitate to contact us again</li>
      </ul>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Important:</strong> Please keep this email for your records. You can use the Reference ID above if you need to follow up on your message.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin: 0; font-size: 16px; color: #2c3e50;">
        Thank you for contacting CHARISM!
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Contact message admin notification template
const getContactAdminNotificationTemplate = (name, email, message, messageId) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Message - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">New Contact Message</p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #856404; font-weight: bold;">
        ⚠️ New contact message requires your attention
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Message Details</h3>
      <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #d5d5d5;">
        <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${name}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #3498db;">${email}</a></p>
        <p style="margin: 0 0 10px 0;"><strong>Received:</strong> ${new Date().toLocaleString()}</p>
        <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
        <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">
        <strong>Message ID:</strong> ${messageId}
      </p>
    </div>
    
    <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0;">Next Steps</h4>
      <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
        <li>Review the message content above</li>
        <li>Respond to the user at: <a href="mailto:${email}" style="color: #3498db;">${email}</a></li>
        <li>Mark the message as read in the admin panel</li>
        <li>Consider adding a reply through the admin interface</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d;">
        This is an automated notification from the CHARISM contact system.
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Contact message response template
const getContactResponseTemplate = (name, email, originalMessage, adminResponse, adminName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Response to Your Message - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Response to Your Message</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Dear ${name},</p>
      <p>Thank you for contacting us. Here is our response to your message:</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
      <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Your Original Message</h3>
      <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #d5d5d5;">
        ${originalMessage.replace(/\n/g, '<br>')}
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
      <h3 style="color: #27ae60; margin: 0 0 15px 0;">Our Response</h3>
      <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #d5d5d5;">
        ${adminResponse.replace(/\n/g, '<br>')}
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">
        <strong>Responded by:</strong> ${adminName} (Administrator)
      </p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Note:</strong> If you have any follow-up questions or concerns, please don't hesitate to contact us again.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin: 0; font-size: 16px; color: #2c3e50;">
        Thank you for contacting CHARISM!
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

// Event Registration Confirmation Template
const getEventRegistrationConfirmationTemplate = (studentName, eventTitle, eventDate, eventLocation, requiresApproval) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Registration Confirmation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    .email-container {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .email-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }
    .email-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3498db, #2980b9);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      position: relative;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .tagline {
      color: #7f8c8d;
      font-size: 16px;
      font-weight: 400;
      margin: 0;
    }
    .success-icon {
      font-size: 64px;
      margin: 20px 0;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    }
    .confirmation-title {
      color: #27ae60;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .event-details {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border: none;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .event-details::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(135deg, #3498db, #2980b9);
      border-radius: 0 2px 2px 0;
    }
    .event-title {
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px 0;
      letter-spacing: -0.3px;
    }
    .event-detail {
      display: flex;
      align-items: center;
      margin: 8px 0;
      font-size: 15px;
    }
    .event-detail-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      opacity: 0.7;
    }
    .status-badge {
      background: linear-gradient(135deg, ${requiresApproval ? '#f39c12, #e67e22' : '#27ae60, #2ecc71'});
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      display: inline-flex;
      align-items: center;
      margin: 16px 0;
      box-shadow: 0 8px 20px rgba(${requiresApproval ? '243, 156, 18' : '39, 174, 96'}, 0.3);
    }
    .status-badge::before {
      content: '${requiresApproval ? '⏳' : '✅'}';
      margin-right: 8px;
      font-size: 18px;
    }
    .next-steps {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      border: none;
    }
    .next-steps h3 {
      color: #1976d2;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
    }
    .next-steps h3::before {
      content: '📋';
      margin-right: 8px;
    }
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
      color: #424242;
    }
    .next-steps li {
      margin: 8px 0;
      font-size: 15px;
    }
    .footer-message {
      text-align: center;
      margin: 32px 0;
      color: #7f8c8d;
      font-size: 16px;
      font-weight: 500;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
      transition: all 0.3s ease;
      margin: 20px 0;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(52, 152, 219, 0.4);
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <div class="logo">CHARISM</div>
        <p class="tagline">Community Service Management System</p>
        <div class="success-icon">🎉</div>
        <h1 class="confirmation-title">Registration Confirmed!</h1>
      </div>
      
      <p style="font-size: 16px; color: #2c3e50; margin-bottom: 24px;">
        Dear <strong>${studentName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #555; margin-bottom: 32px;">
        Thank you for registering for our event! Your registration has been successfully recorded.
      </p>
      
      <div class="event-details">
        <h3 class="event-title">Event Details</h3>
        <div class="event-detail">
          <span class="event-detail-icon">🎯</span>
          <strong>Event:</strong> ${eventTitle}
        </div>
        <div class="event-detail">
          <span class="event-detail-icon">📅</span>
          <strong>Date:</strong> ${eventDate}
        </div>
        <div class="event-detail">
          <span class="event-detail-icon">📍</span>
          <strong>Location:</strong> ${eventLocation || 'TBD'}
        </div>
        <div class="status-badge">
          ${requiresApproval ? 'Pending Approval' : 'Auto-Approved'}
        </div>
      </div>
      
      <div class="next-steps">
        <h3>What's Next?</h3>
        ${requiresApproval ? `
        <ul>
          <li>Your registration is pending approval from staff/admin</li>
          <li>You will receive an email notification once your registration is reviewed</li>
          <li>Please wait for approval before attending the event</li>
          <li>Check your "My Participants" page for updates</li>
        </ul>
        ` : `
        <ul>
          <li>Your registration has been automatically approved</li>
          <li>You can now attend the event</li>
          <li>Remember to time in and time out during the event</li>
          <li>Check your "My Participants" page for event details</li>
        </ul>
        `}
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}" class="cta-button">
          View Event Details
        </a>
      </div>
      
      <div class="footer-message">
        We look forward to seeing you at the event! 🌟<br>
        <strong>Best regards,<br>CHARISM Team</strong>
      </div>
      
      ${getNoReplyFooter()}
    </div>
  </div>
</body>
</html>
`;

// Event Completion Template
const getEventCompletionTemplate = (studentName, eventTitle, eventDate, hoursCompleted) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Completion Confirmation</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background-color: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #007bff;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #007bff;
      margin-bottom: 10px;
    }
    .success-icon {
      font-size: 48px;
      color: #28a745;
      margin-bottom: 20px;
    }
    .event-details {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #007bff;
    }
    .hours-badge {
      background-color: #28a745;
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: bold;
      display: inline-block;
      margin: 15px 0;
    }
    .next-steps {
      background-color: #e7f3ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #007bff;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">CHARISM</div>
      <div class="success-icon">🎉</div>
      <h1 style="color: #28a745; margin: 0;">Event Completed Successfully!</h1>
    </div>
    
    <p>Dear <strong>${studentName}</strong>,</p>
    
    <p>Congratulations! You have successfully completed the event and your participation has been recorded.</p>
    
    <div class="event-details">
      <h3 style="margin-top: 0; color: #007bff;">Event Details:</h3>
      <p><strong>Event:</strong> ${eventTitle}</p>
      <p><strong>Date:</strong> ${eventDate}</p>
      <div class="hours-badge">
        ⏱️ ${hoursCompleted} hours completed
      </div>
    </div>
    
    <div class="next-steps">
      <h3 style="margin-top: 0; color: #007bff;">What's Next?</h3>
      <ul>
        <li>Your participation hours have been added to your profile</li>
        <li>Check your "My Participants" page to view your updated hours</li>
        <li>Continue participating in more events to reach your certificate goals</li>
        <li>If you have any questions, contact the event organizers</li>
      </ul>
    </div>
    
    <p>Thank you for your participation and contribution to our community!</p>
    
    <p>Best regards,<br>
    <strong>CHARISM Team</strong></p>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Registration Approval Email Template
const getRegistrationApprovalTemplate = (userName, eventTitle, eventDate, eventLocation, eventHours) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Approved - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #27ae60; margin: 0;">CHARISM</h1>
      <p style="color: #666; margin: 5px 0 0 0;">Community Service Management System</p>
    </div>
    
    <h2 style="color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
      ✅ Registration Approved
    </h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <p>Great news! Your registration for the following community service event has been <strong style="color: #27ae60;">approved</strong>:</p>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #27ae60; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${eventTitle}</h3>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> ${eventLocation || 'TBD'}</p>
      <p style="margin: 5px 0;"><strong>Service Hours:</strong> ${eventHours} hours</p>
    </div>
    
    <div style="background-color: #e8f5e8; border: 1px solid #27ae60; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #27ae60; font-weight: bold;">
        ✅ Your registration is confirmed! You can now participate in this event.
      </p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="color: #2c3e50;">What's Next?</h3>
      <ul style="color: #555;">
        <li>Make sure to arrive on time for the event</li>
        <li>Bring any required materials or documentation</li>
        <li>Check the event details for any specific requirements</li>
        <li>Remember to time in and time out during the event</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}" 
         style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Event Details
      </a>
    </div>
    
    <p>Thank you for your commitment to community service!</p>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Registration Disapproval Email Template
const getRegistrationDisapprovalTemplate = (userName, eventTitle, eventDate, reason) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Update - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #e74c3c; margin: 0;">CHARISM</h1>
      <p style="color: #666; margin: 5px 0 0 0;">Community Service Management System</p>
    </div>
    
    <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
      ❌ Registration Update
    </h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <p>We wanted to inform you about an update regarding your registration for the following community service event:</p>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #e74c3c; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${eventTitle}</h3>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
    </div>
    
    <div style="background-color: #fdf2f2; border: 1px solid #e74c3c; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Registration Status</h3>
      <p style="margin: 0; color: #e74c3c; font-weight: bold;">
        ❌ Your registration for this event has been disapproved.
      </p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="color: #2c3e50;">Reason for Disapproval</h3>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #e74c3c;">
        <p style="margin: 0; color: #555;">${reason}</p>
      </div>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="color: #2c3e50;">What's Next?</h3>
      <ul style="color: #555;">
        <li>You can register for other available community service events</li>
        <li>Make sure to meet all requirements before registering for future events</li>
        <li>Contact the event organizer if you have any questions</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}" 
         style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Other Events
      </a>
    </div>
    
    <p>We encourage you to continue participating in community service opportunities.</p>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Attendance Approval Email Template
const getAttendanceApprovalTemplate = (userName, eventTitle, eventHours, totalHours) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Approved - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #27ae60; margin: 0;">CHARISM</h1>
      <p style="color: #666; margin: 5px 0 0 0;">Community Service Management System</p>
    </div>
    
    <h2 style="color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
      ✅ Attendance Approved
    </h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <p>Great news! Your attendance for the following community service event has been <strong style="color: #27ae60;">approved</strong>:</p>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #27ae60; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${eventTitle}</h3>
      <p style="margin: 5px 0;"><strong>Hours Earned:</strong> ${eventHours} hours</p>
      <p style="margin: 5px 0;"><strong>Total Community Service Hours:</strong> ${totalHours} hours</p>
    </div>
    
    <div style="background-color: #e8f5e8; border: 1px solid #27ae60; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #27ae60; font-weight: bold;">
        ✅ Your attendance has been confirmed! Hours have been added to your record.
      </p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="color: #2c3e50;">What's Next?</h3>
      <ul style="color: #555;">
        <li>Your community service hours have been added to your profile</li>
        <li>Continue participating in more events to reach your certificate goals</li>
        <li>Check your dashboard to view your updated total hours</li>
        <li>Keep up the excellent work!</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}" 
         style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Your Dashboard
      </a>
    </div>
    
    <p>Thank you for your participation in community service activities.</p>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Attendance Disapproval Email Template
const getAttendanceDisapprovalTemplate = (userName, eventTitle, eventDate, reason) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Update - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #e74c3c; margin: 0;">CHARISM</h1>
      <p style="color: #666; margin: 5px 0 0 0;">Community Service Management System</p>
    </div>
    
    <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
      ❌ Attendance Update
    </h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <p>We wanted to inform you about an update regarding your attendance for the following community service event:</p>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #e74c3c; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${eventTitle}</h3>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
    </div>
    
    <div style="background-color: #fdf2f2; border: 1px solid #e74c3c; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Attendance Status</h3>
      <p style="margin: 0; color: #e74c3c; font-weight: bold;">
        ❌ Your attendance for this event has been disapproved.
      </p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="color: #2c3e50;">Reason for Disapproval</h3>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #e74c3c;">
        <p style="margin: 0; color: #555;">${reason}</p>
      </div>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="color: #2c3e50;">What's Next?</h3>
      <ul style="color: #555;">
        <li>You can register for other available community service events</li>
        <li>Make sure to follow all event requirements and guidelines</li>
        <li>Contact the event organizer if you have any questions</li>
        <li>We encourage you to continue participating in future events</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com'}" 
         style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Other Events
      </a>
    </div>
    
    <p>We encourage you to continue participating in community service opportunities.</p>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Additional email template functions that were missing
const getRegistrationTemplate = (userName, eventTitle, eventDate) => {
  return getEventRegistrationConfirmationTemplate(userName, eventTitle, eventDate, '', false);
};

const getLoginTemplate = (userName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Notification - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Login Notification</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName || 'there'},</p>
      <p>This is to notify you that your account was accessed recently. If this was you, no action is needed.</p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Security Notice:</strong> If you did not log in recently, please change your password immediately.
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

const getForgotPasswordTemplate = (userName, resetLink) => {
  return getPasswordResetTemplate(resetLink, userName);
};

const getResetPasswordTemplate = (userName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #27ae60; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Password Reset Successful</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName || 'there'},</p>
      <p>Your password has been successfully reset. You can now log in with your new password.</p>
    </div>
    
    <div style="background-color: #e8f5e8; border: 1px solid #27ae60; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #27ae60; font-weight: bold;">
        ✅ Your password has been successfully updated.
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

const getEventRegistrationTemplate = (userName, eventTitle, eventDate) => {
  return getEventRegistrationConfirmationTemplate(userName, eventTitle, eventDate, '', true);
};

const getEventApprovalTemplate = (userName, eventTitle, eventDate) => {
  return getEventRegistrationApprovalTemplate(userName, eventTitle, eventDate, '', '');
};

const getEventNotificationTemplate = (userName, eventTitle, eventDate, message) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Notification - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2c3e50; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Event Notification</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName || 'there'},</p>
      <p>We have an important update about the event you're registered for:</p>
    </div>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${eventTitle}</h3>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
    </div>
    
    <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0;">Message:</h4>
      <p style="margin: 0; color: #0c5460;">${message}</p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

const getEventUpdateTemplate = (userName, eventTitle, eventDate, changes) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Update - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #f39c12; margin: 0;">CHARISM</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Event Update</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <p>Hello ${userName || 'there'},</p>
      <p>The following event has been updated:</p>
    </div>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #f39c12; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${eventTitle}</h3>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #856404; margin: 0 0 10px 0;">Changes Made:</h4>
      <p style="margin: 0; color: #856404;">${changes}</p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;
};

const getContactUsTemplate = (name, email, message) => {
  return getContactSubmissionTemplate(name, email, message, '');
};

const getFeedbackTemplate = (userName, subject, message) => {
  return getFeedbackSubmissionTemplate(userName, subject, message, 'general', 'medium', '');
};

// Essential missing templates for approval/disapproval

// User Approval Template
const getUserApprovalTemplate = (userName, adminName, approvalDate) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Approved - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Account Approved!</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Welcome to CHARISM!</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #155724; margin: 0 0 10px 0;">✅ Account Status: APPROVED</h3>
      <p style="margin: 0; color: #155724;">Your account has been successfully approved and is now active!</p>
    </div>
    
    <p>You can now:</p>
    <ul style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db;">
      <li>Log in to your account</li>
      <li>Browse and register for community service events</li>
      <li>Track your attendance and hours</li>
      <li>Access all student features</li>
    </ul>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>Approved by:</strong> ${adminName}<br>
        <strong>Approval Date:</strong> ${approvalDate}
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// User Rejection Template
const getUserRejectionTemplate = (userName, adminName, rejectionReason, rejectionDate) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Update - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📋 Account Update</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Account Status Update</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #721c24; margin: 0 0 10px 0;">❌ Account Status: REJECTED</h3>
      <p style="margin: 0; color: #721c24;">Your account registration has been rejected.</p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #856404; margin: 0 0 10px 0;">Reason for Rejection:</h4>
      <p style="margin: 0; color: #856404;">${rejectionReason}</p>
    </div>
    
    <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0;">What you can do:</h4>
      <ul style="margin: 0; color: #0c5460;">
        <li>Review your registration information</li>
        <li>Contact the administration for clarification</li>
        <li>Submit a new registration with corrected information</li>
      </ul>
    </div>
    
    <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #6c757d;">
        <strong>Rejected by:</strong> ${adminName}<br>
        <strong>Rejection Date:</strong> ${rejectionDate}
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Event Cancellation Template
const getEventCancellationTemplate = (userName, eventTitle, eventDate, cancellationReason) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Event Cancelled - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">❌ Event Cancelled</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Event Cancellation Notice</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #721c24; margin: 0 0 10px 0;">Event Cancelled</h3>
      <p style="margin: 0; color: #721c24;">We regret to inform you that the following event has been cancelled:</p>
    </div>
    
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Event Details</h3>
      <p style="margin: 5px 0;"><strong>Event:</strong> ${eventTitle}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #856404; margin: 0 0 10px 0;">Cancellation Reason:</h4>
      <p style="margin: 0; color: #856404;">${cancellationReason}</p>
    </div>
    
    <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0;">What happens next:</h4>
      <ul style="margin: 0; color: #0c5460;">
        <li>Your registration has been automatically cancelled</li>
        <li>You will receive a refund if applicable</li>
        <li>Look out for future events that may interest you</li>
      </ul>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Event Reminder Template
const getEventReminderTemplate = (userName, eventTitle, eventDate, eventTime, eventLocation) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Event Reminder - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Event Reminder</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Don't Miss Your Event!</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #155724; margin: 0 0 10px 0;">📅 Event Reminder</h3>
      <p style="margin: 0; color: #155724;">This is a friendly reminder about your upcoming community service event.</p>
    </div>
    
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Event Details</h3>
      <p style="margin: 5px 0;"><strong>Event:</strong> ${eventTitle}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> ${eventTime}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> ${eventLocation}</p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #856404; margin: 0 0 10px 0;">Important Reminders:</h4>
      <ul style="margin: 0; color: #856404;">
        <li>Arrive on time for the event</li>
        <li>Remember to time in when you arrive</li>
        <li>Time out when you leave</li>
        <li>Bring any required materials</li>
      </ul>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Attendance Confirmation Template
const getAttendanceConfirmationTemplate = (userName, eventTitle, eventDate, timeIn, timeOut, totalHours) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Attendance Confirmed - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Attendance Confirmed</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Thank You for Your Service!</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #155724; margin: 0 0 10px 0;">✅ Attendance Recorded</h3>
      <p style="margin: 0; color: #155724;">Your attendance has been successfully recorded and confirmed!</p>
    </div>
    
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Attendance Details</h3>
      <p style="margin: 5px 0;"><strong>Event:</strong> ${eventTitle}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
      <p style="margin: 5px 0;"><strong>Time In:</strong> ${timeIn}</p>
      <p style="margin: 5px 0;"><strong>Time Out:</strong> ${timeOut}</p>
      <p style="margin: 5px 0;"><strong>Total Hours:</strong> ${totalHours} hours</p>
    </div>
    
    <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0;">What's Next:</h4>
      <ul style="margin: 0; color: #0c5460;">
        <li>Your hours will be added to your community service record</li>
        <li>You can view your total hours in your profile</li>
        <li>Keep participating in more community service events</li>
      </ul>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Profile Update Template
const getProfileUpdateTemplate = (userName, updatedFields, updateDate) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Profile Updated - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">👤 Profile Updated</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Profile Update Confirmation</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #155724; margin: 0 0 10px 0;">✅ Profile Successfully Updated</h3>
      <p style="margin: 0; color: #155724;">Your profile information has been updated successfully.</p>
    </div>
    
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Updated Fields</h3>
      <ul style="margin: 0; color: #2c3e50;">
        ${updatedFields.map(field => `<li>${field}</li>`).join('')}
      </ul>
    </div>
    
    <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #6c757d;">
        <strong>Update Date:</strong> ${updateDate}
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Password Change Template
const getPasswordChangeTemplate = (userName, changeDate, ipAddress) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Changed - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Password Changed</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Password Change Confirmation</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #155724; margin: 0 0 10px 0;">✅ Password Successfully Changed</h3>
      <p style="margin: 0; color: #155724;">Your password has been changed successfully.</p>
    </div>
    
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Change Details</h3>
      <p style="margin: 5px 0;"><strong>Change Date:</strong> ${changeDate}</p>
      <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="color: #856404; margin: 0 0 10px 0;">Security Notice:</h4>
      <p style="margin: 0; color: #856404;">If you did not make this change, please contact us immediately and consider changing your password again.</p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Welcome Template
const getWelcomeTemplate = (userName, loginDate) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome Back - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">👋 Welcome Back!</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Welcome to CHARISM</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #155724; margin: 0 0 10px 0;">🎉 Welcome to CHARISM!</h3>
      <p style="margin: 0; color: #155724;">Thank you for joining our community service management system.</p>
    </div>
    
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">What you can do:</h3>
      <ul style="margin: 0; color: #2c3e50;">
        <li>Browse and register for community service events</li>
        <li>Track your attendance and service hours</li>
        <li>Connect with other students and staff</li>
        <li>Access your profile and update information</li>
      </ul>
    </div>
    
    <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #6c757d;">
        <strong>Login Date:</strong> ${loginDate}
      </p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// System Alert Template
const getSystemAlertTemplate = (alertType, message, severity, timestamp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>System Alert - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ System Alert</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">System Alert Notification</h2>
    
    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #721c24; margin: 0 0 10px 0;">⚠️ ${alertType}</h3>
      <p style="margin: 0; color: #721c24;">${message}</p>
    </div>
    
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Alert Details</h3>
      <p style="margin: 5px 0;"><strong>Alert Type:</strong> ${alertType}</p>
      <p style="margin: 5px 0;"><strong>Severity:</strong> ${severity}</p>
      <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

// Admin Notification Template
const getAdminNotificationTemplate = (adminName, notificationType, message, timestamp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admin Notification - CHARISM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">👨‍💼 Admin Notification</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0;">Admin Notification</h2>
    
    <p>Dear <strong>${adminName}</strong>,</p>
    
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #155724; margin: 0 0 10px 0;">📋 ${notificationType}</h3>
      <p style="margin: 0; color: #155724;">${message}</p>
    </div>
    
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Notification Details</h3>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${notificationType}</p>
      <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
    
    ${getNoReplyFooter()}
  </div>
</body>
</html>
`;

module.exports = {
  getEmailVerificationTemplate,
  getPasswordResetTemplate,
  getStaffApprovalTemplate,
  getEventRegistrationConfirmationTemplate,
  getEventRegistrationApprovalTemplate,
  getEventRegistrationDisapprovalTemplate,
  getEventCompletionTemplate,
  getFeedbackResponseTemplate,
  getFeedbackStatusUpdateTemplate,
  getFeedbackSubmissionTemplate,
  getContactSubmissionTemplate,
  getContactAdminNotificationTemplate,
  getContactResponseTemplate,
  getRegistrationApprovalTemplate,
  getRegistrationDisapprovalTemplate,
  getAttendanceApprovalTemplate,
  getAttendanceDisapprovalTemplate,
  getNoReplyFooter,
  NO_REPLY_EMAIL,
  // Additional missing templates
  getRegistrationTemplate,
  getLoginTemplate,
  getForgotPasswordTemplate,
  getResetPasswordTemplate,
  getEventRegistrationTemplate,
  getEventApprovalTemplate,
  getEventNotificationTemplate,
  getEventUpdateTemplate,
  getContactUsTemplate,
  getFeedbackTemplate,
  // Essential missing templates for approval/disapproval
  getUserApprovalTemplate,
  getUserRejectionTemplate,
  getEventCancellationTemplate,
  getEventReminderTemplate,
  getAttendanceConfirmationTemplate,
  getProfileUpdateTemplate,
  getPasswordChangeTemplate,
  getWelcomeTemplate,
  getSystemAlertTemplate,
  getAdminNotificationTemplate
};
