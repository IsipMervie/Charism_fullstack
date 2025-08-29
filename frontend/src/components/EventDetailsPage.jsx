// frontend/src/components/EventDetailsPage.jsx
// Simple but Creative Event Details Page Design

import React, { useState, useEffect } from 'react';
import { getEventDetails, approveAttendance, disapproveAttendance } from '../api/api';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaDownload, FaEye, FaCheck, FaTimes, FaArrowLeft, FaSignInAlt } from 'react-icons/fa';
import { formatTimeRange12Hour } from '../utils/timeUtils';

import './EventDetailsPage.css';

function EventDetailsPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();
  
  // Get user info safely
  const getRole = () => {
    try {
      return localStorage.getItem('role');
    } catch (e) {
      return null;
    }
  };
  
  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  };
  
  const role = getRole();
  const user = getUser();
  const isAuthenticated = !!localStorage.getItem('token');
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Handle approve attendance with confirmation
  const handleApprove = async (userId) => {
    if (!isAuthenticated) {
      Swal.fire('Authentication Required', 'Please log in to perform this action.', 'info');
      return;
    }
    
    // Find the participant in the event
    const participant = event?.attendance?.find(p => p.userId._id === userId || p.userId === userId);
    
    // Check if student has timed out
    if (!participant?.timeOut) {
      Swal.fire('Cannot Approve', 'Student has not timed out yet. Attendance can only be approved after time-out.', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to approve this attendance?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await approveAttendance(eventId, userId);
        Swal.fire('Success', 'Attendance approved!', 'success');
        // Refresh event details
        const updatedEvent = await getEventDetails(eventId);
        setEvent(updatedEvent);
      } catch (err) {
        Swal.fire('Error', err.message || 'Failed to approve attendance.', 'error');
      }
    }
  };

  const handleDisapprove = async (userId) => {
    if (!isAuthenticated) {
      Swal.fire('Authentication Required', 'Please log in to perform this action.', 'info');
      return;
    }
    
    const { value: reason } = await Swal.fire({
      title: 'Reason for Disapproval',
      input: 'textarea',
      inputLabel: 'Please provide a reason for disapproval',
      inputPlaceholder: 'Enter your reason here...',
      inputAttributes: {
        'aria-label': 'Enter your reason'
      },
      showCancelButton: true,
      confirmButtonText: 'Submit'
    });

    if (reason) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to disapprove this attendance?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, disapprove it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        try {
          await disapproveAttendance(eventId, userId, reason); // Passing reason to the API
          Swal.fire('Success', 'Attendance disapproved!', 'success');
          // Refresh event details
          const updatedEvent = await getEventDetails(eventId);
          setEvent(updatedEvent);
        } catch (err) {
          Swal.fire('Error', 'Failed to disapprove attendance.', 'error');
        }
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const eventData = await getEventDetails(eventId);
        setEvent(eventData);
        setError('');
      } catch (err) {
        console.error('Error fetching event:', err);
        if (err.response?.status === 404) {
          setError('Event not found');
        } else if (err.response?.status === 403) {
          setError('This event is not available for viewing');
        } else {
          setError('Error fetching event details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error,
      }).then(() => navigate('/events'));
    }
  }, [error, navigate]);

  useEffect(() => {
    if (!loading && !error && event === null) {
      Swal.fire({
        icon: 'warning',
        title: 'No Event Found',
        text: 'The event you are looking for does not exist.',
      }).then(() => navigate('/events'));
    }
  }, [loading, error, event, navigate]);

  if (loading) return (
    <div className="event-details-page">
      <div className="loading-section">
        <div className="loading-spinner"></div>
        <h3>Loading Event Details...</h3>
        <p>Please wait while we fetch the event information</p>
      </div>
    </div>
  );
  
  if (error) return null;
  if (!event) return null;

  // Calculate available slots and isAvailable
  const maxParticipants = typeof event.maxParticipants === 'number' ? event.maxParticipants : 0;
  const attendanceCount = Array.isArray(event.attendance) ? event.attendance.length : 0;
  const availableSlots = maxParticipants > 0 ? maxParticipants - attendanceCount : 0;
  const isAvailable = event.status === 'Active' && availableSlots > 0;

  // Filter attended participants
  const attendedParticipants = event.attendance?.filter(a => 
    a.status === 'Approved' || a.status === 'Attended'
  ) || [];

  return (
    <div className="event-details-page">
      <div className="event-details-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`event-details-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="event-header">
          <div className="event-header-content">
            <div className="event-header-icon">
              <div className="icon-symbol">📋</div>
            </div>
            <div className="event-header-text">
              <h1 className="event-title">{event.title}</h1>
              <div className="event-meta">
                <div className="meta-item">
                  <FaCalendar className="meta-icon" />
                  <span>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="meta-item">
                  <FaClock className="meta-icon" />
                  <span>
                    {event.startTime && event.endTime 
                      ? formatTimeRange12Hour(event.startTime, event.endTime)
                      : 'Time not specified'
                    }
                  </span>
                </div>
                <div className="meta-item">
                  <FaMapMarkerAlt className="meta-icon" />
                  <span>{event.location || 'Location not specified'}</span>
                </div>
                <div className="meta-item">
                  <FaUsers className="meta-icon" />
                  <span>{availableSlots} slots available</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="event-actions">
            <button 
              onClick={() => navigate('/events')}
              className="back-button"
            >
              <FaArrowLeft /> Back to Events
            </button>
            
            {!isAuthenticated && (
              <button 
                onClick={() => navigate('/login')}
                className="login-button"
              >
                <FaSignInAlt /> Login to Participate
              </button>
            )}
          </div>
        </div>

        {/* Event Content */}
        <div className="event-content">
          <div className="event-description">
            <h3>Event Description</h3>
            <p>{event.description || 'No description available.'}</p>
          </div>

          {/* Event Details Grid */}
          <div className="event-details-grid">
            <div className="detail-card">
              <h4>Event Hours</h4>
              <p>{event.hours || 0} hours</p>
            </div>
            <div className="detail-card">
              <h4>Status</h4>
              <span className={`status-badge status-${event.status?.toLowerCase()}`}>
                {event.status || 'Unknown'}
              </span>
            </div>
            <div className="detail-card">
              <h4>Department</h4>
              <p>{event.isForAllDepartments ? 'All Departments' : (event.departments?.join(', ') || 'Not specified')}</p>
            </div>
            <div className="detail-card">
              <h4>Registration</h4>
              <p>{event.requiresApproval ? 'Requires Approval' : 'Auto-approved'}</p>
            </div>
          </div>

          {/* Public Registration Notice */}
          {!isAuthenticated && event.isPublicRegistrationEnabled && (
            <div className="public-registration-notice">
              <h4>🎉 Public Registration Available!</h4>
              <p>This event allows public registration. You can participate without creating an account!</p>
              <button 
                onClick={() => navigate(`/events/register/${event.publicRegistrationToken}`)}
                className="public-register-button"
              >
                Register for Event
              </button>
            </div>
          )}

          {/* Admin/Staff Actions */}
          {isAuthenticated && (role === 'Admin' || role === 'Staff') && (
            <div className="admin-actions">
              <h3>Admin Actions</h3>
              <div className="action-buttons">
                <button 
                  onClick={() => navigate(`/events/${eventId}/edit`)}
                  className="edit-button"
                >
                  Edit Event
                </button>
                <button 
                  onClick={() => navigate(`/events/${eventId}/participants`)}
                  className="participants-button"
                >
                  View Participants
                </button>
              </div>
            </div>
          )}

          {/* Attendance List (Admin/Staff only) */}
          {isAuthenticated && (role === 'Admin' || role === 'Staff') && event.attendance && event.attendance.length > 0 && (
            <div className="attendance-section">
              <h3>Event Attendance</h3>
              <div className="attendance-list">
                {event.attendance.map((attendance, index) => (
                  <div key={index} className="attendance-item">
                    <div className="attendance-info">
                      <span className="student-name">
                        {attendance.userId?.name || 'Unknown Student'}
                      </span>
                      <span className="attendance-status">
                        Status: {attendance.status || 'Pending'}
                      </span>
                    </div>
                    <div className="attendance-actions">
                      {attendance.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(attendance.userId?._id || attendance.userId)}
                            className="approve-button"
                          >
                            <FaCheck /> Approve
                          </button>
                          <button 
                            onClick={() => handleDisapprove(attendance.userId?._id || attendance.userId)}
                            className="disapprove-button"
                          >
                            <FaTimes /> Disapprove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventDetailsPage;
