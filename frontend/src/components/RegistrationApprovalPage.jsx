import React, { useState, useEffect, useCallback } from 'react';
import { getEvents, getAllEventRegistrations, approveRegistration, disapproveRegistration } from '../api/api';
import Swal from 'sweetalert2';
import { FaSpinner, FaEye, FaArrowLeft, FaFilter, FaMapMarkerAlt, FaUsers, FaClock, FaBuilding, FaUserGraduate, FaCheck, FaTimes, FaChartBar, FaCalendarAlt, FaUserCheck, FaUserTimes, FaSearch, FaSync } from 'react-icons/fa';
import { safeFilter, safeLength, safeMap } from '../utils/arrayUtils';
import { formatDateTimePhilippines, formatDatePhilippines } from '../utils/timeUtils';
import './RegistrationApprovalPage.css';

function RegistrationApprovalPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredRegistrations, setFilteredRegistrations] = useState(null);
  const [viewMode, setViewMode] = useState('events'); // 'events' or 'registrations'
  const [actionLoading, setActionLoading] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  // Check user role
  const userRole = localStorage.getItem('role');
  const isAuthorized = userRole === 'Admin' || userRole === 'Staff';

  // Registration disapproval reasons
  const registrationDisapprovalReasons = [
    'Full Slot for Event',
    'Did not meet event requirements',
    'Late registration (event already started)',
    'Incomplete registration information',
    'Duplicate registration',
    'Not eligible for this event',
    'Event cancelled or rescheduled',
    'Other'
  ];

  const filterEvents = useCallback(() => {
    if (!eventSearchTerm.trim()) {
      setFilteredEvents(events);
      return;
    }

    const searchLower = eventSearchTerm.toLowerCase();
    const filtered = safeFilter(events, event => 
      event.title.toLowerCase().includes(searchLower) ||
      (event.location && event.location.toLowerCase().includes(searchLower)) ||
      event.date.toLowerCase().includes(searchLower) ||
      safeLength(event.attendance).toString().includes(searchLower)
    );
    setFilteredEvents(filtered);
  }, [eventSearchTerm, events]);

  const filterRegistrations = useCallback(() => {
    if (!eventRegistrations) {
      setFilteredRegistrations(null);
      return;
    }

    if (!studentSearchTerm.trim()) {
      setFilteredRegistrations(eventRegistrations);
      return;
    }

    const searchLower = studentSearchTerm.toLowerCase();
    const filterRegistrationArray = (registrations) => {
      return safeFilter(registrations, registration => 
        registration.userId.name.toLowerCase().includes(searchLower) ||
        (registration.userId.email && registration.userId.email.toLowerCase().includes(searchLower)) ||
        (registration.userId.userId && registration.userId.userId.toLowerCase().includes(searchLower)) ||
        (registration.userId.department && registration.userId.department.toLowerCase().includes(searchLower))
      );
    };

    const filtered = {
      ...eventRegistrations,
      registrations: {
        pending: filterRegistrationArray(eventRegistrations.registrations?.pending || []),
        approved: filterRegistrationArray(eventRegistrations.registrations?.approved || []),
        disapproved: filterRegistrationArray(eventRegistrations.registrations?.disapproved || [])
      }
    };

    setFilteredRegistrations(filtered);
  }, [studentSearchTerm, eventRegistrations]);

  useEffect(() => {
    setIsVisible(true);
    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      loadEvents();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  useEffect(() => {
    filterRegistrations();
  }, [filterRegistrations]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading events...');
      const eventsData = await getEvents();
      console.log('✅ Events loaded successfully:', eventsData.length, 'events');
      setEvents(eventsData);
      setFilteredEvents(eventsData);
    } catch (error) {
      console.error('❌ Error loading events:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      Swal.fire('Error', 'Failed to load events. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEventRegistrations = async (eventId) => {
    try {
      setLoadingRegistrations(true);
      console.log('🔄 Loading registrations for event:', eventId);
      const registrationsData = await getAllEventRegistrations(eventId);
      console.log('✅ Registrations loaded successfully:', registrationsData);
      setEventRegistrations(registrationsData);
      setFilteredRegistrations(registrationsData);
      setSelectedEvent(events.find(e => e._id === eventId));
      setViewMode('registrations');
    } catch (error) {
      console.error('❌ Error loading registrations:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      Swal.fire('Error', 'Failed to load registrations. Please try again.', 'error');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleApproveRegistration = async (eventId, userId, studentName) => {
    const result = await Swal.fire({
      title: 'Approve Registration',
      text: `Are you sure you want to approve ${studentName}'s registration?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745'
    });

    if (result.isConfirmed) {
      setActionLoading(prev => ({ ...prev, [`approve_${userId}`]: true }));
      try {
        console.log('🔄 Approving registration for user:', userId, 'event:', eventId);
        await approveRegistration(eventId, userId);
        console.log('✅ Registration approved successfully');
        Swal.fire({
          title: 'Registration Approved!',
          text: 'The student can now access the event chat.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });
        // Reload registrations
        loadEventRegistrations(eventId);
      } catch (error) {
        console.error('❌ Error approving registration:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        Swal.fire('Error', error.message || 'Failed to approve registration.', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [`approve_${userId}`]: false }));
      }
    }
  };

  const handleDisapproveRegistration = async (eventId, userId, studentName) => {
    // Show dropdown for disapproval reason
    const { value: reasonData } = await Swal.fire({
      title: 'Disapprove Registration',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px;">Please select a reason for disapproving ${studentName}'s registration:</p>
          <select id="disapproval-reason" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            <option value="">Select a reason...</option>
            ${registrationDisapprovalReasons.map((reason, index) => `<option value="${index}">${reason}</option>`).join('')}
          </select>
          <div id="other-reason-container" style="display: none; margin-top: 10px;">
            <label for="other-reason" style="display: block; margin-bottom: 5px; font-weight: 500;">Please specify other reason:</label>
            <textarea id="other-reason" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; min-height: 80px;" placeholder="Enter your specific reason here..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Disapprove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      preConfirm: () => {
        const selectedReason = document.getElementById('disapproval-reason').value;
        const otherReason = document.getElementById('other-reason').value;
        
        if (!selectedReason) {
          Swal.showValidationMessage('Please select a reason for disapproval');
          return false;
        }
        
        if (selectedReason === '7' && !otherReason.trim()) { // "Other" is index 7
          Swal.showValidationMessage('Please specify the other reason');
          return false;
        }
        
        return {
          reason: selectedReason === '7' ? otherReason.trim() : registrationDisapprovalReasons[selectedReason],
          selectedReason: selectedReason
        };
      },
      didOpen: () => {
        const reasonSelect = document.getElementById('disapproval-reason');
        const otherContainer = document.getElementById('other-reason-container');
        
        reasonSelect.addEventListener('change', (e) => {
          if (e.target.value === '7') { // "Other" is index 7
            otherContainer.style.display = 'block';
          } else {
            otherContainer.style.display = 'none';
          }
        });
      }
    });

    if (reasonData) {
      setActionLoading(prev => ({ ...prev, [`disapprove_${userId}`]: true }));
      try {
        await disapproveRegistration(eventId, userId, reasonData.reason);
        Swal.fire('Success', 'Registration disapproved successfully!', 'success');
        // Reload registrations
        loadEventRegistrations(eventId);
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to disapprove registration.', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [`disapprove_${userId}`]: false }));
      }
    }
  };

  const RegistrationCard = ({ registration, event, type }) => {
    const { userId } = registration;

    return (
      <div className={`registration-card ${type}`}>
        <div className="registration-header">
          <div className="student-info">
            <div className="student-name">{userId.name}</div>
            <div className="student-details">
              <span className="detail-item">
                <FaBuilding className="detail-icon" />
                {userId.department}
              </span>
              <span className="detail-item">
                <FaUserGraduate className="detail-icon" />
                {userId.academicYear}
              </span>
            </div>
          </div>
          <div className="registration-status">
            <span className={`status-badge ${type}`}>
              {type === 'pending' && '⏳ Pending'}
              {type === 'approved' && '✅ Approved'}
              {type === 'disapproved' && '❌ Disapproved'}
            </span>
          </div>
        </div>

        <div className="registration-content">
          <div className="registration-meta">
            <div className="meta-item">
              <span className="meta-label">Registered:</span>
              <span className="meta-value">
                {formatDateTimePhilippines(registration.registeredAt)}
              </span>
            </div>
            {type === 'approved' && (
              <>
                <div className="meta-item">
                  <span className="meta-label">Approved:</span>
                  <span className="meta-value">
                    {formatDateTimePhilippines(registration.registrationApprovedAt)}
                  </span>
                </div>
                {registration.timeIn && (
                  <div className="meta-item">
                    <span className="meta-label">Time In:</span>
                    <span className="meta-value">
                      {formatDateTimePhilippines(registration.timeIn)}
                    </span>
                  </div>
                )}
                {registration.timeOut && (
                  <div className="meta-item">
                    <span className="meta-label">Time Out:</span>
                    <span className="meta-value">
                      {formatDateTimePhilippines(registration.timeOut)}
                    </span>
                  </div>
                )}
              </>
            )}
            {type === 'disapproved' && registration.reason && (
              <div className="meta-item full-width">
                <span className="meta-label">Reason:</span>
                <span className="meta-value reason">{registration.reason}</span>
              </div>
            )}
          </div>
        </div>

        <div className="registration-actions">
          <div className="action-buttons">
          {type === 'pending' && (
            <>
              <button 
                className="approve-btn"
                onClick={() => handleApproveRegistration(event._id, userId._id, userId.name)}
                disabled={actionLoading[`approve_${userId._id}`]}
              >
                <FaCheck />
                <span>{actionLoading[`approve_${userId._id}`] ? 'Approving...' : 'Approve'}</span>
              </button>
              <button 
                className="disapprove-btn"
                onClick={() => handleDisapproveRegistration(event._id, userId._id, userId.name)}
                disabled={actionLoading[`disapprove_${userId._id}`]}
              >
                <FaTimes />
                <span>{actionLoading[`disapprove_${userId._id}`] ? 'Disapproving...' : 'Disapprove'}</span>
              </button>
            </>
          )}
          {type === 'approved' && (
            <>
              <span className="approved-note">✅ Registration approved</span>
              <button 
                className="disapprove-btn"
                onClick={() => handleDisapproveRegistration(event._id, userId._id, userId.name)}
                disabled={actionLoading[`disapprove_${userId._id}`]}
              >
                <FaTimes />
                <span>{actionLoading[`disapprove_${userId._id}`] ? 'Disapproving...' : 'Disapprove'}</span>
              </button>
            </>
          )}
          {type === 'disapproved' && (
            <>
              <span className="disapproved-note">❌ Registration disapproved</span>
              <button 
                className="approve-btn"
                onClick={() => handleApproveRegistration(event._id, userId._id, userId.name)}
                disabled={actionLoading[`approve_${userId._id}`]}
              >
                <FaCheck />
                <span>{actionLoading[`approve_${userId._id}`] ? 'Approving...' : 'Approve'}</span>
              </button>
            </>
          )}
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthorized) {
    return (
      <div className="registration-approval-page">
        <div className="unauthorized">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="registration-approval-page">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

        return (
          <div className="registration-approval-page">
            <div className="registration-background">
              <div className="background-pattern"></div>
            </div>

            <div className={`registration-container ${isVisible ? 'visible' : ''}`}>
              {/* Modern Analytics Header */}
              <div className="analytics-header">
                <div className="header-content">
                  <div className="header-icon">
                    <FaChartBar className="header-icon-symbol" />
                  </div>
                  <div className="header-text">
                    <h1 className="page-title">Registration Management</h1>
                    <p className="page-subtitle">Review and approve student event registrations with comprehensive analytics</p>
                  </div>
                </div>
                <div className="header-actions">
                </div>
              </div>

      {viewMode === 'events' && (
        <div className="events-section">
          {/* Modern Search and Filter Section */}
          <div className="analytics-search-filter-section">
            <div className="search-filter-grid">
              <div className="search-container">
                <div className="search-input-group">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search events by title, description, or location..."
                    value={eventSearchTerm}
                    onChange={(e) => setEventSearchTerm(e.target.value)}
                    className="modern-search-input"
                  />
                </div>
              </div>

              <div className="filter-container">
                <div className="filter-input-group">
                  <FaFilter className="filter-icon" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="modern-filter-select"
                  >
                    <option value="">All Events</option>
                    <option value="upcoming">🚀 Upcoming Events</option>
                    <option value="ongoing">🔄 Ongoing Events</option>
                    <option value="past">⏰ Past Events</option>
                  </select>
                </div>
              </div>

              <div className="action-container">
                {(eventSearchTerm || statusFilter) && (
                  <button
                    className="clear-filters-btn"
                    onClick={() => {
                      setEventSearchTerm('');
                      setStatusFilter('');
                    }}
                    title="Clear all filters"
                  >
                    <FaSync className="btn-icon" />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Analytics Summary Cards */}
          <div className="analytics-summary-grid">
            <div className="analytics-card">
              <div className="card-header">
                <div className="card-icon">
                  <FaCalendarAlt />
                </div>
                <div className="card-info">
                  <h3>Total Events</h3>
                  <p>All available events</p>
                </div>
              </div>
              <div className="card-value">{filteredEvents.length}</div>
            </div>

            <div className="analytics-card">
              <div className="card-header">
                <div className="card-icon">
                  <FaUsers />
                </div>
                <div className="card-info">
                  <h3>Active Events</h3>
                  <p>Events with registrations</p>
                </div>
              </div>
              <div className="card-value">{filteredEvents.filter(e => safeLength(e.attendance) > 0).length}</div>
            </div>

            <div className="analytics-card">
              <div className="card-header">
                <div className="card-icon">
                  <FaUserCheck />
                </div>
                <div className="card-info">
                  <h3>Total Registrations</h3>
                  <p>All student registrations</p>
                </div>
              </div>
              <div className="card-value">{filteredEvents.reduce((total, e) => total + (e.attendance ? e.attendance.filter(a => 
                a.registrationApproved === true || 
                a.status === 'Approved' || 
                a.status === 'Attended' || 
                a.status === 'Completed' ||
                a.status === 'Pending' ||
                !a.status // Include registrations without status
              ).length : 0), 0)}</div>
            </div>

            <div className="analytics-card">
              <div className="card-header">
                <div className="card-icon">
                  <FaChartBar />
                </div>
                <div className="card-info">
                  <h3>Pending Reviews</h3>
                  <p>Awaiting approval</p>
                </div>
              </div>
              <div className="card-value">
                {filteredEvents.reduce((total, e) => 
                  total + safeLength((e.attendance || []).filter(a => !a.registrationApproved && !a.reason)), 0
                )}
              </div>
            </div>
          </div>

          <div className="events-grid">
            {filteredEvents.length === 0 ? (
              <div className="no-results-container">
                <div className="no-results-icon">
                  <FaSearch />
                </div>
                <h3 className="no-results-title">No Events Found</h3>
                <p className="no-results-message">
                  {eventSearchTerm ? 
                    `No events match your search for "${eventSearchTerm}". Try adjusting your search terms or filters.` :
                    'No events are currently available.'
                  }
                </p>
                {eventSearchTerm && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setEventSearchTerm('')}
                  >
                    <FaSync className="btn-icon" />
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredEvents.map(event => (
                <div key={event._id} className="event-card">
                  <div className="event-card-header">
                    <h3 className="event-title">{event.title}</h3>
                    <span className="event-date-badge">{formatDatePhilippines(event.date)}</span>
                  </div>
                  <div className="event-meta">
                    <div className="meta-item">
                      <FaMapMarkerAlt className="meta-icon" />
                      <span>{event.location}</span>
                    </div>
                    <div className="meta-item">
                      <FaClock className="meta-icon" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  </div>
                  <div className="event-actions">
                    <button
                      className="view-registrations-btn"
                      onClick={() => loadEventRegistrations(event._id)}
                      disabled={loadingRegistrations}
                    >
                      <FaEye className="btn-icon" />
                      {loadingRegistrations ? 'Loading...' : 'View Registrations'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'registrations' && selectedEvent && eventRegistrations && (
        <div className="registrations-section">
          <div className="registrations-header">
            <button 
              className="back-button"
              onClick={() => setViewMode('events')}
            >
              <FaArrowLeft /> Back to Events
            </button>
            <div className="event-title-section">
              <h2>Registrations for "{selectedEvent.title}"</h2>
              <p className="event-subtitle">{formatDatePhilippines(selectedEvent.date)} • {selectedEvent.location}</p>
            </div>
          </div>


          <div className="registrations-search-section">
            <div className="search-container-large">
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="large-search-input"
              />
            </div>
          </div>



          <div className="registrations-grid">
            {(() => {
              const pendingRegistrations = filteredRegistrations?.registrations?.pending || [];
              const approvedRegistrations = filteredRegistrations?.registrations?.approved || [];
              const disapprovedRegistrations = filteredRegistrations?.registrations?.disapproved || [];
              const totalFilteredRegistrations = pendingRegistrations.length + approvedRegistrations.length + disapprovedRegistrations.length;

              if (totalFilteredRegistrations === 0) {
                return (
                  <div className="no-results-container">
                    <div className="no-results-icon">
                      <FaSearch />
                    </div>
                    <h3 className="no-results-title">No Students Found</h3>
                    <p className="no-results-message">
                      {studentSearchTerm ? 
                        `No students match your search for "${studentSearchTerm}". Try adjusting your search terms.` :
                        'No student registrations found for this event.'
                      }
                    </p>
                    {studentSearchTerm && (
                      <button
                        className="clear-search-btn"
                        onClick={() => setStudentSearchTerm('')}
                      >
                        <FaSync className="btn-icon" />
                        Clear Search
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <>
                  {safeMap(pendingRegistrations, registration => (
                    <RegistrationCard
                      key={registration._id}
                      registration={registration}
                      event={selectedEvent}
                      type="pending"
                    />
                  ))}
                  {safeMap(approvedRegistrations, registration => (
                    <RegistrationCard
                      key={registration._id}
                      registration={registration}
                      event={selectedEvent}
                      type="approved"
                    />
                  ))}
                  {safeMap(disapprovedRegistrations, registration => (
                    <RegistrationCard
                      key={registration._id}
                      registration={registration}
                      event={selectedEvent}
                      type="disapproved"
                    />
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default RegistrationApprovalPage;
