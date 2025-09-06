// backend/controllers/eventController.js

const Event = require('../models/Event');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { getImageInfo, hasFile } = require('../utils/mongoFileStorage');
const { generateEventRegistrationLink } = require('../utils/emailLinkGenerator');



// Health check endpoint
exports.healthCheck = async (req, res) => {
  try {
    console.log('=== EVENTS HEALTH CHECK ===');
    
    // Check Event model availability
    const eventModelStatus = !!Event;
    console.log('Event model available:', eventModelStatus);
    
    // Check database connection
    const { mongoose, getLazyConnection } = require('../config/db');
    let dbStatus = 'disconnected';
    let dbConnected = false;
    
    try {
      if (mongoose.connection.readyState === 1) {
        dbStatus = 'connected';
        dbConnected = true;
      } else {
        // Try lazy connection with timeout
        const connectionPromise = getLazyConnection();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), 3000);
        });
        
        dbConnected = await Promise.race([connectionPromise, timeoutPromise]);
        dbStatus = dbConnected ? 'connected' : 'failed';
      }
    } catch (error) {
      console.error('Health check DB error:', error.message);
      dbStatus = 'error';
      dbConnected = false;
    }
    
    // Try a simple query to test functionality
    let queryStatus = 'not_tested';
    if (dbConnected && Event) {
      try {
        const count = await Event.countDocuments().maxTimeMS(3000);
        queryStatus = 'working';
        console.log('Events count:', count);
      } catch (error) {
        queryStatus = 'failed';
        console.error('Health check query error:', error.message);
      }
    }
    
    const healthData = {
      status: dbConnected && eventModelStatus && queryStatus === 'working' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      components: {
        eventModel: eventModelStatus,
        database: {
          status: dbStatus,
          connected: dbConnected,
          readyState: mongoose.connection.readyState
        },
        query: queryStatus
      },
      message: dbConnected && eventModelStatus && queryStatus === 'working' 
        ? 'Events service is running normally' 
        : 'Events service has issues'
    };
    
    console.log('Health check result:', healthData);
    
    if (healthData.status === 'OK') {
      res.json(healthData);
    } else {
      res.status(503).json(healthData);
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get All Events - Ultra-optimized version
exports.getAllEvents = async (req, res) => {
  try {
    console.log('=== GET ALL EVENTS (OPTIMIZED) ===');
    console.log('User:', req.user ? 'Authenticated' : 'Not authenticated');
    console.log('User role:', req.user?.role || 'Unknown');
    
    // Immediate timeout protection for the entire function
    const functionTimeout = setTimeout(() => {
      console.error('❌ Function timeout - returning empty response');
      res.json({ 
        events: [],
        message: 'Request timeout - server overloaded',
        totalEvents: 0,
        warning: 'Please try again later'
      });
    }, 15000); // 15 second total timeout for slow server
    
    // Check if Event model is available
    if (!Event) {
      clearTimeout(functionTimeout);
      console.error('Event model not available');
      return res.status(500).json({ 
        message: 'Event model not available',
        error: 'Database model not loaded'
      });
    }
    
    // Quick database connection check with aggressive timeout
    const { mongoose, getLazyConnection } = require('../config/db');
    let isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      console.log('🔄 Quick database connection attempt...');
      try {
        const connectionPromise = getLazyConnection();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 3000); // Increased to 3 seconds
        });
        
        isConnected = await Promise.race([connectionPromise, timeoutPromise]);
      } catch (error) {
        console.error('❌ Quick connection failed:', error.message);
        isConnected = false;
      }
    }
    
    if (!isConnected) {
      clearTimeout(functionTimeout);
      console.error('Database not connected, returning empty events list');
      return res.json({ 
        events: [],
        message: 'Unable to load events at this time. Please try again later.',
        totalEvents: 0,
        error: 'SERVICE_TEMPORARILY_UNAVAILABLE'
      });
    }
    
    // Quick user role check - handle both authenticated and public requests
    const userRole = req.user?.role || req.userInfo?.role || 'Public';
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    
    console.log('👤 User details:', {
      userRole,
      userId,
      hasUser: !!req.user,
      userInfo: req.userInfo
    });
    
    // Build minimal query
    let query = {};
    if (userRole === 'Student') {
      query.isVisibleToStudents = true;
      query.status = { $ne: 'Disabled' };
      console.log('🎓 Student query filters applied');
    } else if (userRole === 'Public') {
      // For public requests, show only visible events
      query.status = { $ne: 'Disabled' };
      console.log('🌐 Public query filters applied');
    } else {
      console.log('👨‍💼 Admin/Staff - no filters applied, showing all events');
    }
    
    console.log('🔍 Final query:', JSON.stringify(query, null, 2));
    
    // Test: Try a simple query first to see if Event model works
    try {
      const testCount = await Event.countDocuments({});
      console.log(`🧪 Test query - Total events in collection: ${testCount}`);
    } catch (testError) {
      console.error('❌ Test query failed:', testError.message);
    }
    
    // Ultra-fast query with maximum timeout protection
    let events = [];
    try {
      // Single ultra-optimized query - include attendance field for frontend
      const queryPromise = Event.find(query)
        .select('title description date startTime endTime location hours maxParticipants department departments isForAllDepartments status isVisibleToStudents requiresApproval publicRegistrationToken isPublicRegistrationEnabled createdAt attendance')
        .sort({ createdAt: -1 }) // Single field sort for speed
        .lean()
        .limit(15) // Reasonable limit
        .maxTimeMS(10000); // Increased to 10 seconds for slow server
      
      // Single timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 12000);
      });
      
      events = await Promise.race([queryPromise, timeoutPromise]);
      console.log(`✅ Found ${events.length} events`);
      
      // Debug: Log first few events to see what we got
      if (events.length > 0) {
        console.log('📊 Sample events:', events.slice(0, 2).map(e => ({
          id: e._id,
          title: e.title,
          status: e.status,
          isVisibleToStudents: e.isVisibleToStudents,
          date: e.date
        })));
      } else {
        console.log('❌ No events found - checking if this is expected...');
        
        // Try a simple count query to see if there are any events at all
        try {
          const totalCount = await Event.countDocuments({});
          console.log(`📊 Total events in database: ${totalCount}`);
          
          if (totalCount > 0) {
            console.log('⚠️ Events exist in DB but query returned none - checking query conditions...');
            
            // Check if events match the query conditions
            const allEvents = await Event.find({}).select('title status isVisibleToStudents').limit(5);
            console.log('📋 Sample events from DB:', allEvents.map(e => ({
              title: e.title,
              status: e.status,
              isVisibleToStudents: e.isVisibleToStudents
            })));
          }
        } catch (countError) {
          console.error('❌ Count query failed:', countError.message);
        }
      }
      
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
      
      // Emergency fallback - absolute minimal query
      try {
        const emergencyPromise = Event.find({})
          .select('title date status isVisibleToStudents attendance')
          .lean()
          .limit(5)
          .maxTimeMS(5000); // 5 second emergency timeout
        
        const emergencyTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Emergency timeout')), 8000);
        });
        
        events = await Promise.race([emergencyPromise, emergencyTimeoutPromise]);
        console.log(`✅ Emergency fallback found ${events.length} events`);
        
      } catch (emergencyError) {
        console.error('❌ Emergency fallback failed:', emergencyError.message);
        clearTimeout(functionTimeout);
        return res.json({ 
          events: [],
          message: 'Server overloaded - please try again later',
          totalEvents: 0,
          error: 'TIMEOUT'
        });
      }
    }
    
    // Minimal processing for maximum speed
    const eventsWithUrls = events.map(event => {
      const eventObj = { ...event };
      
      // Ensure attendance field exists (frontend expects this)
      if (!eventObj.attendance) {
        eventObj.attendance = [];
      }
      
      // Only add registration URL if token exists
      if (event.publicRegistrationToken) {
        eventObj.publicRegistrationUrl = generateEventRegistrationLink(event.publicRegistrationToken);
      }
      
      // Skip image processing for speed
      eventObj.imageUrl = null;
      
      return eventObj;
    });
    
    // Clear the function timeout since we're about to respond
    clearTimeout(functionTimeout);
    
    console.log(`✅ Returning ${eventsWithUrls.length} events successfully`);
    res.json(eventsWithUrls);
  } catch (err) {
    console.error('❌ Error in getAllEvents:', err);
    
    // Clear any pending timeout
    if (typeof functionTimeout !== 'undefined') {
      clearTimeout(functionTimeout);
    }
    
    // Handle specific error types with fast responses
    if (err.name === 'MongoTimeoutError' || err.message.includes('timeout')) {
      console.error('⏰ Database timeout error');
      return res.status(504).json({ 
        events: [],
        message: 'Request timeout - server overloaded', 
        error: 'TIMEOUT',
        totalEvents: 0
      });
    }
    
    if (err.name === 'MongoNetworkError' || err.message.includes('network')) {
      console.error('🌐 Database network error');
      return res.status(503).json({ 
        events: [],
        message: 'Database temporarily unavailable', 
        error: 'NETWORK_ERROR',
        totalEvents: 0
      });
    }
    
    // Generic error handling - return empty events instead of error
    res.json({ 
      events: [],
      message: 'Temporary service issue - please try again',
      error: 'SERVICE_ERROR',
      totalEvents: 0
    });
  }
};

// Get Event Details
exports.getEventDetails = async (req, res) => {
  try {
    console.log('=== GET EVENT DETAILS ===');
    console.log('Event ID:', req.params.eventId);
    console.log('User:', req.user ? 'Authenticated' : 'Not authenticated');
    console.log('User role:', req.user?.role || 'Unknown');
    console.log('User ID:', req.user?.userId || req.user?.id || req.user?._id || 'Unknown');
    
    // Check database connection first with fallback
    const { mongoose, getLazyConnection } = require('../config/db');
    let isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      console.log('🔄 Database not connected, attempting lazy connection...');
      try {
        const connectionPromise = getLazyConnection();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database connection timeout')), 8000);
        });
        
        isConnected = await Promise.race([connectionPromise, timeoutPromise]);
      } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        // Return a more user-friendly error instead of 503
        return res.status(500).json({ 
          message: 'Unable to fetch event details at this time. Please try again later.',
          error: 'SERVICE_TEMPORARILY_UNAVAILABLE'
        });
      }
    }
    
    if (!isConnected) {
      console.error('❌ Database not available');
      return res.status(500).json({ 
        message: 'Unable to fetch event details at this time. Please try again later.',
        error: 'SERVICE_TEMPORARILY_UNAVAILABLE'
      });
    }
    
    // Add timeout protection for the query
    const queryPromise = Event.findById(req.params.eventId)
      .populate('createdBy', 'name')
      .populate('attendance.userId', 'name email department academicYear')
      .maxTimeMS(10000); // 10 second timeout for the query
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), 10000);
    });
    
    const event = await Promise.race([queryPromise, timeoutPromise]);
    
    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    console.log('✅ Event found:', {
      id: event._id,
      title: event.title,
      date: event.date,
      isVisibleToStudents: event.isVisibleToStudents,
      status: event.status,
      attendanceCount: event.attendance?.length || 0
    });
    
    // For public access (no authentication), only show basic event info
    if (!req.user) {
      console.log('⚠️ Public access - limited information');
      
      // Check if event is public and active
      if (event.status === 'Disabled') {
        return res.status(403).json({ 
          message: 'This event is currently disabled.',
          error: 'EVENT_DISABLED'
        });
      }
      
      // Return limited event data for public viewing
      const publicEventData = {
        _id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        hours: event.hours,
        maxParticipants: event.maxParticipants,
        department: event.department,
        departments: event.departments,
        isForAllDepartments: event.isForAllDepartments,
        requiresApproval: event.requiresApproval,
        isPublicRegistrationEnabled: event.isPublicRegistrationEnabled,
        publicRegistrationToken: event.publicRegistrationToken,
        publicRegistrationUrl: event.publicRegistrationToken ? generateEventRegistrationLink(event.publicRegistrationToken) : null,
        status: event.status,
        image: (typeof event.image === 'string' || !event.image || !event.image.data || event.image.data.length === 0) ? null : event.image,
        imageUrl: (typeof event.image === 'string' || !event.image || !event.image.data || event.image.data.length === 0) ? null : (hasFile(event.image) ? `/api/files/event-image/${event._id}` : null),
        // Don't include attendance data for public users
        attendanceCount: event.attendance?.length || 0
      };
      
      return res.json(publicEventData);
    }
    
    // For authenticated users, check access control
    const userRole = req.user.role || req.userInfo?.role;
    const userId = req.user.userId || req.user.id || req.user._id;
    
    console.log('🔍 Access control check - Role:', userRole, 'User ID:', userId);
    
    if (userRole === 'Student') {
      // Students can only see events that are visible and not disabled
      // UNLESS they are already approved for the event (to preserve their access)
      if (!event.isVisibleToStudents || event.status === 'Disabled') {
        console.log('⚠️ Event not visible to students or disabled');
        
        // Check if student is already approved for this event
        const existingAttendance = event.attendance.find(
          a => a.userId && a.userId.toString() === userId && a.registrationApproved === true
        );
        
        if (!existingAttendance) {
          console.log('❌ Student not approved for this event - access denied');
          return res.status(403).json({ 
            message: 'This event is not available for viewing. It may be disabled or not visible to students.',
            error: 'EVENT_NOT_ACCESSIBLE',
            eventStatus: event.status,
            isVisibleToStudents: event.isVisibleToStudents
          });
        } else {
          console.log('✅ Student has approved attendance - allowing access');
        }
      } else {
        console.log('✅ Event is visible to students');
      }
    } else {
      console.log('✅ Admin/Staff user - full access granted');
    }
    
    console.log('✅ Access granted - sending event details');
    res.json(event);
  } catch (err) {
    console.error('❌ Error in getEventDetails:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid event ID format.',
        error: 'INVALID_ID_FORMAT'
      });
    }
    
    if (err.message === 'Database connection timeout' || err.message === 'Query timeout') {
      return res.status(500).json({ 
        message: 'Unable to fetch event details at this time. Please try again later.',
        error: 'SERVICE_TEMPORARILY_UNAVAILABLE'
      });
    }
    
    if (err.name === 'MongoNetworkTimeoutError' || err.name === 'MongoServerError') {
      return res.status(500).json({ 
        message: 'Unable to fetch event details at this time. Please try again later.',
        error: 'SERVICE_TEMPORARILY_UNAVAILABLE'
      });
    }
    
    res.status(500).json({ 
      message: 'Error fetching event details.', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Create Event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, hours, maxParticipants, department, departments, isForAllDepartments, requiresApproval, isPublicRegistrationEnabled } = req.body;
    
    // Parse departments if it's a JSON string
    let parsedDepartments = [];
    if (departments) {
      try {
        if (typeof departments === 'string') {
          parsedDepartments = JSON.parse(departments);
        } else if (Array.isArray(departments)) {
          parsedDepartments = departments;
        }
      } catch (err) {
        console.error('Error parsing departments:', err);
        parsedDepartments = [];
      }
    }
    
    const eventData = {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      hours: parseInt(hours) || 0,
      maxParticipants: parseInt(maxParticipants) || 0,
      department, // Keep for backward compatibility
      departments: parsedDepartments, // Parsed departments array
      isForAllDepartments: isForAllDepartments === 'true' || isForAllDepartments === true,
      requiresApproval: requiresApproval !== 'false' && requiresApproval !== false, // Default to true
      isPublicRegistrationEnabled: isPublicRegistrationEnabled === 'true' || isPublicRegistrationEnabled === true,
      isVisibleToStudents: true, // Default to visible for students
      createdBy: req.user.userId,
      status: 'Active'
    };

    // Handle image upload
    if (req.file) {
      // Store image data in MongoDB
      const imageInfo = getImageInfo(req.file);
      eventData.image = imageInfo;
    }

    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json(event);
  } catch (err) {
    console.error('Error in createEvent:', err);
    res.status(500).json({ message: 'Error creating event.', error: err.message });
  }
};

// Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, hours, maxParticipants, department, departments, isForAllDepartments, requiresApproval, isPublicRegistrationEnabled, status } = req.body;
    
    // Parse departments if it's a JSON string
    let parsedDepartments = [];
    if (departments) {
      try {
        if (typeof departments === 'string') {
          parsedDepartments = JSON.parse(departments);
        } else if (Array.isArray(departments)) {
          parsedDepartments = departments;
        }
      } catch (err) {
        console.error('Error parsing departments:', err);
        parsedDepartments = [];
      }
    }
    
    const updateData = {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      hours: parseInt(hours) || 0,
      maxParticipants: parseInt(maxParticipants) || 0,
      department, // Keep for backward compatibility
      departments: parsedDepartments, // Parsed departments array
      isForAllDepartments: isForAllDepartments === 'true' || isForAllDepartments === true,
      requiresApproval: requiresApproval !== 'false' && requiresApproval !== false, // Default to true
      isPublicRegistrationEnabled: isPublicRegistrationEnabled === 'true' || isPublicRegistrationEnabled === true,
      status
    };

    // Generate registration token if public registration is enabled and token doesn't exist
    if (updateData.isPublicRegistrationEnabled && !updateData.publicRegistrationToken) {
      updateData.publicRegistrationToken = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // If public registration is being enabled, ensure we have a token
    if (updateData.isPublicRegistrationEnabled) {
      // Check if the current event has a token
      const currentEvent = await Event.findById(req.params.eventId);
      if (!currentEvent.publicRegistrationToken) {
        updateData.publicRegistrationToken = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
    }

    // Handle image upload
    if (req.file) {
      // Store new image data in MongoDB
      const imageInfo = getImageInfo(req.file);
      updateData.image = imageInfo;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      updateData,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.json(event);
  } catch (err) {
    console.error('Error in updateEvent:', err);
    res.status(500).json({ message: 'Error updating event.', error: err.message });
  }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // No need to delete image from local storage - it's stored in MongoDB
    // The image data will be automatically removed when the event is deleted

    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Error in deleteEvent:', err);
    res.status(500).json({ message: 'Error deleting event.', error: err.message });
  }
};

// Get Event Capacity Status
exports.getEventCapacityStatus = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const approvedAttendees = event.attendance.filter(
      a => a.registrationApproved === true
    ).length;
    
    const pendingRegistrations = event.attendance.filter(
      a => a.registrationApproved === false && a.status === 'Pending'
    ).length;
    
    const totalRegistrations = event.attendance.length;
    const availableSlots = event.maxParticipants > 0 ? event.maxParticipants - approvedAttendees : 'Unlimited';
    const isFull = event.maxParticipants > 0 ? approvedAttendees >= event.maxParticipants : false;

    res.json({
      eventId: event._id,
      title: event.title,
      maxParticipants: event.maxParticipants,
      approvedAttendees,
      pendingRegistrations,
      totalRegistrations,
      availableSlots,
      isFull,
      requiresApproval: event.requiresApproval
    });
  } catch (err) {
    console.error('Error in getEventCapacityStatus:', err);
    res.status(500).json({ message: 'Error fetching event capacity status.', error: err.message });
  }
};

// Join Event
exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if event is active and visible to students
    if (event.status !== 'Active') {
      return res.status(400).json({ message: 'Event is not active.' });
    }
    
    if (!event.isVisibleToStudents) {
      return res.status(400).json({ message: 'This event is not available for student registration.' });
    }

    // Get user details to check department access
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check department access
    if (!event.isForAllDepartments) {
      if (event.departments && event.departments.length > 0) {
        // Check if user's department is in the allowed departments
        if (!event.departments.includes(user.department)) {
          return res.status(403).json({ 
            message: 'This event is not available for your department.' 
          });
        }
      } else if (event.department && event.department !== user.department) {
        // Backward compatibility check
        return res.status(403).json({ 
          message: 'This event is not available for your department.' 
        });
      }
    }

    // Check if user is already registered
    const existingAttendance = event.attendance.find(
      a => a.userId.toString() === req.user.userId
    );

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already registered for this event.' });
    }

    // Check if event is full - only count approved registrations
    if (event.maxParticipants > 0) {
      const approvedAttendees = event.attendance.filter(
        a => a.registrationApproved === true
      ).length;
      
      if (approvedAttendees >= event.maxParticipants) {
        return res.status(400).json({ 
          message: 'Event is full. All approved slots have been taken. You can still register and wait for approval if any approved registrations are cancelled.' 
        });
      }
    }

    // Determine initial status based on whether approval is required
    let initialStatus = 'Pending';
    let registrationApproved = false;
    
    if (!event.requiresApproval) {
      initialStatus = 'Attended';
      registrationApproved = true;
    }

    // Add user to attendance
    event.attendance.push({
      userId: req.user.userId,
      status: initialStatus,
      registeredAt: new Date(),
      registrationApproved: registrationApproved
    });

    await event.save();
    
    if (event.requiresApproval) {
      res.json({ 
        message: 'Successfully registered for event. Your registration is pending approval from staff/admin.',
        requiresApproval: true
      });
    } else {
      res.json({ 
        message: 'Successfully joined event. No approval required.',
        requiresApproval: false
      });
    }
  } catch (err) {
    console.error('Error in joinEvent:', err);
    res.status(500).json({ message: 'Error joining event.', error: err.message });
  }
};

// Time In
exports.timeIn = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    
    // Get user ID from request (handle different formats)
    const requestUserId = req.user.userId || req.user.id || req.user._id;
    
    // Verify user is trying to time in for themselves
    if (requestUserId !== userId) {
      return res.status(403).json({ message: 'Can only time in for yourself.' });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(
      a => a.userId.toString() === userId || (a.userId && a.userId.toString() === userId)
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Not registered for this event.' });
    }

    // Check if registration has been approved
    if (event.requiresApproval && !attendance.registrationApproved) {
      return res.status(400).json({ 
        message: 'Your registration is still pending approval. Please wait for staff/admin approval before timing in.' 
      });
    }

    if (attendance.timeIn) {
      return res.status(400).json({ message: 'Already timed in.' });
    }

    // Add validation for reasonable time in (not too early or too late)
    const now = new Date();
    const eventDate = new Date(event.date);
    const eventStartTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
    const eventEndTime = new Date(`${eventDate.toDateString()} ${event.endTime || '23:59'}`);
    
    // Allow time in up to 1 hour before event starts and up to 1 hour after event ends
    const earliestTimeIn = new Date(eventStartTime.getTime() - 60 * 60 * 1000); // 1 hour before
    const latestTimeIn = new Date(eventEndTime.getTime() + 60 * 60 * 1000); // 1 hour after
    
    if (now < earliestTimeIn) {
      return res.status(400).json({ 
        message: `Too early to time in. You can time in starting from ${earliestTimeIn.toLocaleString()}.` 
      });
    }
    
    if (now > latestTimeIn) {
      return res.status(400).json({ 
        message: `Too late to time in. The time in window has closed.` 
      });
    }

    attendance.timeIn = now;
    await event.save();

    res.json({ message: 'Time in recorded successfully.' });
  } catch (err) {
    console.error('Error in timeIn:', err);
    res.status(500).json({ message: 'Error recording time in.', error: err.message });
  }
};

// Time Out
exports.timeOut = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    
    // Get user ID from request (handle different formats)
    const requestUserId = req.user.userId || req.user.id || req.user._id;
    
    // Verify user is trying to time out for themselves
    if (requestUserId !== userId) {
      return res.status(403).json({ message: 'Can only time out for yourself.' });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(
      a => a.userId.toString() === userId || (a.userId && a.userId.toString() === userId)
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Not registered for this event.' });
    }

    // Check if registration has been approved
    if (event.requiresApproval && !attendance.registrationApproved) {
      return res.status(400).json({ 
        message: 'Your registration is still pending approval. Please wait for staff/admin approval before timing out.' 
      });
    }

    if (!attendance.timeIn) {
      return res.status(400).json({ message: 'Must time in before timing out.' });
    }

    if (attendance.timeOut) {
      return res.status(400).json({ message: 'Already timed out.' });
    }

    // Add validation for reasonable time out (must be after time in)
    const now = new Date();
    const timeInDate = new Date(attendance.timeIn);
    
    // Check if time out is at least 5 minutes after time in
    const minDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (now.getTime() - timeInDate.getTime() < minDuration) {
      return res.status(400).json({ 
        message: 'Time out must be at least 5 minutes after time in.' 
      });
    }
    
    // Check if time out is not too far in the future (within 24 hours of time in)
    const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (now.getTime() - timeInDate.getTime() > maxDuration) {
      return res.status(400).json({ 
        message: 'Time out cannot be more than 24 hours after time in.' 
      });
    }

    attendance.timeOut = now;
    await event.save();

    res.json({ message: 'Time out recorded successfully.' });
  } catch (err) {
    console.error('Error in timeOut:', err);
    res.status(500).json({ message: 'Error recording time out.', error: err.message });
  }
};

// Get Event Participants
exports.getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email department academicYear');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.json(event.attendance);
  } catch (err) {
    console.error('Error in getEventParticipants:', err);
    res.status(500).json({ message: 'Error fetching participants.', error: err.message });
  }
};

// Approve Attendance
exports.approveAttendance = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(a => 
      a.userId.toString() === userId || (a.userId && a.userId.toString() === userId)
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // Check if student has timed out
    if (!attendance.timeOut) {
      return res.status(400).json({ 
        message: 'Cannot approve attendance. Student has not timed out yet.' 
      });
    }

    attendance.status = 'Approved';
    // Fix: Get user ID from the correct field
    const currentUserId = req.user.id || req.user.userId || req.user._id;
    attendance.approvedBy = currentUserId;
    attendance.approvedAt = new Date();

    // Calculate hours for community service
    const approvedUser = await User.findById(userId);
    if (approvedUser) {
      // Ensure hours is a number and add to existing hours
      const currentHours = parseFloat(approvedUser.communityServiceHours || 0);
      const eventHours = parseFloat(event.hours || 0);
      approvedUser.communityServiceHours = currentHours + eventHours;
      
      console.log(`✅ Adding ${eventHours} hours to user ${approvedUser._id}. Current: ${currentHours}, New total: ${approvedUser.communityServiceHours}`);
      
      await approvedUser.save();
    }

    await event.save();
    res.json({ 
      message: 'Attendance approved successfully.',
      hoursAdded: event.hours,
      totalHours: approvedUser ? approvedUser.communityServiceHours : 0
    });
  } catch (err) {
    console.error('Error in approveAttendance:', err);
    res.status(500).json({ message: 'Error approving attendance.', error: err.message });
  }
};


// Disapprove Attendance
exports.disapproveAttendance = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { reason } = req.body; // Get the reason from the request body
    
    // Check if the reason is provided
    if (!reason) {
      return res.status(400).json({ message: 'Reason for disapproval is required.' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(a => 
      a.userId.toString() === userId || (a.userId && a.userId.toString() === userId)
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // If attendance was previously approved, subtract the hours
    if (attendance.status === 'Approved') {
      const user = await User.findById(userId);
      if (user) {
        const currentHours = parseFloat(user.communityServiceHours || 0);
        const eventHours = parseFloat(event.hours || 0);
        user.communityServiceHours = Math.max(0, currentHours - eventHours);
        
        console.log(`❌ Subtracting ${eventHours} hours from user ${user._id}. Current: ${currentHours}, New total: ${user.communityServiceHours}`);
        
        await user.save();
      }
    }

    attendance.status = 'Disapproved';
    attendance.reason = reason; // Store the reason for disapproval
    // Fix: Get user ID from the correct field
    const currentUserId = req.user.id || req.user.userId || req.user._id;
    attendance.approvedBy = currentUserId;
    attendance.approvedAt = new Date();

    await event.save();
    res.json({ message: 'Attendance disapproved successfully.' });
  } catch (err) {
    console.error('Error in disapproveAttendance:', err);
    res.status(500).json({ message: 'Error disapproving attendance.', error: err.message });
  }
};

// Get All Attachments for an Event (Admin/Staff)
exports.getAllEventAttachments = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .populate('attendance.userId', 'name email department academicYear year section')
      .populate('createdBy', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Filter to only show attendees who have attachments
    const attachments = event.attendance
      .filter(att => att.attachment && att.attachment.trim() !== '')
      .map(att => ({
        userId: att.userId,
        attachment: att.attachment,
        uploadedAt: att.registeredAt, // Use registration date as fallback
        status: att.status,
        registrationApproved: att.registrationApproved
      }));

    res.json({
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      totalAttachments: attachments.length,
      attachments: attachments
    });

  } catch (err) {
    console.error('Error in getAllEventAttachments:', err);
    res.status(500).json({ message: 'Error fetching event attachments.' });
  }
};

// Toggle Event Availability
exports.toggleEventAvailability = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    event.status = event.status === 'Active' ? 'Completed' : 'Active';
    await event.save();

    res.json({ 
      message: `Event ${event.status.toLowerCase()} successfully.`,
      status: event.status
    });
  } catch (err) {
    console.error('Error in toggleEventAvailability:', err);
    res.status(500).json({ message: 'Error toggling event status.', error: err.message });
  }
};

// Approve Registration
exports.approveRegistration = async (req, res) => {
  try {
    console.log('✅ Approving registration...');
    const { eventId, userId } = req.params;
    console.log(`Event ID: ${eventId}, User ID: ${userId}`);

    const event = await Event.findById(eventId);
    
    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(a => a.userId.toString() === userId);

    if (!attendance) {
      console.log('❌ Attendance record not found');
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // Check if event is full (only for events with max participants)
    if (event.maxParticipants > 0) {
      const approvedCount = event.attendance.filter(a => a.registrationApproved === true).length;
      if (approvedCount >= event.maxParticipants) {
        console.log('❌ Event is full');
        return res.status(400).json({ 
          message: 'Cannot approve registration. Event is full.' 
        });
      }
    }

    // Allow re-approval if already approved
    const wasAlreadyApproved = attendance.registrationApproved;
    
    attendance.registrationApproved = true;
    attendance.registrationApprovedBy = req.user.userId;
    attendance.registrationApprovedAt = new Date();
    attendance.status = 'Attended'; // Change status to Attended after approval

    await event.save();
    
    console.log(`✅ Registration ${wasAlreadyApproved ? 're-approved' : 'approved'} successfully`);
    
    if (wasAlreadyApproved) {
      res.json({ message: 'Registration re-approved successfully.' });
    } else {
      res.json({ message: 'Registration approved successfully.' });
    }
  } catch (err) {
    console.error('❌ Error in approveRegistration:', err);
    res.status(500).json({ message: 'Error approving registration.', error: err.message });
  }
};

// Disapprove Registration (can disapprove both pending and approved)
exports.disapproveRegistration = async (req, res) => {
  try {
    console.log('❌ Disapproving registration...');
    const { eventId, userId } = req.params;
    const { reason } = req.body;
    console.log(`Event ID: ${eventId}, User ID: ${userId}, Reason: ${reason}`);
    
    if (!reason || reason.trim() === '') {
      console.log('❌ Reason is required');
      return res.status(400).json({ message: 'Reason for disapproval is required.' });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json({ message: 'Event not found.' });
    }

    const attendance = event.attendance.find(a => a.userId.toString() === userId);

    if (!attendance) {
      console.log('❌ Attendance record not found');
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // Store disapproval information
    attendance.status = 'Disapproved';
    attendance.reason = reason.trim();
    attendance.approvedBy = req.user.userId;
    attendance.approvedAt = new Date();
    
    // If it was previously approved, mark it as disapproved but keep the record
    if (attendance.registrationApproved) {
      attendance.registrationApproved = false;
      attendance.registrationApprovedBy = null;
      attendance.registrationApprovedAt = null;
    }

    await event.save();

    console.log('✅ Registration disapproved successfully');
    res.json({ message: 'Registration disapproved successfully.' });
  } catch (err) {
    console.error('❌ Error in disapproveRegistration:', err);
    res.status(500).json({ message: 'Error disapproving registration.', error: err.message });
  }
};

// Get All Registrations for an Event (Admin/Staff)
exports.getAllEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .populate('createdBy', 'name')
      .populate('attendance.userId', 'name email department academicYear year section')
      .populate('attendance.registrationApprovedBy', 'name')
      .populate('attendance.approvedBy', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Filter registrations based on user role and department
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let filteredRegistrations = event.attendance;

    if (user.role === 'Staff') {
      // Staff can only see registrations for events in their department
      if (!event.isForAllDepartments) {
        if (event.departments && event.departments.length > 0) {
          if (!event.departments.includes(user.department)) {
            return res.status(403).json({ message: 'Access denied. Event not in your department.' });
          }
        } else if (event.department && event.department !== user.department) {
          return res.status(403).json({ message: 'Access denied. Event not in your department.' });
        }
      }
    }

    // Group registrations by status
    const registrations = {
      pending: filteredRegistrations.filter(att => !att.registrationApproved && att.status === 'Pending'),
      approved: filteredRegistrations.filter(att => att.registrationApproved === true),
      disapproved: filteredRegistrations.filter(att => att.status === 'Disapproved'),
      total: filteredRegistrations.length
    };

    res.json({
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      registrations
    });
  } catch (err) {
    console.error('Error in getAllEventRegistrations:', err);
    res.status(500).json({ message: 'Error fetching event registrations.', error: err.message });
  }
};

// Get Pending Registrations
exports.getPendingRegistrations = async (req, res) => {
  try {
    console.log('🔍 Fetching pending registrations...');
    
    // Get all events that have pending registrations
    const events = await Event.find({
      'attendance': {
        $elemMatch: {
          'registrationApproved': false,
          'status': 'Pending'
        }
      }
    })
    .populate('createdBy', 'name')
    .populate('attendance.userId', 'name email department academicYear year section')
    .populate('attendance.registrationApprovedBy', 'name');

    console.log(`Found ${events.length} events with pending registrations`);

    // Filter to only show events where the current user has permission to approve
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error('❌ User not found in getPendingRegistrations');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`👤 User role: ${user.role}, Department: ${user.department}`);

    let filteredEvents = events;

    if (user.role === 'Staff') {
      // Staff can only approve registrations for events in their department
      filteredEvents = events.filter(event => {
        if (event.isForAllDepartments) return true;
        if (event.departments && event.departments.length > 0) {
          return event.departments.includes(user.department);
        }
        return event.department === user.department;
      });
      console.log(`🔒 Filtered to ${filteredEvents.length} events for staff department`);
    }

    // Filter out events that don't have any pending registrations after filtering
    const finalEvents = filteredEvents.filter(event => {
      return event.attendance && event.attendance.some(att => 
        !att.registrationApproved && att.status === 'Pending'
      );
    });

    // Format the response to match frontend expectations
    const formattedEvents = finalEvents.map(event => ({
      _id: event._id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      department: event.department,
      departments: event.departments,
      isForAllDepartments: event.isForAllDepartments,
      maxParticipants: event.maxParticipants,
      createdBy: event.createdBy,
      attendance: event.attendance.filter(att => 
        !att.registrationApproved && att.status === 'Pending'
      )
    }));

    console.log(`✅ Returning ${formattedEvents.length} events with pending registrations`);
    res.json(formattedEvents);
  } catch (err) {
    console.error('❌ Error in getPendingRegistrations:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Error fetching pending registrations.', error: err.message });
  }
};

// Get Pending Registrations for a Specific Event
exports.getPendingRegistrationsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ 
        message: 'Event ID is required',
        error: 'MISSING_EVENT_ID'
      });
    }

    const event = await Event.findById(eventId)
      .populate('createdBy', 'name')
      .populate('attendance.userId', 'name email department academicYear year section')
      .populate('attendance.registrationApprovedBy', 'name');

    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND'
      });
    }

    // Filter to only show pending registrations
    const pendingRegistrations = event.attendance.filter(att => 
      !att.registrationApproved && att.status === 'Pending'
    );

    // Check user permissions
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'Staff') {
      // Staff can only see registrations for events in their department
      if (!event.isForAllDepartments && 
          (!event.departments || !event.departments.includes(user.department)) &&
          event.department !== user.department) {
        return res.status(403).json({ 
          message: 'You do not have permission to view registrations for this event',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    res.json({
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      registrations: {
        pending: pendingRegistrations,
        total: event.attendance.length
      }
    });

  } catch (err) {
    console.error('Error in getPendingRegistrationsForEvent:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid event ID format',
        error: 'INVALID_ID_FORMAT'
      });
    }
    
    res.status(500).json({ 
      message: 'Error fetching pending registrations for event.', 
      error: err.message 
    });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    // Get basic counts with error handling
    const totalUsers = await User.countDocuments().catch(() => 0);
    const totalEvents = await Event.countDocuments().catch(() => 0);
    
    // Calculate attendance with better error handling
    let totalAttendance = 0;
    try {
      const events = await Event.find({}, 'attendance');
      totalAttendance = events.reduce((sum, event) => {
        if (event.attendance && Array.isArray(event.attendance)) {
          return sum + event.attendance.length;
        }
        return sum;
      }, 0);
    } catch (attendanceError) {
      console.log('Error calculating attendance:', attendanceError);
      totalAttendance = 0;
    }

    // Get additional analytics
    let studentsCount = 0;
    let staffCount = 0;
    let adminCount = 0;
    
    try {
      studentsCount = await User.countDocuments({ role: 'Student' });
      staffCount = await User.countDocuments({ role: 'Staff' });
      adminCount = await User.countDocuments({ role: 'Admin' });
    } catch (roleError) {
      console.log('Error counting users by role:', roleError);
    }

    // Get events by status
    let activeEvents = 0;
    let completedEvents = 0;
    
    try {
      activeEvents = await Event.countDocuments({ status: 'Active' });
      completedEvents = await Event.countDocuments({ status: 'Completed' });
    } catch (eventStatusError) {
      console.log('Error counting events by status:', eventStatusError);
    }

    // Get approved attendance count
    let approvedAttendance = 0;
    try {
      const eventsWithAttendance = await Event.find({ 'attendance.status': 'Approved' });
      approvedAttendance = eventsWithAttendance.reduce((sum, event) => {
        if (event.attendance && Array.isArray(event.attendance)) {
          return sum + event.attendance.filter(att => att.status === 'Approved').length;
        }
        return sum;
      }, 0);
    } catch (approvedError) {
      console.log('Error calculating approved attendance:', approvedError);
    }

    // Get total hours from approved events
    let totalHours = 0;
    try {
      const approvedEvents = await Event.find({ 'attendance.status': 'Approved' });
      totalHours = approvedEvents.reduce((sum, event) => {
        if (event.hours && event.attendance) {
          const approvedCount = event.attendance.filter(att => att.status === 'Approved').length;
          return sum + (event.hours * approvedCount);
        }
        return sum;
      }, 0);
    } catch (hoursError) {
      console.log('Error calculating total hours:', hoursError);
    }

    // Get recent activity (last 30 days)
    let recentEvents = 0;
    let recentUsers = 0;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      recentEvents = await Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
      recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    } catch (recentError) {
      console.log('Error calculating recent activity:', recentError);
    }

    res.json({
      // Basic counts
      totalUsers,
      totalEvents,
      totalAttendance,
      
      // User breakdown
      studentsCount,
      staffCount,
      adminCount,
      
      // Event breakdown
      activeEvents,
      completedEvents,
      
      // Attendance analytics
      approvedAttendance,
      totalHours,
      
      // Recent activity
      recentEvents,
      recentUsers,
      
      // Success flag
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data.',
      message: err.message,
      success: false,
      timestamp: new Date().toISOString()
    });
  }
};

// Students By Year
exports.getStudentsByYear = async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' });
    
    // Calculate total hours for each student
    const studentsWithHours = await Promise.all(
      students.map(async (student) => {
        // Find all events where this student has approved attendance
        // Include disabled events if student was already approved (to preserve their hours)
        const events = await Event.find({
          'attendance.userId': student._id,
          'attendance.status': 'Approved'
        });

        let totalHours = 0;
        events.forEach(event => {
          const attendance = event.attendance.find(a => 
            a.userId.toString() === student._id.toString() && a.status === 'Approved'
          );
          if (attendance) {
            totalHours += event.hours || 0;
          }
        });

        return {
          ...student.toObject(),
          totalHours
        };
      })
    );

    // Group by year
    const byYear = {};
    studentsWithHours.forEach(student => {
      const year = student.academicYear || 'Unknown';
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(student);
    });
    
    res.json(byYear);
  } catch (err) {
    console.error('Error in getStudentsByYear:', err);
    res.status(500).json({ message: 'Error fetching students by year.', error: err.message });
  }
};

// Students with 40+ Hours
exports.getStudents40Hours = async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' });
    
    // Calculate total hours for each student
    const studentsWithHours = await Promise.all(
      students.map(async (student) => {
        // Find all events where this student has approved attendance
        // Include disabled events if student was already approved (to preserve their hours)
        const events = await Event.find({
          'attendance.userId': student._id,
          'attendance.status': 'Approved'
        });

        let totalHours = 0;
        events.forEach(event => {
          const attendance = event.attendance.find(a => 
            a.userId.toString() === student._id.toString() && a.status === 'Approved'
          );
          if (attendance) {
            totalHours += event.hours || 0;
          }
        });

        return {
          ...student.toObject(),
          totalHours
        };
      })
    );

    // Filter students with 40+ hours
    const result = studentsWithHours.filter(s => s.totalHours >= 40);
    res.json(result);
  } catch (err) {
    console.error('Error in getStudents40Hours:', err);
    res.status(500).json({ message: 'Error fetching students with 40 hours.', error: err.message });
  }
};

// Toggle Event Visibility (Admin/Staff only)
exports.toggleEventVisibility = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('Toggle event visibility request for event:', eventId);
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    console.log('Current event state:', {
      isVisibleToStudents: event.isVisibleToStudents,
      status: event.status
    });
    
    // Toggle the visibility (opposite of current state)
    event.isVisibleToStudents = !event.isVisibleToStudents;
    
    // If disabling, also set status to Disabled
    if (!event.isVisibleToStudents) {
      event.status = 'Disabled';
      console.log('🔄 Disabling event - setting status to Disabled');
    } else if (event.status === 'Disabled') {
      // If re-enabling, set status back to Active
      event.status = 'Active';
      console.log('🔄 Re-enabling event - setting status back to Active');
    }
    
    await event.save();
    
    console.log('✅ Event visibility updated successfully:', {
      eventId,
      isVisibleToStudents: event.isVisibleToStudents,
      status: event.status
    });
    
    res.json({ 
      message: `Event ${event.isVisibleToStudents ? 'enabled' : 'disabled'} successfully.`,
      isVisibleToStudents: event.isVisibleToStudents,
      status: event.status
    });
    
  } catch (err) {
    console.error('❌ Error in toggleEventVisibility:', err);
    res.status(500).json({ 
      message: 'Error updating event visibility. Please try again.' 
    });
  }
};

// Mark Event as Completed (Admin/Staff only)
exports.markEventAsCompleted = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('Mark event as completed request for event:', eventId);
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    console.log('Current event state:', {
      status: event.status,
      isVisibleToStudents: event.isVisibleToStudents
    });
    
    // Mark the event as completed
    event.status = 'Completed';
    event.isVisibleToStudents = false; // Hide from students when completed
    
    await event.save();
    
    console.log('✅ Event marked as completed successfully:', {
      eventId,
      status: event.status,
      isVisibleToStudents: event.isVisibleToStudents
    });
    
    res.json({ 
      message: 'Event marked as completed successfully.',
      status: event.status,
      isVisibleToStudents: event.isVisibleToStudents
    });
    
  } catch (err) {
    console.error('❌ Error in markEventAsCompleted:', err);
    res.status(500).json({ 
      message: 'Error marking event as completed. Please try again.' 
    });
  }
};

// Mark Event as NOT Completed (Admin/Staff only) - Revert to editable status
exports.markEventAsNotCompleted = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('Mark event as NOT completed request for event:', eventId);
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    console.log('Current event state:', {
      status: event.status,
      isVisibleToStudents: event.isVisibleToStudents
    });
    
    // Mark the event as NOT completed (revert to editable)
    event.status = 'Active'; // Reset to active status
    event.isVisibleToStudents = true; // Make visible to students again
    
    await event.save();
    
    console.log('✅ Event marked as NOT completed successfully:', {
      eventId,
      status: event.status,
      isVisibleToStudents: event.isVisibleToStudents
    });
    
    res.json({ 
      message: 'Event marked as NOT completed successfully. Students can now register again.',
      status: event.status,
      isVisibleToStudents: event.isVisibleToStudents
    });
    
  } catch (err) {
    console.error('❌ Error in markEventAsNotCompleted:', err);
    res.status(500).json({ 
      message: 'Error marking event as NOT completed. Please try again.' 
    });
  }
};

// File Upload Functions for Event Documentation

// Upload documentation files for an event
exports.uploadEventDocumentation = async (req, res) => {
  try {
    console.log('=== Upload Event Documentation ===');
    const { eventId } = req.params;
    const { description } = req.body;
    
    console.log('Event ID:', eventId);
    console.log('Description:', description);
    console.log('Files received:', req.files ? req.files.length : 0);
    
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      console.log('❌ Authentication required');
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    console.log('✅ Event found:', event.title);
    
    // Check if user is registered for this event
    const attendance = event.attendance.find(
      a => a.userId.toString() === req.user.userId
    );
    
    if (!attendance) {
      console.log('❌ User not registered for this event');
      return res.status(400).json({ message: 'You must be registered for this event to upload documentation.' });
    }
    
    console.log('✅ User attendance found');
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files uploaded');
      return res.status(400).json({ message: 'No files were uploaded.' });
    }
    
    console.log(`📁 Processing ${req.files.length} files...`);
    
    // Process uploaded files using MongoDB storage
    const { getFileInfoWithData } = require('../utils/fileUpload');
    const uploadedFiles = req.files.map(file => getFileInfoWithData(file));
    
    // Add description if provided
    if (description) {
      uploadedFiles.forEach(file => {
        file.description = description;
      });
    }
    
    // Initialize documentation array if it doesn't exist
    if (!attendance.documentation) {
      attendance.documentation = { files: [], lastUpdated: new Date() };
    }
    
    // Add new files to documentation
    attendance.documentation.files.push(...uploadedFiles);
    attendance.documentation.lastUpdated = new Date();
    
    await event.save();
    
    console.log(`✅ ${uploadedFiles.length} files uploaded successfully`);
    
    res.json({
      message: 'Documentation uploaded successfully.',
      uploadedFiles: uploadedFiles.map(file => ({
        filename: file.filename,
        originalName: file.originalName,
        fileType: file.contentType,
        fileSize: file.fileSize,
        description: file.description
      }))
    });
    
  } catch (err) {
    console.error('❌ Error in uploadEventDocumentation:', err);
    res.status(500).json({ message: 'Error uploading documentation.', error: err.message });
  }
};

// Get documentation files for an event
exports.getEventDocumentation = async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('=== Get Event Documentation ===');
    console.log('Event ID:', eventId);
    console.log('Request user:', req.user);
    
    // Check if event exists
    const event = await Event.findById(eventId)
      .populate('attendance.userId', 'name email department academicYear');
    
    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    console.log('✅ Event found:', event.title);
    console.log('👥 Attendance count:', event.attendance.length);
    
    // Check if user has permission to view documentation
    let canViewAll = false;
    if (req.user) {
      const userRole = req.user.role || req.userInfo?.role;
      canViewAll = userRole === 'Admin' || userRole === 'Staff';
      console.log('🔐 User role:', userRole, 'Can view all:', canViewAll);
    } else {
      console.log('❌ No user found');
    }
    
    let documentation = [];
    
    if (canViewAll) {
      // Admin/Staff can see all documentation
      console.log('🔍 Admin/Staff view - checking all attendance for documentation');
      event.attendance.forEach((att, index) => {
        console.log(`👤 Attendance ${index}: userId=${att.userId._id}, has documentation: ${!!att.documentation}`);
        if (att.documentation && att.documentation.files && att.documentation.files.length > 0) {
          console.log(`📁 Documentation files count: ${att.documentation.files.length}`);
          documentation.push({
            userId: att.userId,
            files: att.documentation.files,
            lastUpdated: att.documentation.lastUpdated
          });
          console.log(`✅ Added documentation for user: ${att.userId.name}`);
        }
      });
    } else {
      // Students can only see their own documentation
      const userAttendance = event.attendance.find(
        a => a.userId._id.toString() === req.user.userId
      );
      
      if (userAttendance && userAttendance.documentation && userAttendance.documentation.files) {
        documentation.push({
          userId: userAttendance.userId,
          files: userAttendance.documentation.files,
          lastUpdated: userAttendance.documentation.lastUpdated
        });
        console.log('✅ Added student documentation');
      }
    }
    
    // Add download URLs for documentation files
    const documentationWithUrls = documentation.map(doc => ({
      ...doc,
      files: doc.files.map(file => ({
        ...file,
        downloadUrl: `/api/files/documentation/${file.filename}`,
        fullUrl: `${process.env.FRONTEND_URL_PRODUCTION || 'https://charism.vercel.app'}/api/files/documentation/${file.filename}`
      }))
    }));
    
    console.log(`📊 Total documentation entries found: ${documentationWithUrls.length}`);
    
    res.json({ documentation: documentationWithUrls });
    
  } catch (err) {
    console.error('❌ Error in getEventDocumentation:', err);
    res.status(500).json({ message: 'Error fetching documentation.', error: err.message });
  }
};

// Download documentation file
exports.downloadDocumentationFile = async (req, res) => {
  try {
    const { eventId, filename } = req.params;
    console.log('=== Download Documentation File ===');
    console.log('Event ID:', eventId);
    console.log('Filename:', filename);
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    // Check if user has permission to download this file
    let canDownload = false;
    let fileData = null;
    
    if (req.user) {
      const userRole = req.user.role || req.userInfo?.role;
      console.log('🔐 User role:', userRole);
      
      if (userRole === 'Admin' || userRole === 'Staff') {
        canDownload = true;
        console.log('✅ Admin/Staff access granted');
        
        // Find file in any attendance record
        for (const attendance of event.attendance) {
          if (attendance.documentation && attendance.documentation.files) {
            const file = attendance.documentation.files.find(f => f.filename === filename);
            if (file) {
              fileData = file;
              break;
            }
          }
        }
      } else {
        console.log('❌ User role not Admin/Staff');
        // Students can only download their own files
        const userAttendance = event.attendance.find(
          a => a.userId.toString() === req.user.userId
        );
        
        if (userAttendance && userAttendance.documentation && userAttendance.documentation.files) {
          const file = userAttendance.documentation.files.find(f => f.filename === filename);
          if (file) {
            canDownload = true;
            fileData = file;
            console.log('✅ Student file access granted');
          }
        }
      }
    }
    
    if (!canDownload || !fileData) {
      console.log('❌ Download permission denied or file not found');
      return res.status(403).json({ message: 'Access denied or file not found.' });
    }
    
    console.log('✅ File found, serving download');
    
    // Set response headers
    res.set({
      'Content-Type': fileData.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileData.originalName || fileData.filename}"`,
      'Content-Length': fileData.data ? fileData.data.length : 0
    });
    
    // Send file data
    if (fileData.data) {
      res.send(fileData.data);
    } else {
      res.status(404).json({ message: 'File data not found.' });
    }
    
  } catch (err) {
    console.error('❌ Error in downloadDocumentationFile:', err);
    res.status(500).json({ message: 'Error downloading file.', error: err.message });
  }
};

// Delete documentation file
exports.deleteDocumentationFile = async (req, res) => {
  try {
    const { eventId, filename } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    // Check if user has permission to delete this file
    let canDelete = false;
    let attendance = null;
    
    if (req.user) {
      const userRole = req.user.role || req.userInfo?.role;
      if (userRole === 'Admin' || userRole === 'Staff') {
        canDelete = true;
        // Find attendance record that contains this file
        for (let att of event.attendance) {
          if (att.documentation && att.documentation.files.some(f => f.filename === filename)) {
            attendance = att;
            break;
          }
        }
      } else {
        // Students can only delete their own files
        attendance = event.attendance.find(
          a => a.userId.toString() === req.user.userId
        );
        
        if (attendance && attendance.documentation) {
          canDelete = attendance.documentation.files.some(
            file => file.filename === filename
          );
        }
      }
    }
    
    if (!canDelete || !attendance) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    // Remove file from documentation
    attendance.documentation.files = attendance.documentation.files.filter(
      file => file.filename !== filename
    );
    
    // Update last updated timestamp
    attendance.documentation.lastUpdated = new Date();
    
    // Delete physical file
    // deleteFile(filename); // This function is no longer used
    
    await event.save();
    
    res.json({ message: 'File deleted successfully.' });
    
  } catch (err) {
    console.error('Error in deleteDocumentationFile:', err);
    res.status(500).json({ message: 'Error deleting file.', error: err.message });
  }
};

// =======================
// Public Event Registration Methods
// =======================

// Get event by registration token (public)
exports.getEventByRegistrationToken = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('🔍 Getting event by registration token:', token);
    
    const event = await Event.findOne({ 
      publicRegistrationToken: token,
      isPublicRegistrationEnabled: true,
      status: { $ne: 'Disabled' }
    }).populate('createdBy', 'name');
    
    console.log('📊 Event found:', event ? 'Yes' : 'No');
    if (event) {
      console.log('📋 Event details:', {
        id: event._id,
        title: event.title,
        token: event.publicRegistrationToken,
        enabled: event.isPublicRegistrationEnabled,
        status: event.status
      });
    }
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found or public registration is not enabled for this event.',
        error: 'EVENT_NOT_FOUND'
      });
    }
    
    // Check if event is still open for registration
    const now = new Date();
    if (event.date < now) {
      return res.status(400).json({ 
        message: 'This event has already passed.',
        error: 'EVENT_EXPIRED'
      });
    }
    
    // Return basic event info for public view
    res.json({
      _id: event._id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      time: event.time,
      location: event.location,
      hours: event.hours,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.attendance.length,
      createdBy: event.createdBy,
      requiresApproval: event.requiresApproval,
      isPublicRegistrationEnabled: event.isPublicRegistrationEnabled,
      image: event.image // Include image data for frontend
    });
    
  } catch (err) {
    console.error('Error in getEventByRegistrationToken:', err);
    res.status(500).json({ 
      message: 'Error fetching event details.', 
      error: err.message 
    });
  }
};

// Register for event using token (public - requires login)
exports.registerForEventWithToken = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required to register for events.',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // Find event by token
    const event = await Event.findOne({ 
      publicRegistrationToken: token,
      isPublicRegistrationEnabled: true,
      status: { $ne: 'Disabled' }
    });
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found or public registration is not enabled.',
        error: 'EVENT_NOT_FOUND'
      });
    }
    
    // Check if event is still open for registration
    const now = new Date();
    if (event.date < now) {
      return res.status(400).json({ 
        message: 'This event has already passed.',
        error: 'EVENT_EXPIRED'
      });
    }
    
    // Check if user is already registered
    const existingRegistration = event.attendance.find(
      a => a.userId.toString() === userId
    );
    
    if (existingRegistration) {
      return res.status(400).json({ 
        message: 'You are already registered for this event.',
        error: 'ALREADY_REGISTERED'
      });
    }
    
    // Check if event is full
    if (event.maxParticipants > 0 && event.attendance.length >= event.maxParticipants) {
      return res.status(400).json({ 
        message: 'This event is already full.',
        error: 'EVENT_FULL'
      });
    }
    
    // Add user to attendance
    event.attendance.push({
      userId: userId,
      status: 'Pending',
      registeredAt: new Date(),
      registrationApproved: !event.requiresApproval // Auto-approve if no approval required
    });
    
    await event.save();
    
    res.json({ 
      message: 'Successfully registered for event!',
      requiresApproval: event.requiresApproval,
      registrationApproved: !event.requiresApproval
    });
    
  } catch (err) {
    console.error('Error in registerForEventWithToken:', err);
    res.status(500).json({ 
      message: 'Error registering for event.', 
      error: err.message 
    });
  }
};

// Generate registration tokens for existing events (admin utility)
exports.generateTokensForExistingEvents = async (req, res) => {
  try {
    // Find all events without registration tokens
    const eventsWithoutTokens = await Event.find({ 
      publicRegistrationToken: { $exists: false } 
    });
    
    console.log(`Found ${eventsWithoutTokens.length} events without registration tokens`);
    
    let updatedCount = 0;
    for (const event of eventsWithoutTokens) {
      event.publicRegistrationToken = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await event.save();
      updatedCount++;
    }
    
    res.json({ 
      message: `Generated registration tokens for ${updatedCount} events`,
      updatedCount 
    });
    
  } catch (err) {
    console.error('Error generating tokens for existing events:', err);
    res.status(500).json({ 
      message: 'Error generating tokens for existing events.', 
      error: err.message 
    });
  }
};
