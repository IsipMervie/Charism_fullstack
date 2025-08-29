// frontend/src/components/ContactUsPage.jsx
// Simple but Creative Contact Page Design

import React, { useState, useEffect } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { axiosInstance } from '../api/api';
import Swal from 'sweetalert2';
import './ContactUsPage.css';

function ContactUsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      Swal.fire({
        icon: 'warning',
        title: 'All fields are required',
        text: 'Please fill out your name, email, and message.',
      });
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/contact-us', { name, email, message });
      Swal.fire({
        icon: 'success',
        title: 'Message Sent Successfully!',
        text: 'Thank you for contacting us!',
        confirmButtonText: 'Great!'
      });
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'There was an error sending your message. Please try again later.',
      });
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
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
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
                  as="textarea"
                  rows={5}
                  placeholder="Your message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
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
