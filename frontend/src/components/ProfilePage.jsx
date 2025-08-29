// frontend/src/components/ProfilePage.jsx
// Fresh Modern Profile Page Design

import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaUserTie, FaIdCard, FaGraduationCap, 
  FaBuilding, FaCalendar, FaEdit, FaCrown, FaUserGraduate,
  FaSpinner, FaCheckCircle, FaExclamationTriangle, FaUsers
} from 'react-icons/fa';
import { axiosInstance } from '../api/api';
import { getProfilePictureUrl as getImageUrl } from '../utils/imageUtils';
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
  
  // Profile picture state - just for display
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  // Get profile picture URL from user object with cache busting
  const getProfilePictureUrl = (filename) => {
    if (!filename) return null;
    
    // Use the image utilities for consistent URL handling
    const timestamp = Date.now();
    const baseUrl = getImageUrl(filename);
    return baseUrl ? `${baseUrl}?t=${timestamp}` : null;
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
  const loadProfileData = async (showLoading = false) => {
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
      if (user.profilePicture) {
        const fullUrl = getProfilePictureUrl(user.profilePicture);
        console.log('ProfilePage - Setting profile picture from localStorage:', fullUrl);
        setProfilePictureUrl(fullUrl);
      }
      
      // Fetch latest user profile from backend to get updated profile picture
      if (user._id) {
        const backendUser = await fetchUserProfile(user._id);
        if (backendUser && backendUser.profilePicture) {
          const fullUrl = getProfilePictureUrl(backendUser.profilePicture);
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
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    await loadProfileData(true);
  };

  // Check if profile is in sync with backend
  const checkProfileSync = async () => {
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
  };

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
        const fullUrl = getProfilePictureUrl(profilePicture);
        console.log('ProfilePage - Profile picture changed event received:', fullUrl);
        setProfilePictureUrl(fullUrl);
        
        // Update localStorage user object
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.profilePicture = profilePicture;
        localStorage.setItem('user', JSON.stringify(user));
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

  // Handle profile picture changes
  const handleProfilePictureChange = (newProfilePicture) => {
    if (newProfilePicture) {
      const fullUrl = getProfilePictureUrl(newProfilePicture);
      console.log('ProfilePage - Profile picture changed, updating to:', fullUrl);
      setProfilePictureUrl(fullUrl);
      
      // Update localStorage user object
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.profilePicture = newProfilePicture;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Force a re-render by updating the state
      setProfilePictureUrl(''); // Clear first
      setTimeout(() => {
        setProfilePictureUrl(fullUrl); // Set again
      }, 100);
    }
  };

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
            <FaSpinner className="loading-spinner" />
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
                  alt="Profile Picture" 
                  className="profile-picture"
                  onError={(e) => {
                    console.error('Profile picture failed to load:', e.target.src);
                    e.target.style.display = 'none';
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
                  <FaSpinner className="refresh-icon spinning" />
                ) : (
                  <FaSpinner className="refresh-icon" />
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
          </div>

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