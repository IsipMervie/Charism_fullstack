// frontend/src/components/EventListPage.jsx
// Simple but Creative Event List Page Design

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { getEvents, joinEvent, timeIn, timeOut, generateReport, getPublicSettings } from '../api/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaEye, FaTimes, FaDownload, FaSyncAlt } from 'react-icons/fa';
import { formatTimeRange12Hour, formatDateTimePhilippines, formatDatePhilippines } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import { safeFilter, safeMap, safeSet, safeSpread, safeGetAttendance } from '../utils/arrayUtils';
import './EventListPage.css';

function EventListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [joinedEvents, setJoinedEvents] = useState([]);
  
  // Use ref to prevent infinite loops
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

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

  // Refresh events and joined events
  const refreshEvents = useCallback(async (retryCount = 0) => {
    // Prevent multiple simultaneous calls using ref
    if (isLoadingRef.current && retryCount === 0) {
      return;
    }
    
    // Check cache first (valid for 30 seconds)
    const cacheKey = 'events-cache';
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheTimestamp = sessionStorage.getItem(`${cacheKey}-timestamp`);
    
    if (cachedData && cacheTimestamp && retryCount === 0) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      if (cacheAge < 30000) { // 30 seconds cache
        console.log('📦 Using cached events data');
        try {
          const parsedData = JSON.parse(cachedData);
          setEvents(parsedData);
          hasLoadedRef.current = true;
          setLoading(false);
          return;
        } catch (error) {
          console.log('❌ Cache data corrupted, fetching fresh data');
        }
      }
    }
    
    // If we've already loaded successfully, don't reload unless explicitly requested
    if (hasLoadedRef.current && retryCount === 0) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError('');
      
      const eventsData = await getEvents();
      
      console.log('📊 Events data received:', {
        isArray: Array.isArray(eventsData),
        length: eventsData?.length,
        sample: eventsData?.slice(0, 2)
      });
      
      if (!eventsData || !Array.isArray(eventsData)) {
        throw new Error('Invalid events data received');
      }
      
      
      setEvents(eventsData);
      hasLoadedRef.current = true;
      
      // Cache the events data
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(eventsData));
        sessionStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
        console.log('💾 Events data cached');
      } catch (error) {
        console.log('⚠️ Failed to cache events data:', error);
      }
      
      // Extract unique departments from events for filter options
      const uniqueDepartments = [...safeSet(
        safeMap(eventsData, event => {
          if (event.departments && Array.isArray(event.departments)) {
            return event.departments;
          }
          if (event.department && typeof event.department === 'string') {
            return [event.department];
          }
          if (event.department && typeof event.department === 'object' && event.department.name) {
            return [event.department.name];
          }
          return [];
        }).flat().filter(Boolean)
      )].sort();
      
      setFilterOptions({
        departments: uniqueDepartments
      });
      
      // Set joined events for students
      if (role === 'Student') {
        let userId = user._id || user.id;
        if (!userId) {
          userId = localStorage.getItem('userId');
        }
        
        if (userId) {
          const joined = safeMap(
            safeFilter(eventsData, event => {
              const attendance = safeGetAttendance(event);
              return attendance.some(a => {
                const attUserId = a.userId?._id || a.userId;
                return attUserId === userId;
              });
            }),
            event => event._id
          );
          setJoinedEvents(joined);
        }
      }
      
    } catch (err) {
      console.error('❌ Error in refreshEvents:', err);
      
      // Handle timeout errors with retry logic
      if (err.message && err.message.includes('timeout') && retryCount < 2) {
        console.log(`⏰ Timeout detected, retrying... (${retryCount + 1}/3)`);
        setError(`Connection timeout. Retrying... (${retryCount + 1}/3)`);
        
        // Wait 2 seconds before retry
        setTimeout(() => {
          refreshEvents(retryCount + 1);
        }, 2000);
        return;
      }
      
      let errorMessage = 'Failed to load events.';
      
      if (err.response?.status === 503) {
        errorMessage = '🚨 Backend server is currently unavailable. The service is temporarily down.';
      } else if (err.message.includes('Database not connected')) {
        errorMessage = 'Database temporarily unavailable. Please try again later.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. The server may be slow. Please try again.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message) {
        errorMessage = `Failed to load events: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Show SweetAlert for the error
      Swal.fire({
        icon: 'error',
        title: 'Failed to Load Events',
        text: errorMessage,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK',
        showCancelButton: true,
        cancelButtonText: 'Retry',
        cancelButtonColor: '#6b7280'
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
          refreshEvents();
        }
      });
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // Remove dependencies to prevent infinite loop

  // Manual refresh function for user-triggered refreshes
  const handleManualRefresh = useCallback(() => {
    hasLoadedRef.current = false;
    refreshEvents();
  }, [refreshEvents]);

  // Fetch filter options from settings with caching
  const fetchFilterOptions = async () => {
    // Prevent multiple simultaneous calls and use cache
    if (filterOptions.departments.length > 0) {
      return;
    }
    
    // Check if we have cached settings (valid for 5 minutes)
    const cachedSettings = sessionStorage.getItem('publicSettings');
    const cachedTimestamp = sessionStorage.getItem('publicSettingsTimestamp');
    
    if (cachedSettings && cachedTimestamp) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp);
      const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes
      
      if (cacheValid) {
        try {
          const settings = JSON.parse(cachedSettings);
          const departments = safeSpread(settings?.departments, []);
          const activeDepartments = safeMap(
            safeFilter(departments, d => d && d.isActive),
            d => d.name
          );
          
          setFilterOptions(prev => ({
            ...prev,
            departments: activeDepartments
          }));
          return;
        } catch (e) {
          // If cache is invalid, remove it
          sessionStorage.removeItem('publicSettings');
          sessionStorage.removeItem('publicSettingsTimestamp');
        }
      } else {
        // Cache expired, remove it
        sessionStorage.removeItem('publicSettings');
        sessionStorage.removeItem('publicSettingsTimestamp');
      }
    }
    
    try {
      const settings = await getPublicSettings();
      
      // Cache the settings for 5 minutes
      sessionStorage.setItem('publicSettings', JSON.stringify(settings));
      sessionStorage.setItem('publicSettingsTimestamp', Date.now().toString());
      
      // Use safe array utilities to prevent filter errors
      const departments = safeSpread(settings?.departments, []);
      const activeDepartments = safeMap(
        safeFilter(departments, d => d && d.isActive),
        d => d.name
      );
      
      setFilterOptions(prev => ({
        ...prev,
        departments: activeDepartments
      }));
      
      // If no departments found, try to get them from events
      if (activeDepartments.length === 0 && events.length > 0) {
        // Simplified department extraction
        const eventDepartments = [...safeSet(
          safeMap(events, event => {
            if (event.departments && Array.isArray(event.departments)) {
              return event.departments;
            }
            if (event.department && typeof event.department === 'string') {
              return [event.department];
            }
            if (event.department && typeof event.department === 'object' && event.department.name) {
              return [event.department.name];
            }
            return [];
          }).flat().filter(Boolean)
        )];
        
        if (eventDepartments.length > 0) {
          setFilterOptions(prev => ({
            ...prev,
            departments: eventDepartments
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
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
    setIsVisible(true);
    
    // Load data on mount
    refreshEvents();
    fetchFilterOptions();
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setError('Loading timeout. Please refresh the page.');
        setLoading(false);
        isLoadingRef.current = false;
      }
    }, 30000);
    
    // Add focus event listener to refresh data when user returns to the page (with debouncing)
    const handleFocus = () => {
      // Only refresh if it's been more than 30 seconds since last refresh
      const lastRefresh = localStorage.getItem('lastEventsRefresh');
      const now = Date.now();
      if (!lastRefresh || (now - parseInt(lastRefresh)) > 30000) {
        localStorage.setItem('lastEventsRefresh', now.toString());
        handleManualRefresh();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timeoutId);
    };
  }, []); // Remove refreshEvents dependency to prevent infinite loop
  
  // Update filter options when events are loaded
  useEffect(() => {
    if (events.length > 0 && filterOptions.departments.length === 0) {
      // Simplified department extraction
      const eventDepartments = [...safeSet(
        safeMap(events, event => {
          if (event.departments && Array.isArray(event.departments)) {
            return event.departments;
          }
          if (event.department && typeof event.department === 'string') {
            return [event.department];
          }
          if (event.department && typeof event.department === 'object' && event.department.name) {
            return [event.department.name];
          }
          return [];
        }).flat().filter(Boolean)
      )];
      
      if (eventDepartments.length > 0) {
        setFilterOptions(prev => ({
          ...prev,
          departments: eventDepartments
        }));
      }
    }
  }, [events]); // Remove filterOptions.departments.length dependency





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

  // Server status check for 503 errors
  const checkServerStatus = async () => {
    try {
      console.log('🔍 Checking server status...');
      const response = await fetch('/api/health', { 
        method: 'GET'
      });
      
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Server is Online! 🟢',
          text: 'The backend server is now available. Refreshing events...',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Refresh events after a short delay
        setTimeout(() => {
          setError('');
          refreshEvents();
        }, 1000);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Server Still Offline 🔴',
          text: `Server responded with status: ${response.status}`,
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('❌ Server status check failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Server Still Offline 🔴',
        text: 'Unable to connect to the server. It may still be down.',
        confirmButtonText: 'OK'
      });
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

  // This useEffect was causing infinite loops - removed duplicate call

  const handleJoin = async (eventId) => {
    // Prevent multiple clicks
    if (loading) return;
    
    const event = events.find(e => e._id === eventId);
    if (!event) return;

    const eventDate = new Date(event.date);
    const eventDateTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
    const now = new Date();

    const result = await Swal.fire({
      title: 'Confirm Registration',
      html: `
        <div style="text-align: left;">
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${formatDatePhilippines(eventDate)}</p>
          <p><strong>Time:</strong> ${formatTimeRange12Hour(event.startTime, event.endTime)}</p>
          <p><strong>Location:</strong> ${event.location || 'TBD'}</p>
          <p><strong>Service Hours:</strong> ${event.hours} hours</p>
          ${event.requiresApproval ? `
          <br>
          <div className="approval-warning">
            <p className="approval-warning-title"><strong>⚠️ Approval Required:</strong></p>
            <p className="approval-warning-text">Your registration will be reviewed by staff/admin before you can participate.</p>
          </div>
          ` : ''}
          <br>
          <div className="important-reminders">
            <p className="important-reminders-title"><strong>📋 Important Reminders:</strong></p>
            <ul className="important-reminders-list">
              ${event.requiresApproval ? '<li>Wait for approval before timing in</li>' : ''}
              <li>You can time in 5 minutes before the event starts</li>
              <li>Time in window closes 30 minutes after event starts</li>
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

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleTimeIn = async (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (!event) return;

    const eventDate = new Date(event.date);
    
    // Parse startTime and endTime properly (handle timezone issues)
    const [startHour, startMinute] = (event.startTime || '00:00').split(':').map(Number);
    const [endHour, endMinute] = (event.endTime || '23:59').split(':').map(Number);
    
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(startHour, startMinute, 0, 0);
    
    const eventEndTime = new Date(eventDate);
    eventEndTime.setHours(endHour, endMinute, 0, 0);
    
    const now = new Date();

    // Allow time in 5 minutes before event starts
    const earliestTimeIn = new Date(eventDateTime.getTime() - 5 * 60 * 1000); // 5 minutes before
    if (now < earliestTimeIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Too Early to Time In',
        text: `You can time in starting from ${formatDateTimePhilippines(earliestTimeIn)} (5 minutes before event starts).`,
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    // Check if time-in window has closed (30 minutes after event starts)
    const latestTimeIn = new Date(eventDateTime.getTime() + 30 * 60 * 1000); // 30 minutes after
    if (now > latestTimeIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Time In Window Closed',
        text: `The time in window closed at ${formatDateTimePhilippines(latestTimeIn)} (30 minutes after event start).`,
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
    const event = events.find(e => e._id === eventId);
    if (!event) return;

    // Find user's attendance record
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const att = event.attendance?.find(a => {
      const attUserId = a.userId?._id || a.userId;
      return attUserId === user._id || attUserId === user.id;
    });

    // Check if user has timed in
    if (!att || !att.timeIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Time In Required',
        text: 'You must time in before you can time out.',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    // Check if user has already timed out
    if (att.timeOut) {
      Swal.fire({
        icon: 'info',
        title: 'Already Timed Out',
        text: 'You have already timed out for this event.',
        confirmButtonColor: '#6c757d'
      });
      return;
    }

    // Check if enough time has passed since time in (at least 5 minutes)
    const timeInDate = new Date(att.timeIn);
    const now = new Date();
    const timeDiff = now.getTime() - timeInDate.getTime();
    const minDuration = 5 * 60 * 1000; // 5 minutes

    if (timeDiff < minDuration) {
      const remainingTime = Math.ceil((minDuration - timeDiff) / (60 * 1000));
      Swal.fire({
        icon: 'warning',
        title: 'Too Soon to Time Out',
        text: `You must wait at least 5 minutes after time in. Please wait ${remainingTime} more minute(s).`,
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    // Check if event has ended (cannot time out after event ends)
    const eventDate = new Date(event.date);
    const [endHour, endMinute] = (event.endTime || '23:59').split(':').map(Number);
    const eventEndTime = new Date(eventDate);
    eventEndTime.setHours(endHour, endMinute, 0, 0);
    
    if (now > eventEndTime) {
      Swal.fire({
        icon: 'warning',
        title: 'Event Has Ended',
        text: `Cannot time out after event has ended. The event ended at ${formatDateTimePhilippines(eventEndTime)}.`,
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
      const eventsWithFilters = safeFilter(events, event => {
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
    
    return safeFilter(events, event => {
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
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    return events.filter(event => {
      // Search filter
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = filter === 'all' || filter === getEventStatus(event);
      
      // Department restriction filter (only for students)
      let matchesDepartment = true;
      if (role === 'Student') {
        const userDepartment = user.department;
        
        if (event.isForAllDepartments) {
          matchesDepartment = true;
        } else if (event.departments && event.departments.length > 0) {
          matchesDepartment = event.departments.includes(userDepartment);
        } else if (event.department) {
          matchesDepartment = event.department === userDepartment;
        } else {
          matchesDepartment = true;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [events, searchTerm, filter, role, user.department]);

  // Loading state
  if (loading) {
    return (
      <div className="event-list-page">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <button onClick={handleManualRefresh} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const is503Error = error.includes('503') || error.includes('Backend server is currently unavailable');
    
    return (
      <div className="event-list-page">
        <div className="error-section">
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          
          {is503Error && (
            <div className="error-503-warning">
              <div className="warning-icon">🚨</div>
              <div className="warning-content">
                <h4>Backend Server Unavailable</h4>
                <p>The backend server is currently down or experiencing issues. This is not a problem with your device or internet connection.</p>
                <div className="server-status-info">
                  <strong>Server Status:</strong> 🔴 Offline
                  <br />
                  <strong>Error Code:</strong> 503 Service Unavailable
                  <br />
                  <strong>What This Means:</strong> The application server is temporarily unavailable
                </div>
              </div>
            </div>
          )}
          
          <div className="error-actions">
            <button onClick={handleManualRefresh} className="refresh-button primary">
              🔄 Try Again
            </button>
            {error.includes('timeout') && (
              <button onClick={() => window.location.reload()} className="refresh-button secondary">
                🔄 Refresh Page
              </button>
            )}
                      {is503Error && (
            <>
              <button onClick={() => window.location.reload()} className="refresh-button secondary">
                🔄 Refresh Page
              </button>
              <button onClick={() => checkServerStatus()} className="refresh-button secondary">
                🔍 Check Server Status
              </button>
            </>
          )}
          </div>
          
          <div className="error-help">
            <p><strong>💡 Tips:</strong></p>
            <ul>
              {is503Error ? (
                <>
                  <li>This is a server-side issue, not your fault</li>
                  <li>The backend team has been notified</li>
                  <li>Try again in a few minutes</li>
                  <li>Check if the service is back online</li>
                </>
              ) : (
                <>
                  <li>Check your internet connection</li>
                  <li>The server might be temporarily slow</li>
                  <li>Try refreshing the page</li>
                </>
              )}
            </ul>
          </div>
          
          <div className="debug-info">
            <strong>Debug Info:</strong>
            <div>Role: {role}</div>
            <div>User: {user._id || user.id || 'No user ID'}</div>
            <div>Events loaded: {events.length}</div>
            <div>Loading state: {loading ? 'Yes' : 'No'}</div>
            {is503Error && (
              <div className="server-error">
                <strong>Server Error:</strong> HTTP 503 Service Unavailable
              </div>
            )}
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

        {/* Action Buttons Section */}
        <div className="action-buttons-section">
          <button 
            onClick={handleManualRefresh} 
            className="refresh-button"
            title="Refresh Events"
          >
            <FaSyncAlt className="refresh-icon" />
            Refresh Events
          </button>
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
                {(!events || events.length === 0) && <span className="disabled-hint"> (No Events)</span>}
              </button>
              
              {/* PDF Info Badge */}
              {events && events.length > 0 && getEventsWithPdfFilters().length > 0 && (
                <div className="pdf-info-badge">
                  📊 {getEventsWithPdfFilters().length} events
                </div>
              )}
            </div>
            
            {/* Status Messages */}
            {(!events || events.length === 0) && (
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
                
                const attendance = safeGetAttendance(event);
                const att = attendance.find(a => {
                  const attUserId = a.userId?._id || a.userId;
                  return attUserId === userId;
                });
                
                const isJoined = attendance.some(a => {
                  const attUserId = a.userId?._id || a.userId;
                  return attUserId === userId;
                });

                // Calculate available slots and status - count all approved participants
                const maxParticipants = typeof event.maxParticipants === 'number' ? event.maxParticipants : 0;
                const approvedAttendanceCount = safeFilter(attendance, a => 
                  a.registrationApproved === true || 
                  a.status === 'Approved' || 
                  a.status === 'Attended' || 
                  a.status === 'Completed'
                ).length;
                
                // Debug logging for participant count
                console.log(`🔍 Event "${event.title}" participant count:`, {
                  totalAttendance: attendance.length,
                  approvedCount: approvedAttendanceCount,
                  attendanceData: attendance.map(a => ({
                    registrationApproved: a.registrationApproved,
                    status: a.status,
                    userId: a.userId?._id || a.userId
                  }))
                });
                const pendingRegistrationsCount = safeFilter(attendance, a => 
                  (a.registrationApproved === false && a.status === 'Pending') ||
                  (a.status === 'Pending' && !a.registrationApproved)
                ).length;
                const availableSlots = maxParticipants > 0 ? maxParticipants - approvedAttendanceCount : 'Unlimited';
                
                // Check if event is available for registration (not completed, has slots, time hasn't passed)
                // Allow registration before event starts - only block after event ends
                const now = new Date();
                const eventDate = new Date(event.date);
                const eventStartTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
                const eventEndTime = new Date(`${eventDate.toDateString()} ${event.endTime || '23:59'}`);
                const isTimeExpired = eventEndTime < now;
                const hasNotStarted = eventStartTime > now;
                const hasAvailableSlots = maxParticipants === 0 || availableSlots > 0;
                const eventStatus = getEventStatus(event);
                const isAvailable = eventStatus !== 'completed' && event.status !== 'Completed' && hasAvailableSlots && !isTimeExpired;

                return (
                  <div key={event._id} className="event-card">
                    {/* Event Image */}
                    <div className="event-image-horizontal">
                      <img 
                        src={getEventImageUrl(event.image, event._id)} 
                        alt={event.title}
                        className="event-image-img-horizontal"
                        loading="lazy"
                        onError={(e) => {
                          // Simply hide the broken image - let CSS handle the placeholder
                          e.target.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          // Image loaded successfully
                          e.target.style.opacity = '1';
                        }}
                        style={{ 
                          opacity: 1, 
                          transition: 'opacity 0.3s ease-in-out' 
                        }}
                      />
                      <div className="event-image-placeholder" style={{ display: 'none' }}>
                        <FaCalendar />
                      </div>
                      {/* Status Badge */}
                      {eventStatus === 'completed' && (
                        <div className="status-badge-horizontal completed">
                          <span className="status-icon">✅</span>
                          <span className="status-text">completed</span>
                        </div>
                      )}
                    </div>
                   
                    {/* Event Content */}
                    <div className="event-content-horizontal">
                      <h3 className="event-title-horizontal">{event.title}</h3>
                      
                      {/* Participants Count */}
                      <div className="participants-count-horizontal">
                        <FaUsers className="participants-icon" />
                        <span>{attendance.filter(a => 
                          a.registrationApproved === true || 
                          a.status === 'Approved' || 
                          a.status === 'Attended' || 
                          a.status === 'Completed' ||
                          a.status === 'Pending' // Include pending registrations in count
                        ).length} registrations</span>
                      </div>
                      
                      {/* Event Details */}
                      <div className="event-details-horizontal">
                        <div className="detail-item">
                          <span className="detail-label">Date:</span>
                          <span className="detail-value">{formatDatePhilippines(event.date)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Time:</span>
                          <span className="detail-value">{formatTimeRange12Hour(event.startTime, event.endTime)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">{event.location || 'TBD'}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="event-description-horizontal">{event.description}</p>

                      {/* Action Button */}
                      <div className="event-action-horizontal">
                        {role === 'Student' && !isJoined && (
                          <>
                            {isAvailable ? (
                              <button 
                                className="join-chat-button"
                                onClick={() => handleJoin(event._id)}
                                disabled={loading}
                              >
                                <span className="button-icon"></span>
                                Join Event
                              </button>
                            ) : (
                              <div className="event-unavailable-horizontal">
                                {eventStatus === 'completed' ? (
                                  <span className="unavailable-reason">Event Completed</span>
                                ) : event.status === 'Completed' ? (
                                  <span className="unavailable-reason">Event Completed</span>
                                ) : isTimeExpired ? (
                                  <span className="unavailable-reason">Registration Closed</span>
                                ) : (
                                  <span className="unavailable-reason">No Available Slots</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        
                        {role === 'Student' && isJoined && (
                          <div className="student-event-actions">
                            {/* Time Status Display */}
                            <div className="time-status-display">
                              {att && (
                                <>
                                  {att.timeIn && (
                                    <div className="time-status-item time-in-status">
                                      <span className="status-icon">⏰</span>
                                      <span className="status-text">
                                        Time In: {new Date(att.timeIn).toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit',
                                          hour12: true 
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {att.timeOut && (
                                    <div className="time-status-item time-out-status">
                                      <span className="status-icon">🏁</span>
                                      <span className="status-text">
                                        Time Out: {new Date(att.timeOut).toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit',
                                          hour12: true 
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {att.timeIn && !att.timeOut && (
                                    <div className="time-status-item active-status">
                                      <span className="status-icon">🟢</span>
                                      <span className="status-text">Currently Active</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="student-action-buttons">
                              {/* Time In/Out Buttons */}
                              {!att?.timeIn && (
                                <button 
                                  className="time-action-button time-in-button"
                                  onClick={() => handleTimeIn(event._id)}
                                  disabled={loading}
                                >
                                  <span className="button-icon">⏰</span>
                                  Time In
                                </button>
                              )}
                              
                              {att?.timeIn && !att?.timeOut && (
                                <button 
                                  className="time-action-button time-out-button"
                                  onClick={() => handleTimeOut(event._id)}
                                  disabled={loading}
                                >
                                  <span className="button-icon">🏁</span>
                                  Time Out
                                </button>
                              )}

                              {/* Join Chat Button */}
                              <button 
                                className="join-chat-button"
                                onClick={() => navigate(`/events/${event._id}/chat`)}
                              >
                                <span className="button-icon">💬</span>
                                Join Chat
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {(role === 'Admin' || role === 'Staff') && (
                          <div className="admin-staff-event-actions">
                            {/* Event Statistics */}
                            <div className="event-statistics">
                              <div className="stat-item">
                                <span className="stat-label">Participants:</span>
                                <span className="stat-value">{approvedAttendanceCount}</span>
                                {maxParticipants > 0 && (
                                  <span className="stat-max">/ {maxParticipants}</span>
                                )}
                              </div>
                              {pendingRegistrationsCount > 0 && (
                                <div className="stat-item pending-stat">
                                  <span className="stat-label">Pending:</span>
                                  <span className="stat-value">{pendingRegistrationsCount}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="admin-staff-buttons">
                              <button 
                                className="admin-action-button view-button"
                                onClick={() => navigate(`/events/${event._id}`)}
                              >
                                View Details
                              </button>
                              
                              <button 
                                className="admin-action-button participants-button"
                                onClick={() => navigate(`/events/${event._id}/participants`)}
                              >
                                <span className="button-icon">👥</span>
                                Manage Participants
                              </button>
                            </div>
                          </div>
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