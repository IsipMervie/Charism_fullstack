// EventChatPage.jsx - Dedicated page for event chat functionality

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaComments, FaUsers } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EventChat from './EventChat';
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
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');

  // Check if user can access chat for this event
  const canAccessChat = (event) => {
    // Admin and Staff can access chat for all events
    if (role === 'Admin' || role === 'Staff') {
      console.log('✅ Admin/Staff access granted');
      return true;
    }
    
    // Students can access chat if they are registered for the event
    // The approval system is for chat participation, not initial access
    if (role === 'Student' && event?.attendance) {
      const userAttendance = event.attendance.find(att => 
        (att.userId?._id || att.userId) === user._id
      );
      
      console.log('🎓 Student access check:', {
        userId: user._id,
        userName: user.name,
        hasAttendance: !!userAttendance,
        attendanceData: userAttendance ? {
          registrationApproved: userAttendance.registrationApproved,
          status: userAttendance.status
        } : null
      });
      
      // Allow access if student is registered (has attendance record)
      return !!userAttendance;
    }
    
    console.log('❌ Access denied:', { role, hasEvent: !!event, hasAttendance: !!event?.attendance });
    return false;
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
  const viewProfile = (participant) => {
    setSelectedProfile(participant);
    setShowProfileModal(true);
  };

  // Load event details
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Import the API function
        const { getEventDetails } = await import('../api/api');
        const eventData = await getEventDetails(eventId);
        
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
          <h2>Access Denied</h2>
          <p>{error}</p>
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
      {/* Event Header */}
      <div className="event-header">
        <button 
          className="back-button"
          onClick={() => navigate('/events')}
        >
          <FaArrowLeft /> Back to Events
        </button>
        
        <div className="event-info">
          <h1>{event.title}</h1>
          <div className="event-meta">
            <span className="event-date">
              📅 {new Date(event.date).toLocaleDateString()}
            </span>
            <span className="event-time">
              🕐 {event.startTime} - {event.endTime}
            </span>
            <span className="event-location">
              📍 {event.location}
            </span>
          </div>
        </div>
        
        <div className="event-actions">
          <button 
            className="participants-toggle-btn"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <FaUsers /> Participants ({participants.length})
          </button>
          {(role === 'Admin' || role === 'Staff') && (
            <button 
              className="approvals-toggle-btn"
              onClick={() => setShowApprovals(!showApprovals)}
            >
              ⏳ Approvals ({pendingApprovals.length})
            </button>
          )}
          <button 
            className="chat-toggle-btn"
            onClick={() => setShowChat(!showChat)}
          >
            <FaComments /> {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>
      </div>

      {/* Event Description */}
      <div className="event-description">
        <h3>Event Description</h3>
        <p>{event.description}</p>
      </div>

      {/* Participants Section */}
      {showParticipants && (
        <div className="participants-section">
          <div className="participants-header">
            <h3><FaUsers /> Chat Participants</h3>
            <p>People who can participate in this event's chat</p>
          </div>
          
          <div className="participants-list">
            {participants.length === 0 ? (
              <div className="no-participants">
                <p>No participants yet. Participants will appear here once they join the chat.</p>
              </div>
            ) : (
              participants.map((participant) => (
                <div key={participant._id} className="participant-card">
                  <div 
                    className="participant-avatar clickable"
                    onClick={() => viewProfile(participant)}
                    title="Click to view profile"
                  >
                    {participant.profilePicture ? (
                      <img 
                        src={participant.profilePicture} 
                        alt={participant.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="participant-avatar-placeholder" style={{ display: participant.profilePicture ? 'none' : 'flex' }}>
                      {participant.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  </div>
                  
                  <div 
                    className="participant-info clickable"
                    onClick={() => viewProfile(participant)}
                    title="Click to view profile"
                  >
                    <h4>{participant.name}</h4>
                    <p className="participant-role">{participant.role}</p>
                    <p className="participant-email">{participant.email}</p>
                  </div>
                  
                  <div className="participant-status">
                    <span className="status-badge online">Online</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      {showApprovals && (role === 'Admin' || role === 'Staff') && (
        <div className="approvals-section">
          <div className="approvals-header">
            <h3>⏳ Pending Chat Approvals</h3>
            <p>Students waiting for chat access approval</p>
          </div>
          
          <div className="approvals-list">
            {pendingApprovals.length === 0 ? (
              <div className="no-approvals">
                <p>No pending approvals. All registered students have been processed.</p>
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <div key={approval._id} className="approval-card">
                  <div className="approval-avatar">
                    {approval.userId?.profilePicture ? (
                      <img 
                        src={approval.userId.profilePicture} 
                        alt={approval.userId.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="approval-avatar-placeholder" style={{ display: approval.userId?.profilePicture ? 'none' : 'flex' }}>
                      {approval.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  </div>
                  
                  <div className="approval-info">
                    <h4>{approval.userId?.name || 'Unknown Student'}</h4>
                    <p className="approval-email">{approval.userId?.email || 'No email'}</p>
                    <p className="approval-status">Status: {approval.status || 'Pending'}</p>
                    <p className="approval-date">Registered: {new Date(approval.registeredAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="approval-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => approveStudentForChat(approval.userId._id)}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => rejectStudentForChat(approval.userId._id)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Section */}
      {showChat && (
        <div className="chat-section">
          <div className="chat-header-info">
            <h3><FaComments /> Event Chat</h3>
            <p>Discuss this event with other participants</p>
            <button 
              className="fullscreen-chat-btn"
              onClick={() => setShowFullscreenChat(true)}
              title="View chat in full screen"
            >
              🔍 View Full Screen
            </button>
          </div>
          
          <EventChat 
            eventId={event._id} 
            eventTitle={event.title}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* Full-screen Chat Modal */}
      {showFullscreenChat && (
        <div className="fullscreen-chat-overlay">
          <div className="fullscreen-chat-container">
            <div className="fullscreen-chat-header">
              <div className="fullscreen-chat-title">
                <h2><FaComments /> {event.title} - Event Chat</h2>
                <p>Discuss this event with other participants</p>
              </div>
              <button 
                className="exit-fullscreen-btn"
                onClick={() => setShowFullscreenChat(false)}
                title="Exit full screen"
              >
                ✕ Exit Full Screen
              </button>
            </div>
            
            <div className="fullscreen-chat-content">
              <EventChat 
                eventId={event._id} 
                eventTitle={event.title}
                onClose={() => setShowFullscreenChat(false)}
                isFullscreen={true}
              />
            </div>
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
                    src={selectedProfile.profilePicture} 
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
                <p className="profile-role">{selectedProfile.role}</p>
                <p className="profile-email">{selectedProfile.email}</p>
                
                {selectedProfile.bio && (
                  <div className="profile-bio">
                    <h4>Bio</h4>
                    <p>{selectedProfile.bio}</p>
                  </div>
                )}
                
                {selectedProfile.department && (
                  <div className="profile-info">
                    <h4>Department</h4>
                    <p>{selectedProfile.department}</p>
                  </div>
                )}
                
                {selectedProfile.yearLevel && (
                  <div className="profile-info">
                    <h4>Year Level</h4>
                    <p>{selectedProfile.yearLevel}</p>
                  </div>
                )}
                
                <div className="profile-info">
                  <h4>Member Since</h4>
                  <p>{new Date(selectedProfile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventChatPage;
