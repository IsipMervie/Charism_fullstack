import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { sendMessage, getAllContactMessages, updateContactMessage, deleteContactMessage } from '../api/api';

const MessagesPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    content: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await getAllContactMessages();
      setMessages(response);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load messages',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.to.trim()) {
      errors.to = 'Recipient is required';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (!formData.content.trim()) {
      errors.content = 'Message content is required';
    } else if (formData.content.trim().length < 10) {
      errors.content = 'Message must be at least 10 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input change
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fix the errors in the form.',
        icon: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      await sendMessage(formData);
      Swal.fire({
        title: 'Success!',
        text: 'Message sent successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      setFormData({ to: '', subject: '', content: '' });
      setFormErrors({});
      await fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to send message. Please try again.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle reply to message
  const handleReply = async (messageId, replyContent) => {
    try {
      await updateContactMessage(messageId, {
        adminResponse: replyContent,
        adminResponseDate: new Date(),
        status: 'Replied'
      });
      
      Swal.fire({
        title: 'Success!',
        text: 'Reply sent successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      await fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending reply:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to send reply. Please try again.',
        icon: 'error'
      });
    }
  };

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      await updateContactMessage(messageId, { read: true });
      await fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteContactMessage(messageId);
          Swal.fire('Deleted!', 'The message has been deleted.', 'success');
          await fetchMessages(); // Refresh messages
        } catch (error) {
          console.error('Error deleting message:', error);
          Swal.fire('Error', 'Failed to delete message.', 'error');
        }
      }
    });
  };

  return (
    <div className={`page-container ${isVisible ? 'visible' : ''}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Messages</h2>
                <p className="card-subtitle">Send and manage messages</p>
              </div>
              
              <div className="card-body">
                {/* Send Message Form */}
                <div className="mb-4">
                  <h4>Send New Message</h4>
                  <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                    <div className="mb-3">
                      <label htmlFor="to" className="form-label">Recipient Email</label>
                      <input
                        type="email"
                        className={`form-control ${formErrors.to ? 'is-invalid' : ''}`}
                        id="to"
                        name="to"
                        value={formData.to}
                        onChange={handleInputChange}
                        placeholder="Enter recipient email"
                        required
                      />
                      {formErrors.to && (
                        <div className="invalid-feedback">{formErrors.to}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="subject" className="form-label">Subject</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.subject ? 'is-invalid' : ''}`}
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Enter message subject"
                        required
                      />
                      {formErrors.subject && (
                        <div className="invalid-feedback">{formErrors.subject}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">Message Content</label>
                      <textarea
                        className={`form-control ${formErrors.content ? 'is-invalid' : ''}`}
                        id="content"
                        name="content"
                        rows="5"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Enter your message"
                        required
                      ></textarea>
                      {formErrors.content && (
                        <div className="invalid-feedback">{formErrors.content}</div>
                      )}
                    </div>

                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Messages List */}
                <div>
                  <h4>Recent Messages</h4>
                  {loading ? (
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="list-group">
                      {messages.map((message, index) => (
                        <div key={index} className="list-group-item">
                          <div className="d-flex w-100 justify-content-between">
                            <h5 className="mb-1">{message.subject}</h5>
                            <small>{new Date(message.timestamp).toLocaleDateString()}</small>
                          </div>
                          <p className="mb-1">{message.content}</p>
                          <small>To: {message.to}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted">
                      <p>No messages found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
