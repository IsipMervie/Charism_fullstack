import React, { useState, useEffect } from 'react';
import { getEvents, getEventDetails } from '../api/api';
import './SimpleEventList.css';

function SimpleEventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🚀 Loading events...');
      
      const eventsData = await getEvents();
      console.log('✅ Events loaded:', eventsData.length);
      
      setEvents(eventsData);
    } catch (err) {
      console.error('❌ Error loading events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = async (eventId) => {
    try {
      console.log('🔍 Loading event details for:', eventId);
      const eventDetails = await getEventDetails(eventId);
      setSelectedEvent(eventDetails);
      setShowEventDetails(true);
    } catch (err) {
      console.error('❌ Error loading event details:', err);
      alert('Failed to load event details: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getEventStatus = (event) => {
    try {
      // First check if admin has manually marked the event as completed
      if (event.status === 'Completed') {
        return { text: 'Completed', class: 'status-completed' };
      }
      
      const now = new Date();
      const eventDate = new Date(event.date);
      
      if (eventDate < now) {
        return { text: 'Past', class: 'status-past' };
      } else {
        return { text: 'Upcoming', class: 'status-upcoming' };
      }
    } catch (err) {
      return { text: 'Unknown', class: 'status-unknown' };
    }
  };

  if (loading) {
    return (
      <div className="simple-event-list">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-event-list">
        <div className="error-container">
          <h2>❌ Error Loading Events</h2>
          <p>{error}</p>
          <button onClick={loadEvents} className="retry-btn">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-event-list">
      <div className="header">
        <h1>📅 Events List</h1>
        <p>Found {events.length} events</p>
        <button onClick={loadEvents} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <h3>No events found</h3>
          <p>There are no events available at the moment.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => {
            const status = getEventStatus(event);
            return (
              <div key={event._id} className="event-card" onClick={() => handleEventClick(event._id)}>
                <div className="event-header">
                  <h3>{event.title || 'Untitled Event'}</h3>
                  <span className={`status-badge ${status.class}`}>
                    {status.text}
                  </span>
                </div>
                
                <div className="event-info">
                  <p className="event-date">
                    📅 {formatDate(event.date)}
                  </p>
                  {event.location && (
                    <p className="event-location">
                      📍 {event.location}
                    </p>
                  )}
                  {event.description && (
                    <p className="event-description">
                      {event.description.length > 100 
                        ? event.description.substring(0, 100) + '...' 
                        : event.description
                      }
                    </p>
                  )}
                </div>
                
                <div className="event-footer">
                  <span className="attendance-count">
                    👥 {event.attendance?.length || 0} participants
                  </span>
                  <span className="click-hint">Click to view details</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="event-details-modal" onClick={() => setShowEventDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEvent.title}</h2>
              <button className="close-btn" onClick={() => setShowEventDetails(false)}>
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="event-detail">
                <strong>Date:</strong> {formatDate(selectedEvent.date)}
              </div>
              
              {selectedEvent.location && (
                <div className="event-detail">
                  <strong>Location:</strong> {selectedEvent.location}
                </div>
              )}
              
              {selectedEvent.description && (
                <div className="event-detail">
                  <strong>Description:</strong>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="event-detail">
                <strong>Status:</strong> {selectedEvent.status || 'Active'}
              </div>
              
              <div className="event-detail">
                <strong>Participants:</strong> {selectedEvent.attendance?.length || 0}
              </div>
              
              {selectedEvent.createdBy && (
                <div className="event-detail">
                  <strong>Created by:</strong> {selectedEvent.createdBy.name}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setShowEventDetails(false)} className="close-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleEventList;
