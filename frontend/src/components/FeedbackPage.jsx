import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaComment, FaPaperPlane, FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaBug, FaStar } from 'react-icons/fa';
import { submitFeedback, getUserFeedback } from '../api/api';
import Swal from 'sweetalert2';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium',
    userEmail: '',
    userName: ''
  });
  const [loading, setLoading] = useState(false);
  const [userFeedback, setUserFeedback] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user._id) {
      fetchUserFeedback();
      // Pre-fill user details if logged in
      setFormData(prev => ({
        ...prev,
        userEmail: user.email || '',
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
      }));
    } else {
      setLoadingHistory(false);
    }
  }, [user._id]);

  const fetchUserFeedback = async () => {
    try {
      setLoadingHistory(true);
      const feedback = await getUserFeedback();
      setUserFeedback(feedback);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    // For public users, require email and name
    if (!user._id && (!formData.userEmail.trim() || !formData.userName.trim())) {
      setError('Please provide your name and email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await submitFeedback(formData);
      
      Swal.fire({
        icon: 'success',
        title: 'Feedback Submitted!',
        text: 'Thank you for your feedback. We appreciate your input!'
      });
      
      // Reset form
      setFormData({
        subject: '',
        message: '',
        category: 'general',
        priority: 'medium',
        userEmail: user._id ? '' : formData.userEmail,
        userName: user._id ? '' : formData.userName
      });
      
      // Refresh feedback history if user is logged in
      if (user._id) {
        await fetchUserFeedback();
      }
      
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bug': return <FaBug className="category-icon bug" />;
      case 'feature': return <FaLightbulb className="category-icon feature" />;
      case 'suggestion': return <FaStar className="category-icon suggestion" />;
      case 'complaint': return <FaExclamationTriangle className="category-icon complaint" />;
      default: return <FaComment className="category-icon general" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'secondary',
      medium: 'info',
      high: 'warning',
      urgent: 'danger'
    };
    return <Badge bg={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      'in-progress': 'info',
      resolved: 'success',
      closed: 'secondary'
    };
    return <Badge bg={variants[status]}>{status.replace('-', ' ').toUpperCase()}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="feedback-page">
      {/* Header */}
      <div className="feedback-header">
        <div className="header-content">
          <h2 className="page-title">
            <FaComment className="title-icon" />
            Feedback & Suggestions
          </h2>
          <p className="page-subtitle">
            Help us improve CommunityLink by sharing your thoughts, reporting issues, or suggesting new features
          </p>
        </div>
      </div>

      <div className="feedback-content">
        {/* Feedback Form */}
        <Card className="feedback-form-card">
          <Card.Header>
            <h4 className="form-title">
              <FaPaperPlane className="me-2" />
              Submit New Feedback
            </h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              {/* Public user fields - only show if not logged in */}
              {!user._id && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="userName"
                      value={formData.userName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name..."
                      maxLength={100}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Your Email *</Form.Label>
                    <Form.Control
                      type="email"
                      name="userEmail"
                      value={formData.userEmail}
                      onChange={handleInputChange}
                      placeholder="Enter your email address..."
                      maxLength={100}
                      required
                    />
                  </Form.Group>
                </>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Subject *</Form.Label>
                <Form.Control
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief description of your feedback..."
                  maxLength={100}
                  required
                />
                <Form.Text className="text-muted">
                  {formData.subject.length}/100 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="complaint">Complaint</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Message *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Please provide detailed feedback, suggestions, or describe any issues you've encountered..."
                  maxLength={1000}
                  required
                />
                <Form.Text className="text-muted">
                  {formData.message.length}/1000 characters
                </Form.Text>
              </Form.Group>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="submit-button"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="me-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Feedback History (for logged-in users) */}
        {user._id && (
          <Card className="feedback-history-card">
            <Card.Header>
              <h4 className="history-title">
                <FaComment className="me-2" />
                Your Feedback History
              </h4>
            </Card.Header>
            <Card.Body>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading your feedback...</p>
                </div>
              ) : userFeedback.length === 0 ? (
                <div className="text-center py-4">
                  <FaComment className="no-feedback-icon" />
                  <p className="no-feedback-text">No feedback submitted yet</p>
                  <p className="text-muted">Your submitted feedback will appear here</p>
                </div>
              ) : (
                <div className="feedback-list">
                  {userFeedback.map((feedback) => (
                    <div key={feedback._id} className="feedback-item">
                      <div className="feedback-header">
                        <div className="feedback-meta">
                          <div className="feedback-category">
                            {getCategoryIcon(feedback.category)}
                            <span className="category-name">{feedback.category}</span>
                          </div>
                          <div className="feedback-priority">
                            Priority: {getPriorityBadge(feedback.priority)}
                          </div>
                          <div className="feedback-status">
                            Status: {getStatusBadge(feedback.status)}
                          </div>
                        </div>
                        <div className="feedback-date">
                          {formatDate(feedback.createdAt)}
                        </div>
                      </div>
                      
                      <div className="feedback-content">
                        <h6 className="feedback-subject">{feedback.subject}</h6>
                        <p className="feedback-message">{feedback.message}</p>
                        
                        {feedback.adminResponse && (
                          <div className="admin-response">
                            <strong>Admin Response:</strong>
                            <p className="response-text">{feedback.adminResponse}</p>
                            {feedback.resolvedAt && (
                              <small className="resolved-date">
                                Resolved on: {formatDate(feedback.resolvedAt)}
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Information Section */}
        <Card className="info-card">
          <Card.Body>
            <h5 className="info-title">
              <FaLightbulb className="me-2" />
              Tips for Great Feedback
            </h5>
            <div className="info-content">
              <div className="info-item">
                <strong>Be Specific:</strong> Provide clear, detailed descriptions of issues or suggestions.
              </div>
              <div className="info-item">
                <strong>Include Context:</strong> Mention what you were trying to do when you encountered an issue.
              </div>
              <div className="info-item">
                <strong>Suggest Solutions:</strong> If you have ideas for improvements, share them!
              </div>
              <div className="info-item">
                <strong>Be Constructive:</strong> Helpful feedback helps us improve faster.
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackPage;
