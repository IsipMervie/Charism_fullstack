import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByRegistrationToken, registerForEventWithToken } from '../api/api';
import { getEventImageUrl } from '../utils/imageUtils';
import Swal from 'sweetalert2';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaSignInAlt, FaUserPlus, FaCheckCircle } from 'react-icons/fa';
import { formatTimeRange12Hour } from '../utils/timeUtils';
import './PublicEventRegistrationPage.css';

function PublicEventRegistrationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  const checkAuthStatus = useCallback(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isAuthenticated = !!(token && user);
    setIsLoggedIn(isAuthenticated);
    
    // If user just logged in and we have a stored redirect, stay on this page
    if (isAuthenticated && window.location.hash.includes('/events/register/')) {
      // User is on the registration page and logged in, don't redirect
      console.log('User is authenticated and on registration page');
    }
  }, []);

  const fetchEventDetails = useCallback(async () => {
    try {
      setLoading(true);
      const eventData = await getEventByRegistrationToken(token);
      setEvent(eventData);
      
      // Check if user is already registered (if logged in)
      if (isLoggedIn) {
        const isUserRegistered = eventData.currentParticipants > 0; // This is a simplified check
        setIsRegistered(isUserRegistered);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isLoggedIn]);

  useEffect(() => {
    checkAuthStatus();
    fetchEventDetails();
  }, [checkAuthStatus, fetchEventDetails]);

  // Listen for authentication changes (when user logs in)
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab login
    const interval = setInterval(checkAuthStatus, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [checkAuthStatus]);

  const handleLogin = () => {
    // Store the current URL to redirect back after login (include hash)
    const currentUrl = window.location.hash || `#${window.location.pathname}`;
    console.log('Storing redirect URL:', currentUrl);
    console.log('Current location:', window.location.href);
    console.log('Current hash:', window.location.hash);
    localStorage.setItem('redirectAfterLogin', currentUrl);
    navigate('/login');
  };

  const handleRegister = () => {
    // Store the current URL to redirect back after registration (include hash)
    const currentUrl = window.location.hash || `#${window.location.pathname}`;
    console.log('Storing redirect URL:', currentUrl);
    console.log('Current location:', window.location.href);
    console.log('Current hash:', window.location.hash);
    localStorage.setItem('redirectAfterLogin', currentUrl);
    navigate('/register');
  };

  const handleEventRegistration = async () => {
    if (!isLoggedIn) {
      handleLogin();
      return;
    }

    try {
      setRegistering(true);
      const result = await registerForEventWithToken(token);
      
      Swal.fire({
        title: 'Registration Successful!',
        text: `You have successfully registered for "${event.title}". You can stay on this page.`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });

      setIsRegistered(true);
      
      // Stay on the event registration page to show success
      // User can manually navigate away if they want
      
    } catch (err) {
      Swal.fire({
        title: 'Registration Failed',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="public-registration-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-registration-container">
        <div className="error-message">
          <h2>Event Not Found</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="public-registration-container">
        <div className="error-message">
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or is not available for public registration.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="public-registration-container">
      <div className="event-card">
        {/* Event Image */}
        {event.image && (
          <div className="event-image-section">
            <img
              src={getEventImageUrl(event.image, event._id)}
              alt={event.title}
              className="event-image"
              onError={(e) => {
                console.error('Event image failed to load:', e.target.src);
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="event-header">
          <h1>{event.title}</h1>
          <p className="event-description">{event.description}</p>
        </div>

        <div className="event-details">
          <div className="detail-item">
            <FaCalendar className="icon" />
            <span>{formatDate(event.date)}</span>
          </div>
          
          <div className="detail-item">
            <FaClock className="icon" />
                                    <span>{formatTimeRange12Hour(event.startTime, event.endTime)}</span>
          </div>
          
          <div className="detail-item">
            <FaMapMarkerAlt className="icon" />
            <span>{event.location}</span>
          </div>
          
          <div className="detail-item">
            <FaUsers className="icon" />
            <span>{event.hours} hours • {event.currentParticipants}/{event.maxParticipants || '∞'} participants</span>
          </div>
        </div>

        <div className="registration-section">
          {isRegistered ? (
            <div className="already-registered">
              <FaCheckCircle className="success-icon" />
              <h3>You're Already Registered!</h3>
              <p>You have successfully registered for this event.</p>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="registration-actions">
              {!isLoggedIn ? (
                <>
                  <h3>Join This Event</h3>
                  <p>To register for this event, you need to have an account.</p>
                  
                  <div className="action-buttons">
                    <button onClick={handleLogin} className="btn-primary">
                      <FaSignInAlt /> Log In
                    </button>
                    <button onClick={handleRegister} className="btn-secondary">
                      <FaUserPlus /> Create Account
                    </button>
                  </div>
                  
                  <p className="login-note">
                    Already have an account? <button onClick={handleLogin} className="link-button">Log in</button> to register for this event.
                  </p>
                </>
              ) : (
                <>
                  <h3>Ready to Join?</h3>
                  <p>You're logged in and ready to register for this event.</p>
                  
                  <button 
                    onClick={handleEventRegistration} 
                    className="btn-primary"
                    disabled={registering}
                  >
                    {registering ? 'Registering...' : 'Register for Event'}
                  </button>
                  
                  {event.requiresApproval && (
                    <p className="approval-note">
                      Note: Registration requires approval from staff.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="event-footer">
          <p>Event organized by <strong>{event.createdBy?.name || 'Staff'}</strong></p>
          <p className="share-note">
            Share this link with others: <code>{process.env.REACT_APP_FRONTEND_URL || window.location.origin}/#/events/register/{token}</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicEventRegistrationPage;
