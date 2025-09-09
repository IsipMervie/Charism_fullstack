// frontend/src/components/HomePage.jsx
// Simple but Creative Homepage Design

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

// Images are in public folder - no need to import

function HomePage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: "/images/527595417_1167021392113223_2872992497207843477_n.jpg",
      title: "Blessed Virgin Mary",
      subtitle: "Our Spiritual Guide and Protector",
      type: "main"
    },
    {
      id: 2,
      image: "/images/542758163_1192740069541355_8390690964585757521_n.jpg",
      title: "Community Service",
      subtitle: "University of the Assumption",
      type: "side"
    },
    {
      id: 3,
      image: "/images/Screenshot 2025-07-09 234757.png",
      title: "Tree Planting",
      subtitle: "Nurturing Nature, Cultivating Futures",
      type: "side"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

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

          {/* Beautiful Image Collage - Desktop */}
          <div className="home-collage desktop-only">
            <div className="collage-container">
              {/* Main Image - Virgin Mary */}
              <div className="main-image-container">
                <img 
                  src="/images/527595417_1167021392113223_2872992497207843477_n.jpg" 
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
                    src="/images/542758163_1192740069541355_8390690964585757521_n.jpg" 
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
                    src="/images/Screenshot 2025-07-09 234757.png" 
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

          {/* Mobile Slideshow */}
          <div className="home-collage mobile-slideshow">
            <div className="slideshow-container">
              <div className="slide-wrapper">
                <img 
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="slide-image"
                />
                <div className="slide-overlay">
                  <h3>{slides[currentSlide].title}</h3>
                  <p>{slides[currentSlide].subtitle}</p>
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <button className="slide-nav prev" onClick={prevSlide}>
                ‹
              </button>
              <button className="slide-nav next" onClick={nextSlide}>
                ›
              </button>
              
              {/* Dots Indicator */}
              <div className="slide-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="home-contact">
            <div className="contact-item" onClick={() => navigate('/contact')}>
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