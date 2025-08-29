// Fresh Modern My Participation Page Design

import React, { useEffect, useState } from 'react';
import { getEvents } from '../api/api';
import { 
  FaCalendarAlt, FaClock, FaTrophy, FaDownload, FaSpinner, 
  FaCheckCircle, FaExclamationTriangle, FaTimes, FaUserGraduate,
  FaChartLine, FaAward, FaCalendar, FaMapMarkerAlt, FaUsers
} from 'react-icons/fa';
import './MyParticipationPage.css';

function MyParticipationPage() {
  const [participation, setParticipation] = useState([]);
  const [analytics, setAnalytics] = useState({ totalHours: 0, totalEvents: 0, approvedEvents: 0, pendingEvents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    setIsVisible(true);
    const fetchParticipation = async () => {
      setLoading(true);
      try {
        const events = await getEvents();
        // Filter events where the user is in attendance
        const myEvents = events.filter(event =>
          event.attendance && event.attendance.some(a => a.userId === user._id || (a.userId && a.userId._id === user._id))
        );
        setParticipation(myEvents);
        
        // Calculate analytics
        let totalHours = 0;
        let approvedEvents = 0;
        let pendingEvents = 0;
        
        myEvents.forEach(event => {
          const att = event.attendance.find(a => a.userId === user._id || (a.userId && a.userId._id === user._id));
          if (att && att.status === 'Approved') {
            totalHours += event.hours || 0;
            approvedEvents++;
          } else if (att && att.status === 'Pending') {
            pendingEvents++;
          }
        });
        
        setAnalytics({ 
          totalHours, 
          totalEvents: myEvents.length, 
          approvedEvents, 
          pendingEvents 
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch participation.');
        setLoading(false);
      }
    };
    fetchParticipation();
  }, [user._id]);

  // Certificate Download Handler
  const handleDownloadCertificate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/certificates/generate/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to generate certificate');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${user._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Show success message
      alert('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Failed to download certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <FaCheckCircle className="status-icon approved" />;
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'disapproved':
        return <FaTimes className="status-icon disapproved" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'disapproved':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getProgressPercentage = () => {
    const targetHours = 40;
    return Math.min((analytics.totalHours / targetHours) * 100, 100);
  };

  if (loading) {
    return (
      <div className="my-participation-page">
        <div className="loading-section">
          <div className="loading-content">
            <FaSpinner className="loading-spinner" />
            <h3>Loading Participation</h3>
            <p>Please wait while we fetch your participation data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-participation-page">
        <div className="error-section">
          <div className="error-content">
            <FaExclamationTriangle className="error-icon" />
            <h3>Error Loading Data</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if the user is eligible for a certificate
  const eligibleForCertificate = analytics.totalHours >= 40 && analytics.approvedEvents > 0;

  return (
    <div className="my-participation-page">
      <div className="participation-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`participation-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="participation-header">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">📊</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">My Participation</h1>
              <p className="header-subtitle">Track your community service journey and achievements</p>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">
                <FaCalendarAlt />
              </div>
              <div className="analytics-content">
                <div className="analytics-number">{analytics.totalEvents}</div>
                <div className="analytics-label">Total Events</div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">
                <FaClock />
              </div>
              <div className="analytics-content">
                <div className="analytics-number">{analytics.totalHours}</div>
                <div className="analytics-label">Approved Hours</div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">
                <FaCheckCircle />
              </div>
              <div className="analytics-content">
                <div className="analytics-number">{analytics.approvedEvents}</div>
                <div className="analytics-label">Approved Events</div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">
                <FaClock />
              </div>
              <div className="analytics-content">
                <div className="analytics-number">{analytics.pendingEvents}</div>
                <div className="analytics-label">Pending Events</div>
              </div>
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
            <p className="progress-subtitle">Your progress towards the 40-hour requirement</p>
          </div>

          <div className="progress-card">
            <div className="progress-info">
              <div className="progress-stats">
                <span className="current-hours">{analytics.totalHours}</span>
                <span className="separator">/</span>
                <span className="target-hours">40</span>
                <span className="hours-label">hours</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getProgressPercentage() >= 80 ? '#10b981' : 
                                   getProgressPercentage() >= 60 ? '#f59e0b' : 
                                   getProgressPercentage() >= 40 ? '#3b82f6' : '#ef4444'
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
                  {40 - analytics.totalHours} more hours needed to complete your requirement.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Section */}
        {eligibleForCertificate && (
          <div className="certificate-section">
            <div className="certificate-card">
              <div className="certificate-icon">
                <FaAward />
              </div>
              <div className="certificate-content">
                <h3 className="certificate-title">Certificate Available</h3>
                <p className="certificate-description">
                  You've completed the 40-hour community service requirement. Download your certificate!
                </p>
                <button className="certificate-button" onClick={handleDownloadCertificate}>
                  <FaDownload className="button-icon" />
                  <span>Download Certificate</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participation List */}
        <div className="participation-section">
          <div className="participation-header">
            <h2 className="participation-title">
              <FaChartLine className="participation-icon" />
              Event History
            </h2>
            <p className="participation-subtitle">Your participation in community service events</p>
          </div>

          {participation.length === 0 ? (
            <div className="empty-section">
              <div className="empty-content">
                <FaUserGraduate className="empty-icon" />
                <h3>No Participation Yet</h3>
                <p>You haven't participated in any events yet. Start your community service journey by joining events!</p>
              </div>
            </div>
          ) : (
            <div className="participation-grid">
              {participation.map(event => {
                const att = event.attendance.find(a => a.userId === user._id || (a.userId && a.userId._id === user._id));
                return (
                  <div key={event._id} className="participation-card">
                    <div className="card-header">
                      <div className="event-title">{event.title}</div>
                      <div className="status-badge" style={{ backgroundColor: getStatusColor(att?.status) }}>
                        {getStatusIcon(att?.status)}
                        <span>{att?.status || 'Pending'}</span>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <p className="event-description">{event.description}</p>
                      
                      <div className="event-details">
                        <div className="detail-item">
                          <FaCalendar className="detail-icon" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                          <FaClock className="detail-icon" />
                          <span>{event.hours} hours</span>
                        </div>
                        {event.location && (
                          <div className="detail-item">
                            <FaMapMarkerAlt className="detail-icon" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>

                      {att && (att.timeIn || att.timeOut) && (
                        <div className="time-details">
                          {att.timeIn && (
                            <div className="time-item">
                              <span className="time-label">Time In:</span>
                              <span className="time-value">{new Date(att.timeIn).toLocaleString()}</span>
                            </div>
                          )}
                          {att.timeOut && (
                            <div className="time-item">
                              <span className="time-label">Time Out:</span>
                              <span className="time-value">{new Date(att.timeOut).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {att && att.status === 'Disapproved' && att.reason && (
                        <div className="disapproval-reason">
                          <FaExclamationTriangle className="reason-icon" />
                          <div className="reason-content">
                            <span className="reason-label">Reason:</span>
                            <span className="reason-text">{att.reason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyParticipationPage;