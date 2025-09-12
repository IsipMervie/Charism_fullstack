// frontend/src/components/AdminManageEventsPage.jsx
// Simple but Creative Manage Events Page Design

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, deleteEvent, getAllEventAttachments, toggleEventVisibility, markEventAsCompleted, markEventAsNotCompleted, clearCache, clearAllCache } from '../api/api';
import Swal from 'sweetalert2';
import { showConfirm, showError, showSuccess, showWarning } from '../utils/sweetAlertUtils';
import { FaCalendar, FaClock, FaUsers, FaMapMarkerAlt, FaEdit, FaEye, FaTrash, FaEyeSlash, FaShare } from 'react-icons/fa';
import { formatTimeRange12Hour } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import { safeFilter, safeMap, safeLength } from '../utils/arrayUtils';
import LoadingOptimizer from './LoadingOptimizer';
import './AdminManageEventsPage.css';

function AdminManageEventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();
  const loadingRef = useRef(true); // Use ref to track loading state

  // Update ref when loading state changes
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Set visibility on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Check and refresh authentication if needed
  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      console.log('❌ No authentication found');
      return false;
    }
    
    // Check if token is expired (simple check)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (tokenData.exp < now) {
        console.log('❌ Token expired');
        return false;
      }
      
      console.log('✅ Token valid');
      return true;
    } catch (error) {
      console.log('❌ Invalid token format');
      return false;
    }
  };

  // Handle authentication errors
  const handleAuthError = () => {
    console.log('🔐 Authentication error detected - redirecting to login');
    showWarning('Session Expired', 'Your session has expired. Please log in again.', {
      confirmButtonText: 'Log In',
      showCancelButton: false
    }).then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    });
  };

  const fetchEvents = useCallback(async (retryCount = 0) => {
    // Prevent multiple simultaneous calls
    if (isFetching && retryCount === 0) {
      console.log('⚠️ fetchEvents already in progress, skipping...');
      return;
    }
    
    console.log('🔄 Starting fetchEvents, retry count:', retryCount);
    setIsFetching(true);
    setLoading(true);
    setError('');
    
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found');
        setError('Please log in to view this page.');
        setLoading(false);
        setIsFetching(false);
        return;
      }

      // Check user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user.role || localStorage.getItem('role');
      
      console.log('👤 User role:', role);
      
      if (!role || (role !== 'Admin' && role !== 'Staff')) {
        console.log('❌ Access denied for role:', role);
        setError(`Access denied. This page requires Admin or Staff role. Your current role is: ${role || 'Unknown'}`);
        setLoading(false);
        setIsFetching(false);
        return;
      }

      // Simplified caching - only cache for 5 seconds to avoid stale data
      const cacheKey = `events_cache_${role}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
      
      // Use cache if it's less than 5 seconds old
      if (cachedData && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        if (cacheAge < 5000) { // 5 seconds to ensure fresh data
          console.log('📦 Using cached events data');
          setEvents(JSON.parse(cachedData));
          setLoading(false);
          setIsFetching(false);
          return;
        }
      }

      console.log('🌐 Fetching events from API...');
      
      // Use the standard getEvents function with its built-in timeout
      const data = await getEvents();
      
      console.log('✅ Events fetched successfully, count:', data?.length || 0);
      console.log('📊 Events data sample:', data?.slice(0, 2)); // Log first 2 events for debugging
      
      // Cache the data
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      
      setEvents(data);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      // Handle specific error types
      if (err.message === 'API timeout') {
        setError('API request timed out. Please try again.');
      } else if (err.code === 'ECONNABORTED') {
        if (retryCount < 2) {
          console.log(`🔄 Retrying fetchEvents (${retryCount + 1}/3)...`);
          setTimeout(() => {
            fetchEvents(retryCount + 1);
          }, 2000);
          return;
        } else {
          setError('Request timeout after multiple attempts - server may be slow or overloaded. Please try again later.');
        }
      } else if (err.response?.status === 503) {
        setError('Backend server is currently unavailable. Please try again later.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response?.status === 403) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = user.role || localStorage.getItem('role');
        setError(`Access denied. This page requires Admin or Staff role. Your current role is: ${role || 'Unknown'}`);
      } else if (err.message && err.message.includes('Database not connected')) {
        setError('Database temporarily unavailable. Please try again later.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to fetch events: ${err.message || 'Unknown error'}`);
      }
    } finally {
      console.log('🏁 fetchEvents completed');
      setLoading(false);
      setIsFetching(false);
    }
  }, []); // Remove dependencies to prevent infinite loops

  useEffect(() => {
    console.log('🚀 Component mounted, calling fetchEvents...');
    
    // Check authentication first
    if (!checkAuthentication()) {
      handleAuthError();
      return;
    }
    
    // Call fetchEvents with error handling
    fetchEvents().catch(error => {
      console.error('❌ fetchEvents failed:', error);
      if (error.response?.status === 401) {
        handleAuthError();
      } else {
        setError('Failed to load events. Please refresh the page.');
        setLoading(false);
        setIsFetching(false);
      }
    });
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout triggered, loading state:', loading);
      if (loading && isFetching) {
        console.log('❌ Loading timeout - stopping loading');
        setError('Loading timeout. Please refresh the page.');
        setLoading(false);
        setIsFetching(false);
      }
    }, 10000); // 10 seconds instead of 30
    
    return () => clearTimeout(timeoutId);
  }, []); // Remove loading dependency to prevent infinite loops

  const handleEdit = (eventId) => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleView = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  const handleDelete = async (eventId) => {
    const result = await showConfirm(
      'Are you sure?',
      'This will permanently delete the event.',
      {
        icon: 'warning',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545'
      }
    );
    if (!result.isConfirmed) return;

    try {
      await deleteEvent(eventId);
      // Clear all relevant caches to ensure fresh data
      clearCache('events_cache_Admin');
      clearCache('events_cache_Staff');
      clearCache('events-cache');
      clearCache('publicSettings');
      clearAllCache(); // Clear all cached data
      showSuccess('Deleted', 'Event deleted.');
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      if (err.response?.status === 401) {
        handleAuthError();
      } else if (err.response?.status === 403) {
        showError('Error', 'Access denied. This action requires Admin or Staff role.');
      } else {
        showError('Error', 'Failed to delete event.');
      }
    }
  };

  const handleToggleVisibility = async (eventId, currentVisibility) => {
    const action = currentVisibility ? 'disable' : 'enable';
    const result = await showConfirm(
      `Are you sure?`,
      `This will ${action} the event for students. ${currentVisibility ? 'Students will no longer see the "Register" button for this event.' : 'Students will be able to register for this event.'}`,
      {
        icon: 'warning',
        confirmButtonText: currentVisibility ? 'Disable' : 'Enable',
        cancelButtonText: 'Cancel',
        confirmButtonColor: currentVisibility ? '#dc3545' : '#28a745'
      }
    );
    
    if (!result.isConfirmed) return;

    try {
      await toggleEventVisibility(eventId, !currentVisibility);
      // Clear cache to ensure fresh data
      clearCache('events_cache_Admin');
      clearCache('events_cache_Staff');
      showSuccess('Success', `Event ${action}d successfully.`);
      fetchEvents();
    } catch (err) {
      console.error('Error toggling event visibility:', err);
      if (err.response?.status === 401) {
        handleAuthError();
      } else {
        showError('Error', err.message || 'Failed to update event visibility.');
      }
    }
  };

  // Handle marking event as completed
  const handleMarkAsCompleted = async (eventId) => {
    const result = await showConfirm(
      'Mark Event as Completed?',
      'This will mark the event as completed and move it to the completed filter, make it read-only, and hide it from students. This action cannot be undone automatically.',
      {
        icon: 'question',
        confirmButtonText: 'Mark as Completed',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#28a745',
        html: `
          <div style="text-align: left;">
            <p>This will mark the event as completed and:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>✅ Move it to the completed filter</li>
              <li>📖 Make it read-only (no more editing)</li>
              <li>👥 Hide it from students</li>
              <li>⚠️ Events are NOT automatically completed by time</li>
              <li>⚠️ This action cannot be undone automatically</li>
            </ul>
            <p className="confirmation-text-danger">Are you sure you want to continue?</p>
          </div>
        `
      }
    );
    
    if (!result.isConfirmed) return;

    try {
      await markEventAsCompleted(eventId);
      showSuccess('Event Completed!', 'The event has been marked as completed and is now read-only.');
      fetchEvents();
    } catch (err) {
      console.error('Error marking event as completed:', err);
      showError('Error', err.message || 'Failed to mark event as completed.');
    }
  };

  // Handle marking event as NOT completed (revert to editable)
  const handleMarkAsNotCompleted = async (eventId) => {
    const result = await showConfirm(
      'Mark Event as NOT Completed?',
      'This will revert the event to editable status and allow students to register again.',
      {
        icon: 'question',
        confirmButtonText: 'Mark as NOT Completed',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#2563eb',
        html: `
          <div style="text-align: left;">
            <p>This will revert the event to editable status and:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>🔄 Move it back to upcoming/past filter</li>
              <li>✏️ Make it editable again</li>
              <li>👥 Show it to students (they can register)</li>
              <li>⚠️ This will allow students to join again</li>
            </ul>
            <p className="confirmation-text-primary">Are you sure you want to continue?</p>
          </div>
        `
      }
    );
    
    if (!result.isConfirmed) return;

    try {
      await markEventAsNotCompleted(eventId);
      showSuccess('Event Reverted!', 'The event has been marked as NOT completed and is now editable again.');
      fetchEvents();
    } catch (err) {
      console.error('Error marking event as NOT completed:', err);
      showError('Error', err.message || 'Failed to mark event as NOT completed.');
    }
  };

  const handleShareEvent = (event) => {
    // Check if event has public registration enabled
    if (!event.isPublicRegistrationEnabled || !event.publicRegistrationToken) {
      showWarning('Public Registration Not Enabled', 'Please enable public registration for this event first to generate a shareable link.');
      return;
    }

    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    const registrationUrl = `${frontendUrl}/#/events/register/${event.publicRegistrationToken}`;

    const eventTitle = event.title;
    const eventDate = new Date(event.date).toLocaleDateString();
    const eventTime = formatTimeRange12Hour(event.startTime, event.endTime);
    const eventLocation = event.location;

    Swal.fire({
      title: 'Share Event',
      html: `
        <div style="text-align: left; max-width: 500px;">
          <h4 className="event-details-title">${eventTitle}</h4>
          <div className="event-details-info">
            <p className="event-details-item">
              <strong>📅 Date:</strong> ${eventDate}
            </p>
            <p className="event-details-item">
              <strong>🕐 Time:</strong> ${eventTime}
            </p>
            <p className="event-details-item">
              <strong>📍 Location:</strong> ${eventLocation}
            </p>
          </div>
          

          
        </div>
      `,
      confirmButtonText: '📋 Copy Link',
      showCancelButton: false,
      width: '600px',
      customClass: {
        popup: 'share-event-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Copy registration link to clipboard
        navigator.clipboard.writeText(registrationUrl);
        showSuccess('Registration Link Copied!', 'Registration link copied to clipboard');
      }
    });
  };



  // Helper function to determine event status
  const getEventStatus = (event) => {
    // Check if admin has manually marked the event as completed
    if (event.status === 'Completed') {
      return 'completed';
    }
    
    const now = new Date();
    const eventDate = new Date(event.date);
    const eventStartTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
    const eventEndTime = new Date(`${eventDate.toDateString()} ${event.endTime || '23:59'}`);
    
    // Check if event time has completely passed
    if (eventEndTime < now) {
      // Event time has passed - automatically mark as completed
      return 'completed';
    } else if (eventStartTime > now) {
      // Event hasn't started yet - it's upcoming
      return 'upcoming';
    } else if (eventStartTime <= now && eventEndTime > now) {
      // Event is currently happening - it's ongoing
      return 'ongoing';
    } else {
      // Event date has passed but time logic didn't catch it - it's past
      return 'past';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'status-upcoming';
      case 'ongoing': return 'status-ongoing';
      case 'past': return 'status-past';
      case 'completed': return 'status-completed';
      default: return 'status-upcoming';
    }
  };

  // Filter events by search and status
  const filteredEvents = safeFilter(events, event => {
    // Search filter
    const matchesSearch = (event.title && event.title.toLowerCase().includes(search.toLowerCase())) ||
                         (event.description && event.description.toLowerCase().includes(search.toLowerCase()));
    
    // Status filter
    const matchesStatus = !statusFilter || getEventStatus(event) === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <LoadingOptimizer 
      loading={loading} 
      error={error}
      message="Loading events..."
      timeout={15000}
    >
      <div className="manage-events-page">
      <div className="manage-events-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`manage-events-container ${isVisible ? 'visible' : ''}`}>
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">📅</div>
            </div>
            <div className="header-text">
              <h1 className="page-title">Manage Events</h1>
              <p className="page-subtitle">Create, edit, and manage community service events</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="action-button secondary-button"
              onClick={() => navigate('/registration-approval')}
            >
              Registration 
            </button>

            <button
              className="action-button primary-button"
              onClick={() => navigate('/admin/create-event')}
            >
              Create Event
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-box">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search events by title or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Events</option>
              <option value="upcoming">🚀 Upcoming Events</option>
              <option value="ongoing">🔄 Ongoing Events</option>
              <option value="past">⏰ Past Events</option>
              <option value="completed">✅ Completed Events</option>
            </select>
          </div>
          
          {(search || statusFilter) && (
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
              title="Clear all filters"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* Events Summary */}
        <div className="events-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-number">{safeLength(safeFilter(events, e => getEventStatus(e) === 'upcoming'))}</span>
              <span className="stat-label">🚀 Upcoming</span>
            </div>

            <div className="stat-item">
              <span className="stat-number">{safeLength(safeFilter(events, e => getEventStatus(e) === 'ongoing'))}</span>
              <span className="stat-label">🔄 Ongoing</span>
            </div>

            <div className="stat-item">
              <span className="stat-number">{safeLength(safeFilter(events, e => getEventStatus(e) === 'past'))}</span>
              <span className="stat-label">⏰ Past</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{safeLength(safeFilter(events, e => getEventStatus(e) === 'completed'))}</span>
              <span className="stat-label">✅ Completed</span>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-section">
          {safeLength(filteredEvents) === 0 ? (
            <div className="no-events">
              <div className="no-events-icon">📅</div>
              <h3>No Events Found</h3>
              <p>
                {search || statusFilter 
                  ? `No events match your current filters.`
                  : 'No events found in the system.'
                }
              </p>
              {(search || statusFilter) && (
                <p>Try adjusting your search criteria or clearing the filters.</p>
              )}
              <button 
                className="clear-filters-btn large"
                onClick={clearFilters}
              >
                ✕ Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="results-header">
                <h3>Events ({safeLength(filteredEvents)} of {safeLength(events)})</h3>
                {(search || statusFilter) && (
                  <div className="active-filters">
                    <span className="filter-tag">
                      {search && `Search: "${search}"`}
                    </span>
                    {statusFilter && (
                      <span className="filter-tag">
                        Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="events-grid">
                                 {filteredEvents.map(event => {
                  const status = getEventStatus(event);
                  const maxParticipants = typeof event.maxParticipants === 'number' ? event.maxParticipants : 0;
                  const approvedAttendanceCount = safeFilter(event.attendance, a => a.registrationApproved === true).length;


                  const availableSlots = maxParticipants > 0 ? maxParticipants - approvedAttendanceCount : 'Unlimited';

                  return (
                    <div key={event._id} className="event-card">
                     
                      {/* Event Content */}
                      <div className="event-content">
                        <h3 className="event-title">{event.title}</h3>
                        
                        <div className="event-meta">
                          <div className="meta-item">
                            <FaCalendar className="meta-icon" />
                            <span>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="meta-item">
                            <FaClock className="meta-icon" />
                            <span>{formatTimeRange12Hour(event.startTime, event.endTime)}</span>
                          </div>
                          <div className="meta-item">
                            <FaMapMarkerAlt className="meta-icon" />
                            <span>{event.location || 'N/A'}</span>
                          </div>
                          <div className="meta-item">
                            <FaUsers className="meta-icon" />
                            <span>
                              {availableSlots === 'Unlimited' ? 'Unlimited Slots' : `${availableSlots} slots available`}
                              {maxParticipants > 0 && (
                                <span className="capacity-details">
                                  ({approvedAttendanceCount} approved)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="event-details">
                          <div className="detail-item">
                            <span className="detail-label">Service Hours:</span>
                            <span className="detail-value">{event.hours || 0} hours</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Attendees:</span>
                            <span className="detail-value">{approvedAttendanceCount} / {maxParticipants || '∞'}</span>
                          </div>
                          
                          {/* Show completion status for manually completed events */}
                          {event.status === 'Completed' && (
                            <div className="detail-item completed-notice">
                              <span className="detail-label">Status:</span>
                              <span className="detail-value completed-status">✅ Manually Completed - Read Only</span>
                            </div>
                          )}

                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                          {/* Edit Button - Only show for non-completed events */}
                          {event.status !== 'Completed' && (
                            <button
                              className="action-button edit-button"
                              onClick={() => handleEdit(event._id)}
                              title="Edit Event"
                            >
                              <FaEdit className="button-icon" />
                              <span>Edit</span>
                            </button>
                          )}
                          
                          <button
                            className="action-button view-button"
                            onClick={() => handleView(event._id)}
                            title="View Details"
                          >
                            <FaEye className="button-icon" />
                            <span>View</span>
                          </button>

                          {/* Share Button - Only show if public registration is enabled */}
                          {event.isPublicRegistrationEnabled && event.publicRegistrationToken && (
                            <button
                              className="action-button share-button"
                              onClick={() => handleShareEvent(event)}
                              title="Share Event"
                            >
                              <FaShare className="button-icon" />
                              <span>Share</span>
                            </button>
                          )}

                          {/* Visibility Toggle Button - Only show for non-completed events */}
                          {event.status !== 'Completed' && (
                            <button
                              className={`action-button ${event.isVisibleToStudents ? 'disable-button' : 'enable-button'}`}
                              onClick={() => handleToggleVisibility(event._id, event.isVisibleToStudents)}
                              title={event.isVisibleToStudents ? 'Disable for Students' : 'Enable for Students'}
                            >
                              {event.isVisibleToStudents ? (
                                <>
                                  <FaEyeSlash className="button-icon" />
                                  <span>Disable</span>
                                </>
                              ) : (
                                <>
                                  <FaEye className="button-icon" />
                                  <span>Enable</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Completion Management Buttons */}
                          {event.status !== 'Completed' ? (
                            // Show "Mark as Completed" button for non-completed events
                            <button
                              className="action-button complete-button"
                              onClick={() => handleMarkAsCompleted(event._id)}
                              title="Mark Event as Completed"
                            >
                              <span>Complete</span>
                            </button>
                          ) : (
                            // Show "Mark as NOT Completed" button for completed events
                            <button
                              className="action-button not-complete-button"
                              onClick={() => handleMarkAsNotCompleted(event._id)}
                              title="Mark Event as NOT Completed - Allow Editing"
                            >
                              <span>🔄 Revert</span>
                            </button>
                          )}
                          
                          <button
                            className="action-button delete-button"
                            onClick={() => handleDelete(event._id)}
                            title="Delete Event"
                          >
                            <FaTrash className="button-icon" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </LoadingOptimizer>
  );
}

export default AdminManageEventsPage;
