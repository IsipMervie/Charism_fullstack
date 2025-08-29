// frontend/src/components/ForgotPasswordPage.jsx
// Simple but Creative Forgot Password Page Design

import React, { useState, useEffect } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import './ForgotPasswordPage.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Required',
        text: 'Please enter your email address.',
      });
      return;
    }
    
    setLoading(true);
    try {
      // Use the correct API endpoint
      const response = await axios.post(`${process.env.REACT_APP_API_URL || ''}/api/auth/forgot-password`, { 
        email: email.trim() 
      });
      
      if (response.data && response.data.message) {
        Swal.fire({
          icon: 'success',
          title: '📧 Reset Link Sent!',
          text: response.data.message,
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });
        setEmail('');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      
      let errorMessage = 'Failed to send reset link. Please try again.';
      let icon = 'error';
      
      if (err.response && err.response.data) {
        if (err.response.data.message.includes('User not found')) {
          // Don't reveal if user exists or not for security
          errorMessage = 'If an account with that email exists, a password reset link has been sent.';
          icon = 'info';
        } else if (err.response.data.message.includes('Email service not available')) {
          errorMessage = 'Email service is currently unavailable. Please contact support.';
          icon = 'warning';
        } else if (err.response.data.message.includes('Failed to send')) {
          errorMessage = 'Failed to send email. Please try again later.';
          icon = 'warning';
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
        icon = 'warning';
      }
      
      Swal.fire({
        icon: icon,
        title: 'Reset Link Not Sent',
        text: errorMessage,
        confirmButtonText: 'OK',
        confirmButtonColor: icon === 'error' ? '#ef4444' : '#3b82f6'
      });
    }
    setLoading(false);
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-background">
        <div className="background-pattern"></div>
      </div>

      <Container className={`forgot-password-container ${isVisible ? 'visible' : ''}`}>
        <div className="forgot-password-card">
          {/* Header */}
          <div className="forgot-password-header">
            <div className="forgot-password-icon">
              <div className="icon-symbol">🔐</div>
            </div>
            <h1 className="forgot-password-title">Reset Password</h1>
            <p className="forgot-password-subtitle">Enter your email to receive a reset link</p>
          </div>

          {/* Form */}
          <Form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-field">
              <div className="input-wrapper">
                <Form.Control
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
                <div className="input-focus-line"></div>
              </div>
              <div className="form-hint">We'll send you a secure link to reset your password</div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className={`forgot-password-button ${loading ? 'loading' : ''}`}
            >
              <span className="button-content">
                {loading ? 'Sending reset link...' : 'Send Reset Link'}
              </span>
            </Button>
          </Form>

          {/* Additional Help */}
          <div className="forgot-password-help">
            <p>Don't have an account? <a href="/register">Sign up here</a></p>
            <p>Remember your password? <a href="/login">Login here</a></p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default ForgotPasswordPage;