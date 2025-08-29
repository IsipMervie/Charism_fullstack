// frontend/src/components/AdminDashboard.jsx
// Simple but Creative Admin Dashboard Design

import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAnalytics } from '../api/api';
import { axiosInstance } from '../api/api';
import { FaUsers, FaCalendarAlt, FaChartBar, FaTrophy, FaUserCheck, FaEnvelope, FaCog, FaBuilding, FaFile, FaUser, FaFileAlt } from 'react-icons/fa';
import { getSchoolSettings } from '../api/api';
import { getLogoUrl } from '../utils/imageUtils';

import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState('');

  const [isVisible, setIsVisible] = useState(false);


  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (err) {
        setAnalytics(null);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchSchool = async () => {
      setSchoolLoading(true);
      try {
        // Use public endpoint that doesn't require admin auth
        const res = await axiosInstance.get('/settings/public/school');
        setSchool(res.data);
        setSchoolError('');
      } catch (err) {
        console.error('Error fetching school settings:', err);
        setSchoolError('Failed to fetch school info.');
      }
      setSchoolLoading(false);
    };

    fetchSchool();
  }, []);



  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`admin-dashboard-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">⚙️</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">Admin Dashboard</h1>
              <p className="header-subtitle">Welcome to the Admin Dashboard</p>
            </div>
          </div>
          <div className="user-info">
            <div className="user-badge">
              <FaUser className="user-icon" />
              <span>Admin</span>
            </div>
          </div>
        </div>



        {/* School Info Card */}
        <div className="school-info-card">
          <div className="school-info-content">
            <div className="school-logo-section">
              {schoolLoading ? (
                <div className="logo-loading">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : school && school.logo ? (
                <img
                  src={`${getLogoUrl(school.logo)}`}
                  alt="School Logo"
                  className="school-logo"
                />
              ) : (
                <div className="logo-placeholder">
                  <FaBuilding className="logo-icon" />
                </div>
              )}
            </div>
            <div className="school-info-section">
              {schoolLoading ? (
                <div className="school-loading">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : school ? (
                <>
                  <h3 className="school-name">{school.schoolName}</h3>
                  <div className="school-contact">
                    <span className="contact-label">Contact Email:</span>
                    <span className="contact-value">{school.contactEmail}</span>
                  </div>
                </>
              ) : (
                <Alert variant="danger" className="school-error">
                  {schoolError || 'No school info found.'}
                </Alert>
              )}
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="actions-section">
          <div className="actions-header">
            <h3 className="actions-title">
              <FaCog className="actions-icon" />
              Quick Actions
            </h3>
            <p className="actions-subtitle">Access all admin tools and features</p>
          </div>
          
          <div className="actions-grid">
            <div 
              className="action-card"
              onClick={() => navigate('/admin/manage-users')}
            >
              <div className="action-icon">
                <FaUsers />
              </div>
              <div className="action-content">
                <div className="action-title">Manage Users</div>
                <div className="action-description">Add, edit, and manage user accounts and permissions</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div 
              className="action-card"
              onClick={() => navigate('/admin/manage-events')}
            >
              <div className="action-icon">
                <FaCalendarAlt />
              </div>
              <div className="action-content">
                <div className="action-title">Manage Events</div>
                <div className="action-description">Create, edit, and manage community service events</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div 
              className="action-card"
              onClick={() => navigate('/analytics')}
            >
              <div className="action-icon">
                <FaChartBar />
              </div>
              <div className="action-content">
                <div className="action-title">Analytics</div>
                <div className="action-description">View detailed reports and statistics</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div 
              className="action-card"
              onClick={() => navigate('/students-40-hours')}
            >
              <div className="action-icon">
                <FaTrophy />
              </div>
              <div className="action-content">
                <div className="action-title">Completed</div>
                <div className="action-description">View students who completed 40 hours</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div 
              className="action-card"
              onClick={() => navigate('/admin/staff-approvals')}
            >
              <div className="action-icon">
                <FaUserCheck />
              </div>
              <div className="action-content">
                <div className="action-title">Staff Approvals</div>
                <div className="action-description">Review and approve staff registrations</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div 
              className="action-card"
              onClick={() => navigate('/admin/manage-messages')}
            >
              <div className="action-icon">
                <FaEnvelope />
              </div>
              <div className="action-content">
                <div className="action-title">Manage Messages</div>
                <div className="action-description">Handle contact form submissions and communications</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div 
              className="action-card"
              onClick={() => navigate('/admin/school-settings')}
            >
              <div className="action-icon">
                <FaCog />
              </div>
              <div className="action-content">
                <div className="action-title">School Settings</div>
                <div className="action-description">Configure school information and system settings</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div 
              className="action-card"
              onClick={() => navigate('/admin/student-documentation')}
            >
              <div className="action-icon">
                <FaFile />
              </div>
              <div className="action-content">
                <div className="action-title">Student Documentation</div>
                <div className="action-description">Review and manage student documentation</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div 
              className="action-card"
              onClick={() => navigate('/admin/registration-approvals')}
            >
              <div className="action-icon">
                <FaUserCheck />
              </div>
              <div className="action-content">
                <div className="action-title">Event Registration Approval</div>
                <div className="action-description">Review and approve student event registrations</div>
              </div>
              <div className="action-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;