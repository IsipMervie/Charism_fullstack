// Fresh Modern Staff Dashboard Design

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaUsers, FaCog, FaUserTie, 
  FaClock, FaCheckCircle, 
  FaBuilding, FaGraduationCap, FaEdit, FaFile
} from 'react-icons/fa';
import { getEvents, getUserProfile } from '../api/api';
import { axiosInstance } from '../api/api';

import { getLogoUrl } from '../utils/imageUtils';

import './StaffDashboard.css';

function StaffDashboard() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    department: '',
    role: ''
  });
  const [dashboardData, setDashboardData] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalParticipants: 0,
    pendingApprovals: 0
  });



  useEffect(() => {
    setIsVisible(true);
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get user profile data
        const userProfile = await getUserProfile();
        
        // Get events data to calculate dashboard metrics
        const events = await getEvents();
        
        // Calculate dashboard metrics
        const totalEvents = events.length;
        const activeEvents = events.filter(event => event.status === 'Active').length;
        const totalParticipants = events.reduce((total, event) => {
          return total + (event.attendance ? event.attendance.filter(a => 
            a.registrationApproved === true || 
            a.status === 'Approved' || 
            a.status === 'Attended' || 
            a.status === 'Completed' ||
            a.status === 'Pending' // Include pending registrations in count
          ).length : 0);
        }, 0);
        const pendingApprovals = events.reduce((total, event) => {
          if (event.attendance) {
            return total + event.attendance.filter(att => att.status === 'Pending').length;
          }
          return total;
        }, 0);
        
        setUserData({
          name: userProfile.name || 'Staff Member',
          email: userProfile.email || 'staff@example.com',
          department: userProfile.department || 'General',
          role: userProfile.role || 'Staff'
        });

        
        setDashboardData({
          totalEvents,
          activeEvents,
          totalParticipants,
          pendingApprovals
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to localStorage data
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData({
          name: user.name || 'Staff Member',
          email: user.email || 'staff@example.com',
          department: user.department || 'General',
          role: user.role || 'Staff'
        });

        setDashboardData({
          totalEvents: 0,
          activeEvents: 0,
          totalParticipants: 0,
          pendingApprovals: 0
        });
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);



  if (loading) {
    return (
      <div className="staff-dashboard">
        <div className="loading-section">
          <div className="loading-content">
            <h3>Loading Dashboard</h3>
            <p>Please wait while we fetch your information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      <div className="dashboard-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`dashboard-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">👨‍💼</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">Staff Dashboard</h1>
              <p className="header-subtitle">Welcome back, {userData.name}! Here's your overview.</p>
            </div>
          </div>
          
          <div className="user-info">
            <div className="user-badge">
              <FaUserTie className="user-icon" />
              <span>{userData.role}</span>
            </div>
          </div>
        </div>


        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.totalEvents}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.activeEvents}</div>
              <div className="stat-label">Active Events</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.totalParticipants}</div>
              <div className="stat-label">Total Participants</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.pendingApprovals}</div>
              <div className="stat-label">Pending Approvals</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="actions-section">
          <div className="actions-header">
            <h2 className="actions-title">
              <FaUserTie className="actions-icon" />
              Quick Actions
            </h2>
            <p className="actions-subtitle">Access your most important features</p>
          </div>

          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/admin/manage-events')}>
              <div className="action-icon">
                <FaCalendarAlt />
              </div>
              <div className="action-content">
                <h3 className="action-title">Manage Events</h3>
                <p className="action-description">View, edit, and manage all community service events</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => navigate('/staff/create-event')}>
              <div className="action-icon">
                <FaEdit />
              </div>
              <div className="action-content">
                <h3 className="action-title">Create Event</h3>
                <p className="action-description">Create new community service events for students</p>
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

            <div className="action-card" onClick={() => navigate('/staff/student-documentation')}>
              <div className="action-icon">
                <FaFile />
              </div>
              <div className="action-content">
                <h3 className="action-title">Student Documentation</h3>
                <p className="action-description">View and manage student documentation uploads</p>
              </div>
              <div className="action-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;