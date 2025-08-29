import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token if it exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't override Content-Type for file uploads
    if (config.data instanceof FormData) {
      // Remove the default Content-Type to let the browser set it with boundary
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        console.error('401 Unauthorized:', data.message || 'Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        // Optionally redirect to login:
        // window.location.href = '/login';
      }
      if (status === 500) {
        console.error('500 Server Error:', data.message || 'Try again later.');
      }
    }
    return Promise.reject(error);
  }
);

// Helper to get userId from localStorage
function getUserId() {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user)._id;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }
  const userId = localStorage.getItem('userId');
  if (userId) return userId;
  throw new Error('No userId found in localStorage. Please log in.');
}

// =======================
// API Functions
// =======================

// Generate registration tokens for existing events (admin utility)
export const generateTokensForExistingEvents = async () => {
  try {
    const response = await axiosInstance.post('/events/generate-tokens');
    return response.data;
  } catch (error) {
    console.error('Error generating tokens for existing events:', error);
    throw new Error('Failed to generate tokens for existing events. Please try again.');
  }
};

// Users (Admin/Staff)
export const getUsers = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/admin/users${query ? `?${query}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users. Please try again.');
  }
};



export const deleteUser = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user. Please try again.');
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axiosInstance.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user. Please try again.');
  }
};

// Settings Management Functions
export const addSection = async (name) => {
  try {
    const response = await axiosInstance.post('/settings/sections', { name });
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
    const response = await axiosInstance.put(`/settings/sections/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating section:', error);
    throw new Error('Failed to update section. Please try again.');
  }
};

export const deleteSection = async (id) => {
  try {
    const response = await axiosInstance.delete(`/settings/sections/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting section:', error);
    throw new Error('Failed to delete section. Please try again.');
  }
};

// Year Levels Management
export const addYearLevel = async (name) => {
  try {
    const response = await axiosInstance.post('/settings/year-levels', { name });
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
    const response = await axiosInstance.put(`/settings/year-levels/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating year level:', error);
    throw new Error('Failed to update year level. Please try again.');
  }
};

export const deleteYearLevel = async (id) => {
  try {
    const response = await axiosInstance.delete(`/settings/year-levels/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting year level:', error);
    throw new Error('Failed to delete year level. Please try again.');
  }
};

// Departments Management
export const addDepartment = async (name) => {
  try {
    const response = await axiosInstance.post('/settings/departments', { name });
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
    const response = await axiosInstance.put(`/settings/departments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating department:', error);
    throw new Error('Failed to update department. Please try again.');
  }
};

export const deleteDepartment = async (id) => {
  try {
    const response = await axiosInstance.delete(`/settings/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw new Error('Failed to delete department. Please try again.');
  }
};

// Academic Years
export const getActiveAcademicYears = async () => {
  try {
    const response = await axiosInstance.get('/academic-years/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active academic years:', error);
    throw new Error('Failed to fetch academic years. Please try again.');
  }
};

export const getAcademicYears = async () => {
  try {
    const response = await axiosInstance.get('/academic-years');
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
    const response = await axiosInstance.post('/academic-years', academicYearData);
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
    const response = await axiosInstance.put(`/academic-years/${id}`, academicYearData);
    return response.data;
  } catch (error) {
    console.error('Error updating academic year:', error);
    throw new Error('Failed to update academic year. Please try again.');
  }
};

export const deleteAcademicYear = async (id) => {
  try {
    const response = await axiosInstance.delete(`/academic-years/${id}`);
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
    const response = await axiosInstance.get('/admin/staff-approvals');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending staff approvals:', error);
    throw new Error('Failed to fetch pending staff approvals. Please try again.');
  }
};

export const approveStaff = async (userId, approvalNotes = '') => {
  try {
    const response = await axiosInstance.post(`/admin/staff-approvals/${userId}/approve`, {
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
    const response = await axiosInstance.post(`/admin/staff-approvals/${userId}/reject`, {
      approvalNotes
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting staff:', error);
    throw new Error('Failed to reject staff. Please try again.');
  }
};

// Events
export const getEvents = async () => {
  try {
    const response = await axiosInstance.get('/events');
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch events. Please try again.');
  }
};

export const getEventDetails = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw new Error('Failed to fetch event details. Please try again.');
  }
};

export const joinEvent = async (eventId) => {
  try {
    const response = await axiosInstance.post(`/events/${eventId}/join`);
    return response.data;
  } catch (error) {
    console.error('Error joining event:', error);
    throw new Error('Failed to join event. Please try again.');
  }
};

export const timeIn = async (eventId) => {
  try {
    const userId = getUserId();
    const response = await axiosInstance.post(`/events/${eventId}/attendance/${userId}/time-in`);
    return response.data;
  } catch (error) {
    console.error('Error timing in:', error);
    throw new Error('Failed to time in. Please try again.');
  }
};

export const timeOut = async (eventId) => {
  try {
    const userId = getUserId();
    const response = await axiosInstance.post(`/events/${eventId}/attendance/${userId}/time-out`);
    return response.data;
  } catch (error) {
    console.error('Error timing out:', error);
    throw new Error('Failed to time out. Please try again.');
  }
};

export const getEventParticipants = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/events/${eventId}/participants`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event participants:', error);
    throw new Error('Failed to fetch event participants. Please try again.');
  }
};

export const getStudentsByYear = async () => {
  try {
    const response = await axiosInstance.get('/admin/students-by-year');
    return response.data;
  } catch (error) {
    console.error('Error fetching students by year:', error);
    throw new Error('Failed to fetch students by year. Please try again.');
  }
};

export const getStudentsByYearFilterOptions = async () => {
  try {
    const response = await axiosInstance.get('/admin/students-by-year-filter-options');
    return response.data;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw new Error('Failed to fetch filter options. Please try again.');
  }
};

export const getStudents40Hours = async () => {
  try {
    const response = await axiosInstance.get('/admin/students-40-hours');
    return response.data;
  } catch (error) {
    console.error('Error fetching students with 40+ hours:', error);
    throw new Error('Failed to fetch students with 40+ hours. Please try again.');
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await axiosInstance.delete(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event. Please try again.');
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await axiosInstance.put(`/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event. Please try again.');
  }
};

// Auth
export const loginUser = async (email, password) => {
  try {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    // Preserve the original error structure so frontend can access response data
    if (error.response?.data?.message) {
      const customError = new Error(error.response.data.message);
      customError.response = error.response;
      throw customError;
    }
    throw error;
  }
};

export const registerUser = async (name, email, password, userId, academicYear, year, section, role, department) => {
  try {
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
    const response = await axiosInstance.post('/auth/register', payload);
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
export const createEvent = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axiosInstance.post('/events/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 60000, // 60 second timeout for file uploads
    });
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
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
  try {
    const response = await axiosInstance.get('/analytics');
    return response.data;
  } catch (error) {
    // Fallback to legacy endpoint if the new one is not available
    if (error?.response?.status === 404) {
      try {
        const legacy = await axiosInstance.get('/events/analytics');
        return legacy.data;
      } catch (legacyErr) {
        console.error('Error fetching analytics (legacy):', legacyErr);
        throw new Error('Failed to fetch analytics. Please try again.');
      }
    }
    console.error('Error fetching analytics:', error);
    throw new Error('Failed to fetch analytics. Please try again.');
  }
};

// Change Password
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await axiosInstance.post('/auth/change-password', { oldPassword, newPassword });
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
    const response = await axiosInstance.get('/settings/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile. Please try again.');
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await axiosInstance.post('/settings/profile', profileData);
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
    
    const response = await axiosInstance.post(`/users/${userId}/profile-picture`, formData);
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
    const response = await axiosInstance.delete(`/users/${userId}/profile-picture`);
    return response.data;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw new Error('Failed to delete profile picture. Please try again.');
  }
};

// Messages
export const getMessages = async () => {
  try {
    const response = await axiosInstance.get('/messages');
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages. Please try again.');
  }
};

export const sendMessage = async (messageData) => {
  try {
    const response = await axiosInstance.post('/messages', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message. Please try again.');
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const response = await axiosInstance.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message. Please try again.');
  }
};

// Notifications
export const getNotifications = async () => {
  try {
    const response = await axiosInstance.get('/notifications');
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
    const response = await axiosInstance.patch(`/events/${eventId}/attendance/${userId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Error approving attendance:', error);
    throw new Error('Failed to approve attendance. Please try again.');
  }
};

export const disapproveAttendance = async (eventId, userId, reason) => {
  try {
    const response = await axiosInstance.patch(`/events/${eventId}/attendance/${userId}/disapprove`, {
      reason: reason
    });
    return response.data;
  } catch (error) {
    console.error('Error disapproving attendance:', error);
    throw new Error('Failed to disapprove attendance. Please try again.');
  }
};

// Reflection functions removed - no longer needed

// Certificate Generation
export const generateCertificate = async (userId) => {
  try {
    const response = await axiosInstance.get(`/certificates/${userId}`, {
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
    const response = await axiosInstance.get(`/reports/students-by-year?year=${year}`, {
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
    const response = await axiosInstance.get('/settings');
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
    const response = await axiosInstance.get('/settings/public');
    return response.data;
  } catch (error) {
    console.error('Error fetching public settings:', error);
    throw new Error('Failed to fetch public settings. Please try again.');
  }
};

// Get public school settings (for navbar)
export const getPublicSchoolSettings = async () => {
  try {
    const response = await axiosInstance.get('/settings/public/school');
    return response.data;
  } catch (error) {
    console.error('Error fetching public school settings:', error);
    // Return default values if API fails
    return {
          schoolName: 'CHARISM School',
    brandName: 'CHARISM',
      logo: null
    };
  }
};

export const updateSettings = async (settingsData) => {
  try {
    const response = await axiosInstance.post('/settings', settingsData);
    return response.data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings. Please try again.');
  }
};

// Get school settings (Admin only)
export const getSchoolSettings = async () => {
  try {
    const response = await axiosInstance.get('/settings/school');
    return response.data;
  } catch (error) {
    console.error('Error fetching school settings:', error);
    throw new Error('Failed to fetch school settings. Please try again.');
  }
};

// Update school settings (Admin only)
export const updateSchoolSettings = async (formData) => {
  try {
    const response = await axiosInstance.post('/settings/school', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating school settings:', error);
    throw new Error(error.response?.data?.message || 'Failed to update school settings. Please try again.');
  }
};

// Reports
export const generateReport = async (reportType, params = {}) => {
  try {
    let url = `/reports/${reportType}`;
    if (Object.keys(params).length > 0) {
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
    const response = await axiosInstance.post('/auth/forgot-password', { email });
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
    const response = await axiosInstance.post('/auth/reset-password', { token, newPassword });
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
    const response = await axiosInstance.get(`/auth/verify-email/${token}`);
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
    const response = await axiosInstance.get(`/events/${eventId}/attendance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event attendance:', error);
    throw new Error('Failed to fetch event attendance. Please try again.');
  }
};

// User Participation
export const getUserParticipation = async () => {
  try {
    const response = await axiosInstance.get('/user/participation');
    return response.data;
  } catch (error) {
    console.error('Error fetching user participation:', error);
    throw new Error('Failed to fetch user participation. Please try again.');
  }
};

// Event Statistics
export const getEventStatistics = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/events/${eventId}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    throw new Error('Failed to fetch event statistics. Please try again.');
  }
};

// My Events
export const getMyEvents = async () => {
  try {
    const response = await axiosInstance.get('/user/my-events');
    return response.data;
  } catch (error) {
    console.error('Error fetching my events:', error);
    throw new Error('Failed to fetch my events. Please try again.');
  }
};

// My Participation History
export const getMyParticipationHistory = async () => {
  try {
    const response = await axiosInstance.get('/user/participation-history');
    return response.data;
  } catch (error) {
    console.error('Error fetching participation history:', error);
    throw new Error('Failed to fetch participation history. Please try again.');
  }
};

// Event Attendance Report
export const getEventAttendanceReport = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/events/${eventId}/attendance-report`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event attendance report:', error);
    throw new Error('Failed to fetch event attendance report. Please try again.');
  }
};

// Department Statistics
export const getDepartmentStatistics = async (department) => {
  try {
    const response = await axiosInstance.get(`/analytics/department/${department}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    throw new Error('Failed to fetch department statistics. Please try again.');
  }
};

// Yearly Statistics
export const getYearlyStatistics = async (year) => {
  try {
    const response = await axiosInstance.get(`/analytics/yearly/${year}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching yearly statistics:', error);
    throw new Error('Failed to fetch yearly statistics. Please try again.');
  }
};

// Bulk Certificate Generation
export const generateBulkCertificates = async (userIds) => {
  try {
    const response = await axiosInstance.post('/certificates/bulk', { userIds }, {
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
export const submitContactForm = async (contactData) => {
  try {
    const response = await axiosInstance.post('/contact', contactData);
    return response.data;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw new Error('Failed to submit contact form. Please try again.');
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
    const response = await axiosInstance.get(`/events/${eventId}/attachments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event attachments:', error);
    throw new Error('Failed to fetch event attachments. Please try again.');
  }
};

export const getPendingRegistrations = async () => {
  try {
    console.log('🔍 Fetching pending registrations...');
    const response = await axiosInstance.get('/events/pending-registrations');
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
    const response = await axiosInstance.get(`/events/${eventId}/registrations/pending`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending registrations for event:', error);
    throw new Error('Failed to fetch pending registrations for event. Please try again.');
  }
};

export const approveRegistration = async (eventId, userId) => {
  try {
    console.log(`✅ Approving registration for event ${eventId}, user ${userId}`);
    const response = await axiosInstance.put(`/events/${eventId}/registrations/${userId}/approve`);
    console.log('✅ Registration approved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error approving registration:', error);
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Cannot approve registration. Event may be full.');
    }
    throw new Error('Failed to approve registration. Please try again.');
  }
};

export const disapproveRegistration = async (eventId, userId, reason) => {
  try {
    console.log(`❌ Disapproving registration for event ${eventId}, user ${userId}`);
    const response = await axiosInstance.put(`/events/${eventId}/registrations/${userId}/disapprove`, { reason });
    console.log('✅ Registration disapproved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error disapproving registration:', error);
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Cannot disapprove registration. Reason is required.');
    }
    throw new Error('Failed to disapprove registration. Please try again.');
  }
};

export const getAllEventRegistrations = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/events/${eventId}/registrations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    throw new Error('Failed to fetch event registrations. Please try again.');
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
    
    const response = await axiosInstance.post(`/events/${eventId}/documentation/upload`, formData, {
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
    const response = await axiosInstance.get(`/events/${eventId}/documentation`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event documentation:', error);
    throw new Error('Failed to fetch event documentation. Please try again.');
  }
};

export const downloadDocumentationFile = async (eventId, filename, originalName) => {
  try {
    const response = await axiosInstance.get(`/events/${eventId}/documentation/download/${filename}`, {
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
    const response = await axiosInstance.delete(`/events/${eventId}/documentation/${filename}`);
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
    const response = await axiosInstance.get(`/events/register/${token}`);
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
    const response = await axiosInstance.post(`/events/register/${token}`);
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
    const response = await axiosInstance.post('/feedback/submit', feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback. Please try again.');
  }
};

export const getUserFeedback = async () => {
  try {
    const response = await axiosInstance.get('/feedback/my-feedback');
    return response.data;
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    throw new Error('Failed to fetch feedback. Please try again.');
  }
};

export const getFeedbackById = async (feedbackId) => {
  try {
    const response = await axiosInstance.get(`/feedback/${feedbackId}`);
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
    const response = await axiosInstance.get(`/feedback/admin/all${query ? `?${query}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    throw new Error('Failed to fetch feedback. Please try again.');
  }
};

export const getFeedbackStats = async () => {
  try {
    const response = await axiosInstance.get('/feedback/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    throw new Error('Failed to fetch feedback statistics. Please try again.');
  }
};

export const updateFeedback = async (feedbackId, updateData) => {
  try {
    const response = await axiosInstance.put(`/feedback/admin/${feedbackId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw new Error('Failed to update feedback. Please try again.');
  }
};

export const deleteFeedback = async (feedbackId) => {
  try {
    const response = await axiosInstance.delete(`/feedback/admin/${feedbackId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw new Error('Failed to delete feedback. Please try again.');
  }
};