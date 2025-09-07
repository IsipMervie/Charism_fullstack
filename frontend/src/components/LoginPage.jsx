// frontend/src/components/LoginPage.jsx
// Simple but Creative Login Page Design (Matching Contact Page Style)

import React, { useState, useEffect } from 'react';
import { Button, Form, Container } from 'react-bootstrap';
import { loginUser, testApiConnection } from '../api/api';
import { useNavigate, Link } from 'react-router-dom';
import { showWarning, showError, showSuccess, showInfo, showAlert } from '../utils/sweetAlertUtils';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Test API connection first
    try {
      const connectionTest = await testApiConnection();
      if (!connectionTest.success) {
        console.error('API connection test failed:', connectionTest);
        
        // Provide more specific error messages
        let errorTitle = 'Connection Issue';
        let errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        
        if (connectionTest.code === 'ECONNABORTED') {
          errorTitle = 'Server Timeout';
          errorMessage = 'The server is taking too long to respond. This may indicate the server is overloaded or experiencing issues. Please try again in a few minutes.';
        } else if (connectionTest.code === 'ERR_NETWORK') {
          errorTitle = 'Network Error';
          errorMessage = 'Cannot reach the server. The backend may be down or there may be network connectivity issues.';
        } else if (connectionTest.status === 0) {
          errorTitle = 'Server Unreachable';
          errorMessage = 'The backend server appears to be offline or unreachable. Please contact support if this issue persists.';
        }
        
        showWarning(errorTitle, errorMessage, {
          footer: '<small>If this issue persists, the backend server may need to be restarted.</small>'
        });
        setLoading(false);
        return;
      }
    } catch (connectionError) {
      console.error('Connection test error:', connectionError);
      showWarning('Connection Issue', 'Unable to reach the server. Please check your internet connection and try again.');
      setLoading(false);
      return;
    }
    
    try {
      const { token, user } = await loginUser(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);
      window.dispatchEvent(new Event('userChanged'));
      await showSuccess('Login Successful', `Welcome, ${user.name || user.email}!`, {
        timer: 1500,
        showConfirmButton: false,
      });
      
      // Check if there's a redirect URL stored
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      console.log('Login redirect URL:', redirectUrl);
      console.log('Redirect URL type:', typeof redirectUrl);
      console.log('Redirect URL length:', redirectUrl ? redirectUrl.length : 0);
      
      if (redirectUrl && redirectUrl.trim() !== '') {
        localStorage.removeItem('redirectAfterLogin');
        console.log('Redirecting to:', redirectUrl);
        
        // Handle hash URLs properly
        if (redirectUrl.startsWith('#')) {
          // Remove the # and navigate to the path
          const path = redirectUrl.substring(1);
          console.log('Navigating to path:', path);
          navigate(path);
        } else {
          console.log('Navigating to full URL:', redirectUrl);
          navigate(redirectUrl);
        }
      } else {
        switch (user.role) {
          case 'Admin': navigate('/admin/dashboard'); break;
          case 'Staff': navigate('/staff/dashboard'); break;
          case 'Student': navigate('/student/dashboard'); break;
          default: navigate('/');
        }
      }
    } catch (err) {
      console.log('Login error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        hasResponse: !!err?.response,
        responseMessage: err?.response?.data?.message
      });
      
      const errorMessage = err?.response?.data?.message || err?.message;
      let title = 'Login Failed';
      let icon = 'error';
      let text = 'An unexpected error occurred. Please try again.';
      
      if (errorMessage) {
        if (errorMessage.includes('User not found')) {
          title = 'Account Not Found';
          text = 'This email address is not registered. Please check your email or create a new account.';
          icon = 'warning';
        } else if (errorMessage.includes('Please verify your email')) {
          title = 'Email Not Verified';
          text = 'Please check your email and click the verification link before logging in.';
          icon = 'info';
        } else if (errorMessage.includes('pending admin approval')) {
          title = 'Account Pending Approval';
          text = 'Your account is waiting for administrator approval. You will receive an email once approved.';
          icon = 'info';
        } else if (errorMessage.includes('Invalid credentials')) {
          title = 'Invalid Password';
          text = 'The password you entered is incorrect. Please try again.';
          icon = 'error';
        } else if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
          title = 'Connection Timeout';
          text = 'The login request took too long. Please check your internet connection and try again.';
          icon = 'warning';
        } else if (errorMessage.includes('Network error')) {
          title = 'Network Error';
          text = 'Unable to connect to the server. Please check your internet connection and try again.';
          icon = 'warning';
        } else if (errorMessage.includes('canceled')) {
          title = 'Request Canceled';
          text = 'The login request was interrupted. Please try again.';
          icon = 'info';
        } else if (errorMessage.includes('Error logging in')) {
          title = 'Server Error';
          text = 'There was a problem with the server. Please try again later.';
          icon = 'error';
        } else {
          text = errorMessage;
        }
      }
      
      if (icon === 'error') {
        showError(title, text, { confirmButtonText: 'OK' });
      } else if (icon === 'warning') {
        showWarning(title, text, { confirmButtonText: 'OK' });
      } else if (icon === 'info') {
        showInfo(title, text, { confirmButtonText: 'OK' });
      } else {
        showAlert({ icon, title, text, confirmButtonText: 'OK' });
      }
    }
    setLoading(false);
  };


  return (
    <div className="login-page">
      <div className="login-background">
        <div className="background-pattern"></div>
      </div>

      <Container className={`login-container ${isVisible ? 'visible' : ''}`}>
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-icon">
              <div className="icon-symbol">🔐</div>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your CHARISM account</p>
          </div>

          {/* Form */}
          <Form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <div className="input-wrapper">
                <Form.Control
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <div className="form-field">
              <div className="input-wrapper">
                <Form.Control
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="form-input"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className={`login-button ${loading ? 'loading' : ''}`}
            >
              <span className="button-content">
                {loading ? 'Signing in...' : 'Sign In'}
              </span>
            </Button>
          </Form>

          {/* Links */}
          <div className="login-links">
            <Link to="/forgot-password" className="link-text">
              Forgot your password?
            </Link>
            <div className="divider">
              <span>or</span>
            </div>
            <Link to="/register" className="link-text">
              Create new account
            </Link>
          </div>


          {/* Login Info */}
          <div className="login-info">
            <div className="info-item">
              <div className="info-icon">🚀</div>
              <div className="info-text">
                <h4>Fast Access</h4>
                <p>Quick login to your dashboard</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🛡️</div>
              <div className="info-text">
                <h4>Secure</h4>
                <p>Your data is protected</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">💻</div>
              <div className="info-text">
                <h4>24/7 Access</h4>
                <p>Login anytime, anywhere</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default LoginPage;