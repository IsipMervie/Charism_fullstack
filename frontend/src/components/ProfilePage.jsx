// frontend/src/components/ProfilePage.jsx
// Fresh Modern Profile Page Design

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUser, FaEnvelope, FaUserTie, FaIdCard, FaGraduationCap, 
  FaBuilding, FaCalendar, FaCrown, FaUserGraduate,
  FaCheckCircle, FaUsers, FaEdit, FaSave, FaTimes
} from 'react-icons/fa';
import { axiosInstance, updateProfile } from '../api/api';
import { getProfilePictureUrl } from '../utils/imageUtils';
import './ProfilePage.css';

function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userId: '',
    academicYear: '',
    department: '',
    year: '',
    section: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.userId.trim()) {
      errors.userId = 'User ID is required';
    }
    
    if (!formData.academicYear.trim()) {
      errors.academicYear = 'Academic Year is required';
    }
    
    if (!formData.department.trim()) {
      errors.department = 'Department is required';
    }
    
    if (!formData.year.trim()) {
      errors.year = 'Year is required';
    }
    
    if (!formData.section.trim()) {
      errors.section = 'Section is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Profile picture state - just for display
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  // Get profile picture URL from user object with cache busting
  const getProfilePictureUrlWithTimestamp = (filename, userId) => {
    if (!filename || !userId) return null;
    
    // Use the image utilities for consistent URL handling
    const timestamp = Date.now();
    const baseUrl = getProfilePictureUrl(filename, userId);
    
    if (!baseUrl) return null;
    
    // Add cache busting timestamp
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${timestamp}`;
  };

  // Fetch user profile from backend to get the latest profile picture
  const fetchUserProfile = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
              const response = await axiosInstance.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Load profile data from localStorage and backend
  const loadProfileData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setRefreshing(true);
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('ProfilePage - User from localStorage:', user);
      console.log('ProfilePage - User ID:', user._id);
      
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || '');
      setUserId(user.userId || '');
      setAcademicYear(user.academicYear || '');
      setDepartment(user.department || '');
      setYear(user.year || '');
      setSection(user.section || '');
      
      // Set profile picture from localStorage first (for immediate display)
      const fullUrl = getProfilePictureUrl(user.profilePicture, user._id);
      console.log('ProfilePage - Setting profile picture from localStorage:', fullUrl);
      setProfilePictureUrl(fullUrl);
      
      // Fetch latest user profile from backend to get updated profile picture
      if (user._id) {
        const backendUser = await fetchUserProfile(user._id);
        if (backendUser && backendUser._id) {
          const fullUrl = getProfilePictureUrl(backendUser.profilePicture, backendUser._id);
          console.log('ProfilePage - Found profile picture from backend:', fullUrl);
          setProfilePictureUrl(fullUrl);
          
          // Update localStorage if backend has newer data
          if (backendUser.profilePicture !== user.profilePicture) {
            user.profilePicture = backendUser.profilePicture;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } else {
          console.log('ProfilePage - No profile picture found in backend');
        }
      }
      
      if (showLoading) {
        setMessage('Profile refreshed successfully!');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      if (showLoading) {
        setMessage('Failed to refresh profile. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    } finally {
      if (showLoading) {
        setRefreshing(false);
      }
    }
  }, []);

  // Manual refresh function
  const handleManualRefresh = async () => {
    await loadProfileData(true);
  };

  // Form handling functions
  const handleEditClick = () => {
    setFormData({
      name,
      email,
      userId,
      academicYear,
      department,
      year,
      section
    });
    setIsEditing(true);
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      email: '',
      userId: '',
      academicYear: '',
      department: '',
      year: '',
      section: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await updateProfile(formData);
      
      // Update local state
      setName(formData.name);
      setEmail(formData.email);
      setUserId(formData.userId);
      setAcademicYear(formData.academicYear);
      setDepartment(formData.department);
      setYear(formData.year);
      setSection(formData.section);
      
      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      Object.assign(user, formData);
      localStorage.setItem('user', JSON.stringify(user));
      
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: { profileData: formData }
      }));
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if profile is in sync with backend
  const checkProfileSync = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user._id) {
        const backendUser = await fetchUserProfile(user._id);
        if (backendUser) {
          // Check if any fields are out of sync
          const fieldsToCheck = ['name', 'email', 'userId', 'academicYear', 'year', 'section', 'department', 'profilePicture'];
          const isInSync = fieldsToCheck.every(field => user[field] === backendUser[field]);
          
          if (!isInSync) {
            console.log('Profile out of sync with backend, updating...');
            await loadProfileData();
          }
        }
      }
    } catch (error) {
      console.error('Error checking profile sync:', error);
    }
  }, [loadProfileData]);

  useEffect(() => {
    const loadProfile = async () => {
      setIsVisible(true);
      setMessage('Loading profile data...');
      await loadProfileData();
      setLoading(false);
      setMessage('Profile loaded successfully!');
      setTimeout(() => setMessage(''), 2000);
    };
    
    loadProfile();
    
    // Set up periodic refresh every 30 seconds to stay in sync
    const refreshInterval = setInterval(async () => {
      console.log('ProfilePage - Periodic sync check');
      await checkProfileSync();
    }, 30000);
    
    // Listen for profile picture changes from ProfilePictureUpload
    const handleProfilePictureChange = (event) => {
      const { profilePicture } = event.detail;
      if (profilePicture) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser._id) {
          const fullUrl = getProfilePictureUrl(profilePicture, currentUser._id);
          console.log('ProfilePage - Profile picture changed event received:', fullUrl);
          setProfilePictureUrl(fullUrl);
        }
        
        // Update localStorage user object
        currentUser.profilePicture = profilePicture;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    };
    
    // Listen for profile updates from SettingsPage
    const handleProfileUpdate = (event) => {
      const { profileData } = event.detail;
      if (profileData) {
        console.log('ProfilePage - Profile update event received:', profileData);
        
        // Update local state
        setName(profileData.name || '');
        setEmail(profileData.email || '');
        setUserId(profileData.userId || '');
        setAcademicYear(profileData.academicYear || '');
        setDepartment(profileData.department || '');
        setYear(profileData.year || '');
        setSection(profileData.section || '');
        
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        Object.assign(user, profileData);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Show success message
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    };
    
    // Listen for localStorage changes (when other tabs/components update it)
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        console.log('ProfilePage - localStorage user updated, reloading profile');
        loadProfileData();
      }
    };
    
    // Add event listeners
    window.addEventListener('profilePictureChanged', handleProfilePictureChange);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup event listeners and interval
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('profilePictureChanged', handleProfilePictureChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);



  // Get profile picture fallback
  const getProfilePictureFallback = () => {
    return (
      <div className="profile-picture-fallback">
        {getRoleIcon(role)}
      </div>
    );
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <FaCrown />;
      case 'staff':
        return <FaUserTie />;
      case 'student':
        return <FaUserGraduate />;
      default:
        return <FaUser />;
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '#ef4444';
      case 'staff':
        return '#3b82f6';
      case 'student':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrator';
      case 'staff':
        return 'Staff Member';
      case 'student':
        return 'Student';
      default:
        return role || 'User';
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-section">
          <div className="loading-content">
            <h3>Loading Profile</h3>
            <p>Please wait while we fetch your profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`profile-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="profile-picture-container">
              {profilePictureUrl ? (
                <img 
                  src={profilePictureUrl} 
                  alt="Profile" 
                  className="profile-picture"
                  onError={(e) => {
                    console.error('Profile picture failed to load:', e.target.src);
                    // Set a default profile picture or hide the image
                    let apiUrl = process.env.REACT_APP_API_URL || 
                      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                        ? 'http://localhost:5000/api' 
                        : 'https://charism-api-xtw9.onrender.com');
                    
                    // Ensure API URL always ends with /api
                    if (!apiUrl.endsWith('/api')) {
                      apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`;
                    }
                    e.target.src = `${apiUrl}/files/profile-picture/default`;
                    e.target.onerror = null; // Prevent infinite loop
                  }}
                  onLoad={() => {
                    console.log('Profile picture loaded successfully:', profilePictureUrl);
                  }}
                />
              ) : (
                getProfilePictureFallback()
              )}
            </div>
            
            <div className="role-badge" style={{ backgroundColor: getRoleColor(role) }}>
              {getRoleBadge(role)}
            </div>
          </div>
          
          <div className="profile-info">
            <div className="profile-header-actions">
              <h1 className="profile-name">{name || 'User Name'}</h1>
              <button 
                className="refresh-button"
                onClick={handleManualRefresh}
                title="Refresh Profile Data"
                disabled={refreshing}
              >
                {refreshing ? (
                  <span>Refreshing...</span>
                ) : (
                  <span>Refresh</span>
                )}
              </button>
            </div>
            <p className="profile-email">{email}</p>
            <div className="profile-stats">
              <div className="stat-item">
                <FaCalendar className="stat-icon" />
                <span className="stat-label">Member Since</span>
                <span className="stat-value">2024</span>
              </div>
              <div className="stat-item">
                <FaBuilding className="stat-icon" />
                <span className="stat-label">Department</span>
                <span className="stat-value">{department || 'Not Assigned'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="profile-details">
          <div className="details-header">
            <h2 className="details-title">
              <FaUser className="details-icon" />
              Profile Information
            </h2>
            <p className="details-subtitle">Your account details and preferences</p>
            {!isEditing && (
              <button 
                className="edit-profile-button"
                onClick={handleEditClick}
                title="Edit Profile"
              >
                <FaEdit className="button-icon" />
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleFormSubmit} className="profile-edit-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    <FaUser className="form-icon" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="Enter your full name"
                  />
                  {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <FaEnvelope className="form-icon" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.email ? 'error' : ''}`}
                    placeholder="Enter your email"
                  />
                  {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="userId" className="form-label">
                    <FaIdCard className="form-icon" />
                    User ID *
                  </label>
                  <input
                    type="text"
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.userId ? 'error' : ''}`}
                    placeholder="Enter your user ID"
                  />
                  {formErrors.userId && <span className="error-message">{formErrors.userId}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="academicYear" className="form-label">
                    <FaGraduationCap className="form-icon" />
                    Academic Year
                  </label>
                  <input
                    type="text"
                    id="academicYear"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter academic year"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department" className="form-label">
                    <FaBuilding className="form-icon" />
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter department"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="year" className="form-label">
                    <FaUserGraduate className="form-icon" />
                    Year Level
                  </label>
                  <input
                    type="text"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter year level"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="section" className="form-label">
                    <FaUsers className="form-icon" />
                    Section
                  </label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter section"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="cancel-button"
                  disabled={submitting}
                >
                  <FaTimes className="button-icon" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-button"
                  disabled={submitting}
                >
                  <FaSave className="button-icon" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-header">
                  <FaUser className="detail-icon" />
                  <span className="detail-label">Full Name</span>
                </div>
                <div className="detail-value">{name || 'Not provided'}</div>
              </div>

              <div className="detail-card">
                <div className="detail-header">
                  <FaEnvelope className="detail-icon" />
                  <span className="detail-label">Email Address</span>
                </div>
                <div className="detail-value">{email || 'Not provided'}</div>
              </div>

              <div className="detail-card">
                <div className="detail-header">
                  <FaIdCard className="detail-icon" />
                  <span className="detail-label">User ID</span>
                </div>
                <div className="detail-value">{userId || 'Not provided'}</div>
              </div>

              <div className="detail-card">
                <div className="detail-header">
                  <FaUserTie className="detail-icon" />
                  <span className="detail-label">Account Role</span>
                </div>
                <div className="detail-value">
                  <span className="role-display" style={{ color: getRoleColor(role) }}>
                    {getRoleIcon(role)}
                    {getRoleBadge(role)}
                  </span>
                </div>
              </div>

              {academicYear && (
                <div className="detail-card">
                  <div className="detail-header">
                    <FaGraduationCap className="detail-icon" />
                    <span className="detail-label">Academic Year</span>
                  </div>
                  <div className="detail-value">{academicYear}</div>
                </div>
              )}

              {department && (
                <div className="detail-card">
                  <div className="detail-header">
                    <FaBuilding className="detail-icon" />
                    <span className="detail-label">Department</span>
                  </div>
                  <div className="detail-value">{department}</div>
                </div>
              )}

              {year && (
                <div className="detail-card">
                  <div className="detail-header">
                    <FaUserGraduate className="detail-icon" />
                    <span className="detail-label">Year Level</span>
                  </div>
                  <div className="detail-value">{year}</div>
                </div>
              )}

              {section && (
                <div className="detail-card">
                  <div className="detail-header">
                    <FaUsers className="detail-icon" />
                    <span className="detail-label">Section</span>
                  </div>
                  <div className="detail-value">{section}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Success Message */}
        {message && (
          <div className="message-section">
            <div className="message-content">
              <FaCheckCircle className="message-icon" />
              <span className="message-text">{message}</span>
            </div>
          </div>
        )}

        {/* Profile Sync Status */}
        <div className="sync-status">
          <div className="sync-indicator">
            <div className="sync-dot"></div>
            <span className="sync-text">Profile synchronized with settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;