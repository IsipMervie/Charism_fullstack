// frontend/src/components/SchoolSettingsPage.jsx
// Simple but Creative School Settings Page Design

import React, { useState, useEffect } from 'react';
import { getSchoolSettings, updateSchoolSettings } from '../api/api';
import { getLogoUrl } from '../utils/imageUtils';
import Swal from 'sweetalert2';
import { FaBuilding, FaEnvelope, FaTag, FaImage, FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './SchoolSettingsPage.css';

function SchoolSettingsPage() {
  const [settings, setSettings] = useState({
    schoolName: '',
    contactEmail: '',
    brandName: '',
    logo: null,
    logoPreview: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getSchoolSettings();
      setSettings({
        schoolName: data.schoolName || '',
        contactEmail: data.contactEmail || '',
        brandName: data.brandName || '',
        logo: null,
        logoPreview: data.logo ? getLogoUrl(data.logo) : null,
      });
      setError('');
    } catch {
      setError('Failed to fetch school settings.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo' && files.length > 0) {
      setSettings(prev => ({
        ...prev,
        logo: files[0],
        logoPreview: URL.createObjectURL(files[0]),
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('schoolName', settings.schoolName);
      formData.append('contactEmail', settings.contactEmail);
      formData.append('brandName', settings.brandName);
      if (settings.logo) formData.append('logo', settings.logo);

      await updateSchoolSettings(formData);
      setMessage('School settings updated successfully!');
      Swal.fire({ icon: 'success', title: 'Success', text: 'School settings updated successfully!' });
    } catch (err) {
      setError('Error updating school settings.');
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Error updating school settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="school-settings-page">
        <div className="loading-section">
          <FaSpinner className="loading-spinner" />
          <h3>Loading School Settings...</h3>
          <p>Please wait while we fetch the settings data</p>
        </div>
      </div>
    );
  }

  if (error && !settings.schoolName) {
    return (
      <div className="school-settings-page">
        <div className="error-section">
          <div className="error-message">
            <FaExclamationTriangle className="error-icon" />
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={fetchSettings} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="school-settings-page">
      <div className="school-settings-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`school-settings-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">🏫</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">School Settings</h1>
              <p className="header-subtitle">Manage your school's basic information and branding</p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="settings-section">
          <div className="settings-card">
            <div className="card-header">
              <h3 className="card-title">Basic School Information</h3>
              <p className="card-subtitle">Configure your school's identity and contact details</p>
            </div>

            <form onSubmit={handleSubmit} className="settings-form">
              {/* School Name Field */}
              <div className="form-group">
                <label className="form-label">
                  <FaBuilding className="label-icon" />
                  School Name *
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={settings.schoolName}
                  onChange={handleChange}
                  placeholder="e.g., CHARISM School"
                  className="form-input"
                  required
                />
                <p className="form-hint">This name will appear throughout the application</p>
              </div>

              {/* Contact Email Field */}
              <div className="form-group">
                <label className="form-label">
                  <FaEnvelope className="label-icon" />
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  placeholder="e.g., info@charism.edu"
                  className="form-input"
                  required
                />
                <p className="form-hint">This email will be used for system communications</p>
              </div>

              {/* Brand Name Field */}
              <div className="form-group">
                <label className="form-label">
                  <FaTag className="label-icon" />
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brandName"
                  value={settings.brandName}
                  onChange={handleChange}
                  placeholder="e.g., CHARISM"
                  className="form-input"
                />
                <p className="form-hint">Optional brand name for the application</p>
              </div>

              {/* Logo Upload Field */}
              <div className="form-group">
                <label className="form-label">
                  <FaImage className="label-icon" />
                  School Logo
                </label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    name="logo"
                    onChange={handleChange}
                    accept="image/*"
                    className="file-input"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="file-upload-label">
                    <FaImage className="upload-icon" />
                    <span>Choose Logo File</span>
                  </label>
                </div>
                <p className="form-hint">Recommended size: 200x200 pixels. Supported formats: JPG, PNG, GIF</p>
                
                {settings.logoPreview && (
                  <div className="logo-preview">
                    <img 
                      src={settings.logoPreview} 
                      alt="Logo preview" 
                      className="preview-image"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="button-icon spinning" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="button-icon" />
                      <span>Save School Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Current Settings Display */}
          <div className="current-settings-card">
            <div className="card-header">
              <h3 className="card-title">
                <FaCheckCircle className="title-icon" />
                Current School Information
              </h3>
            </div>
            
            <div className="settings-info">
              <div className="info-item">
                <span className="info-label">School Name:</span>
                <span className="info-value">{settings.schoolName || 'Not set'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Contact Email:</span>
                <span className="info-value">{settings.contactEmail || 'Not set'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Brand Name:</span>
                <span className="info-value">{settings.brandName || 'Not set'}</span>
              </div>
              
              {settings.logoPreview && (
                <div className="info-item">
                  <span className="info-label">Logo:</span>
                  <div className="current-logo">
                    <img src={settings.logoPreview} alt="Current logo" className="current-logo-image" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchoolSettingsPage;