// frontend/src/components/ContactUsPage.jsx
// Simple but Creative Contact Page Design

import React, { useState, useEffect } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { axiosInstance, contactUs } from '../api/api';
import { showWarning, showSuccess, showError } from '../utils/sweetAlertUtils';
import './ContactUsPage.css';

function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [validation, setValidation] = useState({
    isValid: false,
    errors: {}
  });
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Legacy variables for backward compatibility
  const name = formData.name;
  const email = formData.email;
  const message = formData.message;

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    
    setFormErrors(errors);
    setValidation({
      isValid: Object.keys(errors).length === 0,
      errors
    });
    
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarning('Validation Error', 'Please fix the errors in the form.');
      return;
    }
    
    setLoading(true);
    try {
      await contactUs(formData);
      showSuccess('Message Sent Successfully!', 'Thank you for contacting us!', {
        confirmButtonText: 'Great!'
      });
      setFormData({ name: '', email: '', message: '' });
      setFormErrors({});
      setSuccess(true);
    } catch (err) {
      showError('Error', 'There was an error sending your message. Please try again later.');
      setSuccess(false);
    }
    setLoading(false);
  };

  return (
    <div className="contact-page">
      <div className="contact-background">
        <div className="background-pattern"></div>
      </div>

      <Container className={`contact-container ${isVisible ? 'visible' : ''}`}>
        <div className="contact-card">
          {/* Header */}
          <div className="contact-header">
            <div className="contact-icon">
              <div className="icon-symbol">💬</div>
            </div>
            <h1 className="contact-title">Get in Touch</h1>
            <p className="contact-subtitle">We'd love to hear from you. Send us a message!</p>
          </div>

          {/* Contact Form */}
          <Form onSubmit={handleSubmit} className="contact-form">
            <div className="form-field">
              <div className="input-wrapper">
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  isInvalid={!!formErrors.name}
                  required
                  className="form-input"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <div className="form-field">
              <div className="input-wrapper">
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  isInvalid={!!formErrors.email}
                  required
                  className="form-input"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <div className="form-field">
              <div className="input-wrapper">
                <Form.Control
                  as="textarea"
                  name="message"
                  rows={5}
                  placeholder="Your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  isInvalid={!!formErrors.message}
                  required
                  className="form-input textarea-input"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className={`contact-button ${loading ? 'loading' : ''}`}
            >
              <span className="button-content">
                {loading ? 'Sending message...' : 'Send Message'}
              </span>
            </Button>
          </Form>

          {/* Contact Info */}
          <div className="contact-info">
            <div className="info-item">
              <div className="info-icon">📍</div>
              <div className="info-text">
                <h4>Location</h4>
                <p>University of the Assumption</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">📧</div>
              <div className="info-text">
                <h4>Email</h4>
                <p>ceo@ua.edu.ph</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">📞</div>
              <div className="info-text">
                <h4>Phone</h4>
                <p>09368956784</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default ContactUsPage;
