// frontend/src/components/VerifyEmailPage.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../api/api';
import { showSuccess, showError, showWarning, showInfo } from '../utils/sweetAlertUtils';
import Swal from 'sweetalert2';
import './VerifyEmailPage.css';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUserEmail = async () => {
      if (!token) {
        setMessage('No verification token provided');
        setSuccess(false);
        setLoading(false);
        return;
      }

      try {
        // Use the API utility function
        const response = await verifyEmail(token);
        
        if (response && response.message) {
          setMessage(response.message);
          setSuccess(true);
          
          // Show success SweetAlert
          showSuccess('🎉 Email Verified Successfully!', 'Your email has been verified. You can now log in to your account.', {
            confirmButtonText: 'Go to Login',
            showCancelButton: true,
            cancelButtonText: 'Stay Here'
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/login');
            }
          });
        }
        
      } catch (error) {
        console.error('Email verification error:', error);
        
        let errorMessage = 'An error occurred while verifying your email.';
        let icon = 'error';
        
        if (error.message) {
          if (error.message.includes('already verified')) {
            errorMessage = 'This email is already verified. You can log in to your account.';
            icon = 'info';
          } else if (error.message.includes('Invalid or expired token')) {
            errorMessage = 'The verification link is invalid or has expired. Please request a new verification email.';
            icon = 'warning';
          } else if (error.message.includes('User not found')) {
            errorMessage = 'User account not found. Please check your verification link.';
            icon = 'error';
          } else {
            errorMessage = error.message;
          }
        } else if (error.message && error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
          icon = 'warning';
        }
        
        setMessage(errorMessage);
        setSuccess(false);
        
        // Show error SweetAlert
        const alertFunction = icon === 'error' ? showError : 
                             icon === 'warning' ? showWarning : 
                             icon === 'info' ? showInfo : showError;
        
        alertFunction('Email Verification Failed', errorMessage, {
          confirmButtonText: 'OK',
          showCancelButton: true,
          cancelButtonText: 'Go to Login'
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.cancel) {
            navigate('/login');
          }
        });
      } finally {
        setLoading(false);
      }
    };

    verifyUserEmail();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="verify-container">
        <div className="verify-box">
          <div className="spinner-border text-primary" role="status" style={{ marginBottom: '16px' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h2>Verifying Email...</h2>
          <p>Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-container">
      <div className="verify-box">
        <h2>CHARISM Email Verification</h2>
        <p className={success ? 'success-message' : 'error-message'}>
          {message}
        </p>
        
        {!success && (
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ marginRight: '12px' }}
            >
              Go to Login
            </button>
            <button 
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;