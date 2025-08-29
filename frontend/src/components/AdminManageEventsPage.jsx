// frontend/src/components/AdminManageEventsPage.jsx
// Simple but Creative Manage Events Page Design

import React, { useEffect, useState } from 'react';
import { getEvents, deleteEvent, getAllEventAttachments, toggleEventVisibility, markEventAsCompleted, markEventAsNotCompleted } from '../api/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaCalendar, FaClock, FaUsers, FaMapMarkerAlt, FaEdit, FaEye, FaTrash, FaPlus, FaSpinner, FaEyeSlash, FaShare } from 'react-icons/fa';
import { formatTimeRange12Hour } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import './AdminManageEventsPage.css';

function AdminManageEventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view this page.');
        setLoading(false);
        return;
      }

      // Check user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user.role || localStorage.getItem('role');
      
      if (!role || (role !== 'Admin' && role !== 'Staff')) {
        setError(`Access denied. This page requires Admin or Staff role. Your current role is: ${role || 'Unknown'}`);
        setLoading(false);
        return;
      }

      const data = await getEvents();
      setEvents(data);
      setError('');
    } catch (err) {
      console.error('Error fetching events:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response?.status === 403) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = user.role || localStorage.getItem('role');
        setError(`Access denied. This page requires Admin or Staff role. Your current role is: ${role || 'Unknown'}`);
      } else {
        setError('Failed to fetch events. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the event.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    try {
      await deleteEvent(eventId);
      Swal.fire({ icon: 'success', title: 'Deleted', text: 'Event deleted.' });
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      if (err.response?.status === 401) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Your session has expired. Please log in again.' });
      } else if (err.response?.status === 403) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Access denied. This action requires Admin or Staff role.' });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete event.' });
      }
    }
  };

  const handleToggleVisibility = async (eventId, currentVisibility) => {
    const action = currentVisibility ? 'disable' : 'enable';
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `This will ${action} the event for students. ${currentVisibility ? 'Students will no longer see the "Register" button for this event.' : 'Students will be able to register for this event.'}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: currentVisibility ? 'Disable' : 'Enable',
      cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) return;

    try {
      await toggleEventVisibility(eventId, !currentVisibility);
      Swal.fire({ 
        icon: 'success', 
        title: 'Success', 
        text: `Event ${action}d successfully.` 
      });
      fetchEvents();
    } catch (err) {
      console.error('Error toggling event visibility:', err);
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message || 'Failed to update event visibility.' 
      });
    }
  };

  // Handle marking event as completed
  const handleMarkAsCompleted = async (eventId) => {
    const result = await Swal.fire({
      title: 'Mark Event as Completed?',
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
          <p style="color: #dc2626; font-weight: 600;">Are you sure you want to continue?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mark as Completed',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745'
    });
    
    if (!result.isConfirmed) return;

    try {
      await markEventAsCompleted(eventId);
      Swal.fire({ 
        icon: 'success', 
        title: 'Event Completed!', 
        html: `
          <div style="text-align: left;">
            <p>✅ The event has been marked as completed!</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>📊 Now appears in the completed filter</li>
              <li>📖 Event is now read-only (no editing)</li>
              <li>👥 Hidden from student view</li>
            </ul>
          </div>
        `,
        confirmButtonColor: '#28a745'
      });
      fetchEvents();
    } catch (err) {
      console.error('Error marking event as completed:', err);
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message || 'Failed to mark event as completed.' 
      });
    }
  };

  // Handle marking event as NOT completed (revert to editable)
  const handleMarkAsNotCompleted = async (eventId) => {
    const result = await Swal.fire({
      title: 'Mark Event as NOT Completed?',
      html: `
        <div style="text-align: left;">
          <p>This will revert the event to editable status and:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>🔄 Move it back to upcoming/past filter</li>
            <li>✏️ Make it editable again</li>
            <li>👥 Show it to students (they can register)</li>
            <li>⚠️ This will allow students to join again</li>
          </ul>
          <p style="color: #2563eb; font-weight: 600;">Are you sure you want to continue?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mark as NOT Completed',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb'
    });
    
    if (!result.isConfirmed) return;

    try {
      await markEventAsNotCompleted(eventId);
      Swal.fire({ 
        icon: 'success', 
        title: 'Event Reverted!', 
        html: `
          <div style="text-align: left;">
            <p>🔄 The event has been marked as NOT completed!</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>📊 Now appears in upcoming/past filter</li>
              <li>✏️ Event is now editable again</li>
              <li>👥 Visible to students (can register)</li>
            </ul>
          </div>
        `,
        confirmButtonColor: '#2563eb'
      });
      fetchEvents();
    } catch (err) {
      console.error('Error marking event as NOT completed:', err);
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message || 'Failed to mark event as NOT completed.' 
      });
    }
  };

  const handleShareEvent = (event) => {
    // Check if event has public registration enabled
    if (!event.isPublicRegistrationEnabled || !event.publicRegistrationToken) {
      Swal.fire({
        icon: 'warning',
        title: 'Public Registration Not Enabled',
        text: 'Please enable public registration for this event first to generate a shareable link.',
        confirmButtonText: 'OK'
      });
      return;
    }

    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    const registrationUrl = `${frontendUrl}/events/register/${event.publicRegistrationToken}`;
    const eventUrl = `${frontendUrl}/events/${event._id}`;
    const eventTitle = event.title;
    const eventDate = new Date(event.date).toLocaleDateString();
    const eventTime = formatTimeRange12Hour(event.startTime, event.endTime);
    const eventLocation = event.location;

    Swal.fire({
      title: 'Share Event',
      html: `
        <div style="text-align: left; max-width: 500px;">
          <h4 style="color: #2c3e50; margin-bottom: 15px;">${eventTitle}</h4>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0; color: #495057;">
              <strong>📅 Date:</strong> ${eventDate}
            </p>
            <p style="margin: 5px 0; color: #495057;">
              <strong>🕐 Time:</strong> ${eventTime}
            </p>
            <p style="margin: 5px 0; color: #495057;">
              <strong>📍 Location:</strong> ${eventLocation}
            </p>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; color: #1565c0; font-weight: 600;">
              🔗 Event Link (Public View):
            </p>
            <code style="background: white; padding: 8px; border-radius: 4px; font-size: 12px; word-break: break-all; display: block; color: #333;">
              ${eventUrl}
            </code>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
            <p style="margin: 0 0 10px 0; color: #2e7d32; font-weight: 600;">
              📋 Registration Link:
            </p>
            <code style="background: white; padding: 8px; border-radius: 4px; font-size: 12px; word-break: break-all; display: block; color: #333;">
              ${registrationUrl}
            </code>
          </div>
        </div>
      `,
      confirmButtonText: '📋 Copy Registration Link',
      showCancelButton: true,
      cancelButtonText: '🔗 Copy Event Link',
      width: '600px',
      customClass: {
        popup: 'share-event-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Copy registration link to clipboard
        navigator.clipboard.writeText(registrationUrl);
        Swal.fire({
          icon: 'success',
          title: 'Registration Link Copied!',
          text: 'Registration link copied to clipboard',
          timer: 2000,
          showConfirmButton: false
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Copy event link to clipboard
        navigator.clipboard.writeText(eventUrl);
        Swal.fire({
          icon: 'success',
          title: 'Event Link Copied!',
          text: 'Event link copied to clipboard',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const handleViewAttachments = async (eventId) => {
    try {
      const attachmentsData = await getAllEventAttachments(eventId);
      
      if (!attachmentsData.attachments || attachmentsData.attachments.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Attachments',
          text: 'No students have submitted attachments for this event yet.'
        });
        return;
      }

      // Create a detailed view of all attachments
      let attachmentsHtml = `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
          <h4 style="color: #2c3e50; margin-bottom: 15px;">${attachmentsData.eventTitle}</h4>
          <p style="color: #7f8c8d; margin-bottom: 20px;">Total Attachments: ${attachmentsData.totalAttachments}</p>
      `;

      attachmentsData.attachments.forEach((attachment, index) => {
        const student = attachment.userId;
        attachmentsHtml += `
          <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #f8f9fa;">
            <h5 style="color: #495057; margin: 0 0 10px 0;">${index + 1}. ${student.name}</h5>
            <p style="color: #6c757d; margin: 5px 0; font-size: 14px;">
              <strong>Department:</strong> ${student.department} • <strong>Year:</strong> ${student.year} • <strong>Section:</strong> ${student.section}
            </p>
            <p style="color: #6c757d; margin: 5px 0; font-size: 14px;">
              <strong>Status:</strong> ${attachment.status} • <strong>Approved:</strong> ${attachment.registrationApproved ? 'Yes' : 'No'}
            </p>
        `;

        if (attachment.attachment && attachment.attachment.trim() !== '') {
          attachmentsHtml += `
            <div style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; border-left: 4px solid #28a745;">
              <strong style="color: #495057;">Attachment:</strong>
              <p style="margin: 5px 0 0 0; color: #212529;">📎 ${attachment.attachment}</p>
            </div>
          `;
        }

        attachmentsHtml += `
            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 12px;">
              <strong>Uploaded:</strong> ${new Date(attachment.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        `;
      });

      attachmentsHtml += '</div>';

      Swal.fire({
        title: 'Student Attachments',
        html: attachmentsHtml,
        width: '800px',
        confirmButtonText: 'Close',
        showCloseButton: true
      });

    } catch (err) {
      console.error('Error fetching attachments:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch student attachments. Please try again.'
      });
    }
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
  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = (event.title && event.title.toLowerCase().includes(search.toLowerCase())) ||
                         (event.description && event.description.toLowerCase().includes(search.toLowerCase()));
    
    // Status filter
    const matchesStatus = !statusFilter || getEventStatus(event) === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="manage-events-page">
      <div className="loading-section">
        <FaSpinner className="loading-spinner" />
        <h3>Loading Events...</h3>
        <p>Please wait while we fetch the events data</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="manage-events-page">
      <div className="error-section">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchEvents} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
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
              <span className="stat-number">{events.filter(e => getEventStatus(e) === 'upcoming').length}</span>
              <span className="stat-label">🚀 Upcoming</span>
            </div>

            <div className="stat-item">
              <span className="stat-number">{events.filter(e => getEventStatus(e) === 'ongoing').length}</span>
              <span className="stat-label">🔄 Ongoing</span>
            </div>

            <div className="stat-item">
              <span className="stat-number">{events.filter(e => getEventStatus(e) === 'past').length}</span>
              <span className="stat-label">⏰ Past</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{events.filter(e => getEventStatus(e) === 'completed').length}</span>
              <span className="stat-label">✅ Completed</span>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-section">
          {filteredEvents.length === 0 ? (
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
                <h3>Events ({filteredEvents.length} of {events.length})</h3>
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
                  const approvedAttendanceCount = Array.isArray(event.attendance) ? 
                    event.attendance.filter(a => a.registrationApproved === true).length : 0;

                  const totalAttendanceCount = Array.isArray(event.attendance) ? event.attendance.length : 0;
                  const availableSlots = maxParticipants > 0 ? maxParticipants - approvedAttendanceCount : 'Unlimited';

                  return (
                    <div key={event._id} className="event-card">
                      {/* Event Image */}
                      {event.image && (
                        <div className="event-image-wrapper">
                          <img
                            src={getEventImageUrl(event.image)}
                            alt={event.title}
                            className="event-image"
                          />
                          <div className="event-status">
                            <span className={`status-badge ${getStatusColor(status)}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                        </div>
                      )}

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

                          {/* Show registration link if public registration is enabled */}
                          {event.isPublicRegistrationEnabled && event.publicRegistrationToken && (
                            <div className="detail-item registration-link">
                              <span className="detail-label">Registration Link:</span>
                              <div className="link-container">
                                <code className="registration-url">
                                  {`${window.location.origin}/events/register/${event.publicRegistrationToken}`}
                                </code>
                                <button
                                  className="copy-link-btn"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/events/register/${event.publicRegistrationToken}`);
                                    Swal.fire({
                                      icon: 'success',
                                      title: 'Link Copied!',
                                      text: 'Registration link copied to clipboard',
                                      timer: 2000,
                                      showConfirmButton: false
                                    });
                                  }}
                                  title="Copy registration link"
                                >
                                  📋 Copy
                                </button>
                              </div>
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
  );
}

export default AdminManageEventsPage;