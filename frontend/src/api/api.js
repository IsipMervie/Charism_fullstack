import axios from 'axios';
import { API_URL } from '../config/environment';

// Use centralized environment configuration
const API_BASE_URL = API_URL;

console.log('🌐 API URL configured as:', API_BASE_URL);
console.log('🏠 Current hostname:', window.location.hostname);
console.log('🔗 Current protocol:', window.location.protocol);

// Simple axios instance with proper CORS configuration
export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // Optimized timeout for Render
  withCredentials: false, // Disable credentials for CORS
  crossDomain: true
});


// Request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic for timeout/network errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Retry on timeout or network errors
    if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && 
        config && !config._retry && (config._retryCount || 0) < 2) {
      config._retry = true;
      config._retryCount = (config._retryCount || 0) + 1;
      
      console.log(`🔄 Retrying request (attempt ${config._retryCount})...`);
      
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return axiosInstance(config);
    }
    
    return Promise.reject(error);
  }
);

// Test API connection function

// Get user ID from localStorage
export const getUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Decode JWT token to get user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

export const testAPIConnection = async () => {
  try {
    const response = await axiosInstance.get('/health');
    console.log('✅ API connection successful:', response.status);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API connection test failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: axiosInstance.defaults.baseURL + '/health'
    });
    
    // Provide more helpful error messages
    let errorMessage = 'Server is not responding';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Server timeout - server may be overloaded or down';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error - server may be offline';
    } else if (error.response?.status === 0) {
      errorMessage = 'Server unreachable - check if backend is running';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code,
      status: error.response?.status,
      url: axiosInstance.defaults.baseURL + '/health'
    };
  }
};

// Retry mechanism for critical API calls
export const retryApiCall = async (apiCall, maxRetries = 3, initialDelay = 2000) => {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API call attempt ${attempt}/${maxRetries}`);
      const result = await apiCall();
      console.log(`✅ API call successful on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.error(`❌ API call failed on attempt ${attempt}:`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`💥 All ${maxRetries} attempts failed`);
        throw error;
      }
      
      // Wait before retrying
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      // eslint-disable-next-line no-loop-func
      await new Promise(resolve => setTimeout(() => resolve(), delay));
      
      // Increase delay for next retry
      delay *= 1.5;
    }
  }
};

// Clear all cached data
export const clearAllCache = () => {
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('_cache') || key.includes('_timestamp'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
  console.log('🧹 Cleared all cached data');
};

// Clear specific cache
export const clearCache = (cacheKey) => {
  sessionStorage.removeItem(cacheKey);
  sessionStorage.removeItem(`${cacheKey}_timestamp`);
  console.log(`🧹 Cleared cache: ${cacheKey}`);
};

// Clear participant-related cache
export const clearParticipantCache = (eventId) => {
  // Clear all participant-related caches
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes('participants') || 
      key.includes('events-cache') || 
      key.includes('events_cache') ||
      key.includes('publicSettings')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
  console.log(`🧹 Cleared participant cache for event ${eventId}`);
};

// =======================
// API Functions
// =======================

// Default export for backward compatibility
const apiExports = {
  axiosInstance,
  // Add other commonly used functions here if needed
};

export default apiExports;

// Generate registration tokens for existing events (admin utility)
export const generateTokensForExistingEvents = async () => {
  try {
    const response = await axiosInstance.post('/api/events/generate-tokens');
    return response.data;
  } catch (error) {
    console.error('Error generating tokens for existing events:', error);
    throw new Error('Failed to generate tokens for existing events. Please try again.');
  }
};

// Users (Admin/Staff)
export const getUsers = async (params = {}) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetching users attempt ${attempt}/${maxRetries}`);
      const query = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/api/admin/users${query ? `?${query}` : ''}`);
      console.log(`✅ Users fetched successfully on attempt ${attempt}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching users (attempt ${attempt}/${maxRetries}):`, error);
      lastError = error;
      
      // If it's a timeout error, wait before retrying
      if (error.code === 'ECONNABORTED' && attempt < maxRetries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors or last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error('Failed to fetch users after multiple attempts. Please try again.');
      }
    }
  }
  
  throw lastError;
};



export const deleteUser = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/api/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user. Please try again.');
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axiosInstance.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user. Please try again.');
  }
};

// Settings Management Functions
export const addSection = async (name) => {
  try {
    const response = await axiosInstance.post('/api/settings/sections', { name });
    return response.data;
  } catch (error) {
    console.error('Error adding section:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to add section. Please try again.');
  }
};

export const updateSection = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/api/settings/sections/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating section:', error);
    throw new Error('Failed to update section. Please try again.');
  }
};

export const deleteSection = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/settings/sections/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting section:', error);
    throw new Error('Failed to delete section. Please try again.');
  }
};

// Year Levels Management
export const addYearLevel = async (name) => {
  try {
    const response = await axiosInstance.post('/api/settings/year-levels', { name });
    return response.data;
  } catch (error) {
    console.error('Error adding year level:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to add year level. Please try again.');
  }
};

export const updateYearLevel = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/api/settings/year-levels/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating year level:', error);
    throw new Error('Failed to update year level. Please try again.');
  }
};

export const deleteYearLevel = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/settings/year-levels/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting year level:', error);
    throw new Error('Failed to delete year level. Please try again.');
  }
};

// Departments Management
export const addDepartment = async (name) => {
  try {
    const response = await axiosInstance.post('/api/settings/departments', { name });
    return response.data;
  } catch (error) {
    console.error('Error adding department:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to add department. Please try again.');
  }
};

export const updateDepartment = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/api/settings/departments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating department:', error);
    throw new Error('Failed to update department. Please try again.');
  }
};

export const deleteDepartment = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/settings/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw new Error('Failed to delete department. Please try again.');
  }
};

// Academic Years
export const getActiveAcademicYears = async () => {
  try {
    const response = await axiosInstance.get('/api/academic-years/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active academic years:', error);
    throw new Error('Failed to fetch academic years. Please try again.');
  }
};

export const getAcademicYears = async () => {
  try {
    const response = await axiosInstance.get('/api/academic-years');
    return response.data;
  } catch (error) {
    console.error('Error fetching academic years:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch academic years. Please try again.');
  }
};

export const createAcademicYear = async (academicYearData) => {
  try {
    const response = await axiosInstance.post('/api/academic-years', academicYearData);
    return response.data;
  } catch (error) {
    console.error('Error creating academic year:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to create academic year. Please try again.');
  }
};

export const updateAcademicYear = async (id, academicYearData) => {
  try {
    const response = await axiosInstance.put(`/api/academic-years/${id}`, academicYearData);
    return response.data;
  } catch (error) {
    console.error('Error updating academic year:', error);
    throw new Error('Failed to update academic year. Please try again.');
  }
};

export const deleteAcademicYear = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/academic-years/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting academic year:', error);
    throw new Error('Failed to delete academic year. Please try again.');
  }
};

export const toggleAcademicYearStatus = async (id) => {
  try {
    const response = await axiosInstance.patch(`/academic-years/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling academic year status:', error);
    throw new Error('Failed to toggle academic year status. Please try again.');
  }
};

// Staff Approval Management
export const getPendingStaffApprovals = async () => {
  try {
    const response = await axiosInstance.get('/api/admin/staff-approvals');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending staff approvals:', error);
    throw new Error('Failed to fetch pending staff approvals. Please try again.');
  }
};

export const approveStaff = async (userId, approvalNotes = '') => {
  try {
    const response = await axiosInstance.post(`/api/admin/staff-approvals/${userId}/approve`, {
      approvalNotes
    });
    return response.data;
  } catch (error) {
    console.error('Error approving staff:', error);
    throw new Error('Failed to approve staff. Please try again.');
  }
};

export const rejectStaff = async (userId, approvalNotes = '') => {
  try {
    const response = await axiosInstance.post(`/api/admin/staff-approvals/${userId}/reject`, {
      approvalNotes
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting staff:', error);
    throw new Error('Failed to reject staff. Please try again.');
  }
};

// Check server health with reasonable timeout
export const checkServerHealth = async () => {
  try {
    const response = await axiosInstance.get('/api/ping', {
      timeout: 60000 // 60 seconds timeout for Render.com cold starts
    });
    return response.data.status === 'OK';
  } catch (error) {
    console.warn('⚠️ Server health check failed:', error.message);
    return false;
  }
};

// Circuit breaker for events API
let eventsApiFailureCount = 0;
let lastEventsApiFailure = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5; // 5 consecutive failures
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

// Events
export const getEvents = async (retryCount = 0) => {
  const maxRetries = 3; // Increased retries
  
  // Check circuit breaker
  const now = Date.now();
  if (eventsApiFailureCount >= CIRCUIT_BREAKER_THRESHOLD && 
      (now - lastEventsApiFailure) < CIRCUIT_BREAKER_TIMEOUT) {
    console.warn('🚨 Events API circuit breaker OPEN - too many failures, skipping request');
    return [];
  }
  
  try {
    console.log(`🔄 Fetching events from API... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Check server health first if this is the first attempt
    if (retryCount === 0) {
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        console.warn('🚨 Server appears to be down or unresponsive');
        return [];
      }
    }
    
    // Use public events endpoint (no authentication required)
    console.log('🔐 Using public events endpoint: /events');
    
    // Use longer timeout for better reliability
    const response = await axiosInstance.get('/api/events', {
      timeout: 30000 // 30 seconds timeout for better reliability
    });
    
    console.log('✅ Events API response received');
    console.log('📊 Full response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data)
    });
    
    // Reset circuit breaker on success
    eventsApiFailureCount = 0;
    
    // Ensure we always return an array
    const data = response.data;
    if (Array.isArray(data)) {
      console.log('✅ Returning array data, length:', data.length);
      return data;
    } else if (data && Array.isArray(data.events)) {
      console.log('✅ Returning nested events array, length:', data.events.length);
      return data.events;
    } else {
      console.warn('⚠️ getEvents: Unexpected response format, returning empty array:', data);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching events (attempt ${retryCount + 1}):`, error);
    
    // Track failures for circuit breaker
    eventsApiFailureCount++;
    lastEventsApiFailure = Date.now();
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      console.warn('⚠️ Events API timeout - server may be slow or overloaded');
    } else if (error.response?.status === 503) {
      console.error('🚨 Events API 503 - Backend server is DOWN or unavailable');
    } else if (error.response?.status === 500) {
      console.warn('⚠️ Events API server error - backend issue');
    } else if (error.response?.status === 404) {
      console.warn('⚠️ Events API endpoint not found - routing issue');
    }
    
    // If we get a 401 error, it means the endpoint requires authentication
    if (error.response?.status === 401) {
      console.warn('🔐 Events endpoint requires authentication - this should not happen with public endpoint');
    }
    
    // Retry logic for timeouts - but with exponential backoff
    if (retryCount < maxRetries && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
      const delay = Math.min(2000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10 seconds
      console.log(`🔄 Retrying in ${delay/1000} seconds... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getEvents(retryCount + 1);
    }
    
    // Return empty array instead of throwing error to prevent crashes
    console.warn('⚠️ Returning empty events array due to persistent errors');
    
    // If this is the first attempt and we're getting timeouts, the server might be overloaded
    if (retryCount === 0 && error.code === 'ECONNABORTED') {
      console.warn('🚨 Server appears to be overloaded - consider reducing load or checking server health');
    }
    
    return [];
  }
};

// Get events with populated user data for admin documentation
export const getEventsWithUserData = async () => {
  try {
    console.log('🔄 Fetching events with user data from API...');
    
    // Check user role to determine which endpoint to use
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role;
    
    let endpoint = '/admin/events-with-user-data';
    if (userRole === 'Staff') {
      endpoint = '/staff/events-with-user-data';
      console.log('👤 Staff user detected, using staff endpoint');
    } else {
      console.log('👤 Admin user detected, using admin endpoint');
    }
    
    const response = await axiosInstance.get(endpoint);
    console.log('✅ Events with user data API response received');
    
    // Ensure we always return an array
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('⚠️ getEventsWithUserData: Unexpected response format, returning empty array:', data);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching events with user data:', error);
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      console.warn('⚠️ Events with user data API timeout - server may be slow or overloaded');
    } else if (error.response?.status === 503) {
      console.error('🚨 Events with user data API 503 - Backend server is DOWN or unavailable');
    } else if (error.response?.status === 500) {
      console.warn('⚠️ Events with user data API server error - backend issue');
    } else if (error.response?.status === 404) {
      console.warn('⚠️ Events with user data API endpoint not found - routing issue');
    }
    
    // Return empty array instead of throwing error to prevent crashes
    return [];
  }
};

// Public event details (no authentication required)
export const getPublicEventDetails = async (eventId) => {
  try {
    const response = await axios.get(`${API_URL}/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public event details:', error);
    throw new Error('Failed to fetch event details. Please try again.');
  }
};

export const getEventDetails = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw new Error('Failed to fetch event details. Please try again.');
  }
};

export const testJoinEventSimple = async (eventId) => {
  try {
    const response = await axiosInstance.post(`/api/events/${eventId}/join-simple`);
    return response.data;
  } catch (error) {
    console.error('Simple test join event error:', error);
    console.error('Simple test join event response:', error.response);
    throw error;
  }
};

export const testJoinEvent = async (eventId) => {
  try {
    const response = await axiosInstance.post(`/api/events/${eventId}/join-test`);
    return response.data;
  } catch (error) {
    console.error('Test join event error:', error);
    console.error('Test join event response:', error.response);
    throw error;
  }
};

export const joinEvent = async (eventId) => {
  try {
    const response = await axiosInstance.post(`/api/events/${eventId}/join`);
    return response.data;
  } catch (error) {
    console.error('Error joining event:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error status:', error.response?.status);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Extract specific error message from response
    const errorMessage = error.response?.data?.message || 'Failed to join event. Please try again.';
    const errorCode = error.response?.data?.error;
    
    // Show error in alert for immediate debugging
    if (error.response?.data?.message) {
      alert(`Join Event Error: ${error.response.data.message}`);
    }
    
    // Create more specific error messages based on error codes
    let specificMessage = errorMessage;
    if (errorCode) {
      switch (errorCode) {
        case 'EVENT_NOT_ACTIVE':
          specificMessage = 'This event is not currently active.';
          break;
        case 'EVENT_NOT_VISIBLE_TO_STUDENTS':
          specificMessage = 'This event is not available for student registration.';
          break;
        case 'EVENT_STARTED':
          specificMessage = 'Registration is closed. This event has already started.';
          break;
        case 'EVENT_EXPIRED':
          specificMessage = 'This event has already passed.';
          break;
        case 'ALREADY_REGISTERED':
          specificMessage = 'You are already registered for this event.';
          break;
        case 'EVENT_FULL':
          specificMessage = 'This event is full. All approved slots have been taken.';
          break;
        default:
          specificMessage = errorMessage;
      }
    }
    
    throw new Error(specificMessage);
  }
};

export const registerForEvent = async (eventId) => {
  try {
    const response = await axiosInstance.post(`/api/events/${eventId}/register`);
    return response.data;
  } catch (error) {
    console.error('Error registering for event:', error);
    if (error.response?.status === 401) {
      throw new Error('Please log in to register for this event.');
    } else if (error.response?.status === 404) {
      throw new Error('Event not found.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Registration failed. Please try again.');
    }
    throw new Error('Failed to register for event. Please try again.');
  }
};

export const timeIn = async (eventId) => {
  try {
    const userId = (() => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
})();
    const response = await axiosInstance.post(`/api/events/${eventId}/attendance/${userId}/time-in`);
    return response.data;
  } catch (error) {
    console.error('Error timing in:', error);
    
    // Handle specific error messages from backend
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // Handle different error types
    if (error.response?.status === 403) {
      throw new Error('You can only time in for yourself.');
    } else if (error.response?.status === 404) {
      throw new Error('Event not found or you are not registered for this event.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid time in request.');
    } else if (error.response?.status === 401) {
      throw new Error('Please log in to time in.');
    }
    
    throw new Error('Failed to time in. Please try again.');
  }
};

export const timeOut = async (eventId) => {
  try {
    const userId = (() => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
})();
    const response = await axiosInstance.post(`/api/events/${eventId}/attendance/${userId}/time-out`);
    return response.data;
  } catch (error) {
    console.error('Error timing out:', error);
    
    // Handle specific error messages from backend
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // Handle different error types
    if (error.response?.status === 403) {
      throw new Error('You can only time out for yourself.');
    } else if (error.response?.status === 404) {
      throw new Error('Event not found or you are not registered for this event.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid time out request.');
    } else if (error.response?.status === 401) {
      throw new Error('Please log in to time out.');
    }
    
    throw new Error('Failed to time out. Please try again.');
  }
};

export const getEventParticipants = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/participants`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event participants:', error);
    throw new Error('Failed to fetch event participants. Please try again.');
  }
};

export const getEventParticipantsPublic = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/participants/public`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event participants:', error);
    throw new Error('Failed to fetch event participants. Please try again.');
  }
};

export const getStudentsByYear = async () => {
  try {
    const response = await axiosInstance.get('/api/admin/students-by-year');
    return response.data;
  } catch (error) {
    console.error('Error fetching students by year:', error);
    throw new Error('Failed to fetch students by year. Please try again.');
  }
};

export const getStudentsByYearFilterOptions = async () => {
  try {
    const response = await axiosInstance.get('/api/admin/students-by-year-filter-options');
    return response.data;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw new Error('Failed to fetch filter options. Please try again.');
  }
};

export const getStudents40Hours = async () => {
  try {
    const response = await axiosInstance.get('/api/admin/students-40-hours');
    return response.data;
  } catch (error) {
    console.error('Error fetching students with 40+ hours:', error);
    throw new Error('Failed to fetch students with 40+ hours. Please try again.');
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await axiosInstance.delete(`/api/events/${eventId}`);
    
    // Clear participant and event-related caches after successful deletion
    clearParticipantCache(eventId);
    clearAllCache();
    console.log('🧹 Cleared all caches after event deletion');
    
    return response.data;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event. Please try again.');
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await axiosInstance.put(`/api/events/${eventId}/edit`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event. Please try again.');
  }
};

// Auth
export const loginUser = async (email, password) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Login attempt ${attempt}/${maxRetries} to: ${axiosInstance.defaults.baseURL}/auth/login`);
      
      // Test connection first on first attempt
      if (attempt === 1) {
        const connectionTest = await testAPIConnection();
        if (!connectionTest.success) {
          throw new Error(`Cannot connect to server: ${connectionTest.error}`);
        }
      }
      
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      console.log('✅ Login successful');
      return response.data;
    } catch (error) {
      console.error(`❌ Login error (attempt ${attempt}):`, {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url: axiosInstance.defaults.baseURL + '/auth/login'
      });
      lastError = error;
      
      // Handle specific error types
      if (error.code === 'ECONNABORTED') {
        if (attempt < maxRetries) {
          console.log('⏳ Request timed out, retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
          continue;
        }
        throw new Error('Login request timed out. The server may be slow or unavailable. Please try again later.');
      } else if (error.code === 'ERR_NETWORK') {
        if (attempt < maxRetries) {
          console.log('⏳ Network error, retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'ERR_CANCELED') {
        if (attempt < maxRetries) {
          console.log('⏳ Request canceled, retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        throw new Error('Login request was interrupted. Please try again.');
      }
      
      // Don't retry for server errors (4xx, 5xx)
      if (error.response?.status >= 400) {
        break;
      }
      
      // Retry for other errors
      if (attempt < maxRetries) {
        console.log('⏳ Unexpected error, retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
    }
  }
  
  // Handle final error
  if (lastError.response?.data?.message) {
    const customError = new Error(lastError.response.data.message);
    customError.response = lastError.response;
    throw customError;
  }
  
  // Generic error fallback with more specific message
  if (lastError.message.includes('Cannot connect to server')) {
    throw lastError;
  }
  
  throw new Error('Login failed. Please check your credentials and try again.');
};

export const registerUser = async (name, email, password, userId, academicYear, year, section, role, department) => {
  try {
    // Test connection first
    console.log('🔍 Testing API connection before registration...');
    const connectionTest = await testAPIConnection();
    if (!connectionTest.success) {
      console.error('❌ API connection failed:', connectionTest.error);
      throw new Error(`Cannot connect to server: ${connectionTest.error}`);
    }
    console.log('✅ API connection successful, proceeding with registration...');
    
    const payload = {
      name,
      email,
      password,
      role,
      userId,
    };
    if (role === 'Student') {
      payload.academicYear = academicYear;
      payload.year = year;
      payload.section = section;
      payload.department = department;
    }
    const response = await axiosInstance.post('/api/auth/register', payload);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    // Preserve the original error structure so frontend can access response data
    if (error.response?.data?.message) {
      const customError = new Error(error.response.data.message);
      customError.response = error.response;
      throw customError;
    }
    throw error;
  }
};

// Create Event
export const createEvent = async (eventData) => {
  try {
    console.log('🔍 Creating event with data:', eventData);
    
    // Convert FormData to JSON if needed
    let jsonData = eventData;
    if (eventData instanceof FormData) {
      jsonData = {};
      for (let [key, value] of eventData.entries()) {
        jsonData[key] = value;
      }
    }
    
    console.log('📝 Sending JSON data:', jsonData);
    
    const response = await axiosInstance.post('/api/events/', jsonData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
    
    console.log('✅ Event created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating event:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data?.missingFields) {
      throw new Error(`Missing required fields: ${error.response.data.missingFields.join(', ')}`);
    }
    throw new Error('Failed to create event. Please try again.');
  }
};

// Toggle Event Availability
export const toggleEventAvailability = async (eventId) => {
  try {
    const response = await axiosInstance.patch(`/events/${eventId}/toggle-availability`);
    return response.data;
  } catch (error) {
    console.error('Error toggling event availability:', error);
    throw new Error('Failed to toggle event availability. Please try again.');
  }
};

// Analytics
export const getAnalytics = async () => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetching analytics attempt ${attempt}/${maxRetries}`);
      
      // Use longer timeout for analytics (60 seconds)
      const response = await axiosInstance.get('/api/analytics', {
        timeout: 60000
      });
      
      console.log(`✅ Analytics fetched successfully on attempt ${attempt}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching analytics (attempt ${attempt}/${maxRetries}):`, error);
      lastError = error;
      
      // If it's a timeout error, wait before retrying
      if (error.code === 'ECONNABORTED' && attempt < maxRetries) {
        const waitTime = attempt * 3000; // 3s, 6s, 9s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors or last attempt, try fallback
      if (attempt === maxRetries) {
        // Fallback to legacy endpoint if the new one is not available
        if (error?.response?.status === 404) {
          try {
            console.log('🔄 Trying legacy analytics endpoint...');
            const legacy = await axiosInstance.get('/api/events/analytics', {
              timeout: 60000
            });
            return legacy.data;
          } catch (legacyErr) {
            console.error('Error fetching analytics (legacy):', legacyErr);
            throw new Error('Failed to fetch analytics. Please try again.');
          }
        }
        throw new Error('Failed to fetch analytics after multiple attempts. Please try again.');
      }
    }
  }
  
  throw lastError;
};

// Change Password
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await axiosInstance.post('/api/auth/change-password', { oldPassword, newPassword });
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to change password. Please try again.');
  }
};

// User Profile
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get('/api/settings/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile. Please try again.');
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await axiosInstance.post('/api/settings/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile. Please try again.');
  }
};

// Profile Picture Management
export const uploadProfilePicture = async (userId, formData) => {
  try {
    console.log('=== API uploadProfilePicture Debug ===');
    console.log('User ID:', userId);
    console.log('FormData received:', formData);
    console.log('FormData instanceof FormData:', formData instanceof FormData);
    
    // Log FormData entries
    if (formData instanceof FormData) {
      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value);
      }
    }
    
    const response = await axiosInstance.post(`/api/users/${userId}/profile-picture`, formData);
    return response.data;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    throw new Error('Failed to upload profile picture. Please try again.');
  }
};

export const deleteProfilePicture = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/api/users/${userId}/profile-picture`);
    return response.data;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw new Error('Failed to delete profile picture. Please try again.');
  }
};

// Messages
export const getMessages = async () => {
  try {
    const response = await axiosInstance.get('/api/messages');
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages. Please try again.');
  }
};

export const sendMessage = async (messageData) => {
  try {
    const response = await axiosInstance.post('/api/messages', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message. Please try again.');
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const response = await axiosInstance.delete(`/api/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message. Please try again.');
  }
};

// Notifications
export const getNotifications = async () => {
  try {
    const response = await axiosInstance.get('/api/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications. Please try again.');
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read. Please try again.');
  }
};

// Attendance Management
export const setParticipationStatus = async (eventId, userId, status) => {
  try {
    const response = await axiosInstance.patch(`/events/${eventId}/attendance/${userId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error setting participation status:', error);
    throw new Error('Failed to set participation status. Please try again.');
  }
};

export const approveAttendance = async (eventId, userId) => {
  try {
    console.log(`✅ Approving attendance for event ${eventId}, user ${userId}`);
    console.log(`🔍 Making request to: /events/${eventId}/attendance/${userId}/approve`);
    console.log(`🌐 Base URL: ${axiosInstance.defaults.baseURL}`);
    console.log(`🔑 Token exists: ${!!localStorage.getItem('token')}`);
    console.log(`👤 User role: ${localStorage.getItem('role')}`);
    
    const response = await axiosInstance.patch(`/events/${eventId}/attendance/${userId}/approve`, {}, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log('✅ Attendance approved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error approving attendance:', error);
    console.error('❌ Request URL:', error.config?.url);
    console.error('❌ Full URL:', `${axiosInstance.defaults.baseURL}/events/${eventId}/attendance/${userId}/approve`);
    console.error('❌ Response status:', error.response?.status);
    console.error('❌ Response data:', error.response?.data);
    console.error('❌ Request headers:', error.config?.headers);
    
    // Handle specific error messages from backend
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // Handle different error types
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to approve attendance.');
    } else if (error.response?.status === 404) {
      throw new Error('Attendance record not found.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid approval request.');
    } else if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      throw new Error('Your session has expired. Please log in again.');
    }
    
    throw new Error('Failed to approve attendance. Please try again.');
  }
};

export const disapproveAttendance = async (eventId, userId, reason) => {
  try {
    console.log(`❌ Disapproving attendance for event ${eventId}, user ${userId}`);
    console.log(`🔍 Making request to: /events/${eventId}/attendance/${userId}/disapprove`);
    console.log(`🌐 Base URL: ${axiosInstance.defaults.baseURL}`);
    console.log(`🔑 Token exists: ${!!localStorage.getItem('token')}`);
    console.log(`👤 User role: ${localStorage.getItem('role')}`);
    
    const response = await axiosInstance.patch(`/events/${eventId}/attendance/${userId}/disapprove`, {
      reason: reason
    }, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log('✅ Attendance disapproved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error disapproving attendance:', error);
    console.error('❌ Request URL:', error.config?.url);
    console.error('❌ Full URL:', `${axiosInstance.defaults.baseURL}/events/${eventId}/attendance/${userId}/disapprove`);
    console.error('❌ Response status:', error.response?.status);
    console.error('❌ Response data:', error.response?.data);
    console.error('❌ Request headers:', error.config?.headers);
    
    // Handle specific error messages from backend
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // Handle different error types
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to disapprove attendance.');
    } else if (error.response?.status === 404) {
      throw new Error('Attendance record not found.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid disapproval request.');
    } else if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      throw new Error('Your session has expired. Please log in again.');
    }
    
    throw new Error('Failed to disapprove attendance. Please try again.');
  }
};

export const removeParticipant = async (eventId, userId) => {
  try {
    const response = await axiosInstance.delete(`/api/events/${eventId}/participants/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing participant:', error);
    
    // Handle specific error messages from backend
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // Handle different error types
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to remove participants.');
    } else if (error.response?.status === 404) {
      throw new Error('Event or participant not found.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid removal request.');
    } else if (error.response?.status === 401) {
      throw new Error('Please log in to remove participants.');
    }
    
    throw new Error('Failed to remove participant. Please try again.');
  }
};

// Reflection functions removed - no longer needed

// Certificate Generation
export const generateCertificate = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/certificates/generate/${userId}`, {
      responseType: 'blob',
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${userId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error('Failed to generate certificate. Please try again.');
  }
};

// PDF Reports
export const generateStudentsListPDF = async (year) => {
  try {
    const response = await axiosInstance.get(`/api/reports/students-by-year?year=${year}`, {
      responseType: 'blob',
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-by-year-${year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating students list PDF:', error);
    throw new Error('Failed to generate students list PDF. Please try again.');
  }
};

// Settings
export const getSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch settings. Please try again.');
  }
};

export const getPublicSettings = async () => {
  try {
    console.log('🔄 Fetching public settings from API...');
    
    // Use retry mechanism for critical settings
    const response = await retryApiCall(() => axiosInstance.get('/api/settings/public'));
    console.log('✅ Public settings API response received');
    
    const data = response.data;
    
    // Ensure we always return an object with arrays
    return {
      sections: Array.isArray(data?.sections) ? data.sections : [],
      yearLevels: Array.isArray(data?.yearLevels) ? data.yearLevels : [],
      departments: Array.isArray(data?.departments) ? data.departments : [],
      academicYears: Array.isArray(data?.academicYears) ? data.academicYears : []
    };
  } catch (error) {
    console.error('❌ Error fetching public settings:', error);
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      console.warn('⚠️ Public settings API timeout - server may be slow or overloaded');
    } else if (error.response?.status === 503) {
      console.error('🚨 Public settings API 503 - Backend server is DOWN or unavailable');
    } else if (error.response?.status === 500) {
      console.warn('⚠️ Public settings API server error - backend issue');
    } else if (error.response?.status === 404) {
      console.warn('⚠️ Public settings API endpoint not found - routing issue');
    }
    
    // Return default structure instead of throwing error
    return {
      sections: [],
      yearLevels: [],
      academicYears: [],
      departments: []
    };
  }
};


export const updateSettings = async (settingsData) => {
  try {
    const response = await axiosInstance.post('/api/settings', settingsData);
    return response.data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings. Please try again.');
  }
};

// Get school settings (Admin only)
export const getSchoolSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/settings/school');
    return response.data;
  } catch (error) {
    console.error('Error fetching school settings:', error);
    throw new Error('Failed to fetch school settings. Please try again.');
  }
};


// Reports
export const generateReport = async (reportType, params = {}) => {
  try {
    let url = `/reports/${reportType}`;
    
    // Handle special case for event-attendance report
    if (reportType === 'event-attendance' && params.eventId) {
      url = `/reports/${reportType}/${params.eventId}`;
      // Remove eventId from params to avoid duplicate
      const { eventId, ...otherParams } = params;
      if (Object.keys(otherParams).length > 0) {
        const queryString = new URLSearchParams(otherParams).toString();
        url += `?${queryString}`;
      }
    } else if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data]);
    const url2 = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url2;
    
    // Generate filename based on report type
    let filename = `${reportType}-report.pdf`;
    if (params.year) {
      filename = `${reportType}-${params.year}.pdf`;
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url2);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate report. Please try again.');
  }
};

// Password Reset
export const forgotPassword = async (email) => {
  try {
    const response = await axiosInstance.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to send password reset email. Please try again.');
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axiosInstance.post(`/api/auth/reset-password/${token}`, { newPassword });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to reset password. Please try again.');
  }
};

// Email Verification
export const verifyEmail = async (token) => {
  try {
    const response = await axiosInstance.get(`/api/auth/verify-email/${token}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying email:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to verify email. Please try again.');
  }
};

// Event Attendance
export const getEventAttendance = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/attendance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event attendance:', error);
    throw new Error('Failed to fetch event attendance. Please try again.');
  }
};

// User Participation
export const getUserParticipation = async () => {
  try {
    const response = await axiosInstance.get('/api/user/participation');
    return response.data;
  } catch (error) {
    console.error('Error fetching user participation:', error);
    throw new Error('Failed to fetch user participation. Please try again.');
  }
};

// Event Statistics
export const getEventStatistics = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    throw new Error('Failed to fetch event statistics. Please try again.');
  }
};

// My Events
export const getMyEvents = async () => {
  try {
    const response = await axiosInstance.get('/api/user/my-events');
    return response.data;
  } catch (error) {
    console.error('Error fetching my events:', error);
    throw new Error('Failed to fetch my events. Please try again.');
  }
};

// My Participation History
export const getMyParticipationHistory = async () => {
  try {
    const response = await axiosInstance.get('/api/user/participation-history');
    return response.data;
  } catch (error) {
    console.error('Error fetching participation history:', error);
    throw new Error('Failed to fetch participation history. Please try again.');
  }
};

// Event Attendance Report
export const getEventAttendanceReport = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/attendance-report`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event attendance report:', error);
    throw new Error('Failed to fetch event attendance report. Please try again.');
  }
};

// Department Statistics
export const getDepartmentStatistics = async (department) => {
  try {
    const response = await axiosInstance.get(`/api/analytics/department/${department}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    throw new Error('Failed to fetch department statistics. Please try again.');
  }
};

// Yearly Statistics
export const getYearlyStatistics = async (year) => {
  try {
    const response = await axiosInstance.get(`/api/analytics/yearly/${year}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching yearly statistics:', error);
    throw new Error('Failed to fetch yearly statistics. Please try again.');
  }
};

// Bulk Certificate Generation
export const generateBulkCertificates = async (userIds) => {
  try {
    const response = await axiosInstance.post('/api/certificates/bulk', { userIds }, {
      responseType: 'blob',
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-certificates.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating bulk certificates:', error);
    throw new Error('Failed to generate bulk certificates. Please try again.');
  }
};

// Contact Us
export const contactUs = async (contactData) => {
  try {
    const response = await axiosInstance.post('/api/contact-us', contactData);
    return response.data;
  } catch (error) {
    console.error('Error sending contact message:', error);
    throw new Error('Failed to send message. Please try again.');
  }
};

export const submitContactForm = async (contactData) => {
  try {
    const response = await axiosInstance.post('/api/contact-us', contactData);
    return response.data;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw new Error('Failed to submit contact form. Please try again.');
  }
};

export const getAllContactMessages = async (searchTerm = '') => {
  try {
    const url = `/api/contact-us${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    throw new Error('Failed to fetch contact messages. Please try again.');
  }
};

// Event Management Functions
export const toggleEventVisibility = async (eventId) => {
  try {
    console.log(`🔄 Toggling event visibility for event: ${eventId}`);
    const response = await axiosInstance.patch(`/events/${eventId}/toggle-visibility`);
    console.log('✅ Event visibility toggled successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error toggling event visibility:', error);
    if (error.response?.status === 404) {
      throw new Error('Event not found. Please refresh and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to modify this event.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid request. Please check your input.');
    }
    throw new Error('Failed to toggle event visibility. Please try again.');
  }
};



export const getAllEventAttachments = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/attachments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event attachments:', error);
    throw new Error('Failed to fetch event attachments. Please try again.');
  }
};

export const getPendingRegistrations = async () => {
  try {
    console.log('🔍 Fetching pending registrations...');
    const response = await axiosInstance.get('/api/events/pending-registrations');
    console.log('✅ Pending registrations fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching pending registrations:', error);
    if (error.response?.status === 404) {
      throw new Error('No pending registrations found.');
    }
    throw new Error('Failed to fetch pending registrations. Please try again.');
  }
};

export const getPendingRegistrationsForEvent = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/registrations/pending`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending registrations for event:', error);
    throw new Error('Failed to fetch pending registrations for event. Please try again.');
  }
};


export const getAllEventRegistrations = async (eventId) => {
  try {
    console.log('🔄 Fetching registrations for event:', eventId);
    const response = await axiosInstance.get(`/api/events/${eventId}/registrations`);
    console.log('✅ Registrations fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching event registrations:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    throw new Error('Failed to fetch event registrations. Please try again.');
  }
};

export const approveRegistration = async (eventId, userId) => {
  try {
    console.log('🔄 Approving registration for user:', userId, 'event:', eventId);
    const response = await axiosInstance.put(`/api/events/approve/${eventId}/${userId}`);
    console.log('✅ Registration approved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error approving registration:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    throw new Error('Failed to approve registration. Please try again.');
  }
};

export const disapproveRegistration = async (eventId, userId, reason) => {
  try {
    const response = await axiosInstance.put(`/api/events/disapprove/${eventId}/${userId}`, {
      reason
    });
    return response.data;
  } catch (error) {
    console.error('Error disapproving registration:', error);
    throw new Error('Failed to disapprove registration. Please try again.');
  }
};

// =======================
// File Upload API Functions for Event Documentation
// =======================

export const uploadEventDocumentation = async (eventId, files, description = '') => {
  try {
    const formData = new FormData();
    
    // Add files to form data
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    // Add description if provided
    if (description) {
      formData.append('description', description);
    }
    
    const response = await axiosInstance.post(`/api/events/${eventId}/documentation/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading event documentation:', error);
    if (error.response?.status === 413) {
      throw new Error('File is too large. Maximum size is 10MB.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid file type or no files uploaded.');
    }
    throw new Error('Failed to upload documentation. Please try again.');
  }
};

export const getEventDocumentation = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/documentation`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event documentation:', error);
    throw new Error('Failed to fetch event documentation. Please try again.');
  }
};

export const downloadDocumentationFile = async (eventId, filename, originalName) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/documentation/download/${filename}`, {
      responseType: 'blob',
    });
    
    // Create download link with original filename
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', originalName || filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading documentation file:', error);
    throw new Error('Failed to download file. Please try again.');
  }
};

export const deleteDocumentationFile = async (eventId, filename) => {
  try {
    const response = await axiosInstance.delete(`/api/events/${eventId}/documentation/${filename}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting documentation file:', error);
    throw new Error('Failed to delete file. Please try again.');
  }
};

// =======================
// Event Completion Management API Functions
// =======================

export const markEventAsCompleted = async (eventId) => {
  try {
    console.log(`✅ Marking event as completed: ${eventId}`);
    const response = await axiosInstance.patch(`/events/${eventId}/mark-completed`);
    console.log('✅ Event marked as completed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error marking event as completed:', error);
    if (error.response?.status === 404) {
      throw new Error('Event not found. Please refresh and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to modify this event.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid request. Please check your input.');
    }
    throw new Error('Failed to mark event as completed. Please try again.');
  }
};

export const markEventAsNotCompleted = async (eventId) => {
  try {
    console.log(`🔄 Marking event as NOT completed: ${eventId}`);
    const response = await axiosInstance.patch(`/events/${eventId}/mark-not-completed`);
    console.log('✅ Event marked as NOT completed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error marking event as NOT completed:', error);
    if (error.response?.status === 404) {
      throw new Error('Event not found. Please refresh and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to modify this event.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid request. Please check your input.');
    }
    throw new Error('Failed to mark event as NOT completed. Please try again.');
  }
};

// =======================
// Public Event Registration API Functions
// =======================

export const getEventByRegistrationToken = async (token) => {
  try {
    const response = await axiosInstance.get(`/api/events/register/${token}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event by registration token:', error);
    if (error.response?.status === 404) {
      throw new Error('Event not found or public registration is not enabled for this event.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'This event has already passed.');
    }
    throw new Error('Failed to fetch event details. Please try again.');
  }
};

export const registerForEventWithToken = async (token) => {
  try {
    const response = await axiosInstance.post(`/api/events/register/${token}`);
    return response.data;
  } catch (error) {
    console.error('Error registering for event with token:', error);
    if (error.response?.status === 401) {
      throw new Error('Please log in to register for this event.');
    } else if (error.response?.status === 404) {
      throw new Error('Event not found or public registration is not enabled.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Cannot register for this event.');
    }
    throw new Error('Failed to register for event. Please try again.');
  }
};

// =======================
// Feedback API Functions
// =======================

export const submitFeedback = async (feedbackData) => {
  try {
    const response = await axiosInstance.post('/api/feedback/submit', feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback. Please try again.');
  }
};

export const getUserFeedback = async () => {
  try {
    const response = await axiosInstance.get('/api/feedback/my-feedback');
    return response.data;
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    throw new Error('Failed to fetch feedback. Please try again.');
  }
};

export const getFeedbackById = async (feedbackId) => {
  try {
    const response = await axiosInstance.get(`/api/feedback/${feedbackId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw new Error('Failed to fetch feedback. Please try again.');
  }
};

// Admin feedback functions
export const getAllFeedback = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/api/feedback/admin/all${query ? `?${query}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    throw new Error('Failed to fetch feedback. Please try again.');
  }
};

export const getFeedbackStats = async () => {
  try {
    const response = await axiosInstance.get('/api/feedback/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    throw new Error('Failed to fetch feedback statistics. Please try again.');
  }
};

// Event Chat API functions
export const sendEventChatMessage = async (eventId, message, replyTo = null) => {
  try {
    const response = await axiosInstance.post(`/api/event-chat/${eventId}/messages`, {
      message,
      replyTo
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    
    // Handle content filtering errors
    if (error.response?.status === 400 && error.response?.data?.reason) {
      throw new Error(error.response.data.message || 'Your message contains inappropriate content.');
    }
    
    throw new Error('Failed to send message. Please try again.');
  }
};

export const sendEventChatMessageWithFiles = async (eventId, formData) => {
  try {
    const response = await axiosInstance.post(`/api/event-chat/${eventId}/messages/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout for file uploads
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message with files:', error);
    if (error.response?.status === 413) {
      throw new Error('File is too large. Maximum size is 10MB.');
    } else if (error.response?.status === 400) {
      // Handle content filtering errors
      if (error.response?.data?.reason) {
        throw new Error(error.response.data.message || 'Your content contains inappropriate material.');
      }
      throw new Error(error.response.data.message || 'Invalid file type or no files uploaded.');
    }
    throw new Error('Failed to send message with files. Please try again.');
  }
};


export const getEventChatMessages = async (eventId, page = 1, limit = 50, before = null) => {
  try {
    const params = new URLSearchParams({ page, limit });
    if (before) params.append('before', before);
    
    const response = await axiosInstance.get(`/api/event-chat/${eventId}/messages?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    
    // Handle specific error types
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    } else if (error.code === 'ERR_QUIC_PROTOCOL_ERROR') {
      throw new Error('Connection protocol error. Please refresh the page and try again.');
    } else if (error.response?.status === 404) {
      throw new Error('Chat not found. This event may not have a chat enabled.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You may not have permission to view this chat.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again in a few moments.');
    }
    
    throw new Error('Failed to load messages. Please try again.');
  }
};

export const editEventChatMessage = async (messageId, message) => {
  try {
    const response = await axiosInstance.put(`/api/event-chat/messages/${messageId}`, {
      message
    });
    return response.data;
  } catch (error) {
    console.error('Error editing chat message:', error);
    throw new Error('Failed to edit message. Please try again.');
  }
};

export const deleteEventChatMessage = async (messageId) => {
  try {
    const response = await axiosInstance.delete(`/api/event-chat/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting chat message:', error);
    throw new Error('Failed to delete message. Please try again.');
  }
};

export const addEventChatReaction = async (messageId, emoji) => {
  try {
    const response = await axiosInstance.post(`/api/event-chat/messages/${messageId}/reactions`, {
      emoji
    });
    return response.data;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw new Error('Failed to add reaction. Please try again.');
  }
};

export const removeEventChatReaction = async (messageId) => {
  try {
    const response = await axiosInstance.delete(`/api/event-chat/messages/${messageId}/reactions`);
    return response.data;
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw new Error('Failed to remove reaction. Please try again.');
  }
};

export const getEventChatParticipants = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/event-chat/${eventId}/participants`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat participants:', error);
    throw new Error('Failed to load participants. Please try again.');
  }
};

export const removeEventChatParticipant = async (eventId, participantId) => {
  try {
    const response = await axiosInstance.delete(`/api/event-chat/${eventId}/participants/${participantId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing chat participant:', error);
    throw new Error('Failed to remove participant. Please try again.');
  }
};

export const requestEventChatAccess = async (eventId) => {
  try {
    const response = await axiosInstance.post(`/api/event-chat/${eventId}/request-access`);
    return response.data;
  } catch (error) {
    console.error('Error requesting chat access:', error);
    throw new Error('Failed to send chat access request. Please try again.');
  }
};

export const updateFeedback = async (feedbackId, updateData) => {
  try {
    const response = await axiosInstance.put(`/api/feedback/admin/${feedbackId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw new Error('Failed to update feedback. Please try again.');
  }
};

export const deleteFeedback = async (feedbackId) => {
  try {
    const response = await axiosInstance.delete(`/api/feedback/admin/${feedbackId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw new Error('Failed to delete feedback. Please try again.');
  }
};

// Missing API functions - FIXED
export const updateProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put('/api/users/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
};

export const uploadFile = async (file, type = 'general') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await axiosInstance.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
};

// Additional missing API functions
export const unregisterFromEvent = async (eventId) => {
  try {
    const response = await axiosInstance.delete(`/api/events/${eventId}/unregister`);
    return response.data;
  } catch (error) {
    console.error('Error unregistering from event:', error);
    throw new Error('Failed to unregister from event. Please try again.');
  }
};

export const approveUser = async (userId, approvalData) => {
  try {
    const response = await axiosInstance.put(`/api/admin/users/${userId}/approve`, approvalData);
    return response.data;
  } catch (error) {
    console.error('Error approving user:', error);
    throw new Error('Failed to approve user. Please try again.');
  }
};

export const sendContactEmail = async (contactData) => {
  try {
    const response = await axiosInstance.post('/api/contact-us/send', contactData);
    return response.data;
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw new Error('Failed to send contact email. Please try again.');
  }
};

export const sendFeedbackEmail = async (feedbackData) => {
  try {
    const response = await axiosInstance.post('/api/feedback/send', feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error sending feedback email:', error);
    throw new Error('Failed to send feedback email. Please try again.');
  }
};

export const sendEventNotification = async (eventId, notificationData) => {
  try {
    const response = await axiosInstance.post(`/api/events/${eventId}/notify`, notificationData);
    return response.data;
  } catch (error) {
    console.error('Error sending event notification:', error);
    throw new Error('Failed to send event notification. Please try again.');
  }
};

// Get all events (alias for getEvents)
export const getAllEvents = async (searchTerm = '') => {
  try {
    const response = await axiosInstance.get(`/api/events?search=${searchTerm}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all events:', error);
    throw new Error('Failed to fetch events. Please try again.');
  }
};