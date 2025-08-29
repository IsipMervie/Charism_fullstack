// Fresh Modern Student Dashboard Design

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaCalendarAlt, FaChartLine, FaUser, FaCog, FaGraduationCap, 
  FaClock, FaTrophy, FaSpinner, FaCheckCircle, 
  FaExclamationTriangle, FaUserGraduate, FaCalendar
} from 'react-icons/fa';
import { getEvents, getUserProfile } from '../api/api';
import { axiosInstance } from '../api/api';
import { getSchoolSettings } from '../api/api';
import { getLogoUrl } from '../utils/imageUtils';
import './StudentDashboard.css';

function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    department: '',
    yearLevel: '',
    section: '',
    academicYear: '',
    totalHours: 0,
    approvedHours: 0
  });

  const [school, setSchool] = useState(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    setIsVisible(true);
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Get user profile data
        const userProfile = await getUserProfile();
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Get events data to calculate participation
        const events = await getEvents();
        
        // Filter events where the user is in attendance
        const myEvents = events.filter(event =>
          event.attendance && event.attendance.some(a => 
            a.userId === user._id || (a.userId && a.userId._id === user._id)
          )
        );
        
        // Calculate approved hours
        let approvedHours = 0;
        myEvents.forEach(event => {
          const att = event.attendance.find(a => 
            a.userId === user._id || (a.userId && a.userId._id === user._id)
          );
          if (att && att.status === 'Approved') {
            approvedHours += event.hours || 0;
          }
        });
        

        
        setUserData({
          name: userProfile.name || user.name || 'Student Name',
          email: userProfile.email || user.email || 'student@example.com',
          department: userProfile.department || user.department || 'Computer Science',
          yearLevel: userProfile.year || user.year || '2nd Year',
          section: userProfile.section || user.section || 'Section A',
          academicYear: userProfile.academicYear || user.academicYear || '2024-2025',
          totalHours: 0, // We'll focus on approved hours
          approvedHours: approvedHours
        });
        
        console.log('Calculated approved hours:', approvedHours);
        console.log('Events found:', myEvents.length);
        console.log('User ID:', user._id);
        setProfilePicture(userProfile.profilePicture || user.profilePicture || '');

        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to localStorage data
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData({
          name: user.name || 'Student Name',
          email: user.email || 'student@example.com',
          department: user.department || 'Computer Science',
          yearLevel: user.year || '2nd Year',
          section: user.section || 'Section A',
          academicYear: user.academicYear || '2024-2025',
          totalHours: 0,
          approvedHours: 0
        });
        
        console.log('Fallback: Using localStorage data, approved hours set to 0');
        setProfilePicture(user.profilePicture || '');
        setLoading(false);
      }
    };

    const fetchSchool = async () => {
      setSchoolLoading(true);
      try {
        // Use public endpoint that doesn't require authentication
        const res = await axiosInstance.get('/settings/public/school');
        console.log('School data received:', res.data);
        setSchool(res.data);
        setSchoolError('');
      } catch (error) {
        console.error('Error fetching school info:', error);
        setSchoolError('Failed to fetch school info.');
      }
      setSchoolLoading(false);
    };

    fetchUserData();
    fetchSchool();
  }, []);

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getProgressPercentage = () => {
    const targetHours = 40;
    return Math.min((userData.approvedHours / targetHours) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#3b82f6';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="loading-section">
          <div className="loading-content">
            <FaSpinner className="loading-spinner" />
            <h3>Loading Dashboard</h3>
            <p>Please wait while we fetch your information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`dashboard-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">🎓</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">Student Dashboard</h1>
              <p className="header-subtitle">Welcome back, {userData.name}! Here's your academic overview.</p>
            </div>
          </div>
          
          <div className="user-info">
            <div className="user-badge">
              <FaUserGraduate className="user-icon" />
              <span>{userData.department}</span>
            </div>
          </div>
        </div>





        {/* School Info Section */}
        <div className="school-info-section">
          <div className="school-info-card">
            <div className="school-logo-section">
              {schoolLoading ? (
                <div className="logo-loading">
                  <FaSpinner className="loading-spinner" />
                </div>
              ) : school && school.logo ? (
                <img
                  src={getLogoUrl(school.logo)}
                  alt="School Logo"
                  className="school-logo"
                  onError={(e) => {
                    console.error('Logo failed to load:', e.target.src);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : (
                <div className="logo-placeholder">
                  <FaGraduationCap className="logo-icon" />
                </div>
              )}

            </div>
            <div className="school-details">
              {schoolLoading ? (
                <div className="logo-loading">
                  <FaSpinner className="loading-spinner" />
                </div>
              ) : school ? (
                <>
                  <h3 className="school-name">{school.schoolName || 'University of the Assumption'}</h3>
                  <div className="school-contact">
                    <span className="contact-label">Contact Email:</span>
                    <span className="contact-value">{school.contactEmail || 'ceo@ua.edu.ph'}</span>
                  </div>
                </>
              ) : (
                <div className="school-fallback">
                  <h3 className="school-name">University of the Assumption</h3>
                  <div className="school-contact">
                    <span className="contact-label">Contact Email:</span>
                    <span className="contact-value">ceo@ua.edu.ph</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-content">
              <div className="stat-number">{userData.approvedHours}</div>
              <div className="stat-label">Approved Hours</div>
            </div>
          </div>





          <div className="stat-card">
            <div className="stat-icon">
              <FaTrophy />
            </div>
            <div className="stat-content">
              <div className="stat-number">{getProgressPercentage().toFixed(0)}%</div>
              <div className="stat-label">Progress</div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-header">
            <h2 className="progress-title">
              <FaTrophy className="progress-icon" />
              Community Service Progress
            </h2>
            <p className="progress-subtitle">Track your progress towards the 40-hour requirement</p>
          </div>

          <div className="progress-card">
            <div className="progress-info">
              <div className="progress-stats">
                <span className="current-hours">{userData.approvedHours}</span>
                <span className="separator">/</span>
                <span className="target-hours">40</span>
                <span className="hours-label">hours</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getProgressColor()
                  }}
                ></div>
              </div>
            </div>
            <div className="progress-message">
              {getProgressPercentage() >= 100 ? (
                <span className="success-message">
                  <FaCheckCircle /> Congratulations! You've completed your community service requirement.
                </span>
              ) : (
                <span className="progress-message-text">
                  {40 - userData.approvedHours} more hours needed to complete your requirement.
                </span>
              )}
            </div>
          </div>
        </div>





        {/* Quick Actions Section */}
        <div className="actions-section">
          <div className="actions-header">
            <h2 className="actions-title">
              <FaGraduationCap className="actions-icon" />
              Quick Actions
            </h2>
            <p className="actions-subtitle">Access your most important features</p>
          </div>

          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/events')}>
              <div className="action-icon">
                <FaCalendarAlt />
              </div>
              <div className="action-content">
                <h3 className="action-title">View Events</h3>
                <p className="action-description">Browse and register for upcoming community service events</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => navigate('/my-participation')}>
              <div className="action-icon">
                <FaChartLine />
              </div>
              <div className="action-content">
                <h3 className="action-title">My Participation</h3>
                <p className="action-description">Track your event history and participation records</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => navigate('/profile')}>
              <div className="action-icon">
                <FaUser />
              </div>
              <div className="action-content">
                <h3 className="action-title">Profile</h3>
                <p className="action-description">View and manage your personal information</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => navigate('/settings')}>
              <div className="action-icon">
                <FaCog />
              </div>
              <div className="action-content">
                <h3 className="action-title">Settings</h3>
                <p className="action-description">Manage your account settings and preferences</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => navigate('/student-documentation')}>
              <div className="action-icon">
                📁
              </div>
              <div className="action-content">
                <h3 className="action-title">My Documentation</h3>
                <p className="action-description">Upload and manage your event documentation files</p>
              </div>
              <div className="action-arrow">→</div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}

export default StudentDashboard;
