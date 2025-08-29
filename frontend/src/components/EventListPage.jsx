// frontend/src/components/EventListPage.jsx
// Simple but Creative Event List Page Design

import React, { useState, useEffect } from 'react';
import { getEvents, getEventDetails, approveAttendance, disapproveAttendance, joinEvent, timeIn, timeOut, generateReport } from '../api/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaDownload, FaEye, FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { formatTimeRange12Hour } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import './EventListPage.css';

function EventListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const navigate = useNavigate();
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

  // Fetch filter options from settings
  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Fetching filter options with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('/settings/public', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 API response status:', response.status);
      
      if (response.ok) {
        const settings = await response.json();
        console.log('⚙️ Full settings response:', settings);
        
        const activeDepartments = settings.departments?.filter(d => d.isActive).map(d => d.name) || [];
        
        console.log('🏢 Active departments from settings:', activeDepartments);
        console.log('🏢 Raw departments data:', settings.departments);
        
        setFilterOptions(prev => ({
          ...prev,
          departments: activeDepartments
        }));
        
        // If no departments found, try to get them from events
        if (activeDepartments.length === 0) {
          console.log('⚠️ No departments found in settings, trying to extract from events...');
          const eventDepartments = [...new Set(events.map(event => event.department).filter(Boolean))];
          console.log('🏢 Departments from events:', eventDepartments);
          
          if (eventDepartments.length > 0) {
            setFilterOptions(prev => ({
              ...prev,
              departments: eventDepartments
            }));
          }
        }
      } else {
        console.error('❌ API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
      }
    } catch (err) {
      console.error('❌ Error fetching filter options:', err);
      // Show SweetAlert warning
      Swal.fire({
        icon: 'warning',
        title: 'Filter Options Warning',
        text: 'Some filter options may not be available. The page will still work with basic functionality.',
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'OK',
        timer: 4000,
        timerProgressBar: true
      });
    }
  };

  useEffect(() => {
    console.log('🚀 EventListPage component mounted');
    console.log('👤 Current user:', user);
    console.log('🎭 Current role:', role);
    setIsVisible(true);
    
    // Update user and role state
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentRole = localStorage.getItem('role');
    console.log('📱 LocalStorage user:', currentUser);
    console.log('📱 LocalStorage role:', currentRole);
    
    refreshEvents();
    fetchFilterOptions(); // Fetch filter options from settings
    
    // Add focus event listener to refresh data when user returns to the page
    const handleFocus = () => {
      console.log('🔄 Window focus event - refreshing events');
      refreshEvents();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      console.log('🧹 EventListPage component unmounting');
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Update filter options when events are loaded
  useEffect(() => {
    if (events.length > 0 && filterOptions.departments.length === 0) {
      console.log('🔄 Events loaded, updating department filter options...');
      const eventDepartments = [...new Set(events.map(event => event.department).filter(Boolean))];
      console.log('🏢 Departments from events:', eventDepartments);
      
      if (eventDepartments.length > 0) {
        setFilterOptions(prev => ({
          ...prev,
          departments: eventDepartments
        }));
      }
    }
  }, [events, filterOptions.departments.length]);

  // Modal state change logging
  useEffect(() => {
    console.log('🔍 Modal state changed:', { showEventModal, showAttendanceModal });
  }, [showEventModal, showAttendanceModal]);



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
  const refreshEvents = async () => {
    try {
      console.log('🔄 Starting refreshEvents...');
      setLoading(true);
      setError('');
      
      console.log('📡 Calling getEvents()...');
      const eventsData = await getEvents();
      console.log('✅ Events loaded:', eventsData);
      
      if (!eventsData || !Array.isArray(eventsData)) {
        throw new Error('Invalid events data received');
      }
      
      setEvents(eventsData);
      
      // Extract unique departments from events for filter options
      const uniqueDepartments = [...new Set(
        eventsData
          .map(event => event.department)
          .filter(Boolean) // Remove null/undefined values
      )].sort();
      
      console.log('🏢 Unique departments found:', uniqueDepartments);
      
      setFilterOptions({
        departments: uniqueDepartments
      });
      
      // Set joined events for students
      if (role === 'Student') {
        console.log('👤 Processing student events...');
        // Try multiple ways to get user ID
        let userId = user._id || user.id;
        if (!userId) {
          userId = localStorage.getItem('userId');
        }
        console.log('🆔 User ID:', userId);
        
        if (userId) {
          const joined = eventsData
            .filter(event => 
              event.attendance && 
              event.attendance.some(a => {
                const attUserId = a.userId?._id || a.userId;
                return attUserId === userId;
              })
            )
            .map(event => event._id);
          console.log('📋 Joined events:', joined);
        }
      }
      
      console.log('✅ refreshEvents completed successfully');
      

      
    } catch (err) {
      console.error('❌ Error in refreshEvents:', err);
      const errorMessage = `Failed to load events: ${err.message || 'Unknown error'}`;
      setError(errorMessage);
      
      // Show SweetAlert for the error
      Swal.fire({
        icon: 'error',
        title: 'Failed to Load Events',
        text: errorMessage,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setPdfFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearAllFilters = () => {
    Swal.fire({
      icon: 'question',
      title: 'Clear All Filters?',
      text: 'Are you sure you want to clear all search and filter criteria? This will reset the current view.',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Clear All',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setPdfFilters({
          status: '',
          dateFrom: '',
          dateTo: '',
          location: '',
          department: ''
        });
        setSearchTerm('');
        
        Swal.fire({
          icon: 'success',
          title: 'Filters Cleared!',
          text: 'All search and filter criteria have been cleared successfully.',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'OK',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  };

  useEffect(() => {
    refreshEvents();
    // eslint-disable-next-line
  }, []); // Removed role dependency since it's not a state variable

  const handleJoin = async (eventId) => {
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
          ${event.requiresApproval ? `
          <br>
          <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Approval Required:</strong></p>
            <p style="margin: 5px 0 0 0; color: #856404;">Your registration will be reviewed by staff/admin before you can participate.</p>
          </div>
          ` : ''}
          <br>
          <div style="background-color: #d1ecf1; padding: 10px; border-radius: 5px; border-left: 4px solid #17a2b8;">
            <p style="margin: 0; color: #0c5460;"><strong>📋 Important Reminders:</strong></p>
            <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #0c5460;">
              ${event.requiresApproval ? '<li>Wait for approval before timing in</li>' : ''}
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
      const response = await joinEvent(eventId);
      await refreshEvents();
      
      if (response.requiresApproval) {
        Swal.fire({
          icon: 'success',
          title: 'Registration Submitted!',
          text: 'Your registration has been submitted and is pending approval from staff/admin. You will be notified once approved.'
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'You have successfully registered for the event. Please remember to time in when the event starts and time out when you leave.'
        });
      }

      // Preserve the scroll position after the event is added
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Registration Failed', 
        text: 'Failed to register for event. Please try again.' 
      });
    }
  };

  const handleTimeIn = async (eventId) => {
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
      await timeIn(eventId);
      await refreshEvents();
      Swal.fire({ 
        icon: 'success', 
        title: 'Time In Recorded!', 
        text: 'Your time in has been successfully recorded.' 
      });

      // Preserve the scroll position after the event is added
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Time In error:', err);
      Swal.fire({ 
        icon: 'error', 
        title: 'Time In Failed', 
        text: err.message || 'Failed to record Time In. Please try again.' 
      });
    }
  };

  const handleTimeOut = async (eventId) => {
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
      await timeOut(eventId);
      await refreshEvents();
      Swal.fire({ 
        icon: 'success', 
        title: 'Time Out Recorded!', 
        text: 'Your time out has been successfully recorded.' 
      });

      // Preserve the scroll position after the event is added
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Time Out error:', err);
      Swal.fire({ 
        icon: 'error', 
        title: 'Time Out Failed', 
        text: err.message || 'Failed to record Time Out. Please try again.' 
      });
    }
  };

  // PDF Download Handler (Admin/Staff only)
  const handleDownloadPDF = async () => {
    try {
      // Check if there are any events to generate PDF for
      if (!events || events.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Events Available',
          text: 'There are no events available to generate a PDF report. Please refresh the page or check if events exist.',
          confirmButtonColor: '#f59e0b',
          confirmButtonText: 'OK'
        });
        return;
      }

      // Check if current filters would result in no events
      const eventsWithFilters = events.filter(event => {
        // Apply PDF filters to check if any events would match
        if (pdfFilters.status) {
          const eventStatus = getEventStatus(event);
          if (pdfFilters.status !== eventStatus) return false;
        }
        if (pdfFilters.dateFrom) {
          const eventDate = new Date(event.date);
          const filterDate = new Date(pdfFilters.dateFrom);
          if (eventDate < filterDate) return false;
        }
        if (pdfFilters.dateTo) {
          const eventDate = new Date(event.date);
          const filterDate = new Date(pdfFilters.dateTo);
          if (eventDate > filterDate) return false;
        }
        if (pdfFilters.location) {
          if (!event.location || !event.location.toLowerCase().includes(pdfFilters.location.toLowerCase())) {
            return false;
          }
        }
        if (pdfFilters.department) {
          // Check both single department and departments array
          const eventDepartment = event.department;
          const eventDepartments = event.departments || [];
          const isForAllDepartments = event.isForAllDepartments;
          
          if (isForAllDepartments) {
            // Event is for all departments, so it matches any department filter
            return true;
          } else if (eventDepartments.length > 0) {
            // Event has specific departments array
            if (!eventDepartments.includes(pdfFilters.department)) return false;
          } else if (eventDepartment) {
            // Event has single department
            if (eventDepartment !== pdfFilters.department) return false;
          } else {
            // Event has no department restriction
            return true;
          }
        }
        return true;
      });

      if (eventsWithFilters.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Events Match Filters',
          text: 'The current PDF filters would result in no events. Please adjust your filters or clear them to generate a report with all events.',
          showCancelButton: true,
          confirmButtonColor: '#667eea',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Clear Filters',
          cancelButtonText: 'Adjust Filters'
        }).then((result) => {
          if (result.isConfirmed) {
            clearAllFilters();
          }
        });
        return;
      }

      // Build query parameters for PDF generation
      const params = {};
      
      if (pdfFilters.status) params.status = pdfFilters.status;
      if (pdfFilters.dateFrom) params.dateFrom = pdfFilters.dateFrom;
      if (pdfFilters.dateTo) params.dateTo = pdfFilters.dateTo;
      if (pdfFilters.location) params.location = pdfFilters.location;
      if (pdfFilters.department) params.department = pdfFilters.department;
      
      // Show loading state
      Swal.fire({
        icon: 'info',
        title: 'Generating PDF...',
        text: `Generating PDF report for ${eventsWithFilters.length} events...`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Use the generateReport API function
      await generateReport('event-list', params);
      
      // Close loading dialog and show success
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded',
        text: `Event list PDF has been downloaded successfully! Generated report for ${eventsWithFilters.length} events.`,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Great!',
        timer: 3000,
        timerProgressBar: true
      });
    } catch (err) {
      console.error('PDF download error:', err);
      
      // Close loading dialog if it's open
      Swal.close();
      
      // Check if it's a "no results" error from backend
      if (err.message && err.message.includes('No events found')) {
        Swal.fire({
          icon: 'info',
          title: 'No Events Found',
          text: 'No events match the current filter criteria. Please adjust your filters or clear them to see all events.',
          showCancelButton: true,
          confirmButtonColor: '#667eea',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Clear Filters',
          cancelButtonText: 'Adjust Filters'
        }).then((result) => {
          if (result.isConfirmed) {
            clearAllFilters();
          }
        });
      } else {
        // Generic error
        Swal.fire({
          icon: 'warning',
          title: 'Download Failed',
          text: `Could not download PDF: ${err.message || 'Unknown error occurred'}`,
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  // Helper function to check if PDF filters would result in no events
  const getEventsWithPdfFilters = () => {
    if (!events || events.length === 0) return [];
    
    return events.filter(event => {
      // Apply PDF filters to check if any events would match
      if (pdfFilters.status) {
        const eventStatus = getEventStatus(event);
        if (pdfFilters.status !== eventStatus) return false;
      }
      if (pdfFilters.dateFrom) {
        const eventDate = new Date(event.date);
        const filterDate = new Date(pdfFilters.dateFrom);
        if (eventDate < filterDate) return false;
      }
      if (pdfFilters.dateTo) {
        const eventDate = new Date(event.date);
        const filterDate = new Date(pdfFilters.dateTo);
        if (eventDate > filterDate) return false;
      }
      if (pdfFilters.location) {
        if (!event.location || !event.location.toLowerCase().includes(pdfFilters.location.toLowerCase())) {
          return false;
        }
      }
      if (pdfFilters.department) {
        // Check both single department and departments array
        const eventDepartment = event.department;
        const eventDepartments = event.departments || [];
        const isForAllDepartments = event.isForAllDepartments;
        
        if (isForAllDepartments) {
          // Event is for all departments, so it matches any department filter
          return true;
        } else if (eventDepartments.length > 0) {
          // Event has specific departments array
          if (!eventDepartments.includes(pdfFilters.department)) return false;
        } else if (eventDepartment) {
          // Event has single department
          if (eventDepartment !== pdfFilters.department) return false;
        } else {
          // Event has no department restriction
          return true;
        }
      }
      return true;
    });
  };

  // Filter events by status, search, and department restrictions
  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
      <div className="event-list-page">
        <div className="loading-section">
          <h3>Loading Events...</h3>
          <p>Please wait while we fetch the latest events</p>
          <button onClick={refreshEvents} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="event-list-page">
        <div className="error-section">
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={refreshEvents} className="refresh-button">
            Try Again
          </button>
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Debug Info:</strong>
            <div>Role: {role}</div>
            <div>User: {user._id || user.id || 'No user ID'}</div>
            <div>Events loaded: {events.length}</div>
            <div>Loading state: {loading ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="event-list-page">
      <div className="event-list-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`event-list-container ${isVisible ? 'visible' : ''}`}>
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-icon">
              <div className="icon-symbol">📅</div>
            </div>
            <h1 className="hero-title">Community Events</h1>
            <p className="hero-subtitle">Discover meaningful opportunities to serve your community and make a difference</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-box">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search events by title, description, or location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filter-box">
            {/* <FaFilter className="filter-icon" /> */}
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
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
          <div className="pdf-download-section">
            <div className="pdf-button-container">
              <button
                className="pdf-download-button"
                onClick={handleDownloadPDF}
                disabled={!events || events.length === 0}
                title={!events || events.length === 0 ? 'No events available for PDF generation' : 'Download event list as PDF'}
              >
                {/* <FaDownload className="download-icon" /> */}
                Download Event List PDF
                {!events || events.length === 0 && <span className="disabled-hint"> (No Events)</span>}
              </button>
              
              {/* PDF Info Badge */}
              {events && events.length > 0 && getEventsWithPdfFilters().length > 0 && (
                <div className="pdf-info-badge">
                  📊 {getEventsWithPdfFilters().length} events
                </div>
              )}
            </div>
            
            {/* Status Messages */}
            {!events || events.length === 0 && (
              <p className="pdf-disabled-hint">
                PDF generation is disabled because there are no events available.
              </p>
            )}
            {events && events.length > 0 && getEventsWithPdfFilters().length === 0 && (
              <p className="pdf-warning-hint">
                ⚠️ Current filters would result in no events. Adjust filters or clear them to generate a PDF.
              </p>
            )}
          </div>
        )}
        
        {/* PDF Filter Options for Admin/Staff */}
        {(role === 'Admin' || role === 'Staff') && (
          <div className="pdf-filters-section">
            <h4 className="filters-title">PDF Filter Options</h4>
            <div className="filters-grid">
              <div className="filter-field">
                <label>Status:</label>
                <select
                  value={pdfFilters.status}
                  onChange={e => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="past">Past</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="filter-field">
                <label>Date From:</label>
                <input
                  type="date"
                  value={pdfFilters.dateFrom}
                  onChange={e => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div className="filter-field">
                <label>Date To:</label>
                <input
                  type="date"
                  value={pdfFilters.dateTo}
                  onChange={e => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              <div className="filter-field">
                <label>Location:</label>
                <input
                  type="text"
                  placeholder="Enter location..."
                  value={pdfFilters.location}
                  onChange={e => handleFilterChange('location', e.target.value)}
                />
              </div>
              <div className="filter-field">
                <label htmlFor="department-filter">Department:</label>
                <select
                  id="department-filter"
                  name="department"
                  aria-label="Filter events by department"
                  value={pdfFilters.department}
                  onChange={e => handleFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
                  {filterOptions.departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              {/* Clear Filters Button */}
              {(pdfFilters.status || pdfFilters.dateFrom || pdfFilters.dateTo || pdfFilters.location || pdfFilters.department) && (
                <div className="clear-filters-section">
                  <button 
                    className="clear-filters-button"
                    onClick={clearAllFilters}
                    title="Clear all PDF filters"
                  >
                    <FaTimes className="button-icon" />
                    Clear All Filters
                  </button>
                </div>
              )}
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
              <button 
                className="refresh-button"
                onClick={() => {
                  Swal.fire({
                    icon: 'info',
                    title: 'No Events Found',
                    text: 'No events match your current search and filter criteria. You can try adjusting your filters or refresh the page to see if new events are available.',
                    showCancelButton: true,
                    confirmButtonColor: '#667eea',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Refresh Events',
                    cancelButtonText: 'Adjust Filters'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      refreshEvents();
                    }
                  });
                }}
              >
                <FaDownload className="button-icon" />
                Get Help
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map(event => {
                // Try multiple ways to get user ID
                let userId = user._id || user.id;
                if (!userId) {
                  userId = localStorage.getItem('userId');
                }
                
                const att = event.attendance?.find(a => {
                  const attUserId = a.userId?._id || a.userId;
                  return attUserId === userId;
                });
                
                console.log(`🔍 Event ${event.title}: User ID ${userId}, Found attendance:`, att);
                const status = getEventStatus(event);
                const isJoined = // setJoinedEvents(joined); // Removed as per edit hint
                  event.attendance && 
                  event.attendance.some(a => {
                    const attUserId = a.userId?._id || a.userId;
                    return attUserId === userId;
                  });

                // Calculate available slots and status - only count approved registrations
                const maxParticipants = typeof event.maxParticipants === 'number' ? event.maxParticipants : 0;
                const approvedAttendanceCount = Array.isArray(event.attendance) ? 
                  event.attendance.filter(a => a.registrationApproved === true).length : 0;
                const pendingRegistrationsCount = Array.isArray(event.attendance) ? 
                  event.attendance.filter(a => a.registrationApproved === false && a.status === 'Pending').length : 0;
                const availableSlots = maxParticipants > 0 ? maxParticipants - approvedAttendanceCount : 'Unlimited';
                
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
                            {availableSlots === 'Unlimited' ? 'Unlimited Slots' : `${availableSlots} slots`}
                            {maxParticipants > 0 && (
                              <span className="capacity-details">
                                ({approvedAttendanceCount} approved, {pendingRegistrationsCount} pending)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

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

                       <p className="event-description">{event.description}</p>
                      
                      <div className="event-hours">
                        <strong>Service Hours: {event.hours} hours</strong>
                      </div>

                      {/* Event Actions */}
                      <div className="event-actions">
                        {role === 'Student' && !isJoined && (
                          <>
                            {isAvailable ? (
                              <button 
                                className="register-event-button"
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
                            {/* Show approval status if approval is required */}
                            {event.requiresApproval && att && (
                              <>
                                {!att.registrationApproved && att.status === 'Pending' && (
                                  <div className="approval-status pending">
                                    <span className="status-icon">⏳</span>
                                    <span className="status-text">Registration Pending Approval</span>
                                  </div>
                                )}
                                
                                {!att.registrationApproved && att.status === 'Disapproved' && (
                                  <div className="approval-status disapproved">
                                    <span className="status-icon">❌</span>
                                    <span className="status-text">Registration Disapproved</span>
                                    {att.reason && (
                                      <div className="disapproval-reason">
                                        <strong>Reason:</strong> {att.reason}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {att.registrationApproved && (
                                  <div className="approval-status approved">
                                    <span className="status-icon">✅</span>
                                    <span className="status-text">Registration Approved</span>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Only show time buttons if registration is approved or no approval required */}
                            {(att.registrationApproved || !event.requiresApproval) && att.status !== 'Disapproved' && (
                              <div className="time-buttons">
                                <button 
                                  className={`action-button time-in-button ${att && att.timeIn ? 'success-button disabled' : 'warning-button'}`}
                                  onClick={() => handleTimeIn(event._id)} 
                                  disabled={att && att.timeIn}
                                >
                                  {att && att.timeIn ? 'Time In Recorded' : 'Time In'}
                                </button>
                                
                                <button 
                                  className={`action-button time-out-button ${att && att.timeOut ? 'success-button disabled' : 'info-button'}`}
                                  onClick={() => handleTimeOut(event._id)} 
                                  disabled={att && !att.timeIn || (att && att.timeOut)}
                                >
                                  {att && att.timeOut ? 'Time Out Recorded' : 'Time Out'}
                                </button>
                              </div>
                            )}

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
                            className="view-participants-button"
                            onClick={() => navigate(`/events/${event._id}`)}
                          >
                            <FaEye className="button-icon" /> View Participants
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

      {/* Remove reflection modal - no longer needed */}
      {/* <ReflectionUploadModal
        show={showReflectionModal}
        onClose={() => { 
          console.log('🔄 Closing modal');
          setShowReflectionModal(false); 
          setReflectionEventId(null); 
        }}
        eventId={reflectionEventId}
        onSuccess={handleReflectionSuccess}
      /> */}
    </div>
  );
}

export default EventListPage;