// frontend/src/components/HomePage.jsx
// Simple but Creative Homepage Design

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

// Import images
import virginMaryImage from '../assets/527595417_1167021392113223_2872992497207843477_n.jpg';
import communityServiceImage from '../assets/542758163_1192740069541355_8390690964585757521_n.jpg';
import treePlantingImage from '../assets/Screenshot 2025-07-09 234757.png';

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

          {/* Beautiful Image Collage */}
          <div className="home-collage">
            <div className="collage-container">
              {/* Main Image - Virgin Mary */}
              <div className="main-image-container">
                <img 
                  src={virginMaryImage} 
                  alt="Virgin Mary Statue" 
                  className="main-image"
                />
                <div className="image-overlay">
                  <h3>Blessed Virgin Mary</h3>
                  <p>Our Spiritual Guide and Protector</p>
                </div>
              </div>
              
              {/* Side Images */}
              <div className="side-images">
                <div className="side-image-container">
                  <img 
                    src={communityServiceImage} 
                    alt="Community Service" 
                    className="side-image"
                  />
                  <div className="image-overlay-small">
                    <h4>Community Service</h4>
                    <p>University of the Assumption</p>
                  </div>
                </div>
                
                <div className="side-image-container">
                  <img 
                    src={treePlantingImage} 
                    alt="Tree Planting Activity" 
                    className="side-image"
                  />
                  <div className="image-overlay-small">
                    <h4>Tree Planting</h4>
                    <p>Nurturing Nature, Cultivating Futures</p>
                  </div>
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