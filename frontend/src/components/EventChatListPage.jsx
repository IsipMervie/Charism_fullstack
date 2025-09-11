// EventChatListPage.jsx - Modern Event Discovery Interface
// Enhanced with better filtering, search, and modern design

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaComments, 
  FaCalendar, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaEyeSlash,
  FaBell,
  FaBellSlash,
  FaStar,
  FaHeart,
  FaBookmark,
  FaShare,
  FaDownload,
  FaRefresh,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaArrowLeft,
  FaPlus,
  FaGrid3X3,
  FaList,
  FaThumbsUp,
  FaThumbsDown
} from 'react-icons/fa';
import { getEvents } from '../api/api';
import { formatTimeRange12Hour, formatDatePhilippines } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import './EventChatListPage.css';

const EventChatListPage = () => {
  // Core state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all', // all, upcoming, ongoing, completed
    department: 'all',
    location: 'all',
    dateRange: 'all' // all, today, thisWeek, thisMonth
  });
  const [sortBy, setSortBy] = useState('date'); // date, title, participants, location
  
  // UI state
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [bookmarks, setBookmarks] = useState(new Set());
  
  // Navigation
  const navigate = useNavigate();
  
  // User data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');

  // Enhanced utility functions
  const getEventStatus = useCallback((event) => {
    if (!event) return 'unknown';
    const now = new Date();
    const eventDate = new Date(event.date);
    const eventStartTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
    const eventEndTime = new Date(`${eventDate.toDateString()} ${event.endTime || '23:59'}`);
    
    if (now < eventStartTime) return 'upcoming';
    if (now >= eventStartTime && now <= eventEndTime) return 'ongoing';
    return 'completed';
  }, []);

  const getEventStatusColor = useCallback((status) => {
    switch (status) {
      case 'upcoming': return 'var(--info)';
      case 'ongoing': return 'var(--success)';
      case 'completed': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  }, []);

  const getEventStatusIcon = useCallback((status) => {
    switch (status) {
      case 'upcoming': return '⏰';
      case 'ongoing': return '🟢';
      case 'completed': return '✅';
      default: return '❓';
    }
  }, []);

  const formatEventDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  const formatEventTime = useCallback((startTime, endTime) => {
    return `${startTime} - ${endTime}`;
  }, []);

  // Enhanced filtering and sorting
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter(event => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          (event.location && event.location.toLowerCase().includes(searchLower)) ||
          (event.department && event.department.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (selectedFilters.status !== 'all') {
        const eventStatus = getEventStatus(event);
        if (eventStatus !== selectedFilters.status) return false;
      }

      // Department filter
      if (selectedFilters.department !== 'all') {
        if (event.department !== selectedFilters.department) return false;
      }

      // Location filter
      if (selectedFilters.location !== 'all') {
        if (event.location !== selectedFilters.location) return false;
      }

      // Date range filter
      if (selectedFilters.dateRange !== 'all') {
        const eventDate = new Date(event.date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (selectedFilters.dateRange) {
          case 'today':
            if (eventDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'thisWeek':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            if (eventDate < weekStart || eventDate > weekEnd) return false;
            break;
          case 'thisMonth':
            if (eventDate.getMonth() !== today.getMonth() || eventDate.getFullYear() !== today.getFullYear()) return false;
            break;
        }
      }

      return true;
    });

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'participants':
          return (b.attendance?.length || 0) - (a.attendance?.length || 0);
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        case 'date':
        default:
          return new Date(a.date) - new Date(b.date);
      }
    });

    return filtered;
  }, [events, searchTerm, selectedFilters, sortBy, getEventStatus]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const departments = [...new Set(events.map(e => e.department).filter(Boolean))];
    const locations = [...new Set(events.map(e => e.location).filter(Boolean))];
    
    return {
      departments: ['all', ...departments],
      locations: ['all', ...locations],
      statuses: ['all', 'upcoming', 'ongoing', 'completed'],
      dateRanges: ['all', 'today', 'thisWeek', 'thisMonth'],
      sortOptions: [
        { value: 'date', label: 'Date' },
        { value: 'title', label: 'Title' },
        { value: 'participants', label: 'Participants' },
        { value: 'location', label: 'Location' }
      ]
    };
  }, [events]);

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

  // Enhanced event handlers
  const handleFilterChange = useCallback((filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedFilters({
      status: 'all',
      department: 'all',
      location: 'all',
      dateRange: 'all'
    });
    setSearchTerm('');
  }, []);

  const toggleFavorite = useCallback((eventId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId);
      } else {
        newFavorites.add(eventId);
      }
      return newFavorites;
    });
  }, []);

  const toggleBookmark = useCallback((eventId) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(eventId)) {
        newBookmarks.delete(eventId);
      } else {
        newBookmarks.add(eventId);
      }
      return newBookmarks;
    });
  }, []);

  const shareEvent = useCallback(async (event) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      const eventUrl = `${window.location.origin}/event-chat/${event._id}`;
      try {
        await navigator.clipboard.writeText(eventUrl);
        alert('Event link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, []);

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
      {/* Modern Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="back-button"
              onClick={() => navigate('/events')}
              title="Back to Events"
            >
              <FaArrowLeft />
              <span>Back to Events</span>
            </button>
            
            <div className="page-info">
              <h1 className="page-title">Event Chats</h1>
              <p className="page-subtitle">Join discussions for events you're approved for</p>
            </div>
          </div>
          
          <div className="header-right">
            <button 
              className="refresh-button"
              onClick={() => window.location.reload()}
              title="Refresh events"
            >
              <FaRefresh />
            </button>
            
            <div className="view-controls">
              <button 
                className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <FaGrid3X3 />
              </button>
              <button 
                className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Search and Filters */}
      <div className="search-filters-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search events by title, description, location, or department..."
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
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        <div className="filters-controls">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            <span>Filters</span>
            {Object.values(selectedFilters).some(filter => filter !== 'all') && (
              <span className="filter-badge">
                {Object.values(selectedFilters).filter(filter => filter !== 'all').length}
              </span>
            )}
          </button>
          
          <div className="sort-controls">
            <button 
              className="sort-toggle"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <FaSort />
              <span>Sort by {filterOptions.sortOptions.find(opt => opt.value === sortBy)?.label}</span>
            </button>
            
            {showSortOptions && (
              <div className="sort-dropdown">
                {filterOptions.sortOptions.map(option => (
                  <button
                    key={option.value}
                    className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortOptions(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {(searchTerm || Object.values(selectedFilters).some(filter => filter !== 'all')) && (
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <FaTimes />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Status</label>
              <select 
                value={selectedFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Department</label>
              <select 
                value={selectedFilters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                {filterOptions.departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Location</label>
              <select 
                value={selectedFilters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                {filterOptions.locations.map(location => (
                  <option key={location} value={location}>
                    {location === 'all' ? 'All Locations' : location}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Date Range</label>
              <select 
                value={selectedFilters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                {filterOptions.dateRanges.map(range => (
                  <option key={range} value={range}>
                    {range === 'all' ? 'All Dates' : 
                     range === 'today' ? 'Today' :
                     range === 'thisWeek' ? 'This Week' :
                     range === 'thisMonth' ? 'This Month' : range}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="results-summary">
          <span className="results-count">
            {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? 's' : ''} found
          </span>
          {searchTerm && (
            <span className="search-term">
              for "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      {/* Events Display */}
      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No Chat Access</h3>
          <p>
            {role === 'Student' 
              ? "You don't have access to any event chats yet. You need to be registered and approved for events to participate in their discussions."
              : "No events are available for chat at the moment."
            }
          </p>
          <button 
            className="primary-button"
            onClick={() => navigate('/events')}
          >
            <FaPlus />
            Browse Events
          </button>
        </div>
      ) : filteredAndSortedEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Events Found</h3>
          <p>No events match your current search and filter criteria.</p>
          <button 
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={`events-container ${viewMode}`}>
          {filteredAndSortedEvents.map((event) => {
            const eventStatus = getEventStatus(event);
            const canChat = canAccessChat(event);
            const canRequest = canRequestChat(event);
            
            return (
              <div key={event._id} className={`event-card ${viewMode}`}>
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
                  
                  <div className="event-overlay">
                    <div className="event-status-badge" style={{ backgroundColor: getEventStatusColor(eventStatus) }}>
                      {getEventStatusIcon(eventStatus)}
                      <span>{eventStatus}</span>
                    </div>
                    
                    <div className="event-actions-overlay">
                      <button 
                        className={`action-btn ${favorites.has(event._id) ? 'active' : ''}`}
                        onClick={() => toggleFavorite(event._id)}
                        title={favorites.has(event._id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <FaHeart />
                      </button>
                      <button 
                        className={`action-btn ${bookmarks.has(event._id) ? 'active' : ''}`}
                        onClick={() => toggleBookmark(event._id)}
                        title={bookmarks.has(event._id) ? 'Remove bookmark' : 'Bookmark event'}
                      >
                        <FaBookmark />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => shareEvent(event)}
                        title="Share event"
                      >
                        <FaShare />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="event-content">
                  <div className="event-header">
                    <h3 className="event-title">{event.title}</h3>
                    <div className="event-meta">
                      <span className="participants-count">
                        <FaUsers />
                        {event.attendance?.length || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="event-details">
                    <div className="detail-item">
                      <FaCalendar />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <div className="detail-item">
                      <FaClock />
                      <span>{formatEventTime(event.startTime, event.endTime)}</span>
                    </div>
                    <div className="detail-item">
                      <FaMapMarkerAlt />
                      <span>{event.location}</span>
                    </div>
                    {event.department && (
                      <div className="detail-item">
                        <FaInfoCircle />
                        <span>{event.department}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="event-description">
                    <p>{event.description}</p>
                  </div>
                </div>
                
                <div className="event-footer">
                  {canChat ? (
                    <button 
                      className="primary-button chat-button"
                      onClick={() => openEventChat(event._id)}
                    >
                      <FaComments />
                      <span>Join Chat</span>
                    </button>
                  ) : canRequest ? (
                    <button 
                      className="secondary-button request-button"
                      onClick={() => requestToJoinChat(event._id)}
                    >
                      <FaBell />
                      <span>Request Access</span>
                    </button>
                  ) : (
                    <button 
                      className="disabled-button"
                      disabled
                    >
                      <FaTimesCircle />
                      <span>Not Available</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventChatListPage;
