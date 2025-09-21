import React, { useState, useRef } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { FaCamera, FaTrash, FaUser } from 'react-icons/fa';
import { uploadProfilePicture, deleteProfilePicture } from '../api/api';
import Swal from 'sweetalert2';
import { getProfilePictureUrl } from '../utils/imageUtils';
import './ProfilePictureUpload.css';

const ProfilePictureUpload = ({ 
  userId, 
  currentProfilePicture, 
  onProfilePictureChange,
  size = 'medium',
  showUploadButton = true,
  showDeleteButton = true,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Upload the file
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please select a valid image file (JPEG, PNG, GIF, or WebP).'
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please select an image smaller than 5MB.'
      });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadProfilePicture(userId, file);
      
      Swal.fire({
        icon: 'success',
        title: 'Profile Picture Updated',
        text: 'Your profile picture has been updated successfully!',
        timer: 2000,
        showConfirmButton: false
      });

      // Call the callback to update parent component
      if (onProfilePictureChange) {
        onProfilePictureChange(result.profilePicture);
      }

      // Update localStorage with new profile picture
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.profilePicture = result.profilePicture;
      localStorage.setItem('user', JSON.stringify(user));

      // Dispatch custom event for immediate refresh
      window.dispatchEvent(new CustomEvent('profilePictureChanged', {
        detail: { profilePicture: result.profilePicture }
      }));

      // Also dispatch a general profile update event
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: { profileData: { profilePicture: result.profilePicture } }
      }));

      // Clear preview
      setPreviewUrl(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Failed to upload profile picture. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Profile Picture?',
      text: 'Are you sure you want to remove your profile picture? This action cannot be undone.',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        await deleteProfilePicture(userId);
        
        Swal.fire({
          icon: 'success',
          title: 'Profile Picture Deleted',
          text: 'Your profile picture has been removed successfully!',
          timer: 2000,
          showConfirmButton: false
        });

        // Call the callback to update parent component
        if (onProfilePictureChange) {
          onProfilePictureChange(null);
        }

        // Update localStorage to remove profile picture
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.profilePicture = null;
        localStorage.setItem('user', JSON.stringify(user));

        // Dispatch custom event for immediate refresh
        window.dispatchEvent(new CustomEvent('profilePictureChanged', {
          detail: { profilePicture: null }
        }));

        // Also dispatch a general profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { profileData: { profilePicture: null } }
        }));
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: error.message || 'Failed to delete profile picture. Please try again.'
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  const getProfilePictureUrlLocal = (filename) => {
    if (!filename) return null;
    // Use the image utilities for consistent URL handling
    return getProfilePictureUrl(filename);
  };

  const currentImageUrl = currentProfilePicture ? getProfilePictureUrlLocal(currentProfilePicture) : null;
  const displayImageUrl = previewUrl || currentImageUrl;

  const sizeClasses = {
    small: 'profile-picture-small',
    medium: 'profile-picture-medium',
    large: 'profile-picture-large'
  };

  return (
    <div className={`profile-picture-upload ${sizeClasses[size]} ${className}`}>
      <div className="profile-picture-container">
        {/* Profile Picture Display */}
        <div className="profile-picture-display">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt="Profile"
              className="profile-picture-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback Icon */}
          <div className={`profile-picture-fallback ${displayImageUrl ? 'hidden' : ''}`}>
            <FaUser />
          </div>
        </div>

        {/* Action Buttons - Separated from the circle */}
        <div className="profile-picture-actions">
          {showUploadButton && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                  // Fallback: try to find input by ID
                  const input = document.getElementById('profile-picture-file-input');
                  if (input) {
                    input.click();
                  }
                }
              }}
              disabled={uploading}
              className="action-button upload-button"
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
            </Button>
          )}

          {showDeleteButton && currentProfilePicture && (
            <Button
              variant="danger"
              size="lg"
              onClick={handleDelete}
              disabled={deleting}
              className="action-button delete-button"
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
            </Button>
          )}
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="profile-picture-file-input"
        />

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-text">Uploading profile picture...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
