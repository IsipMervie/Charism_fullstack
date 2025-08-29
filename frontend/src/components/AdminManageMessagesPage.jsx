// frontend/src/components/AdminManageMessagesPage.jsx
// Simple but Creative Manage Messages Page Design

import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../api/api';
import { Button, Form, Modal } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { FaEnvelope, FaEnvelopeOpen, FaCalendar, FaTrash, FaCheck, FaSpinner, FaExclamationTriangle, FaEye, FaReply } from 'react-icons/fa';
import './AdminManageMessagesPage.css';

function AdminManageMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [updatingReply, setUpdatingReply] = useState(false);

  // Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  // Debug logging to help identify issues
  useEffect(() => {
    if (!Array.isArray(messages)) {
      console.warn('Messages is not an array:', messages);
    }
  }, [messages]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fetchMessages = async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosInstance.get(
        `/contact-us${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Ensure res.data is an array
      const messagesData = Array.isArray(res.data) ? res.data : [];
      setMessages(messagesData);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
      setMessages([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Auto-search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== '') {
        fetchMessages(search);
      } else {
        fetchMessages();
      }
    }, 500); // 500ms delay to avoid too many API calls

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is now handled automatically via onChange
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
              await axiosInstance.patch(`/contact-us/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({ 
        icon: 'success', 
        title: 'Message Marked as Read',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      fetchMessages(search);
    } catch {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: 'Failed to mark as read.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axiosInstance.delete(`/contact-us/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Message has been deleted.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        fetchMessages(search);
      } catch {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: 'Failed to delete message.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Reply Required',
        text: 'Please enter a reply message.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    setSendingReply(true);
    try {
      const token = localStorage.getItem('token');
              await axiosInstance.post(`/contact-us/${selectedMessage._id}/reply`, 
        { adminResponse: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Reply Sent!',
        text: 'Your reply has been sent and the user will receive an email notification.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000
      });
      
      // Reset form and close modal
      setReplyText('');
      setShowMessageModal(false);
      setSelectedMessage(null);
      
      // Refresh messages to show updated status
      fetchMessages(search);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to send reply. Please try again.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateReply = async () => {
    if (!replyText.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Updated Reply Required',
        text: 'Please enter an updated reply message.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    setUpdatingReply(true);
    try {
      const token = localStorage.getItem('token');
              await axiosInstance.put(`/contact-us/${selectedMessage._id}/reply`, 
        { adminResponse: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Reply Updated!',
        text: 'Your reply has been updated and the user will receive an updated email notification.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000
      });
      
      // Exit edit mode and refresh messages
      setIsEditMode(false);
      setShowMessageModal(false);
      setSelectedMessage(null);
      setReplyText('');
      
      // Refresh messages to show updated content
      fetchMessages(search);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update reply. Please try again.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setUpdatingReply(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Entering edit mode - populate with current response
      setReplyText(selectedMessage.adminResponse || '');
    } else {
      // Exiting edit mode - reset to original
      setReplyText(selectedMessage.adminResponse || '');
    }
  };

  const getMessageStatus = (message) => {
    if (message.isReplied) return 'replied';
    return message.read ? 'read' : 'unread';
  };

  const getStatusColor = (status) => {
    if (status === 'replied') return 'replied';
    return status === 'unread' ? 'unread' : 'read';
  };

  const handleViewMessage = (message) => {
    console.log('View message clicked:', message);
    setSelectedMessage(message);
    setReplyText(message.adminResponse || ''); // Pre-fill with existing reply if any
    setShowMessageModal(true);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setShowMessageModal(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  if (loading) {
    return (
      <div className="manage-messages-page">
        <div className="loading-section">
          <FaSpinner className="loading-spinner" />
          <h3>Loading Messages</h3>
          <p>Please wait while we fetch your messages...</p>
        </div>
      </div>
    );
  }

    if (error) {
    return (
      <div className="manage-messages-page">
        <div className="error-section">
          <div className="error-message">
            <FaExclamationTriangle className="error-icon" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <Button className="retry-button" onClick={() => fetchMessages()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-messages-page">
      <div className="manage-messages-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`manage-messages-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">💬</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">Contact Messages</h1>
              <p className="header-subtitle">Manage and respond to messages from your community</p>
            </div>
          </div>
          <div className="message-stats">
            <div className="stat-item">
              <span className="stat-number">{safeMessages.length}</span>
              <span className="stat-label">Total Messages</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{safeMessages.filter(m => !m.read).length}</span>
              <span className="stat-label">Unread</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{safeMessages.filter(m => m.isReplied).length}</span>
              <span className="stat-label">Replied</span>
            </div>
          </div>
        </div>

                 {/* Search Section */}
         <div className="search-section">
           <div className="search-box">
             <div className="search-input-wrapper">
               <input
                 type="text"
                 placeholder="Search by name, email, or message content..."
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="search-input"
               />
             </div>
           </div>
         </div>

        {/* Messages Section */}
        <div className="messages-section">
          {safeMessages.length === 0 ? (
            <div className="no-messages">
              <FaEnvelope className="no-messages-icon" />
              <h3>No Messages Found</h3>
              <p>{search ? 'Try adjusting your search terms' : 'You\'re all caught up! No messages to display.'}</p>
            </div>
          ) : (
            <div className="messages-grid">
              {safeMessages.map(message => (
                <div key={message._id} className={`message-card ${getMessageStatus(message)}`}>
                  <div className="message-header">
                    <div className="message-status">
                      <span className={`status-badge ${getStatusColor(getMessageStatus(message))}`}>
                        {message.isReplied ? (
                          <FaReply className="status-icon" />
                        ) : message.read ? (
                          <FaEnvelopeOpen className="status-icon" />
                        ) : (
                          <FaEnvelope className="status-icon" />
                        )}
                        <span className="status-text">
                          {message.isReplied ? 'Replied' : message.read ? 'Read' : 'Unread'}
                        </span>
                      </span>
                    </div>
                    <div className="message-date">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="message-content">
                                         <div className="message-sender">
                       <div className="sender-info">
                         <h4 className="sender-name">{message.name}</h4>
                         <p className="sender-email">{message.email}</p>
                       </div>
                     </div>

                                         <div className="message-body">
                       <div className="message-text-container">
                         <p className={`message-text ${expandedMessages.has(message._id) ? 'expanded' : ''}`}>
                           {expandedMessages.has(message._id) 
                             ? message.message 
                             : message.message.length > 300 
                               ? message.message.substring(0, 300) + '...'
                               : message.message
                           }
                         </p>
                         <div className="message-text-footer">
                           {message.message.length > 300 && (
                             <button 
                               className="expand-button"
                               onClick={() => {
                                 const newExpanded = new Set(expandedMessages);
                                 if (newExpanded.has(message._id)) {
                                   newExpanded.delete(message._id);
                                 } else {
                                   newExpanded.add(message._id);
                                 }
                                 setExpandedMessages(newExpanded);
                               }}
                             >
                               {expandedMessages.has(message._id) ? 'Show Less' : 'Read More'}
                             </button>
                           )}
                           <span className="message-length">
                             {message.message.length} characters
                           </span>
                         </div>
                       </div>
                     </div>

                    <div className="message-meta">
                      <div className="meta-item">
                        <FaCalendar className="meta-icon" />
                        <span className="meta-text">{new Date(message.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="message-actions">
                    <Button
                      className="action-button view-button"
                      onClick={() => handleViewMessage(message)}
                    >
                      <FaEye className="button-icon" />
                      <span>View Message</span>
                    </Button>
                    {!message.read && (
                      <Button
                        className="action-button mark-read-button"
                        onClick={() => handleMarkAsRead(message._id)}
                      >
                        <FaCheck className="button-icon" />
                        <span>Mark as Read</span>
                      </Button>
                    )}
                    <Button
                      className="action-button delete-button"
                      onClick={() => handleDelete(message._id)}
                    >
                      <FaTrash className="button-icon" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message View Modal - Always Available */}
      <Modal 
        show={showMessageModal} 
        onHide={handleCloseModal}
        size="lg"
        centered
        className="message-view-modal"
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title className="modal-title">
            <FaEnvelope className="modal-title-icon" />
            Message Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          {selectedMessage && (
            <div className="modal-message-content">
                             {/* Sender Information */}
               <div className="modal-sender-section">
                 <div className="modal-sender-header">
                   <div className="modal-sender-info">
                     <h4 className="modal-sender-name">{selectedMessage.name}</h4>
                     <p className="modal-sender-email">{selectedMessage.email}</p>
                   </div>
                 </div>
                <div className="modal-message-status">
                  <span className={`modal-status-badge ${getStatusColor(getMessageStatus(selectedMessage))}`}>
                    {selectedMessage.isReplied ? (
                      <FaReply className="status-icon" />
                    ) : selectedMessage.read ? (
                      <FaEnvelopeOpen className="status-icon" />
                    ) : (
                      <FaEnvelope className="status-icon" />
                    )}
                    <span className="status-text">
                      {selectedMessage.isReplied ? 'Replied' : selectedMessage.read ? 'Read' : 'Unread'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="modal-message-body">
                <h5 className="modal-message-label">Message:</h5>
                <div className="modal-message-text">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Admin Response Section */}
              {selectedMessage.isReplied && (
                <div className="modal-admin-response">
                  <div className="response-header">
                    <h5 className="modal-response-label">Your Response:</h5>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={toggleEditMode}
                      className="edit-response-button"
                    >
                      {isEditMode ? 'Cancel Edit' : 'Edit Response'}
                    </Button>
                  </div>
                  
                  {isEditMode ? (
                    <div className="edit-response-form">
                      <Form.Group>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="reply-textarea"
                          placeholder="Update your response..."
                        />
                      </Form.Group>
                    </div>
                  ) : (
                    <div className="modal-response-text">
                      {selectedMessage.adminResponse}
                    </div>
                  )}
                  
                  <div className="modal-response-meta">
                    <small className="response-date">
                      {isEditMode ? 'Last updated' : 'Replied'} on: {new Date(selectedMessage.adminResponseDate).toLocaleString()}
                    </small>
                  </div>
                </div>
              )}

              {/* Reply Form */}
              {!selectedMessage.isReplied && (
                <div className="modal-reply-section">
                  <h5 className="modal-reply-label">Reply to this message:</h5>
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Type your reply here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="reply-textarea"
                    />
                  </Form.Group>
                </div>
              )}

              {/* Message Meta */}
              <div className="modal-message-meta">
                <div className="modal-meta-item">
                  <FaCalendar className="modal-meta-icon" />
                  <span className="modal-meta-text">
                    Sent on: {new Date(selectedMessage.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Message Length:</span>
                  <span className="modal-meta-value">{selectedMessage.message.length} characters</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button 
            variant="secondary" 
            onClick={handleCloseModal}
            className="modal-close-button"
          >
            Close
          </Button>
          {selectedMessage && !selectedMessage.read && !selectedMessage.isReplied && (
            <Button
              className="modal-mark-read-button"
              onClick={() => {
                handleMarkAsRead(selectedMessage._id);
                handleCloseModal();
              }}
            >
              <FaCheck className="button-icon" />
              Mark as Read
            </Button>
          )}
          {selectedMessage && !selectedMessage.isReplied && (
            <Button
              className="modal-reply-button"
              onClick={handleReply}
              disabled={sendingReply || !replyText.trim()}
            >
              {sendingReply ? (
                <>
                  <FaSpinner className="button-icon spinning" />
                  Sending...
                </>
              ) : (
                <>
                  <FaReply className="button-icon" />
                  Send Reply
                </>
              )}
            </Button>
          )}
          {selectedMessage && selectedMessage.isReplied && isEditMode && (
            <Button
              className="modal-update-button"
              onClick={handleUpdateReply}
              disabled={updatingReply || !replyText.trim()}
            >
              {updatingReply ? (
                <>
                  <FaSpinner className="button-icon spinning" />
                  Updating...
                </>
              ) : (
                <>
                  <FaReply className="button-icon" />
                  Update & Resend
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminManageMessagesPage;