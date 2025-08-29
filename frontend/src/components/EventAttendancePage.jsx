import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, joinEvent, timeIn, timeOut, getPublicSettings, generateReport } from '../api/api';
import Swal from 'sweetalert2';
import { FaSearch, FaCalendar, FaClock, FaUsers, FaMapMarkerAlt, FaSpinner, FaExclamationTriangle, FaFilter, FaEye, FaDownload } from 'react-icons/fa';
import { formatTimeRange12Hour } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import './EventAttendancePage.css';

const EventAttendancePage = memo(() => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const role = localStorage.getItem('role');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // PDF Filter options
  const [pdfFilters, setPdfFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    location: '',
    department: ''
  });
  
  // Available options for filters
  const [filterOptions, setFilterOptions] = useState({
    departments: []
  });

  // Helper to determine event status
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

  // Refresh events and joined events
  const refreshEvents = useCallback(async () => {
    console.log('EventAttendancePage: refreshEvents called');
    console.log('EventAttendancePage: Current state before refresh:', { 
      eventsCount: events.length,
      loading,
      error 
    });
    
    setLoading(true);
    try {
      console.log('EventAttendancePage: Fetching events and settings...');
      const [eventsData, settingsData] = await Promise.all([
        getEvents(),
        getPublicSettings()
      ]);
      
      console.log('EventAttendancePage: Received data:', { 
        eventsCount: eventsData.length,
        settingsData: !!settingsData 
      });
      
      setEvents(eventsData);
      
      // Set filter options
      setFilterOptions({
        departments: settingsData.departments?.filter(d => d.isActive).map(d => d.name) || []
      });
      
      if (role === 'Student' && user && user._id) {
        const joined = eventsData
          .filter(event =>
            event.attendance &&
            event.attendance.some(a => a.userId === user._id || (a.userId && a.userId._id === user._id))
          )
          .map(event => event._id);
        setJoinedEvents(joined);
        console.log('EventAttendancePage: Updated joined events:', joined);
      }
      
      console.log('EventAttendancePage: Refresh completed successfully');
    } catch (err) {
      console.error('EventAttendancePage: Error refreshing events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [role, user._id]);

  useEffect(() => {
    console.log('EventAttendancePage: useEffect triggered, role:', role);
    refreshEvents();
    // eslint-disable-next-line
  }, [role, refreshEvents]);

  const handleFilterChange = useCallback((field, value) => {
    setPdfFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const handleFilterSelect = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  const handleJoin = useCallback(async (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (!event) return;

    const eventDate = new Date(event.date);
    const eventTime = formatTimeRange12Hour(event.startTime, event.endTime);
    const eventDateTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
    const now = new Date();

    const result = await Swal.fire({
      title: 'Confirm Registration',
      html: `
        <div style="text-align: left;">
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${eventDate.toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${formatTimeRange12Hour(event.startTime, event.endTime)}</p>
          <p><strong>Location:</strong> ${event.location || 'TBD'}</p>
          <p><strong>Service Hours:</strong> ${event.hours} hours</p>
          <br>
          <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Important Reminders:</strong></p>
            <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #856404;">
              <li>Don't time in if the event hasn't started yet</li>
              <li>Make sure to time out when you leave</li>
            </ul>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Register',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      width: '500px'
    });

    if (!result.isConfirmed) return;

    try {
      await joinEvent(eventId);
      await refreshEvents();
      Swal.fire({ 
        icon: 'success', 
        title: 'Registration Successful!', 
        text: 'You have successfully registered for the event. Please remember to time in when the event starts and time out when you leave.' 
      });
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Registration Failed', 
        text: 'Failed to register for event. Please try again.' 
      });
    }
  }, [events, refreshEvents]);

  const handleTimeIn = useCallback(async (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (!event) return;

    const eventDate = new Date(event.date);
    const eventTime = formatTimeRange12Hour(event.startTime, event.endTime);
    const eventDateTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
    const now = new Date();

    // Check if event has started
    if (eventDateTime > now) {
      Swal.fire({
        icon: 'warning',
        title: 'Event Not Started',
        text: 'This event has not started yet. Please wait until the event begins before timing in.',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Time In',
      text: 'Do you want to record your Time In for this event?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Time In',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    });
    
    if (!result.isConfirmed) return;

    try {
      const response = await timeIn(eventId);
      if (response.message === 'Time in recorded successfully.') {
        await refreshEvents();
        Swal.fire({
          icon: 'success',
          title: 'Time In Recorded!',
          text: 'Your time in has been successfully recorded.'
        });
      }
    } catch (err) {
      console.error('Time In error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Time In Failed',
        text: err.message || 'Failed to record Time In. Please try again.'
      });
    }
  }, [events, refreshEvents]);

  const handleTimeOut = useCallback(async (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (!event) return;

    const att = event.attendance?.find(a => a.userId === user._id);

    // Check if Time In has been recorded before Time Out
    if (!att || !att.timeIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Time In First',
        text: 'You must time in before you can time out.',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Time Out',
      text: 'Do you want to record your Time Out for this event?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Time Out',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });
    
    if (!result.isConfirmed) return;

    try {
      const response = await timeOut(eventId);
      if (response.message === 'Time out recorded successfully.') {
        await refreshEvents();
        Swal.fire({
          icon: 'success',
          title: 'Time Out Recorded!',
          text: 'Your time out has been successfully recorded.'
        });
      }
    } catch (err) {
      console.error('Time Out error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Time Out Failed',
        text: err.message || 'Failed to record Time Out. Please try again.'
      });
    }
  }, [events, user._id, refreshEvents]);

  // PDF Download Handler (Admin/Staff only)
  const handleDownloadPDF = useCallback(async () => {
    try {
      // Build query parameters for PDF generation
      const params = {};
      
      if (pdfFilters.status) params.status = pdfFilters.status;
      if (pdfFilters.dateFrom) params.dateFrom = pdfFilters.dateFrom;
      if (pdfFilters.dateTo) params.dateTo = pdfFilters.dateTo;
      if (pdfFilters.location) params.location = pdfFilters.location;
      if (pdfFilters.department) params.department = pdfFilters.department;
      
      // Use the generateReport API function
      await generateReport('event-list', params);
      
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded',
        text: 'Event list PDF has been downloaded successfully!'
      });
    } catch (err) {
      console.error('PDF download error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: `Could not download PDF: ${err.message}`
      });
    }
  }, [pdfFilters]);

  // Filter events by status, search, and department restrictions
  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase()) ||
      (event.location && event.location.toLowerCase().includes(search.toLowerCase()));
    
    // Status filter
    const status = getEventStatus(event);
    const matchesStatus = filter === 'all' || filter === status;
    
    // Department restriction filter (only for students)
    let matchesDepartment = true;
    if (role === 'Student') {
      const userDepartment = user.department;
      console.log(`🔍 Department check for event "${event.title}":`, {
        userDepartment,
        eventDepartment: event.department,
        eventDepartments: event.departments,
        isForAllDepartments: event.isForAllDepartments
      });
      
      if (event.isForAllDepartments) {
        matchesDepartment = true; // All departments can access
        console.log(`✅ Event "${event.title}" is for all departments`);
      } else if (event.departments && event.departments.length > 0) {
        // Check if user's department is in the allowed departments array
        matchesDepartment = event.departments.includes(userDepartment);
        console.log(`🔍 Event "${event.title}" departments: ${event.departments.join(', ')}, User: ${userDepartment}, Match: ${matchesDepartment}`);
      } else if (event.department) {
        // Check if user's department matches the single department
        matchesDepartment = event.department === userDepartment;
        console.log(`🔍 Event "${event.title}" department: ${event.department}, User: ${userDepartment}, Match: ${matchesDepartment}`);
      } else {
        matchesDepartment = true; // No department restriction
        console.log(`✅ Event "${event.title}" has no department restriction`);
      }
    }
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Loading state
  if (loading) {
    return (
      <div className="event-list-container">
        <div className="loading-section">
          <FaSpinner className="loading-spinner" />
          <h3>Loading Events...</h3>
          <p>Please wait while we fetch the latest events</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="event-list-container">
        <div className="error-section">
          <FaExclamationTriangle className="error-icon" />
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={refreshEvents}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-list-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Community Events</h1>
          <p>Discover meaningful opportunities to serve your community and make a difference</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search events by title, description, or location..."
            value={search}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <select 
            value={filter} 
            onChange={e => handleFilterSelect(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="past">Past</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Download PDF Button for Admin/Staff */}
      {(role === 'Admin' || role === 'Staff') && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 0' }}>
          <button
            className="action-btn info-btn"
            onClick={handleDownloadPDF}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <FaDownload style={{ marginRight: 4 }} />
            Download Event List PDF
          </button>
        </div>
      )}
      
      {/* PDF Filter Options for Admin/Staff */}
      {(role === 'Admin' || role === 'Staff') && (
        <div className="pdf-filters-section" style={{ margin: '16px 0', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h6 style={{ marginBottom: '12px', color: '#495057' }}>PDF Filter Options:</h6>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Status:</label>
              <select
                value={pdfFilters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Date From:</label>
              <input
                type="date"
                value={pdfFilters.dateFrom}
                onChange={e => handleFilterChange('dateFrom', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Date To:</label>
              <input
                type="date"
                value={pdfFilters.dateTo}
                onChange={e => handleFilterChange('dateTo', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Location:</label>
              <input
                type="text"
                placeholder="Enter location..."
                value={pdfFilters.location}
                onChange={e => handleFilterChange('location', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Department:</label>
              <select
                value={pdfFilters.department}
                onChange={e => handleFilterChange('department', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">All Departments</option>
                {filterOptions.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div className="events-section">
        {filteredEvents.length === 0 ? (
          <div className="no-events">
            <div className="no-events-icon">📅</div>
            <h3>No Events Found</h3>
            <p>No events match your current search criteria.</p>
            <p>Try adjusting your search or filter options.</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => {
              const att = event.attendance?.find(a => (a.userId === user._id || (a.userId && a.userId._id === user._id)));
              const status = getEventStatus(event);
              const isJoined = joinedEvents.includes(event._id);

              // Calculate available slots and status
              const maxParticipants = typeof event.maxParticipants === 'number' ? event.maxParticipants : 0;
              const attendanceCount = Array.isArray(event.attendance) ? event.attendance.length : 0;
              const availableSlots = maxParticipants > 0 ? maxParticipants - attendanceCount : 0;
              
              // Check if event is available for registration (not completed, has slots, time hasn't passed, and event has started)
              const now = new Date();
              const eventDate = new Date(event.date);
              const eventStartTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
              const eventEndTime = new Date(`${eventDate.toDateString()} ${event.endTime || '23:59'}`);
              const isTimeExpired = eventEndTime < now;
              const hasNotStarted = eventStartTime > now;
              const hasAvailableSlots = maxParticipants === 0 || availableSlots > 0;
              const eventStatus = getEventStatus(event);
              const isAvailable = eventStatus !== 'completed' && event.status !== 'Completed' && hasAvailableSlots && !isTimeExpired && !hasNotStarted;

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
                        <span className={`status-badge ${getStatusColor(eventStatus)}`}>
                          {eventStatus.charAt(0).toUpperCase() + eventStatus.slice(1)}
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
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="meta-item">
                        <FaClock className="meta-icon" />
                                                  <span>{formatTimeRange12Hour(event.startTime, event.endTime)}</span>
                      </div>
                      <div className="meta-item">
                        <FaMapMarkerAlt className="meta-icon" />
                        <span>{event.location || 'TBD'}</span>
                      </div>
                      <div className="meta-item">
                        <FaUsers className="meta-icon" />
                        <span>
                          {availableSlots > 0 ? `${availableSlots} slots` : 'No slots available'}
                        </span>
                      </div>
                    </div>

                    <p className="event-description">{event.description}</p>
                    
                    {/* Department Access Indicator */}
                    <div className="department-access">
                      <strong>Available for: </strong>
                      {event.isForAllDepartments ? (
                        <span className="all-departments">All Departments</span>
                      ) : event.departments && event.departments.length > 0 ? (
                        <span className="specific-departments">
                          {event.departments.join(', ')}
                        </span>
                      ) : event.department ? (
                        <span className="single-department">{event.department}</span>
                      ) : (
                        <span className="no-department">No restrictions</span>
                      )}
                    </div>

                    <div className="event-hours">
                      <strong>Service Hours: {event.hours} hours</strong>
                    </div>

                    {/* Event Actions */}
                    <div className="event-actions">
                      {role === 'Student' && !isJoined && (
                        <>
                          {isAvailable ? (
                            <button 
                              className="action-btn primary-btn"
                              onClick={() => handleJoin(event._id)}
                            >
                              Register for Event
                            </button>
                          ) : (
                            <div className="event-unavailable">
                              {eventStatus === 'completed' ? (
                                <span className="unavailable-reason">Event Completed - Time Has Passed</span>
                              ) : event.status === 'Completed' ? (
                                <span className="unavailable-reason">Event Manually Completed</span>
                              ) : hasNotStarted ? (
                                <span className="unavailable-reason">Registration Not Open - Event Hasn't Started Yet</span>
                              ) : isTimeExpired ? (
                                <span className="unavailable-reason">Registration Closed - Event Time Has Passed</span>
                              ) : (
                                <span className="unavailable-reason">No Available Slots</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      
                      {role === 'Student' && isJoined && (
                        <div className="student-actions">
                          <div className="time-buttons">
                            <button 
                              className={`action-btn ${att && att.timeIn ? 'success-btn disabled' : 'warning-btn'}`}
                              onClick={() => handleTimeIn(event._id)} 
                              disabled={att && att.timeIn}
                            >
                              {att && att.timeIn ? '✓ Time In Recorded' : 'Time In'}
                            </button>
                            
                            <button 
                              className={`action-btn ${att && att.timeOut ? 'success-btn disabled' : 'info-btn'}`}
                              onClick={() => handleTimeOut(event._id)} 
                              disabled={att && !att.timeIn || (att && att.timeOut)}
                            >
                              {att && att.timeOut ? '✓ Time Out Recorded' : 'Time Out'}
                            </button>
                          </div>

                          {/* Time Display */}
                          {(att && (att.timeIn || att.timeOut)) && (
                            <div className="time-display">
                              {att.timeIn && (
                                <div className="time-item">
                                  <span className="time-label">Time In:</span>
                                  <span className="time-value">
                                    {new Date(att.timeIn).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {att.timeOut && (
                                <div className="time-item">
                                  <span className="time-label">Time Out:</span>
                                  <span className="time-value">
                                    {new Date(att.timeOut).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {(role === 'Admin' || role === 'Staff') && (
                        <button 
                          className="action-btn info-btn"
                          onClick={() => navigate(`/events/${event._id}`)}
                        >
                          <FaEye /> View Participants
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default EventAttendancePage;
