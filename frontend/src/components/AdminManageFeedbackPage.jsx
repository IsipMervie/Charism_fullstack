import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Modal, Form, Badge, Pagination, Alert, Spinner } from 'react-bootstrap';
import { FaComments, FaEye, FaReply, FaTrash, FaUser, FaEnvelope, FaCalendar, FaTag, FaExclamationTriangle, FaSpinner, FaTimes, FaCheck } from 'react-icons/fa';
import { axiosInstance } from '../api/api';
import Swal from 'sweetalert2';
import './AdminManageFeedbackPage.css';

function AdminManageFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [stats, setStats] = useState({ overall: { total: 0 } });
  const [filters, setFilters] = useState({
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // Helper function to safely validate pagination state
  const isValidPagination = (paginationState) => {
    return paginationState && 
           typeof paginationState === 'object' && 
           typeof paginationState.currentPage === 'number' &&
           typeof paginationState.totalPages === 'number' &&
           typeof paginationState.totalItems === 'number' &&
           typeof paginationState.itemsPerPage === 'number';
  };

  // Ensure feedback is always an array
  const safeFeedback = Array.isArray(feedback) ? feedback : [];

  // Ensure pagination state is always properly initialized
  useEffect(() => {
    if (!pagination || !isValidPagination(pagination)) {
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
      });
    }
  }, [pagination]);

  // Initialize component data
  useEffect(() => {
    setIsVisible(true);
    fetchFeedback();
    fetchStats();
  }, []);

  // Auto-search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFeedback();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters.search]);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/feedback/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.currentPage || 1,
        limit: pagination.itemsPerPage || 20,
        ...filters
      });

      const response = await axiosInstance.get(`/feedback/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Ensure response.data.feedback is an array
      const feedbackData = Array.isArray(response.data.feedback) ? response.data.feedback : [];
      setFeedback(feedbackData);
      
      // Update pagination if response has pagination data
      if (response.data && response.data.pagination && typeof response.data.pagination === 'object') {
        const newPagination = {
          currentPage: response.data.pagination.currentPage || 1,
          totalPages: response.data.pagination.totalPages || 1,
          totalItems: response.data.pagination.totalItems || 0,
          itemsPerPage: response.data.pagination.itemsPerPage || 20
        };
        
        setPagination(newPagination);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback. Please try again.');
      setFeedback([]);
    }
    setLoading(false);
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ 
      ...prev, 
      currentPage: pageNumber
    }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ 
      ...prev, 
      currentPage: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: ''
    });
    setPagination(prev => ({ 
      ...prev, 
      currentPage: 1
    }));
  };

  const toggleExpanded = (feedbackId) => {
    setExpandedFeedback(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId);
      } else {
        newSet.add(feedbackId);
      }
      return newSet;
    });
  };

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(true);
  };

  const handleRespond = (feedback) => {
    setSelectedFeedback(feedback);
    setShowResponseModal(true);
  };

  const handleDelete = async (feedbackId) => {
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
        await axiosInstance.delete(`/feedback/admin/${feedbackId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Feedback has been deleted.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });

        fetchFeedback();
        fetchStats();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to delete feedback.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const responseData = {
      status: formData.get('status'),
      adminResponse: formData.get('adminResponse')
    };

    try {
      const token = localStorage.getItem('token');
      await axiosInstance.put(`/feedback/admin/${selectedFeedback._id}`, responseData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Response sent successfully.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });

      setShowResponseModal(false);
      fetchFeedback();
      fetchStats();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to send response.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaExclamationTriangle />;
      case 'working-on-it':
        return <FaSpinner />;
      case 'resolve':
        return <FaCheck />;
      default:
        return <FaComments />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'working-on-it':
        return 'info';
      case 'resolve':
        return 'success';
      default:
        return 'secondary';
    }
  };

  if (loading && safeFeedback.length === 0) {
    return (
      <div className="manage-feedback-page">
        <div className="manage-feedback-background">
          <div className="background-pattern"></div>
        </div>
        <div className={`manage-feedback-container ${isVisible ? 'visible' : ''}`}>
          <div className="loading-section">
            <FaSpinner className="loading-spinner" />
            <h3>Loading Feedback...</h3>
            <p>Please wait while we fetch the latest feedback.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && safeFeedback.length === 0) {
    return (
      <div className="manage-feedback-page">
        <div className="manage-feedback-background">
          <div className="background-pattern"></div>
        </div>
        <div className={`manage-feedback-container ${isVisible ? 'visible' : ''}`}>
          <div className="error-section">
            <div className="error-message">
              <FaExclamationTriangle className="error-icon" />
              <h3>Error Loading Feedback</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={fetchFeedback}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-feedback-page">
      <div className="manage-feedback-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`manage-feedback-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">
                <FaComments />
                </div>
              </div>
            <div className="header-text">
              <h1 className="header-title">Manage Feedback</h1>
              <p className="header-subtitle">Review and respond to user feedback efficiently</p>
                </div>
              </div>
          
          <div className="feedback-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.overall?.total || 0}</span>
              <span className="stat-label">Total Feedback</span>
                </div>
              </div>
          </div>
          
        {/* Search Section */}
        <div className="search-section">
          <div className="search-box">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search feedback by subject, message, or user..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
          </div>
            
            </div>
          </div>



        {/* Feedback Section */}
        <div className="feedback-section">
          {safeFeedback.length === 0 ? (
            <div className="no-feedback">
              <FaComments className="no-feedback-icon" />
              <h3>No Feedback Found</h3>
              <p>There are no feedback items matching your current filters.</p>
            </div>
          ) : (
            <div className="feedback-grid">
                {safeFeedback.map((item) => (
                <div key={item._id} className={`feedback-card ${item.status}`}>
                  {/* Feedback Header */}
                  <div className="feedback-header">
                    <div className="feedback-status">
                      <span className={`status-badge ${item.status}`}>
                        {getStatusIcon(item.status)}
                        <span className="status-text">{item.status.replace('-', ' ')}</span>
                      </span>
                      </div>
                      <div className="feedback-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="feedback-content">
                    <div className="feedback-sender">
                      <div className="sender-icon">
                        <FaUser />
                      </div>
                      <div className="sender-info">
                        <h4 className="sender-name">{item.userName}</h4>
                        <p className="sender-email">{item.userEmail}</p>
                      </div>
                    </div>

                    <div className="feedback-body">
                      <h3 className="feedback-subject">{item.subject}</h3>
                      <div className="feedback-text-container">
                        <p className={`feedback-text ${expandedFeedback.has(item._id) ? 'expanded' : ''}`}>
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <div className="feedback-text-footer">
                      <button
                        className="expand-button"
                        onClick={() => toggleExpanded(item._id)}
                      >
                        {expandedFeedback.has(item._id) ? 'Show Less' : 'Show More'}
                      </button>
                    
                    <div className="feedback-meta">
                        <div className="meta-item">
                          <FaTag className="meta-icon" />
                          <span className="meta-text">{item.category}</span>
                        </div>
                        <div className="meta-item">
                          <FaCalendar className="meta-icon" />
                          <span className="meta-text">{item.priority}</span>
                        </div>
                      </div>
                      </div>
                    </div>
                    
                  {/* Feedback Actions */}
                    <div className="feedback-actions">
                    <button
                      className="action-button view-button"
                        onClick={() => handleViewFeedback(item)}
                      >
                        <FaEye />
                      <span>View</span>
                    </button>
                    
                    <button
                      className="action-button respond-button"
                      onClick={() => handleRespond(item)}
                      >
                        <FaReply />
                      <span>Respond</span>
                    </button>
                    
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDelete(item._id)}
                      >
                        <FaTrash />
                      <span>Delete</span>
                    </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination-wrapper">
            <div className="pagination-info">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
            </div>
            <Pagination>
                    <Pagination.First
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    />
                    
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                          <Pagination.Item
                  key={page}
                            active={page === pagination.currentPage}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Pagination.Item>
                      ))}
                    
                    <Pagination.Next
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    />
                    <Pagination.Last
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    />
                  </Pagination>
                </div>
              )}
      </div>

      {/* Feedback View Modal */}
      <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} size="lg" className="feedback-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaComments className="modal-title-icon" />
            Feedback Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFeedback && (
            <div>
              <div className="modal-sender-section">
                <div className="modal-sender-header">
                  <div className="modal-sender-icon">
                    <FaUser />
              </div>
                  <div className="modal-sender-info">
                    <h4>{selectedFeedback.userName}</h4>
                    <p>{selectedFeedback.userEmail}</p>
              </div>
              </div>
                <div className="modal-feedback-status">
                  <span className={`modal-status-badge ${selectedFeedback.status}`}>
                    {getStatusIcon(selectedFeedback.status)}
                    {selectedFeedback.status.replace('-', ' ')}
                  </span>
              </div>
              </div>
              
              <div className="modal-message-body">
                <h5 className="modal-message-label">Subject</h5>
                <p>{selectedFeedback.subject}</p>
                
                <h5 className="modal-message-label">Message</h5>
                <div className="modal-message-text">{selectedFeedback.message}</div>
              </div>
              
              <div className="modal-message-meta">
                <div className="modal-meta-item">
                  <FaTag className="modal-meta-icon" />
                  <span className="modal-meta-label">Category:</span>
                  <span className="modal-meta-value">{selectedFeedback.category}</span>
                </div>
                <div className="modal-meta-item">
                  <FaCalendar className="modal-meta-icon" />
                  <span className="modal-meta-label">Priority:</span>
                  <span className="modal-meta-value">{selectedFeedback.priority}</span>
                </div>
                <div className="modal-meta-item">
                  <FaCalendar className="modal-meta-icon" />
                  <span className="modal-meta-label">Created:</span>
                  <span className="modal-meta-value">
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </span>
                </div>
              {selectedFeedback.adminResponse && (
                  <div className="modal-meta-item">
                    <FaReply className="modal-meta-icon" />
                    <span className="modal-meta-label">Admin Response:</span>
                    <span className="modal-meta-value">{selectedFeedback.adminResponse}</span>
                </div>
              )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="modal-close-button" onClick={() => setShowFeedbackModal(false)}>
            Close
          </button>
          <button className="modal-respond-button" onClick={() => {
            setShowFeedbackModal(false);
            handleRespond(selectedFeedback);
          }}>
            Respond
          </button>
        </Modal.Footer>
      </Modal>

      {/* Response Modal */}
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} className="response-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaReply className="modal-title-icon" />
            Respond to Feedback
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleResponseSubmit}>
        <Modal.Body>
            {selectedFeedback && (
              <div>
                <div className="modal-sender-section">
                  <div className="modal-sender-header">
                    <div className="modal-sender-icon">
                      <FaUser />
                    </div>
                    <div className="modal-sender-info">
                      <h4>{selectedFeedback.userName}</h4>
                      <p>{selectedFeedback.userEmail}</p>
                    </div>
                  </div>
                </div>
                
                <div className="modal-message-body">
                  <h5 className="modal-message-label">Original Message</h5>
                  <div className="modal-message-text">{selectedFeedback.message}</div>
                </div>
                
            <Form.Group className="mb-3">
                  <Form.Label className="form-label">Update Status</Form.Label>
              <Form.Select
                    name="status"
                    className="form-select"
                    defaultValue={selectedFeedback.status}
                    required
                  >
                    <option value="pending">🟡 Pending</option>
                    <option value="working-on-it">🔵 Working On It</option>
                    <option value="resolve">🟢 Resolve</option>
              </Form.Select>
                  <Form.Text className="form-help-text">
                    Choose the current status of this feedback
                  </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
                  <Form.Label className="form-label">Admin Response</Form.Label>
              <Form.Control
                as="textarea"
                    name="adminResponse"
                    className="form-control"
                rows={4}
                    placeholder="Enter your response to the user..."
                    required
                  />
                  <Form.Text className="form-help-text">
                    This response will be sent to the user via email
              </Form.Text>
            </Form.Group>
              </div>
            )}
        </Modal.Body>
        <Modal.Footer>
            <button type="button" className="modal-close-button" onClick={() => setShowResponseModal(false)}>
            Cancel
            </button>
            <button type="submit" className="modal-respond-button">
              Send Response
            </button>
        </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminManageFeedbackPage;
