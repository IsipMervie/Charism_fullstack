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

          {/* Religious Images - Mary, Joseph, Assumption */}
          <div className="home-collage">
            <div className="collage-grid">
              <div className="collage-item main-image">
                <img 
                  src="/images/mary-collage.jpg" 
                  alt="Mother Mary" 
                  className="collage-img"
                />
                <div className="image-overlay">
                  <h3>Blessed Mother Mary</h3>
                  <p>Our spiritual guide and protector</p>
                </div>
              </div>
              
              <div className="collage-item">
                <img 
                  src="/images/saint-joseph.jpg" 
                  alt="Saint Joseph" 
                  className="collage-img"
                />
                <div className="image-overlay">
                  <h3>Saint Joseph</h3>
                  <p>Patron of the Universal Church</p>
                </div>
              </div>
              
              <div className="collage-item">
                <img 
                  src="/images/saint-therese.jpg" 
                  alt="Assumption" 
                  className="collage-img"
                />
                <div className="image-overlay">
                  <h3>Assumption</h3>
                  <p>Mary's Assumption into Heaven</p>
                </div>
              </div>
            </div>
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