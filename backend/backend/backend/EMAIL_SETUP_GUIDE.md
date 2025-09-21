# 📧 Email Setup Guide for CHARISM Community Link

This guide will help you configure email functionality for the CHARISM Community Link system. Email is used for:
- User registration verification
- Password reset requests
- Important system notifications

## 🚀 Quick Setup (Gmail - Recommended for Development)

### 1. Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security → 2-Step Verification
3. Enable 2-Step Verification if not already enabled

### 2. Generate App Password
1. Go to Security → App passwords
2. Select "Mail" and "Other (Custom name)"
3. Enter "CHARISM Community Link" as the name
4. Click "Generate"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### 3. Configure Environment Variables
1. Copy `env_template.txt` to `.env` in the backend folder
2. Update these values:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_SERVICE=gmail
FRONTEND_URL=http://localhost:3000
```

### 4. Test Email Configuration
Run the test script:
```bash
cd backend
node test_email_system.js
```

## 🔧 Alternative Email Providers

### Outlook/Hotmail
```env
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password_or_app_password
EMAIL_SERVICE=outlook
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

### Yahoo Mail
```env
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password
EMAIL_SERVICE=yahoo
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

### Custom SMTP Server
```env
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_password
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SERVICE=custom
```

## 🛠️ Production Email Services

### SendGrid (Recommended for Production)
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Update configuration:

```env
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SERVICE=custom
```

### Amazon SES
1. Set up AWS SES in your AWS Console
2. Create SMTP credentials
3. Update configuration:

```env
EMAIL_USER=your_ses_smtp_username
EMAIL_PASS=your_ses_smtp_password
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SERVICE=custom
```

### Mailgun
1. Sign up at [Mailgun](https://mailgun.com/)
2. Get your SMTP credentials
3. Update configuration:

```env
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASS=your_mailgun_password
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SERVICE=custom
```

## 🔒 Security Best Practices

### 1. Use App Passwords
- Never use your main account password
- Generate unique app passwords for each service
- Rotate passwords regularly

### 2. Environment Variables
- Never commit `.env` files to version control
- Use different credentials for development and production
- Store production credentials securely

### 3. Rate Limiting
- Implement rate limiting for email sending
- Monitor email sending patterns
- Set up alerts for unusual activity

## 🧪 Testing Email Functionality

### 1. Test Registration
1. Register a new user account
2. Check your email for verification link
3. Click the verification link
4. Verify the account is activated

### 2. Test Password Reset
1. Go to login page
2. Click "Forgot Password"
3. Enter your email address
4. Check email for reset link
5. Test password reset functionality

### 3. Test Email Templates
The system includes beautiful HTML email templates for:
- Welcome emails with verification links
- Password reset requests
- Account approval notifications

## 🐛 Troubleshooting

### Common Issues

#### "Email not configured" Warning
- Check that `.env` file exists in backend folder
- Verify EMAIL_USER and EMAIL_PASS are set
- Ensure no extra spaces in environment variables

#### "Authentication failed" Error
- Verify 2FA is enabled (for Gmail)
- Check app password is correct
- Ensure account allows "less secure app access" (if applicable)

#### "Connection timeout" Error
- Check firewall settings
- Verify SMTP port is correct
- Test network connectivity to SMTP server

#### Emails not received
- Check spam/junk folder
- Verify email address is correct
- Check email provider's sending limits

### Debug Steps
1. Check server console for error messages
2. Verify environment variables are loaded
3. Test SMTP connection manually
4. Check email provider's status page
5. Review email provider's logs

## 📱 Mobile Compatibility

The email templates are designed to work on all devices:
- Responsive design for mobile phones
- Tablet-optimized layouts
- Desktop-friendly formatting
- Cross-platform email client support

## 🌐 Cross-Platform Support

The system works on:
- **Operating Systems**: Windows, macOS, Linux
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Email Clients**: Gmail, Outlook, Apple Mail, Thunderbird

## 📊 Monitoring and Analytics

### Email Metrics to Track
- Delivery rates
- Open rates
- Click-through rates
- Bounce rates
- Spam complaints

### Recommended Tools
- SendGrid Analytics
- Mailgun Analytics
- Google Analytics (for click tracking)
- Custom logging and monitoring

## 🔄 Maintenance

### Regular Tasks
- Monitor email delivery rates
- Update email templates as needed
- Review and rotate credentials
- Check for new security updates
- Monitor email provider status

### Updates
- Keep nodemailer package updated
- Monitor email provider API changes
- Update email templates for new features
- Test email functionality after updates

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review server logs for errors
3. Test with different email providers
4. Contact system administrator
5. Check email provider's support documentation

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EMAIL_USER` | Email username/address | Yes | - |
| `EMAIL_PASS` | Email password/app password | Yes | - |
| `EMAIL_SERVICE` | Email service provider | No | `gmail` |
| `EMAIL_HOST` | SMTP host (for custom providers) | No | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | No | `587` |
| `FRONTEND_URL` | Frontend URL for email links | Yes | - |

## 🎯 Quick Start Checklist

- [ ] Enable 2FA on email account
- [ ] Generate app password
- [ ] Create `.env` file from template
- [ ] Configure email settings
- [ ] Test email functionality
- [ ] Verify cross-platform compatibility
- [ ] Set up monitoring (optional)
- [ ] Document configuration

---

**Note**: This guide covers the most common email providers. For specific configurations or enterprise email systems, consult your IT administrator or email provider's documentation.
