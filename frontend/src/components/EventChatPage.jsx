// EventChatPage.jsx - Dedicated page for event chat functionality

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaComments, FaUsers } from 'react-icons/fa';
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
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');

  // Check if user can access chat for this event
  const canAccessChat = (event) => {
    // Admin and Staff can access chat for all events
    if (role === 'Admin' || role === 'Staff') {
      return true;
    }
    
    // Students can access chat if they are registered and either:
    // 1. Registration is approved (registrationApproved: true), OR
    // 2. Attendance is approved (status: 'Approved')
    if (role === 'Student' && event?.attendance) {
      const userAttendance = event.attendance.find(att => 
        (att.userId?._id || att.userId) === user._id
      );
      
      return userAttendance?.registrationApproved || userAttendance?.status === 'Approved';
    }
    
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
        
        setPendingApprovals(pendingStudents);
      }
    } catch (err) {
      console.error('Error loading pending approvals:', err);
    }
  };

  // Approve student for chat
  const approveStudentForChat = async (userId) => {
    try {
      const { approveEventRegistration } = await import('../api/api');
      await approveEventRegistration(eventId, userId);
      
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
    try {
      const { disapproveEventRegistration } = await import('../api/api');
      await disapproveEventRegistration(eventId, userId);
      
      // Refresh data
      await loadParticipants();
      await loadPendingApprovals();
      
      alert('Student rejected for chat access.');
    } catch (err) {
      console.error('Error rejecting student:', err);
      alert('Failed to reject student. Please try again.');
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
          {(role === 'Admin' || role === 'Staff') && pendingApprovals.length > 0 && (
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
          </div>
          
          <EventChat 
            eventId={event._id} 
            eventTitle={event.title}
            onClose={() => setShowChat(false)}
          />
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
