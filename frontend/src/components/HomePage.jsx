// frontend/src/components/HomePage.jsx
// Simple but Creative Homepage Design

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="home-page">
      <div className="home-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`home-container ${isVisible ? 'visible' : ''}`}>
        <div className="home-card">
          {/* Header */}
          <div className="home-header">
            <div className="home-icon">
              <div className="icon-symbol">🌟</div>
            </div>
            <h1 className="home-title">Welcome to CHARISM</h1>
            <p className="home-subtitle">
            (Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission)
            </p>
          </div>

          {/* Features */}
          <div className="home-features">
            <div className="feature-item">
              <div className="feature-icon">📅</div>
              <div className="feature-text">
                <h3>Event Management</h3>
                <p>Create and manage community events with ease</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <div className="feature-text">
                <h3>Participation Tracking</h3>
                <p>Track attendance and engagement metrics</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔗</div>
              <div className="feature-text">
                <h3>Community Connection</h3>
                <p>Connect students, staff, and administrators</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="home-actions">
            <button 
              className="home-button primary-button" 
              onClick={() => navigate('/login')}
            >
              <span className="button-content">
                <span className="button-icon">🔐</span>
                Login
              </span>
            </button>
            <button 
              className="home-button secondary-button" 
              onClick={() => navigate('/register')}
            >
              <span className="button-content">
                <span className="button-icon">✨</span>
                Register
              </span>
            </button>
          </div>

          {/* Contact Info */}
          <div className="home-contact">
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <span>Need help? Contact us</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;