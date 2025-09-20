import React, { useState, useEffect, useCallback } from 'react';
import { getEvents, getAllEventRegistrations, approveRegistration, disapproveRegistration } from '../api/api';
import Swal from 'sweetalert2';
import { FaSpinner, FaSearch, FaEye, FaArrowLeft, FaFilter, FaMapMarkerAlt, FaUsers, FaClock, FaBuilding, FaUserGraduate, FaCheck, FaTimes } from 'react-icons/fa';
import { safeFilter, safeLength } from '../utils/arrayUtils';
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
  const [viewMode, setViewMode] = useState('events'); // 'events' or 'registrations'
  const [actionLoading, setActionLoading] = useState({});

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

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await getEvents();
      setEvents(eventsData);
      setFilteredEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      Swal.fire('Error', 'Failed to load events. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEventRegistrations = async (eventId) => {
    try {
      setLoadingRegistrations(true);
      const registrationsData = await getAllEventRegistrations(eventId);
      setEventRegistrations(registrationsData);
      setSelectedEvent(events.find(e => e._id === eventId));
      setViewMode('registrations');
    } catch (error) {
      console.error('Error loading registrations:', error);
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
        await approveRegistration(eventId, userId);
        Swal.fire('Success', 'Registration approved successfully!', 'success');
        // Reload registrations
        loadEventRegistrations(eventId);
      } catch (error) {
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

        <div className="registration-meta">
          <div className="meta-item">
            <span className="meta-label">Registered:</span>
            <span className="meta-value">
              {formatDateTimePhilippines(registration.registeredAt)}
            </span>
          </div>
          {type === 'approved' && (
            <div className="meta-item">
              <span className="meta-label">Approved:</span>
              <span className="meta-value">
                {formatDateTimePhilippines(registration.registrationApprovedAt)}
              </span>
            </div>
          )}
          {type === 'disapproved' && registration.reason && (
            <div className="meta-item full-width">
              <span className="meta-label">Reason:</span>
              <span className="meta-value reason">{registration.reason}</span>
            </div>
          )}
        </div>

        <div className="registration-actions">
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
            <span className="approved-note">✅ Registration approved</span>
          )}
          {type === 'disapproved' && (
            <span className="disapproved-note">❌ Registration disapproved</span>
          )}
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
      <div className="page-header">
        <h1>Event Registration Approval</h1>
        <p>Review and approve student event registrations</p>
      </div>

      {viewMode === 'events' && (
        <div className="events-section">
          <div className="search-filters">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search events..."
                value={eventSearchTerm}
                onChange={(e) => setEventSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="events-grid">
            {filteredEvents.map(event => (
              <div key={event._id} className="event-card">
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <span className="event-date">{formatDatePhilippines(event.date)}</span>
                </div>
                <div className="event-details">
                  <div className="detail-row">
                    <FaMapMarkerAlt className="detail-icon" />
                    <span>{event.location}</span>
                  </div>
                  <div className="detail-row">
                    <FaClock className="detail-icon" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  <div className="detail-row">
                    <FaUsers className="detail-icon" />
                    <span>{safeLength(event.attendance)} registrations</span>
                  </div>
                </div>
                <button
                  className="view-registrations-btn"
                  onClick={() => loadEventRegistrations(event._id)}
                  disabled={loadingRegistrations}
                >
                  <FaEye />
                  {loadingRegistrations ? 'Loading...' : 'View Registrations'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'registrations' && selectedEvent && eventRegistrations && (
        <div className="registrations-section">
          <div className="registrations-header">
            <button 
              className="back-btn"
              onClick={() => setViewMode('events')}
            >
              <FaArrowLeft /> Back to Events
            </button>
            <div className="event-info">
              <h2>{selectedEvent.title}</h2>
              <p>{formatDatePhilippines(selectedEvent.date)} • {selectedEvent.location}</p>
            </div>
          </div>

          <div className="registrations-filters">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disapproved">Disapproved</option>
            </select>
          </div>

          <div className="registrations-summary">
            <div className="summary-card pending">
              <span className="count">{safeLength(eventRegistrations.registrations?.pending)}</span>
              <span className="label">Pending</span>
            </div>
            <div className="summary-card approved">
              <span className="count">{safeLength(eventRegistrations.registrations?.approved)}</span>
              <span className="label">Approved</span>
            </div>
            <div className="summary-card disapproved">
              <span className="count">{safeLength(eventRegistrations.registrations?.disapproved)}</span>
              <span className="label">Disapproved</span>
            </div>
            <div className="summary-card total">
              <span className="count">{eventRegistrations.registrations?.total || 0}</span>
              <span className="label">Total</span>
            </div>
          </div>

          <div className="registrations-grid">
            {eventRegistrations.registrations?.pending?.map(registration => (
              <RegistrationCard
                key={registration._id}
                registration={registration}
                event={selectedEvent}
                type="pending"
              />
            ))}
            {eventRegistrations.registrations?.approved?.map(registration => (
              <RegistrationCard
                key={registration._id}
                registration={registration}
                event={selectedEvent}
                type="approved"
              />
            ))}
            {eventRegistrations.registrations?.disapproved?.map(registration => (
              <RegistrationCard
                key={registration._id}
                registration={registration}
                event={selectedEvent}
                type="disapproved"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrationApprovalPage;
