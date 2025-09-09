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
        
        // Load participants
        await loadParticipants();
        
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
                  <div className="participant-avatar">
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
                  
                  <div className="participant-info">
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
    </div>
  );
};

export default EventChatPage;
