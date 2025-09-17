// Redesigned Registration Approval Page - Super User Friendly

import React, { useState, useEffect, useCallback } from 'react';
import { getEvents, getAllEventRegistrations, approveRegistration, disapproveRegistration } from '../api/api';
import Swal from 'sweetalert2';
import { FaSpinner, FaSearch, FaEye, FaCheck, FaTimes, FaArrowLeft, FaFilter, FaMapMarkerAlt, FaUsers, FaClock, FaBuilding, FaUserGraduate } from 'react-icons/fa';
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
    setLoading(true);
    try {
      const allEvents = await getEvents();
      const eventsWithRegistrations = safeFilter(allEvents, event => 
        event.attendance && event.attendance.length > 0
      );
      setEvents(eventsWithRegistrations);
      setFilteredEvents(eventsWithRegistrations);
    } catch (err) {
      console.error('Error loading events:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load events. Please try again.'
      });
    }
    setLoading(false);
  };

  const loadEventRegistrations = async (eventId) => {
    setLoadingRegistrations(true);
    try {
      const registrationsData = await getAllEventRegistrations(eventId);
      if (registrationsData && registrationsData.registrations) {
        setEventRegistrations(registrationsData.registrations);
      }
    } catch (err) {
      console.error('Error loading event registrations:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load event registrations. Please try again.'
      });
    }
    setLoadingRegistrations(false);
  };

  const handleEventSelect = async (event) => {
    setSelectedEvent(event);
    setEventRegistrations(null);
    setStudentSearchTerm('');
    setStatusFilter('all');
    setViewMode('registrations');
    await loadEventRegistrations(event._id);
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setEventRegistrations(null);
    setViewMode('events');
    setEventSearchTerm('');
  };

  const handleApproveRegistration = async (eventId, userId, studentName) => {
    try {
      console.log('🔍 Starting approval process:', { eventId, userId, studentName });
      
      // Validate parameters
      if (!eventId || !userId) {
        throw new Error('Missing required parameters: eventId or userId');
      }
      
      const result = await approveRegistration(eventId, userId);
      console.log('✅ Approval successful:', result);
      
      await loadEventRegistrations(eventId);
      Swal.fire({
        icon: 'success',
        title: 'Registration Approved!',
        text: `${studentName}'s registration has been approved successfully.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('❌ Approval failed:', err);
      
      let errorMessage = 'Failed to approve registration.';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Approval Failed',
        text: errorMessage,
        footer: 'Please check the console for more details and contact support if the issue persists.'
      });
    }
  };

  const handleDisapproveRegistration = async (eventId, userId, studentName, isCurrentlyApproved = false) => {
    const action = isCurrentlyApproved ? 'Remove Approval' : 'Disapprove Registration';
    const message = isCurrentlyApproved ? 
      'This will remove approval from an already approved registration. Are you sure?' : 
      'Enter the reason for disapproving this registration...';
    
    const { value: reason } = await Swal.fire({
      title: action,
      input: 'textarea',
      inputLabel: 'Reason for disapproval',
      inputPlaceholder: message,
      inputAttributes: {
        'aria-label': 'Reason for disapproval'
      },
      showCancelButton: true,
      confirmButtonText: isCurrentlyApproved ? 'Remove Approval' : 'Disapprove',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Please provide a reason for disapproval';
        }
      }
    });

    if (reason) {
      try {
        console.log('🔍 Starting disapproval process:', { eventId, userId, studentName, reason });
        
        // Validate parameters
        if (!eventId || !userId || !reason) {
          throw new Error('Missing required parameters: eventId, userId, or reason');
        }
        
        const result = await disapproveRegistration(eventId, userId, reason);
        console.log('✅ Disapproval successful:', result);
        
        await loadEventRegistrations(eventId);
        Swal.fire({
          icon: 'success',
          title: 'Registration Disapproved',
          text: `${studentName}'s registration has been disapproved successfully.`,
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('❌ Disapproval failed:', err);
        
        let errorMessage = 'Failed to disapprove registration.';
        if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Disapproval Failed',
          text: errorMessage,
          footer: 'Please check the console for more details and contact support if the issue persists.'
        });
      }
    }
  };

  const getFilteredRegistrations = () => {
    if (!eventRegistrations) return { pending: [], approved: [], disapproved: [] };

    let filtered = {
      pending: eventRegistrations.pending || [],
      approved: eventRegistrations.approved || [],
      disapproved: eventRegistrations.disapproved || []
    };

    if (studentSearchTerm) {
      const searchLower = studentSearchTerm.toLowerCase();
      filtered = {
        pending: filtered.pending.filter(reg => 
          reg.userId?.name?.toLowerCase().includes(searchLower) ||
          reg.userId?.department?.toLowerCase().includes(searchLower) ||
          reg.userId?.academicYear?.toLowerCase().includes(searchLower) ||
          reg.userId?.year?.toLowerCase().includes(searchLower) ||
          reg.userId?.section?.toLowerCase().includes(searchLower)
        ),
        approved: filtered.approved.filter(reg => 
          reg.userId?.name?.toLowerCase().includes(searchLower) ||
          reg.userId?.department?.toLowerCase().includes(searchLower) ||
          reg.userId?.academicYear?.toLowerCase().includes(searchLower) ||
          reg.userId?.year?.toLowerCase().includes(searchLower) ||
          reg.userId?.section?.toLowerCase().includes(searchLower)
        ),
        disapproved: filtered.disapproved.filter(reg => 
          reg.userId?.name?.toLowerCase().includes(searchLower) ||
          reg.userId?.department?.toLowerCase().includes(searchLower) ||
          reg.userId?.academicYear?.toLowerCase().includes(searchLower) ||
          reg.userId?.year?.toLowerCase().includes(searchLower) ||
          reg.userId?.section?.toLowerCase().includes(searchLower)
        )
      };
    }

    return filtered;
  };

  const filteredRegistrations = getFilteredRegistrations();
  const totalRegistrations = (filteredRegistrations.pending?.length || 0) + 
                           (filteredRegistrations.pending?.length || 0) + 
                           (filteredRegistrations.disapproved?.length || 0);

  if (loading) {
    return (
      <div className="registration-approval-page">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner">⏳</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-approval-page">
      <div className="registration-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Registration Approval</h1>
          <p className="page-subtitle">
            Search and manage student registrations for events. Find events quickly and approve/disapprove registrations with ease.
          </p>
        </div>

        {/* Main Content */}
        {viewMode === 'events' ? (
          <EventsView 
            events={filteredEvents}
            searchTerm={eventSearchTerm}
            onSearchChange={setEventSearchTerm}
            onEventSelect={handleEventSelect}
            onRefresh={loadEvents}
          />
        ) : (
          <RegistrationsView 
            event={selectedEvent}
            registrations={filteredRegistrations}
            totalRegistrations={totalRegistrations}
            loading={loadingRegistrations}
            searchTerm={studentSearchTerm}
            onSearchChange={setStudentSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onApprove={handleApproveRegistration}
            onDisapprove={handleDisapproveRegistration}
            onBack={handleBackToEvents}
            onRefresh={() => loadEventRegistrations(selectedEvent._id)}
          />
        )}
      </div>
    </div>
  );
}

// Events View Component
function EventsView({ events, searchTerm, onSearchChange, onEventSelect, onRefresh }) {
  return (
    <div className="events-view">
      {/* Search and Controls */}
      <div className="search-controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search events by title, location, date, or number of registrations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button 
          className="refresh-button"
          onClick={onRefresh}
          title="Refresh events"
        >
          <FaSpinner className="refresh-icon" />
          Refresh
        </button>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="search-results-info">
          <span className="results-count">
            Found {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
          <button 
            className="clear-search-button"
            onClick={() => onSearchChange('')}
          >
            🗑️ Clear Search
          </button>
        </div>
      )}

      {/* Events Grid */}
      <div className="events-grid">
        {events.map(event => (
          <EventCard 
            key={event._id} 
            event={event} 
            onSelect={onEventSelect}
          />
        ))}
      </div>

      {/* No Events */}
      {events.length === 0 && (
        <div className="no-events">
          <div className="no-events-icon">📅</div>
          <h3>No Events Found</h3>
          <p>
            {searchTerm 
              ? 'No events match your search criteria. Try adjusting your search terms.'
              : 'There are currently no events with student registrations to manage.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

// Event Card Component
function EventCard({ event, onSelect }) {
  const pendingCount = event.attendance?.filter(att => !att.registrationApproved && att.status === 'Pending').length || 0;
  const approvedCount = event.attendance?.filter(att => att.registrationApproved).length || 0;
  const disapprovedCount = event.attendance?.filter(att => att.status === 'Disapproved').length || 0;
  const totalCount = event.attendance?.length || 0;

  return (
    <div className="event-card" onClick={() => onSelect(event)}>
      <div className="event-card-header">
        <h3 className="event-title">{event.title}</h3>
        <div className="event-date-badge">
          {formatDatePhilippines(event.date)}
        </div>
      </div>
      
      <div className="event-meta">
        <div className="meta-item">
          <FaMapMarkerAlt className="meta-icon" />
          <span>{event.location || 'TBD'}</span>
        </div>
        <div className="meta-item">
          <FaUsers className="meta-icon" />
          <span>{totalCount} total registrations</span>
        </div>
      </div>

      <div className="event-status-summary">
        <div className="status-item pending">
          <span className="status-count">{pendingCount}</span>
          <span className="status-label">Pending</span>
        </div>
        <div className="status-item approved">
          <span className="status-count">{approvedCount}</span>
          <span className="status-label">Approved</span>
        </div>
        <div className="status-item disapproved">
          <span className="status-count">{disapprovedCount}</span>
          <span className="status-label">Disapproved</span>
        </div>
      </div>

      <div className="event-actions">
        <button className="view-registrations-btn">
          {pendingCount > 0 ? <FaCheck className="btn-icon" /> : <FaEye className="btn-icon" />}
          {pendingCount > 0 ? 'Approve for Registered' : 'View Registrations'}
        </button>
      </div>
    </div>
  );
}

// Registrations View Component
function RegistrationsView({ 
  event, 
  registrations, 
  totalRegistrations, 
  loading, 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange,
  onApprove, 
  onDisapprove, 
  onBack, 
  onRefresh 
}) {
  const totalStudents = event.attendance?.length || 0;

  return (
    <div className="registrations-view">
      {/* Header with Back Button */}
      <div className="registrations-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Events
        </button>
        <h2 className="event-title">{event.title}</h2>
        <button 
          className="refresh-button"
          onClick={onRefresh}
          disabled={loading}
        >
          <FaSpinner className={`refresh-icon ${loading ? 'spinning' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Event Info Card */}
      <div className="event-info-card">
        <div className="event-info-grid">
          <div className="info-item">
            <div className="info-content">
              <span className="info-label">Event Date</span>
              <span className="info-value">{formatDatePhilippines(event.date)}</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-content">
              <span className="info-label">Location</span>
              <span className="info-value">{event.location || 'TBD'}</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-content">
              <span className="info-label">Total Registrations</span>
              <span className="info-value">{totalStudents}</span>
            </div>
          </div>
        </div>
      </div>



      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search students by name, department, year level..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="approved">Approved Only</option>
            <option value="disapproved">Disapproved Only</option>
          </select>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="search-results-info">
          <span className="results-count">
            Found {totalRegistrations} student{totalRegistrations !== 1 ? 's' : ''}
          </span>
          <button 
            className="clear-search-button"
            onClick={() => onSearchChange('')}
          >
            🗑️ Clear Search
          </button>
        </div>
      )}

      {/* Registrations List */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner">⏳</div>
          </div>
        </div>
      ) : (
        <div className="registrations-container">
          {/* Pending Registrations */}
          {registrations.pending?.length > 0 && (statusFilter === 'all' || statusFilter === 'pending') && (
            <div className="registration-group">
              <h3 className="group-title pending">
                <FaClock className="group-icon" />
                Pending Approvals ({registrations.pending.length})
              </h3>
              <div className="registrations-list">
                {registrations.pending.map(reg => (
                  <RegistrationCard
                    key={reg.userId._id}
                    registration={reg}
                    event={event}
                    onApprove={onApprove}
                    onDisapprove={onDisapprove}
                    type="pending"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved Registrations */}
          {registrations.approved?.length > 0 && (statusFilter === 'all' || statusFilter === 'approved') && (
            <div className="registration-group">
              <h3 className="group-title approved">
                <FaCheck className="group-icon" />
                Approved ({registrations.approved.length})
              </h3>
              <div className="registrations-list">
                {registrations.approved.map(reg => (
                  <RegistrationCard
                    key={reg.userId._id}
                    registration={reg}
                    event={event}
                    onApprove={onApprove}
                    onDisapprove={onDisapprove}
                    type="approved"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Disapproved Registrations */}
          {registrations.disapproved?.length > 0 && (statusFilter === 'all' || statusFilter === 'disapproved') && (
            <div className="registration-group">
              <h3 className="group-title disapproved">
                <FaTimes className="group-icon" />
                Disapproved ({registrations.disapproved.length})
              </h3>
              <div className="registrations-list">
                {registrations.disapproved.map(reg => (
                  <RegistrationCard
                    key={reg.userId._id}
                    registration={reg}
                    event={event}
                    onApprove={onApprove}
                    onDisapprove={onDisapprove}
                    type="disapproved"
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Results - Fixed to show "No Students" */}
          {totalRegistrations === 0 && (
            <div className="no-results">
              <div className="no-results-icon">👥</div>
              <h4>No Students Found</h4>
              <p>
                {searchTerm || statusFilter !== 'all' 
                  ? 'No students match your current search criteria. Try adjusting your filters or search terms.'
                  : 'This event has no student registrations yet.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Registration Card Component
function RegistrationCard({ registration, event, onApprove, onDisapprove, type }) {
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
              onClick={() => onApprove(event._id, userId._id, userId.name)}
              className="action-button approve"
            >
              Approve for Registered
            </button>
            <button
              onClick={() => onDisapprove(event._id, userId._id, userId.name, false)}
              className="action-button disapprove"
            >
              Disapprove
            </button>
          </>
        )}
        
        {type === 'approved' && (
          <button
            onClick={() => onDisapprove(event._id, userId._id, userId.name, true)}
            className="action-button disapprove"
          >
            Remove Approval
          </button>
        )}
        
        {type === 'disapproved' && (
          <button
            onClick={() => onApprove(event._id, userId._id, userId.name)}
            className="action-button approve"
          >
            Approve for Registered
          </button>
        )}
      </div>
    </div>
  );
}

export default RegistrationApprovalPage;

