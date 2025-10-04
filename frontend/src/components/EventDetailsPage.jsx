// frontend/src/components/EventDetailsPage.jsx
// Simple but Creative Event Details Page Design

import React, { useState, useEffect } from 'react';
import { getEventDetails, getPublicEventDetails, approveRegistration, disapproveRegistration, joinEvent, registerForEvent, unregisterFromEvent } from '../api/api';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaArrowLeft, FaSignInAlt, FaComments, FaCheck, FaTimes } from 'react-icons/fa';
import { formatTimeRange12Hour } from '../utils/timeUtils';
import EventChat from './EventChat';
import SimpleEventImage from './SimpleEventImage';
import ImageDiagnostic from './ImageDiagnostic';

import './EventDetailsPage.css';

function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isUserApprovedForEvent, setIsUserApprovedForEvent] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Attendance disapproval reasons
  const attendanceDisapprovalReasons = [
    'Act of Misconduct (Student displayed inappropriate behavior or violated rules during the commserv)',
    'Late Arrival (Arrived late and wasn\'t present during the call time)',
    'Left Early (Left in the middle of the duration of commserv)',
    'Did not sign the Community Service Form',
    'Did not sign attendance sheet (if any)',
    'Absent (Student was absent and didn\'t attend the commserv)',
    'Not wearing the required uniform',
    'Other'
  ];

  // Handle event registration
  const handleRegister = async () => {
    if (!event) return;
    
    setActionLoading(prev => ({ ...prev, register: true }));
    
    try {
      await registerForEvent(event._id);
      Swal.fire({
        title: 'Success!',
        text: 'You have successfully registered for this event.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Refresh event data
      await fetchEventDetails();
    } catch (error) {
      console.error('Registration error:', error);
      Swal.fire({
        title: 'Registration Failed',
        text: error.message || 'Failed to register for event. Please try again.',
        icon: 'error'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, register: false }));
    }
  };

  // Handle event unregistration
  const handleUnregister = async () => {
    if (!event) return;
    
    setActionLoading(prev => ({ ...prev, unregister: true }));
    
    try {
      await unregisterFromEvent(event._id);
      Swal.fire({
        title: 'Success!',
        text: 'You have successfully unregistered from this event.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Refresh event data
      await fetchEventDetails();
    } catch (error) {
      console.error('Unregistration error:', error);
      Swal.fire({
        title: 'Unregistration Failed',
        text: error.message || 'Failed to unregister from event. Please try again.',
        icon: 'error'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, unregister: false }));
    }
  };
  
  // Get user info safely with comprehensive error handling
  const getRole = () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem('role');
    } catch (e) {
      console.warn('localStorage access failed:', e.message);
      return null;
    }
  };
  
  const getUser = () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.warn('localStorage user access failed:', e.message);
      return null;
    }
  };

  const user = getUser();

  // Fetch event details function
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const role = getRole();
      let eventData;
      
      if (role === 'admin' || role === 'staff') {
        eventData = await getEventDetails(eventId);
      } else {
        eventData = await getPublicEventDetails(eventId);
      }
      
      setEvent(eventData);
      setIsUserApprovedForEvent(eventData.isUserApprovedForEvent || false);
      
      // Debug logging for approval status
      console.log('🔍 [FIXED VERSION] Event Details Debug:', {
        eventId: eventData._id,
        isUserApprovedForEvent: eventData.isUserApprovedForEvent,
        userAttendance: eventData.attendance?.find(att => {
          const userId = getUser()?._id || getUser()?.id;
          return att.userId && att.userId.toString() === userId?.toString();
        }),
        totalAttendance: eventData.attendance?.length || 0
      });
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError(error.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };
  
  const role = getRole();

  const isAuthenticated = !!localStorage.getItem('token');
  
  useEffect(() => {
    setIsVisible(true);
  }, []);



  useEffect(() => {
    fetchEventDetails();
    
    // Set flag when user visits event details page
    sessionStorage.setItem('wasOnEventDetails', 'true');
    
    // Cleanup function to remove flag when component unmounts
    return () => {
      // Don't remove flag here - let EventListPage handle it
    };
  }, [eventId, isAuthenticated]);

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

  const handleApproveAttendance = async (userId) => {
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
      setActionLoading(prev => ({ ...prev, [`approve_${userId}`]: true }));
      try {
        await approveRegistration(eventId, userId);
        Swal.fire('Success', 'Registration approved successfully!', 'success');
        // Force reload event data with cache busting
        console.log('🔄 Force refreshing event details after approval...');
        await fetchEventDetails();
        
        // Also update the local state immediately for better UX
        setEvent(prevEvent => {
          if (!prevEvent || !prevEvent.attendance) return prevEvent;
          
          const updatedAttendance = prevEvent.attendance.map(att => {
            if (att.userId && (att.userId._id === userId || att.userId === userId)) {
              console.log('🔄 Updating local attendance state for user:', userId);
              return {
                ...att,
                registrationApproved: true,
                registrationApprovedBy: getUser()?._id || getUser()?.id,
                registrationApprovedAt: new Date(),
                status: 'Approved'
              };
            }
            return att;
          });
          
          return {
            ...prevEvent,
            attendance: updatedAttendance
          };
        });
        
        setIsUserApprovedForEvent(true);
        
        // Notify other pages that data has changed
        console.log('📢 Dispatching approval change event for EventListPage refresh');
        window.dispatchEvent(new CustomEvent('eventApprovalChanged', { 
          detail: { eventId, userId, approved: true } 
        }));
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to approve registration.', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [`approve_${userId}`]: false }));
      }
    }
  };

  const handleDisapproveRegistration = async (userId) => {
    // Find the participant in the event
    const participant = event?.attendance?.find(p => p.userId._id === userId || p.userId === userId);
    
    // Show dropdown for disapproval reason
    const { value: reasonData } = await Swal.fire({
      title: 'Reason for Disapproval',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px;">Please select a reason for disapproving ${participant?.userId?.name || 'student'}'s attendance:</p>
          <select id="disapproval-reason" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            <option value="">Select a reason...</option>
            ${attendanceDisapprovalReasons.map((reason, index) => `<option value="${index}">${reason}</option>`).join('')}
          </select>
          <div id="other-reason-container" style="display: none; margin-top: 10px;">
            <label for="other-reason" style="display: block; margin-bottom: 5px; font-weight: 500;">Please specify other reason:</label>
            <textarea id="other-reason" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; min-height: 80px;" placeholder="Enter your specific reason here..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Disapprove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      preConfirm: () => {
        const selectedReason = document.getElementById('disapproval-reason').value;
        const otherReason = document.getElementById('other-reason').value;
        
        if (!selectedReason) {
          Swal.showValidationMessage('Please select a reason for disapproval');
          return false;
        }
        
        if (selectedReason === '7' && !otherReason.trim()) { // "Other" is index 7
          Swal.showValidationMessage('Please specify the other reason');
          return false;
        }
        
        return {
          reason: selectedReason === '7' ? otherReason.trim() : attendanceDisapprovalReasons[selectedReason],
          selectedReason: selectedReason
        };
      },
      didOpen: () => {
        const reasonSelect = document.getElementById('disapproval-reason');
        const otherContainer = document.getElementById('other-reason-container');
        
        reasonSelect.addEventListener('change', (e) => {
          if (e.target.value === '7') { // "Other" is index 7
            otherContainer.style.display = 'block';
          } else {
            otherContainer.style.display = 'none';
          }
        });
      }
    });

    if (reasonData) {
      setActionLoading(prev => ({ ...prev, [`disapprove_${userId}`]: true }));
      try {
        await disapproveRegistration(eventId, userId, reasonData.reason);
        Swal.fire('Success', 'Registration disapproved successfully!', 'success');
        // Reload event data
        await fetchEventDetails();
        
        // Notify other pages that data has changed
        window.dispatchEvent(new CustomEvent('eventApprovalChanged', { 
          detail: { eventId, userId, approved: false } 
        }));
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to disapprove registration.', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [`disapprove_${userId}`]: false }));
      }
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      setLoading(true);
      await joinEvent(eventId);
      
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: 'You have successfully registered for this event. Your registration is pending approval.',
        confirmButtonText: 'OK'
      });
      
      // Refresh event details to show updated status
      await fetchEventDetails();
      
      // Notify other pages that data has changed
      window.dispatchEvent(new CustomEvent('eventApprovalChanged', { 
        detail: { eventId, userId: user._id || user.id, approved: false, joined: true } 
      }));
    } catch (error) {
      console.error('Error joining event:', error);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.message || 'Failed to register for this event. Please try again.',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareEvent = (event) => {
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    
    // Always generate a registration-style link like in the image
    let shareUrl;
    let shareTitle;
    
    if (event.publicRegistrationToken) {
      // Use existing registration token
      shareUrl = `${frontendUrl}/#/events/register/${event.publicRegistrationToken}`;
      shareTitle = 'Event Registration Link';
    } else {
      // Generate a registration-style link using event ID
      shareUrl = `${frontendUrl}/#/events/register/evt_${event._id}_${Date.now()}`;
      shareTitle = 'Event Registration Link';
    }

    Swal.fire({
      title: 'Share Event Link',
      html: `
        <div style="text-align: left; max-width: 500px;">
          <p style="margin-bottom: 15px;">Copy the link below to share this event:</p>
          <div style="margin: 15px 0;">
            <label style="font-weight: 500; margin-bottom: 8px; display: block;">${shareTitle}:</label>
            <input 
              type="text" 
              value="${shareUrl}" 
              readonly 
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; font-family: monospace; font-size: 12px;"
              onClick="this.select()"
            />
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Click the input field to select all text, then copy it.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Copy Link',
      cancelButtonText: 'Close',
      width: '500px'
    }).then((result) => {
      if (result.isConfirmed) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          Swal.fire('Success!', 'Event link has been copied to your clipboard.', 'success');
        }).catch(() => {
          Swal.fire('Error', 'Failed to copy link. Please manually select and copy the link.', 'error');
        });
      }
    });
  };

  if (loading) return (
    <div className="event-details-page">
      <div className="loading-section">
        <div className="loading-spinner"></div>
       
        
      </div>
    </div>
  );
  
  if (error) return null;
  if (!event) return null;

  // Calculate available slots
  const maxParticipants = typeof event.maxParticipants === 'number' ? event.maxParticipants : 0;
  const attendanceCount = Array.isArray(event.attendance) ? 
    event.attendance.filter(a => 
      a.registrationApproved === true || 
      a.status === 'Approved' || 
      a.status === 'Attended' || 
      a.status === 'Completed'
    ).length : 0;
  const availableSlots = maxParticipants > 0 ? maxParticipants - attendanceCount : 0;

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
            
            {isAuthenticated && isUserApprovedForEvent && (
              <button 
                onClick={() => setShowChat(!showChat)}
                className={`chat-button ${showChat ? 'active' : ''}`}
              >
                <FaComments /> {showChat ? 'Close Chat' : 'Event Chat'}
              </button>
            )}
            
            
            
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
          {/* Event Image */}
          <div className="event-image-section">
            <SimpleEventImage event={event} />
          </div>
          
          {/* Image Diagnostic - for debugging */}
          <ImageDiagnostic eventId={event._id} eventTitle={event.title} />
          
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

          {/* Student Registration Section */}
          {isAuthenticated && role === 'Student' && user && (
            <div className="student-registration-section">
              {(() => {
                const userId = user._id || user.id;
                const userAttendance = event.attendance?.find(att => 
                  att.userId && att.userId.toString() === userId?.toString()
                );
                
                if (!userAttendance) {
                  // User hasn't joined yet - show join button
                  return (
                    <div className="join-event-section">
                      <h4>🎯 Join This Event</h4>
                      <p>Register to participate in this community service event.</p>
                      <button 
                        onClick={() => handleJoinEvent(event._id)}
                        className="join-event-button"
                        disabled={loading}
                      >
                        <span className="button-icon">📝</span>
                        Join Event
                      </button>
                    </div>
                  );
                } else if (userAttendance.registrationApproved !== true && userAttendance.status !== 'Approved' && userAttendance.status !== 'Attended' && userAttendance.status !== 'Completed') {
                  // User joined but registration pending approval
                  return (
                    <div className="registration-pending-section">
                      <h4>⏳ Registration Pending Approval</h4>
                      <p>Your registration is waiting for admin approval. You'll be notified once approved.</p>
                      <div className="pending-status">
                        <span className="status-icon">⏳</span>
                        <span className="status-text">Pending Approval</span>
                      </div>
                    </div>
                  );
                } else {
                  // User is approved
                  return (
                    <div className="registration-approved-section">
                      <h4>✅ Registration Approved</h4>
                      <p>Your registration has been approved! You can now participate in this event.</p>
                      <div className="approved-status">
                        <span className="status-icon">✅</span>
                        <span className="status-text">Approved</span>
                      </div>
                      <div className="time-info">
                        <p>💡 <strong>Note:</strong> Use the Time In/Time Out buttons in the Events List page to record your attendance.</p>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          )}

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
                            onClick={() => handleApproveAttendance(attendance.userId?._id || attendance.userId)}
                            className="approve-button"
                            disabled={actionLoading[`approve_${attendance.userId?._id || attendance.userId}`]}
                          >
                            <FaCheck /> {actionLoading[`approve_${attendance.userId?._id || attendance.userId}`] ? 'Approving...' : 'Approve'}
                          </button>
                          <button 
                            onClick={() => handleDisapproveRegistration(attendance.userId?._id || attendance.userId)}
                            className="disapprove-button"
                            disabled={actionLoading[`disapprove_${attendance.userId?._id || attendance.userId}`]}
                          >
                            <FaTimes /> {actionLoading[`disapprove_${attendance.userId?._id || attendance.userId}`] ? 'Disapproving...' : 'Disapprove'}
                          </button>
                        </>
                      )}
                      {attendance.status === 'Approved' && (
                        <span className="approved-note">✅ Attendance approved</span>
                      )}
                      {attendance.status === 'Disapproved' && (
                        <span className="disapproved-note">❌ Attendance disapproved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Event Chat */}
        {showChat && isAuthenticated && (
          <div className="event-chat-section">
            <EventChat 
              eventId={eventId} 
              eventTitle={event.title}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetailsPage;
