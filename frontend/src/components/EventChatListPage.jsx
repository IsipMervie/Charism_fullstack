// EventChatListPage.jsx - List of events available for chat

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaSearch } from 'react-icons/fa';
import { getEvents } from '../api/api';
import { formatTimeRange12Hour, formatDatePhilippines } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import './EventChatListPage.css';

const EventChatListPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Check if user can request to join chat
  const canRequestChat = (event) => {
    // Only students can request
    if (role !== 'Student') return false;
    
    // Must be registered for the event
    if (!event?.attendance) return false;
    
    const userAttendance = event.attendance.find(att => 
      (att.userId?._id || att.userId) === user._id
    );
    
    // Can request if registered but not approved for chat
    return userAttendance && !userAttendance.registrationApproved && userAttendance.status !== 'Approved';
  };

  // Request to join chat
  const requestToJoinChat = async (eventId) => {
    try {
      const { requestEventChatAccess } = await import('../api/api');
      await requestEventChatAccess(eventId);
      alert('Chat access request sent! Admin/Staff will review your request.');
      // Refresh the events list
      window.location.reload();
    } catch (err) {
      console.error('Error requesting chat access:', err);
      alert('Failed to send request. Please try again.');
    }
  };

  // Filter events based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEvents(filtered);
    }
  }, [events, searchTerm]);

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
        <h1 className="page-title">Event Chats</h1>
        <p className="page-subtitle">Join discussions for events you're approved for</p>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search events by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="search-results-info">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">No Chat Access</div>
          <div className="empty-state-subtext">
            {role === 'Student' 
              ? "You don't have access to any event chats yet. You need to be registered and approved for events to participate in their discussions."
              : "No events are available for chat at the moment."
            }
          </div>
          <button 
            className="chat-button"
            onClick={() => navigate('/events')}
            style={{ marginTop: '1rem' }}
          >
            Browse Events
          </button>
        </div>
      ) : filteredEvents.length === 0 && searchTerm ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">No Events Found</div>
          <div className="empty-state-subtext">No events match your search for "{searchTerm}"</div>
          <button 
            className="chat-button"
            onClick={() => setSearchTerm('')}
            style={{ marginTop: '1rem' }}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <div key={event._id} className="event-card">
              <div className="event-image">
                {event.image ? (
                  <img 
                    src={getEventImageUrl(event.image, event._id)} 
                    alt={event.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    onLoad={(e) => {
                      e.target.style.opacity = '1';
                    }}
                    style={{ 
                      opacity: 0, 
                      transition: 'opacity 0.3s ease-in-out' 
                    }}
                  />
                ) : null}
                <div className="event-image-placeholder" style={{ display: event.image ? 'none' : 'flex' }}>
                  <FaCalendar />
                </div>
              </div>
              
              <div className="event-content">
                <h3 className="event-title">{event.title}</h3>
                
                <div className="event-details">
                  <div className="event-detail-item">
                    <FaCalendar className="event-detail-icon" />
                    <span className="event-detail-text">{formatDatePhilippines(event.date)}</span>
                  </div>
                  <div className="event-detail-item">
                    <FaClock className="event-detail-icon" />
                    <span className="event-detail-text">{formatTimeRange12Hour(event.startTime, event.endTime)}</span>
                  </div>
                  <div className="event-detail-item">
                    <FaMapMarkerAlt className="event-detail-icon" />
                    <span className="event-detail-text">{event.location}</span>
                  </div>
                  <div className="event-detail-item">
                    <FaUsers className="event-detail-icon" />
                    <span className="event-detail-text">{event.attendance?.length || 0} participants</span>
                  </div>
                </div>
              </div>
              
              <div className="event-actions">
                {canAccessChat(event) ? (
                  <button 
                    className="chat-button"
                    onClick={() => openEventChat(event._id)}
                  >
                    <FaComments className="chat-button-icon" />
                    <span className="chat-button-text">Join Chat</span>
                  </button>
                ) : canRequestChat(event) ? (
                  <button 
                    className="request-button"
                    onClick={() => requestToJoinChat(event._id)}
                  >
                    📝 Request Chat Access
                  </button>
                ) : (
                  <button 
                    className="disabled-button"
                    disabled
                  >
                    🔒 Not Available
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventChatListPage;
