// frontend/src/components/ResetPasswordPage.jsx
// Simple but Creative Reset Password Page Design

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import './ResetPasswordPage.css';

function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Check password matching in real-time
  useEffect(() => {
    if (confirmPassword && password) {
      if (password === confirmPassword) {
        setPasswordMatch(true);
      } else {
        setPasswordMatch(false);
      }
    } else {
      setPasswordMatch(null);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No reset token provided. Please use the link from your email.'
      });
      return;
    }
    
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match.'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Use the correct API endpoint
      const response = await axios.post(`${process.env.REACT_APP_API_URL || ''}/api/auth/reset-password/${token}`, { 
        password: password 
      });
      
      if (response.data && response.data.message) {
        Swal.fire({
          icon: 'success',
          title: '🎉 Password Reset Successful!',
          text: 'Your password has been reset successfully. You can now log in with your new password.',
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#10b981'
        }).then(() => {
          navigate('/login');
        });
      }
    } catch (err) {
      console.error('Password reset error:', err);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (err.response && err.response.data) {
        if (err.response.data.message === 'Cannot reuse old password') {
          errorMessage = 'You cannot use your old password. Please choose a new one.';
        } else if (err.response.data.message.includes('Invalid or expired token')) {
          errorMessage = 'The reset link is invalid or has expired. Please request a new password reset.';
        } else if (err.response.data.message.includes('User not found')) {
          errorMessage = 'User account not found. Please check your reset link.';
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Password Reset Failed',
        text: errorMessage,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-background">
          <div className="background-pattern"></div>
        </div>

        <Container className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-header">
              <div className="reset-password-icon">
                <div className="icon-symbol">⚠️</div>
              </div>
              <h1 className="reset-password-title">Invalid Reset Link</h1>
              <p className="reset-password-subtitle">This password reset link is invalid or missing.</p>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Button 
                onClick={() => navigate('/forgot-password')}
                variant="primary"
                size="lg"
                style={{ marginRight: '1rem' }}
              >
                Request New Reset
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline-primary"
                size="lg"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-background">
        <div className="background-pattern"></div>
      </div>

      <Container className={`reset-password-container ${isVisible ? 'visible' : ''}`}>
        <div className="reset-password-card">
          {/* Header */}
          <div className="reset-password-header">
            <div className="reset-password-icon">
              <div className="icon-symbol">🔑</div>
            </div>
            <h1 className="reset-password-title">Set New Password</h1>
            <p className="reset-password-subtitle">Create a strong password for your account</p>
          </div>

          {/* Form */}
          <Form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-section">
              <h3 className="section-title">Password Details</h3>
              
              <div className="form-field">
                <div className="input-wrapper">
                  <Form.Control
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={`form-input ${passwordMatch !== null ? (passwordMatch ? 'password-match' : 'password-mismatch') : ''}`}
                  />
                  <div className="input-focus-line"></div>
                </div>
                <div className="form-hint">Choose a strong password with at least 8 characters</div>
              </div>

              <div className="form-field">
                <div className="input-wrapper">
                  <Form.Control
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className={`form-input ${passwordMatch !== null ? (passwordMatch ? 'password-match' : 'password-mismatch') : ''}`}
                  />
                  <div className="input-focus-line"></div>
                </div>
                <div className="form-hint">Re-enter your password to confirm</div>
                {passwordMatch !== null && (
                  <div className={`password-match-indicator ${passwordMatch ? 'match' : 'mismatch'}`}>
                    {passwordMatch ? '✅ Passwords match!' : '❌ Passwords do not match'}
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || passwordMatch === false} 
              className={`reset-password-button ${loading ? 'loading' : ''}`}
            >
              <span className="button-content">
                {loading ? 'Updating password...' : 'Update Password'}
              </span>
            </Button>
          </Form>
        </div>
      </Container>
    </div>
  );
}

export default ResetPasswordPage;