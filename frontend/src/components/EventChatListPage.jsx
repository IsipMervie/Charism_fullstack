// EventChatListPage.jsx - List of events available for chat

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaCalendar, FaClock, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { getEvents } from '../api/api';
import { formatTimeRange12Hour, formatDatePhilippines } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import './EventChatListPage.css';

const EventChatListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');

  // Check if user can access chat for an event
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

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError('');
        
        const eventsData = await getEvents();
        
        // Filter events that user can access chat for
        const accessibleEvents = eventsData.filter(canAccessChat);
        
        setEvents(accessibleEvents);
        
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const openEventChat = (eventId) => {
    navigate(`/event-chat/${eventId}`);
  };

  if (loading) {
    return (
      <div className="event-chat-list-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-chat-list-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Events</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-chat-list-page">
      <div className="page-header">
        <h1><FaComments /> Event Chats</h1>
        <p>Join discussions for events you're approved for</p>
      </div>

      {events.length === 0 ? (
        <div className="no-events-container">
          <div className="no-events-icon">💬</div>
          <h2>No Chat Access</h2>
          <p>
            {role === 'Student' 
              ? "You don't have access to any event chats yet. You need to be registered and approved for events to participate in their discussions."
              : "No events are available for chat at the moment."
            }
          </p>
          <button 
            className="browse-events-button"
            onClick={() => navigate('/events')}
          >
            Browse Events
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event._id} className="event-card">
              <div className="event-image">
                {event.image ? (
                  <img 
                    src={getEventImageUrl(event._id)} 
                    alt={event.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="event-image-placeholder" style={{ display: event.image ? 'none' : 'flex' }}>
                  <FaCalendar />
                </div>
              </div>
              
              <div className="event-content">
                <h3 className="event-title">{event.title}</h3>
                
                <div className="event-meta">
                  <div className="event-date">
                    <FaCalendar />
                    <span>{formatDatePhilippines(event.date)}</span>
                  </div>
                  <div className="event-time">
                    <FaClock />
                    <span>{formatTimeRange12Hour(event.startTime, event.endTime)}</span>
                  </div>
                  <div className="event-location">
                    <FaMapMarkerAlt />
                    <span>{event.location}</span>
                  </div>
                </div>
                
                <p className="event-description">
                  {event.description.length > 150 
                    ? `${event.description.substring(0, 150)}...` 
                    : event.description
                  }
                </p>
                
                <div className="event-stats">
                  <div className="participants-count">
                    <FaUsers />
                    <span>{event.attendance?.length || 0} participants</span>
                  </div>
                </div>
              </div>
              
              <div className="event-actions">
                <button 
                  className="chat-button"
                  onClick={() => openEventChat(event._id)}
                >
                  <FaComments />
                  Join Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventChatListPage;
