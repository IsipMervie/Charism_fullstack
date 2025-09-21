// Event optimization utilities

const Event = require('../models/Event');
const User = require('../models/User');

// Optimized event query builder
const buildEventQuery = (userRole, userDepartment = null) => {
  let query = {};
  
  switch (userRole) {
    case 'Student':
      query = {
        isVisibleToStudents: true,
        status: { $ne: 'Disabled' }
      };
      break;
    case 'Staff':
      // Staff can see events for their department or all-department events
      query = {
        $or: [
          { department: userDepartment },
          { isForAllDepartments: true },
          { departments: { $in: [userDepartment] } }
        ],
        status: { $ne: 'Disabled' }
      };
      break;
    case 'Admin':
      // Admin can see all events including disabled ones
      query = {};
      break;
    default:
      // Public users see only active, visible events
      query = {
        status: { $ne: 'Disabled' },
        isVisibleToStudents: true
      };
  }
  
  return query;
};

// Optimized event projection based on user role
const getEventProjection = (userRole) => {
  const baseFields = 'title description date startTime endTime location hours maxParticipants department departments isForAllDepartments status isVisibleToStudents requiresApproval publicRegistrationToken isPublicRegistrationEnabled createdAt attendance image';
  
  if (userRole === 'Admin' || userRole === 'Staff') {
    return baseFields + ' createdBy updatedAt';
  }
  
  return baseFields;
};

// Batch process event registrations
const batchProcessRegistrations = async (eventId, registrations) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Process registrations in batches to avoid overwhelming the database
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < registrations.length; i += batchSize) {
      const batch = registrations.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (registration) => {
          try {
            // Check if user is already registered
            const existingAttendance = event.attendance.find(
              a => a.userId && a.userId.toString() === registration.userId.toString()
            );
            
            if (existingAttendance) {
              return {
                userId: registration.userId,
                status: 'already_registered',
                message: 'User already registered'
              };
            }
            
            // Add registration
            event.attendance.push({
              userId: registration.userId,
              status: registration.status || 'Pending',
              registeredAt: new Date(),
              registrationApproved: registration.registrationApproved || false
            });
            
            return {
              userId: registration.userId,
              status: 'success',
              message: 'Registration added successfully'
            };
          } catch (error) {
            return {
              userId: registration.userId,
              status: 'error',
              message: error.message
            };
          }
        })
      );
      
      results.push(...batchResults);
    }
    
    // Save the event with all new registrations
    await event.save();
    
    return results;
  } catch (error) {
    throw new Error(`Batch processing failed: ${error.message}`);
  }
};

// Optimized attendance calculation
const calculateEventAttendance = async (eventId) => {
  try {
    const event = await Event.findById(eventId).select('attendance maxParticipants');
    if (!event) {
      throw new Error('Event not found');
    }
    
    const attendanceStats = {
      total: event.attendance.length,
      approved: 0,
      pending: 0,
      disapproved: 0,
      attended: 0,
      availableSlots: event.maxParticipants || 'Unlimited',
      isFull: false
    };
    
    event.attendance.forEach(attendance => {
      if (attendance.registrationApproved === true) {
        attendanceStats.approved++;
        if (attendance.status === 'Attended') {
          attendanceStats.attended++;
        }
      } else if (attendance.status === 'Pending') {
        attendanceStats.pending++;
      } else if (attendance.status === 'Disapproved') {
        attendanceStats.disapproved++;
      }
    });
    
    if (event.maxParticipants > 0) {
      attendanceStats.availableSlots = event.maxParticipants - attendanceStats.approved;
      attendanceStats.isFull = attendanceStats.approved >= event.maxParticipants;
    }
    
    return attendanceStats;
  } catch (error) {
    throw new Error(`Attendance calculation failed: ${error.message}`);
  }
};

// Event validation helper
const validateEventData = (eventData) => {
  const errors = [];
  
  // Required fields
  if (!eventData.title || eventData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!eventData.date) {
    errors.push('Date is required');
  }
  
  if (!eventData.startTime) {
    errors.push('Start time is required');
  }
  
  if (!eventData.endTime) {
    errors.push('End time is required');
  }
  
  if (!eventData.location || eventData.location.trim() === '') {
    errors.push('Location is required');
  }
  
  // Validate hours
  if (eventData.hours && (isNaN(eventData.hours) || eventData.hours < 0)) {
    errors.push('Hours must be a positive number');
  }
  
  // Validate max participants
  if (eventData.maxParticipants && (isNaN(eventData.maxParticipants) || eventData.maxParticipants < 0)) {
    errors.push('Max participants must be a positive number');
  }
  
  // Validate date format
  if (eventData.date && isNaN(new Date(eventData.date).getTime())) {
    errors.push('Invalid date format');
  }
  
  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (eventData.startTime && !timeRegex.test(eventData.startTime)) {
    errors.push('Invalid start time format (HH:MM)');
  }
  
  if (eventData.endTime && !timeRegex.test(eventData.endTime)) {
    errors.push('Invalid end time format (HH:MM)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Event search optimization
const searchEvents = async (searchTerm, filters = {}, userRole = 'Public', userDepartment = null) => {
  try {
    const query = buildEventQuery(userRole, userDepartment);
    
    // Add search term
    if (searchTerm && searchTerm.trim() !== '') {
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Add filters
    if (filters.department) {
      query.department = filters.department;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) {
        query.date.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.date.$lte = new Date(filters.dateTo);
      }
    }
    
    const projection = getEventProjection(userRole);
    
    const events = await Event.find(query)
      .select(projection)
      .sort({ createdAt: -1 })
      .lean()
      .limit(100); // Reasonable limit for search results
    
    return events;
  } catch (error) {
    throw new Error(`Event search failed: ${error.message}`);
  }
};

// Event analytics helper
const getEventAnalytics = async (eventId) => {
  try {
    const event = await Event.findById(eventId)
      .populate('attendance.userId', 'name email department academicYear')
      .lean();
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    const analytics = {
      eventId: event._id,
      title: event.title,
      totalRegistrations: event.attendance.length,
      attendanceStats: await calculateEventAttendance(eventId),
      departmentBreakdown: {},
      yearBreakdown: {},
      registrationTrend: []
    };
    
    // Department breakdown
    event.attendance.forEach(attendance => {
      if (attendance.userId && attendance.userId.department) {
        const dept = attendance.userId.department;
        analytics.departmentBreakdown[dept] = (analytics.departmentBreakdown[dept] || 0) + 1;
      }
      
      if (attendance.userId && attendance.userId.academicYear) {
        const year = attendance.userId.academicYear;
        analytics.yearBreakdown[year] = (analytics.yearBreakdown[year] || 0) + 1;
      }
    });
    
    return analytics;
  } catch (error) {
    throw new Error(`Event analytics failed: ${error.message}`);
  }
};

module.exports = {
  buildEventQuery,
  getEventProjection,
  batchProcessRegistrations,
  calculateEventAttendance,
  validateEventData,
  searchEvents,
  getEventAnalytics
};
