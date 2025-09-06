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
    <strong>CHARISM Communit</strong><br>
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
      <h1 style="color: #2c3e50; margin: 0;">CHARISM/h1>
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
        <a href="https://charism.onrender.com" style="color: #3498db;">https://charism.onrender.com</a>
      </p>
    </div>
    ` : ''}
    
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
  getNoReplyFooter,
  NO_REPLY_EMAIL
};
