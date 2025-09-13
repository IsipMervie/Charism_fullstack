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

module.exports = {
  getEmailVerificationTemplate,
  getPasswordResetTemplate,
  getStaffApprovalTemplate,
  getFeedbackResponseTemplate,
  getFeedbackStatusUpdateTemplate,
  getFeedbackSubmissionTemplate,
  getContactSubmissionTemplate,
  getContactAdminNotificationTemplate,
  getContactResponseTemplate,
  getNoReplyFooter,
  NO_REPLY_EMAIL
};
