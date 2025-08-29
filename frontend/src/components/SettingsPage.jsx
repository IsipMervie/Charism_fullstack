// frontend/src/components/SettingsPage.jsx
// Modern Blue Theme Settings Page Design

import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { FaUser, FaSave, FaTimes, FaEye, FaEyeSlash, FaCamera, FaTrash, FaEnvelope, FaIdCard, FaGraduationCap, FaBuilding, FaCalendar, FaUserTie, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaCog, FaUserGraduate } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile, getUserProfile, uploadProfilePicture, deleteProfilePicture, getPublicSettings } from '../api/api';
import Swal from 'sweetalert2';
import './SettingsPage.css';

function SettingsPage() {
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    userId: '',
    academicYear: '',
    year: '',
    section: '',
    department: '',
  });
  const [profilePicture, setProfilePicture] = useState('');
  const [tempProfilePicture, setTempProfilePicture] = useState(''); // Temporary profile picture for preview
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Settings options for dropdowns
  const [settings, setSettings] = useState({
    academicYears: [],
    yearLevels: [],
    sections: [],
    departments: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const user = await getUserProfile();
        console.log('=== Profile Data Debug ===');
        console.log('Full user object:', user);
        console.log('academicYear:', user.academicYear);
        console.log('year:', user.year);
        console.log('section:', user.section);
        console.log('department:', user.department);
        
        setProfile({
          name: user.name || '',
          email: user.email || '',
          userId: user.userId || '',
          academicYear: user.academicYear || '',
          year: user.year || '',
          section: user.section || '',
          department: user.department || '',
        });
        setProfilePicture(user.profilePicture || '');
        setTempProfilePicture(user.profilePicture || ''); // Initialize temp state with current
        setRole(user.role || '');
        setError('');
        
        // If no profile picture from backend, check localStorage
        if (!user.profilePicture) {
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (localUser.profilePicture) {
            setProfilePicture(localUser.profilePicture);
            setTempProfilePicture(localUser.profilePicture); // Also set temp state
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        
        Swal.fire({
          icon: 'error',
          title: 'Profile Loading Failed',
          text: 'Failed to fetch your profile. Please make sure you are logged in and try refreshing the page.',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        });
        
        setError('Failed to fetch profile. Please make sure you are logged in and your backend is running.');
      }
      setLoading(false);
    };

    const fetchSettings = async () => {
      try {
        const settingsData = await getPublicSettings();
        console.log('=== Settings Data Debug ===');
        console.log('Full settings data:', settingsData);
        console.log('academicYears:', settingsData.academicYears);
        console.log('yearLevels:', settingsData.yearLevels);
        console.log('sections:', settingsData.sections);
        console.log('departments:', settingsData.departments);
        
        const mappedSettings = {
          academicYears: settingsData.academicYears?.map(a => a.year) || [],
          yearLevels: settingsData.yearLevels?.map(y => y.name) || [],
          sections: settingsData.sections?.map(s => s.name) || [],
          departments: settingsData.departments?.map(d => d.name) || [],
        };
        
        console.log('=== Mapped Settings Debug ===');
        console.log('Mapped academicYears:', mappedSettings.academicYears);
        console.log('Mapped yearLevels:', mappedSettings.yearLevels);
        console.log('Mapped sections:', mappedSettings.sections);
        console.log('Mapped departments:', mappedSettings.departments);
        
        setSettings(mappedSettings);
      } catch (err) {
        console.error('Error fetching settings:', err);
        
        Swal.fire({
          icon: 'warning',
          title: 'Settings Loading Warning',
          text: 'Some dropdown options may not be available. You can still save your profile information.',
          confirmButtonColor: '#f59e0b',
          confirmButtonText: 'OK'
        });
      }
    };

    fetchProfile();
    fetchSettings();
  }, []);

  // Get userId from localStorage for ProfilePictureUpload
  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('=== getCurrentUserId Debug ===');
    console.log('Full user object from localStorage:', user);
    console.log('user._id:', user._id);
    console.log('user.userId:', user.userId);
    console.log('user.id:', user.id);
    
    // Try different possible user ID fields
    const userId = user._id || user.userId || user.id || '';
    console.log('Selected userId:', userId);
    return userId;
  };

  // Monitor profilePicture state changes
  useEffect(() => {
    console.log('SettingsPage - profilePicture state updated:', profilePicture);
  }, [profilePicture]);

  // Debug file input ref
  useEffect(() => {
    // Wait for the component to fully render
    const timer = setTimeout(() => {
      console.log('=== FILE INPUT REF DEBUG ===');
      console.log('fileInputRef.current:', fileInputRef.current);
      console.log('File input by ID:', document.getElementById('profile-picture-file-input'));
      console.log('All file inputs on page:', document.querySelectorAll('input[type="file"]'));
      
      // If ref is still null, try to find the element and reconnect
      if (!fileInputRef.current) {
        const input = document.getElementById('profile-picture-file-input');
        if (input) {
          console.log('Reconnecting file input ref...');
          // We can't reassign the ref, but we can log the issue
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const result = await updateUserProfile(profile);
      
      // Apply temporary profile picture changes if any
      if (tempProfilePicture !== profilePicture) {
        setProfilePicture(tempProfilePicture);
        
        // Update localStorage with new profile picture
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.profilePicture = tempProfilePicture;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Dispatch custom event to notify ProfilePage about profile picture change
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { profileData: { ...profile, profilePicture: tempProfilePicture } }
        }));
      } else {
        // Dispatch custom event to notify ProfilePage about profile data change
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { profileData: profile }
        }));
      }
      
      setMessage('Profile updated successfully!');
      setHasUnsavedChanges(false);
      
      // Update localStorage with new profile data
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      Object.assign(user, profile);
      localStorage.setItem('user', JSON.stringify(user));
      
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your profile has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#1e293b'
      });
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update your profile. Please try again.',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
      
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Profile Picture Handlers
  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('=== Frontend Profile Picture Upload Debug ===');
    console.log('File selected:', file);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      setMessage('File too large. Maximum size is 5MB.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setMessage('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    // Get the current authenticated user's ID
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser._id;
    
    if (!userId) {
      console.error('No user ID found in localStorage');
      setMessage('Error: User not authenticated. Please log in again.');
      return;
    }
    
    // Check authentication token
    const token = localStorage.getItem('token');
    console.log('Authentication token exists:', !!token);
    console.log('Token length:', token ? token.length : 0);
    
    console.log('User ID being sent:', userId);
    console.log('User ID type:', typeof userId);
    console.log('Current authenticated user ID:', currentUser._id);
    console.log('Are they the same?', userId === currentUser._id);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('FormData created with file');
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const result = await uploadProfilePicture(userId, formData);
      
      console.log('API Response:', result);
      
      // Check if the upload was successful (backend returns message and profilePicture)
      if (result.message && result.profilePicture) {
        // Store in temporary state for preview (don't update main profile picture yet)
        setTempProfilePicture(result.profilePicture);
        setHasUnsavedChanges(true);
        
        setMessage('Profile picture uploaded successfully! Click "Save Changes" to apply.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to upload profile picture. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!profilePicture) return;

    // Get the current authenticated user's ID
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser._id;
    
    if (!userId) {
      console.error('No user ID found in localStorage');
      setMessage('Error: User not authenticated. Please log in again.');
      return;
    }

    console.log('=== DELETE PROFILE PICTURE DEBUG ===');
    console.log('User ID for delete:', userId);
    console.log('Profile picture to delete:', profilePicture);
    console.log('Authentication token exists:', !!localStorage.getItem('token'));

    setDeleting(true);
    try {
      const result = await deleteProfilePicture(userId);
      
      console.log('Delete API Response:', result);
      
      if (result.message) {
        // Store in temporary state for preview (don't update main profile picture yet)
        setTempProfilePicture('');
        setHasUnsavedChanges(true);
        
        setMessage('Profile picture removed successfully! Click "Save Changes" to apply.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to remove profile picture. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <FaUserTie />;
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
        return '#dc2626';
      case 'staff':
        return '#2563eb';
      case 'student':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-section">
          <div className="loading-content">
            <FaSpinner className="loading-spinner" />
            <h3>Loading Settings</h3>
            <p>Please wait while we fetch your profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`settings-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="settings-header">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">
                <FaCog />
              </div>
            </div>
            <div className="header-text">
              <h1 className="header-title">Account Settings</h1>
              <p className="header-subtitle">Manage your profile information and preferences</p>
            </div>
          </div>
          
          <div className="role-info">
            <div className="role-badge" style={{ backgroundColor: getRoleColor(role) }}>
              {getRoleIcon(role)}
              <span>{role}</span>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="settings-form">
          <form onSubmit={handleSubmit}>
            {/* Profile Picture Section - Redesigned */}
            <div className="form-section profile-section">
              <div className="section-header">
                <h2 className="section-title">
                  <FaUser className="section-icon" />
                  Profile Picture
                </h2>
                <p className="section-subtitle">Upload or change your profile picture</p>
              </div>

              {/* Profile Picture Upload Component */}
              <div className="profile-picture-upload-section">
                {/* Current Profile Picture Display */}
                <div className="current-profile-picture-display">
                  <h3 className="display-title">Current Profile Picture</h3>
                  <div className="profile-picture-preview">
                    {/* Show temporary profile picture if available, otherwise show current */}
                    {(tempProfilePicture || profilePicture) ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/profile-pictures/${tempProfilePicture || profilePicture}`}
                        alt="Current Profile"
                        className="current-profile-image"
                        onError={(e) => {
                          console.log('Profile picture failed to load:', e.target.src);
                          console.log('Profile picture filename:', tempProfilePicture || profilePicture);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          console.log('Profile picture loaded successfully:', e.target.src);
                        }}
                      />
                    ) : null}
                    
                    <div className={`profile-picture-placeholder ${(tempProfilePicture || profilePicture) ? 'hidden' : ''}`}>
                      <FaUser />
                      <span>No profile picture set</span>
                    </div>
                  </div>
                  
                  {/* Show preview indicator if there are temporary changes */}
                  {tempProfilePicture !== profilePicture && (
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '1rem',
                      padding: '0.5rem',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b',
                      color: '#92400e',
                      fontSize: '0.875rem'
                    }}>
                      {tempProfilePicture ? '📸 Preview: New profile picture ready to save' : '🗑️ Preview: Profile picture removal ready to save'}
                    </div>
                  )}
                </div>

                {/* Profile Picture Action Buttons */}
                <div className="profile-picture-actions">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    style={{ display: 'none' }}
                    id="profile-picture-file-input"
                    ref={fileInputRef}
                  />
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log('=== CHANGE PHOTO BUTTON CLICKED ===');
                      console.log('Button clicked successfully');
                      console.log('fileInputRef.current:', fileInputRef.current);
                      
                      // Try multiple methods to trigger file input
                      let fileInput = null;
                      
                      // Method 1: Use ref
                      if (fileInputRef.current) {
                        console.log('Using ref to click file input');
                        fileInput = fileInputRef.current;
                      } else {
                        console.log('Ref not available, trying by ID');
                        // Method 2: Find by ID
                        fileInput = document.getElementById('profile-picture-file-input');
                        if (fileInput) {
                          console.log('Found input by ID');
                        }
                      }
                      
                      // Method 3: Find any file input on the page
                      if (!fileInput) {
                        console.log('Trying to find any file input');
                        const inputs = document.querySelectorAll('input[type="file"]');
                        if (inputs.length > 0) {
                          fileInput = inputs[0];
                          console.log('Found file input by query selector');
                        }
                      }
                      
                      if (fileInput) {
                        console.log('Clicking file input...');
                        fileInput.click();
                      } else {
                        console.error('No file input found');
                        setMessage('Error: File input not found. Please refresh the page.');
                      }
                    }}
                    disabled={uploading}
                    className="action-button upload-button"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {uploading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaCamera className="me-2" />
                        Change Photo
                      </>
                    )}
                  </button>

                  {profilePicture && (
                                      <button
                    type="button"
                    onClick={() => {
                      console.log('=== DELETE BUTTON CLICKED ===');
                      console.log('Delete button clicked successfully');
                      console.log('Current profilePicture:', profilePicture);
                      handleDeleteProfilePicture();
                    }}
                    disabled={deleting}
                    className="action-button delete-button"
                    style={{
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                      {deleting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash className="me-2" />
                          Remove
                        </>
                      )}
                    </button>
                  )}
                </div>
                
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">
                  <FaUser className="section-icon" />
                  Personal Information
                </h2>
                <p className="section-subtitle">Update your basic profile details</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <FaUser className="label-icon" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FaEnvelope className="label-icon" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                    disabled
                  />
                  <small className="form-help">Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FaIdCard className="label-icon" />
                    User ID
                  </label>
                  <input
                    type="text"
                    name="userId"
                    value={profile.userId}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your user ID"
                    disabled
                  />
                  <small className="form-help">User ID cannot be changed</small>
                </div>
              </div>
            </div>

            {/* Academic Information Section (Students Only) */}
            {role === 'Student' && (
              <div className="form-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <FaGraduationCap className="section-icon" />
                    Academic Information
                  </h2>
                  <p className="section-subtitle">Update your academic details</p>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <FaCalendar className="label-icon" />
                      Academic Year
                    </label>
                    {console.log('=== Form Render Debug ===')}
                    {console.log('profile.academicYear:', profile.academicYear)}
                    {console.log('settings.academicYears:', settings.academicYears)}
                    <select
                      name="academicYear"
                      value={profile.academicYear}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">
                        {profile.academicYear ? `Current: ${profile.academicYear}` : 'Select Academic Year'}
                      </option>
                      {settings.academicYears.map((year, index) => (
                        <option key={index} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <FaGraduationCap className="label-icon" />
                      Year Level
                    </label>
                    {console.log('profile.year:', profile.year)}
                    {console.log('settings.yearLevels:', settings.yearLevels)}
                    <select
                      name="year"
                      value={profile.year}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">
                        {profile.year ? `Current: ${profile.year}` : 'Select Year Level'}
                      </option>
                      {settings.yearLevels.map((level, index) => (
                        <option key={index} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <FaBuilding className="label-icon" />
                      Department
                    </label>
                    <select
                      name="department"
                      value={profile.department}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">
                        {profile.department ? `Current: ${profile.department}` : 'Select Department'}
                      </option>
                      {settings.departments.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <FaUserTie className="label-icon" />
                      Section
                    </label>
                    <select
                      name="section"
                      value={profile.section}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">
                        {profile.section ? `Current: ${profile.section}` : 'Select Section'}
                      </option>
                      {settings.sections.map((section, index) => (
                        <option key={index} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                className={`save-button ${hasUnsavedChanges ? 'has-changes' : ''}`}
                disabled={saving || !hasUnsavedChanges}
              >
                {saving ? (
                  <>
                    <FaSpinner className="button-icon spinner-icon" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="button-icon" />
                    Save Changes
                  </>
                )}
              </button>
              
              {hasUnsavedChanges && (
                <span className="unsaved-changes-hint">
                  You have unsaved changes
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Message Sections */}
        {message && (
          <div className="message-section">
            <div className="message-content">
              <FaCheckCircle className="message-icon" />
              <span className="message-text">{message}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="error-section">
            <div className="error-content">
              <FaExclamationTriangle className="error-icon" />
              <span className="error-text">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;