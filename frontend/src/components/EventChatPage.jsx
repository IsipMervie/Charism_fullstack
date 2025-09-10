// EventChatPage.jsx - Dedicated page for event chat functionality

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaComments, FaUsers } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EventChat from './EventChat';
import { getProfilePictureUrl } from '../utils/imageUtils';
import './EventChatPage.css';

const EventChatPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [showApprovals, setShowApprovals] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);
  const [chatJoinRequested, setChatJoinRequested] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');

  // Check if user can access chat for this event
  const canAccessChat = (event) => {
    console.log('🔍 canAccessChat called with:', {
      eventId: event?._id,
      eventTitle: event?.title,
      hasEvent: !!event,
      hasAttendance: !!event?.attendance,
      attendanceLength: event?.attendance?.length || 0,
      userRole: role,
      userId: user._id,
      userEmail: user.email
    });
    
    // Admin and Staff can access chat for all events
    if (role === 'Admin' || role === 'Staff') {
      console.log('✅ Admin/Staff access granted');
      return true;
    }
    
    // Students can access chat if they are registered and approved for chat
    if (role === 'Student' && event?.attendance) {
      // First try to find by user ID
      let userAttendance = event.attendance.find(att => 
        (att.userId?._id || att.userId) === user._id
      );
      
      // If not found by ID, try to find by email (fallback)
      if (!userAttendance && user.email) {
        userAttendance = event.attendance.find(att => 
          att.userId?.email === user.email
        );
        console.log('🔄 Fallback email search:', {
          userEmail: user.email,
          foundByEmail: !!userAttendance
        });
      }
      
      console.log('🎓 Student access check:', {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        hasAttendance: !!userAttendance,
        attendanceData: userAttendance ? {
          registrationApproved: userAttendance.registrationApproved,
          status: userAttendance.status,
          fullAttendance: userAttendance
        } : null,
        allAttendanceRecords: event.attendance.map(att => ({
          userId: att.userId?._id || att.userId,
          userName: att.userId?.name || 'Unknown',
          userEmail: att.userId?.email || 'Unknown',
          registrationApproved: att.registrationApproved,
          status: att.status
        }))
      });
      
      // Allow access if student is registered and approved for chat
      // Check multiple approval indicators
      const isApproved = userAttendance?.registrationApproved || 
                        userAttendance?.status === 'Approved' ||
                        userAttendance?.status === 'Attended' ||
                        userAttendance?.status === 'Completed';
      
      console.log('🎓 Approval check result:', {
        registrationApproved: userAttendance?.registrationApproved,
        status: userAttendance?.status,
        isApproved: isApproved
      });
      
      return isApproved;
    }
    
    console.log('❌ Access denied:', { 
      role, 
      hasEvent: !!event, 
      hasAttendance: !!event?.attendance,
      eventId: event?._id,
      eventTitle: event?.title,
      attendanceCount: event?.attendance?.length || 0,
      attendanceStructure: event?.attendance ? 'Array' : 'Not Array',
      sampleAttendance: event?.attendance?.slice(0, 2) || 'No attendance data'
    });
    return false;
  };

  // Check if student can request chat access
  const canRequestChatAccess = (event) => {
    if (role !== 'Student' || !event?.attendance) return false;
    
    // First try to find by user ID
    let userAttendance = event.attendance.find(att => 
      (att.userId?._id || att.userId) === user._id
    );
    
    // If not found by ID, try to find by email (fallback)
    if (!userAttendance && user.email) {
      userAttendance = event.attendance.find(att => 
        att.userId?.email === user.email
      );
    }
    
    // Can request if registered but not approved for chat
    const isApproved = userAttendance?.registrationApproved || 
                      userAttendance?.status === 'Approved' ||
                      userAttendance?.status === 'Attended' ||
                      userAttendance?.status === 'Completed';
    
    return userAttendance && !isApproved;
  };

  // Request chat access
  const requestChatAccess = async () => {
    try {
      const { requestEventChatAccess } = await import('../api/api');
      await requestEventChatAccess(eventId);
      setChatJoinRequested(true);
      Swal.fire({
        icon: 'success',
        title: 'Chat Access Requested!',
        text: 'Your request to join the chat has been submitted. Please wait for admin/staff approval.',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error requesting chat access:', err);
      Swal.fire('Error', 'Failed to request chat access. Please try again.', 'error');
    }
  };

  // Load participants
  const loadParticipants = async () => {
    try {
      const { getEventChatParticipants } = await import('../api/api');
      const participantsData = await getEventChatParticipants(eventId);
      setParticipants(participantsData);
    } catch (err) {
      console.error('Error loading participants:', err);
    }
  };

  // Load pending chat approvals
  const loadPendingApprovals = async () => {
    try {
      if (role === 'Admin' || role === 'Staff') {
        const { getEventDetails } = await import('../api/api');
        const eventData = await getEventDetails(eventId);
        
        // Get students who are registered but not approved for chat
        const pendingStudents = eventData.attendance?.filter(att => 
          att.userId && 
          att.userId.role === 'Student' && 
          !att.registrationApproved && 
          att.status !== 'Approved'
        ) || [];
        
        console.log('📋 Pending approvals loaded:', {
          totalAttendance: eventData.attendance?.length || 0,
          pendingCount: pendingStudents.length,
          pendingStudents: pendingStudents.map(p => ({
            name: p.userId?.name,
            email: p.userId?.email,
            registrationApproved: p.registrationApproved,
            status: p.status
          }))
        });
        
        setPendingApprovals(pendingStudents);
      }
    } catch (err) {
      console.error('Error loading pending approvals:', err);
    }
  };

  // Approve student for chat
  const approveStudentForChat = async (userId) => {
    try {
      const { approveRegistration } = await import('../api/api');
      await approveRegistration(eventId, userId);
      
      // Refresh data
      await loadParticipants();
      await loadPendingApprovals();
      
      alert('Student approved for chat access!');
    } catch (err) {
      console.error('Error approving student:', err);
      alert('Failed to approve student. Please try again.');
    }
  };

  // Reject student for chat
  const rejectStudentForChat = async (userId) => {
    // Predefined disapproval reasons
    const disapprovalReasons = [
      'Act of Misconduct (Student displayed inappropriate behavior or violated rules during the commserv)',
      'Late Arrival (Arrived late and wasn\'t present during the call time)',
      'Left Early (Left in the middle of the duration of commserv)',
      'Did not sign the Community Service Form',
      'Did not sign attendance sheet (if any)',
      'Absent (Student was absent and didn\'t attend the commserv)',
      'Not wearing the required uniform',
      'Full slot',
      'Other'
    ];
    
    const { value: formData } = await Swal.fire({
      title: 'Reason for Disapproval',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px; font-weight: 500;">Reasons why this student is disapproved (Attendance and During Duration of commserv):</p>
          <select id="disapproval-reason" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            <option value="">Select a reason...</option>
            ${disapprovalReasons.map(reason => `<option value="${reason}">${reason}</option>`).join('')}
          </select>
          <div id="other-reason-container" style="display: none; margin-top: 10px;">
            <label for="other-reason" style="display: block; margin-bottom: 5px; font-weight: 500;">Please specify other reason:</label>
            <textarea id="other-reason" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; min-height: 80px;" placeholder="Enter your specific reason here..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const selectedReason = document.getElementById('disapproval-reason').value;
        const otherReason = document.getElementById('other-reason').value;
        
        if (!selectedReason) {
          Swal.showValidationMessage('Please select a reason for disapproval');
          return false;
        }
        
        if (selectedReason === 'Other' && !otherReason.trim()) {
          Swal.showValidationMessage('Please specify the other reason');
          return false;
        }
        
        return {
          reason: selectedReason === 'Other' ? otherReason.trim() : selectedReason,
          selectedReason: selectedReason
        };
      },
      didOpen: () => {
        const reasonSelect = document.getElementById('disapproval-reason');
        const otherContainer = document.getElementById('other-reason-container');
        
        reasonSelect.addEventListener('change', (e) => {
          if (e.target.value === 'Other') {
            otherContainer.style.display = 'block';
          } else {
            otherContainer.style.display = 'none';
          }
        });
      }
    });

    if (formData) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to disapprove this student's registration?\n\nReason: ${formData.reason}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, disapprove it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        try {
          const { disapproveRegistration } = await import('../api/api');
          await disapproveRegistration(eventId, userId, formData.reason);
          
          // Refresh data
          await loadParticipants();
          await loadPendingApprovals();
          
          Swal.fire({
            icon: 'success',
            title: 'Registration Disapproved!',
            text: 'The student\'s registration has been disapproved with the provided reason.',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (err) {
          console.error('Error rejecting student:', err);
          Swal.fire('Error', 'Failed to reject student. Please try again.', 'error');
        }
      }
    }
  };

  // View user profile
  const viewProfile = async (participant) => {
    try {
      // If participant doesn't have full user data, fetch it
      if (!participant.role || !participant.department) {
        const { getUserProfile } = await import('../api/api');
        const userData = await getUserProfile(participant._id);
        setSelectedProfile({ ...participant, ...userData });
      } else {
        setSelectedProfile(participant);
      }
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setSelectedProfile(participant);
      setShowProfileModal(true);
    }
  };

  // Load event details
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Import the API functions
        const { getEventDetails, getEventAttendance } = await import('../api/api');
        const eventData = await getEventDetails(eventId);
        const attendanceData = await getEventAttendance(eventId);
        
        // Add attendance data to event object
        eventData.attendance = attendanceData;
        
        console.log('📊 Event data loaded:', {
          eventId: eventData?._id,
          eventTitle: eventData?.title,
          hasAttendance: !!eventData?.attendance,
          attendanceLength: eventData?.attendance?.length || 0,
          attendanceStructure: Array.isArray(eventData?.attendance) ? 'Array' : typeof eventData?.attendance,
          sampleAttendance: eventData?.attendance?.slice(0, 2) || 'No attendance data'
        });
        
        setEvent(eventData);
        
        // Check if user can access chat
        if (!canAccessChat(eventData)) {
          setError('You are not authorized to access the chat for this event. You must be registered and approved for this event to participate in the chat.');
          return;
        }
        
        // Auto-open chat if user has access
        setShowChat(true);
        
        // Load participants and pending approvals
        await loadParticipants();
        await loadPendingApprovals();
        
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="event-chat-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-chat-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Chat Access</h2>
          <p>{error}</p>
          
          {/* Show different options based on user role and status */}
          {role === 'Student' && event && canRequestChatAccess(event) && !chatJoinRequested && (
            <div className="chat-access-options">
              <p>You are registered for this event but need approval to join the chat.</p>
              <button 
                className="request-chat-access-btn"
                onClick={requestChatAccess}
              >
                Request Chat Access
              </button>
            </div>
          )}
          
          {role === 'Student' && chatJoinRequested && (
            <div className="chat-request-status">
              <p>✅ Your chat access request has been submitted!</p>
              <p>Please wait for admin/staff approval to join the chat.</p>
            </div>
          )}
          
          <button 
            className="back-button"
            onClick={() => navigate('/events')}
          >
            <FaArrowLeft /> Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-chat-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Event Not Found</h2>
          <p>The event you're looking for could not be found.</p>
          <button 
            className="back-button"
            onClick={() => navigate('/events')}
          >
            <FaArrowLeft /> Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-chat-page">
      {/* Header Section */}
      <div className="event-chat-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={() => navigate('/events')}
          >
            <FaArrowLeft className="back-button-icon" />
            Back to Events
          </button>
          
          <div className="event-title-header">
            <h1 className="event-title-main">{event.title}</h1>
            <div className="event-meta-header">
              <div className="event-meta-item">
                <span className="event-meta-icon">📅</span>
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="event-meta-item">
                <span className="event-meta-icon">🕐</span>
                <span>{event.startTime} - {event.endTime}</span>
              </div>
              <div className="event-meta-item">
                <span className="event-meta-icon">📍</span>
                <span>{event.location}</span>
              </div>
            </div>
          </div>
          
          <button 
            className="fullscreen-toggle"
            onClick={() => setShowFullscreenChat(true)}
          >
            <span className="fullscreen-toggle-icon">🔍</span>
            View Full Screen
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="event-chat-main">
        {/* Chat Section */}
        <div className="chat-section">
          <div className="chat-container">
            <EventChat 
              eventId={eventId}
              eventTitle={event.title}
              onClose={() => navigate('/events')}
              viewProfile={viewProfile}
            />
          </div>
        </div>

        {/* Event Info Sidebar */}
        <div className="event-info-sidebar">
          {/* Event Description */}
          <div className="sidebar-section">
            <h3 className="section-title description">Event Description</h3>
            <p className="event-description">{event.description}</p>
          </div>

          {/* Participants */}
          <div className="sidebar-section">
            <h3 className="section-title participants">Participants ({participants.length})</h3>
            <div className="participants-list">
              {participants.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <div className="empty-state-text">No participants yet</div>
                  <div className="empty-state-subtext">Participants will appear here once they join the chat</div>
                </div>
              ) : (
                participants.map((participant) => (
                  <div key={participant._id} className="participant-item">
                    <img 
                      className="participant-avatar"
                      src={getProfilePictureUrl(participant.profilePicture, participant._id)} 
                      alt={participant.name}
                      onClick={() => viewProfile(participant)}
                    />
                    <div className="participant-info">
                      <div className="participant-name">{participant.name}</div>
                      <div className="participant-role">{participant.role || 'Unknown'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Fullscreen Chat Modal */}
      {showFullscreenChat && (
        <div className="fullscreen-chat-overlay">
          <div className="fullscreen-chat-header">
            <h3 className="fullscreen-chat-title">{event.title}</h3>
            <button 
              className="exit-fullscreen-btn"
              onClick={() => setShowFullscreenChat(false)}
            >
              Exit Full Screen
            </button>
          </div>
          
          <div className="fullscreen-chat-content">
            <EventChat 
              eventId={eventId}
              eventTitle={event.title}
              onClose={() => setShowFullscreenChat(false)}
              viewProfile={viewProfile}
              isFullscreen={true}
            />
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>User Profile</h3>
              <button 
                className="close-btn"
                onClick={() => setShowProfileModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="profile-modal-content">
              <div className="profile-avatar-large">
                {selectedProfile.profilePicture ? (
                  <img 
                    src={getProfilePictureUrl(selectedProfile.profilePicture, selectedProfile._id)} 
                    alt={selectedProfile.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="profile-avatar-placeholder" style={{ display: selectedProfile.profilePicture ? 'none' : 'flex' }}>
                  {selectedProfile.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              </div>
              
              <div className="profile-details">
                <h2>{selectedProfile.name}</h2>
                <p className="profile-email">{selectedProfile.email}</p>
                
                {selectedProfile.bio && (
                  <div className="profile-bio">
                    <h4>Bio</h4>
                    <p>{selectedProfile.bio}</p>
                  </div>
                )}
                
                {/* Role - Always shown */}
                <div className="profile-info">
                  <h4>Role</h4>
                  <p>{selectedProfile.role || 'Unknown'}</p>
                </div>
                
                {/* Student-specific information */}
                {selectedProfile.role === 'Student' && (
                  <>
                    {selectedProfile.department && (
                      <div className="profile-info">
                        <h4>Department</h4>
                        <p>{selectedProfile.department}</p>
                      </div>
                    )}
                    
                    {selectedProfile.section && (
                      <div className="profile-info">
                        <h4>Section</h4>
                        <p>{selectedProfile.section}</p>
                      </div>
                    )}
                    
                    {selectedProfile.yearLevel && (
                      <div className="profile-info">
                        <h4>Year Level</h4>
                        <p>{selectedProfile.yearLevel}</p>
                      </div>
                    )}
                  </>
                )}
                
                {/* Admin/Staff - only show role (already shown above) */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventChatPage;
