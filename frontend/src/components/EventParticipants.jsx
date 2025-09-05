import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventParticipants, approveAttendance, disapproveAttendance, generateReport } from '../api/api';
import Swal from 'sweetalert2';
import { FaCheck, FaTimes, FaDownload } from 'react-icons/fa';
import './EventParticipantsPage.css';

function EventParticipantsPage() {
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const data = await getEventParticipants(eventId);
        setParticipants(data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        Swal.fire('Error', 'Could not load participants.', 'error');
      }
    };

    fetchParticipants();
  }, [eventId]);

  const handleApprove = async (userId) => {
    const participant = participants.find(p => {
      const pUserId = p.userId._id || p.userId;
      return pUserId === userId;
    });
    
    if (!participant) {
      Swal.fire('Error', 'Participant not found.', 'error');
      return;
    }
    
    // Check if student has timed out
    if (!participant.timeOut) {
      Swal.fire('Cannot Approve', 'Student has not timed out yet. Attendance can only be approved after time-out.', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to approve this attendance?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setActionLoading(prev => ({ ...prev, [`approve_${userId}`]: true }));
      try {
        await approveAttendance(eventId, userId);
        Swal.fire({
          icon: 'success',
          title: 'Attendance Approved!',
          text: 'The student\'s attendance has been successfully approved.',
          timer: 2000,
          showConfirmButton: false
        });
        // Refresh participants list
        const data = await getEventParticipants(eventId);
        setParticipants(data);
      } catch (err) {
        Swal.fire('Error', err.message || 'Failed to approve attendance.', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [`approve_${userId}`]: false }));
      }
    }
  };

  const handleDisapprove = async (userId) => {
    const participant = participants.find(p => {
      const pUserId = p.userId._id || p.userId;
      return pUserId === userId;
    });
    
    if (!participant) {
      Swal.fire('Error', 'Participant not found.', 'error');
      return;
    }
    
    const { value: reason } = await Swal.fire({
      title: 'Reason for Disapproval',
      input: 'textarea',
      inputLabel: 'Please provide a reason for disapproval',
      inputPlaceholder: 'Enter your reason here...',
      inputAttributes: {
        'aria-label': 'Enter your reason'
      },
      showCancelButton: true,
      confirmButtonText: 'Submit'
    });

    if (reason) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to disapprove this attendance?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, disapprove it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setActionLoading(prev => ({ ...prev, [`disapprove_${userId}`]: true }));
        try {
          await disapproveAttendance(eventId, userId, reason);
          Swal.fire({
            icon: 'success',
            title: 'Attendance Disapproved!',
            text: 'The student\'s attendance has been disapproved with the provided reason.',
            timer: 2000,
            showConfirmButton: false
          });
          // Refresh participants list
          const data = await getEventParticipants(eventId);
          setParticipants(data);
        } catch (err) {
          Swal.fire('Error', err.message || 'Failed to disapprove attendance.', 'error');
        } finally {
          setActionLoading(prev => ({ ...prev, [`disapprove_${userId}`]: false }));
        }
      }
    } else {
      Swal.fire('Error', 'Reason is required to disapprove attendance.', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    // Show filter options dialog
    const { value: filters } = await Swal.fire({
      title: 'Download Attendance Report',
      html: `
        <div style="text-align: left;">
          <p>Choose filter options for the PDF report:</p>
          <div style="margin: 10px 0;">
            <label>
              <input type="checkbox" id="status-filter" style="margin-right: 8px;">
              Include only approved participants
            </label>
          </div>
          <div style="margin: 10px 0;">
            <label>
              <input type="checkbox" id="timed-out-filter" style="margin-right: 8px;">
              Include only participants who have timed out
            </label>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Download PDF',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0891b2',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const statusFilter = document.getElementById('status-filter').checked;
        const timedOutFilter = document.getElementById('timed-out-filter').checked;
        return { statusFilter, timedOutFilter };
      }
    });

    if (!filters) return;

    setPdfLoading(true);
    try {
      const params = { eventId };
      
      // Add filters based on user selection
      if (filters.statusFilter) {
        params.status = 'Approved';
      }
      if (filters.timedOutFilter) {
        params.timedOut = 'true';
      }

      await generateReport('event-attendance', params);
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded!',
        text: 'The attendance report has been downloaded successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('PDF download error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: err.message || 'Failed to download attendance report. Please try again.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="event-participants-container">
      <div className="event-participants-card">
        {loading ? <p>Loading...</p> : null}
        <div className="participants-header">
          <h2>Participants</h2>
          <button 
            className="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={pdfLoading || participants.length === 0}
            title="Download Attendance Report PDF"
          >
            <FaDownload />
            <span>{pdfLoading ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
        
        {/* Participants Summary */}
        {participants.length > 0 && (
          <div className="participants-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-number">{participants.length}</span>
                <span className="stat-label">Total Participants</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {participants.filter(p => p.status === 'Approved').length}
                </span>
                <span className="stat-label">Approved</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {participants.filter(p => p.status === 'Pending').length}
                </span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {participants.filter(p => p.timeOut).length}
                </span>
                <span className="stat-label">Timed Out</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop Table View */}
        <div className="desktop-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Registration</th>
                <th>Time In/Out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map(participant => (
                <tr key={participant.userId._id || participant.userId} className={`status-${participant.status?.toLowerCase()}`}>
                  <td>{participant.userId.name}</td>
                  <td>{participant.userId.email}</td>
                  <td>{participant.userId.department}</td>
                  <td>
                    <span className={`status-badge ${participant.registrationApproved ? 'approved' : 'pending'}`}>
                      {participant.registrationApproved ? 'Approved' : 'Pending'}
                    </span>
                    {participant.registrationApprovedAt && (
                      <div className="approval-date">
                        <small>Approved: {new Date(participant.registrationApprovedAt).toLocaleDateString()}</small>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="time-status">
                      <div className="time-in">
                        <strong>Time In:</strong> {participant.timeIn ? new Date(participant.timeIn).toLocaleString() : 'Not timed in'}
                      </div>
                      <div className="time-out">
                        <strong>Time Out:</strong> {participant.timeOut ? new Date(participant.timeOut).toLocaleString() : 'Not timed out'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${participant.status?.toLowerCase()}`}>
                      {participant.status || 'Pending'}
                    </span>
                    {participant.reason && (
                      <div className="reason-text">
                        <small>Reason: {participant.reason}</small>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {participant.status === 'Pending' && (
                        <>
                          <button 
                            className={`approve-btn ${!participant.timeOut ? 'disabled' : ''}`}
                            onClick={() => handleApprove(participant.userId._id || participant.userId)}
                            title={!participant.timeOut ? 'Cannot approve: Student has not timed out' : 'Approve Attendance'}
                            disabled={!participant.timeOut || actionLoading[`approve_${participant.userId._id || participant.userId}`]}
                          >
                            <FaCheck />
                            <span>{actionLoading[`approve_${participant.userId._id || participant.userId}`] ? 'Approving...' : 'Approve'}</span>
                          </button>
                          <button 
                            className="disapprove-btn"
                            onClick={() => handleDisapprove(participant.userId._id || participant.userId)}
                            title="Disapprove Attendance"
                            disabled={actionLoading[`disapprove_${participant.userId._id || participant.userId}`]}
                          >
                            <FaTimes />
                            <span>{actionLoading[`disapprove_${participant.userId._id || participant.userId}`] ? 'Disapproving...' : 'Disapprove'}</span>
                          </button>
                        </>
                      )}
                      {(participant.status === 'Approved' || participant.status === 'Disapproved') && (
                        <>
                          <button 
                            className={`approve-btn ${!participant.timeOut ? 'disabled' : ''}`}
                            onClick={() => handleApprove(participant.userId._id || participant.userId)}
                            title={!participant.timeOut ? 'Cannot approve: Student has not timed out' : 'Change to Approved'}
                            disabled={!participant.timeOut || actionLoading[`approve_${participant.userId._id || participant.userId}`]}
                          >
                            <FaCheck />
                            <span>{actionLoading[`approve_${participant.userId._id || participant.userId}`] ? 'Approving...' : 'Approve'}</span>
                          </button>
                          <button 
                            className="disapprove-btn"
                            onClick={() => handleDisapprove(participant.userId._id || participant.userId)}
                            title="Change to Disapproved"
                            disabled={actionLoading[`disapprove_${participant.userId._id || participant.userId}`]}
                          >
                            <FaTimes />
                            <span>{actionLoading[`disapprove_${participant.userId._id || participant.userId}`] ? 'Disapproving...' : 'Disapprove'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="mobile-cards">
          {participants.map(participant => (
            <div key={participant.userId._id || participant.userId} className={`participant-card status-${participant.status?.toLowerCase()}`}>
              <div className="card-header">
                <div className="participant-info">
                  <h3 className="participant-name">{participant.userId.name}</h3>
                  <p className="participant-email">{participant.userId.email}</p>
                  <p className="participant-department">{participant.userId.department}</p>
                </div>
                <div className="status-indicator">
                  <span className={`status-badge ${participant.status?.toLowerCase()}`}>
                    {participant.status || 'Pending'}
                  </span>
                </div>
              </div>
              
              <div className="card-content">
                <div className="info-row">
                  <span className="label">Registration:</span>
                  <span className={`status-badge ${participant.registrationApproved ? 'approved' : 'pending'}`}>
                    {participant.registrationApproved ? 'Approved' : 'Pending'}
                  </span>
                  {participant.registrationApprovedAt && (
                    <div className="approval-date">
                      <small>Approved: {new Date(participant.registrationApprovedAt).toLocaleDateString()}</small>
                    </div>
                  )}
                </div>
                
                <div className="info-row">
                  <span className="label">Time In:</span>
                  <span className="value">
                    {participant.timeIn ? new Date(participant.timeIn).toLocaleString() : 'Not timed in'}
                  </span>
                </div>
                
                <div className="info-row">
                  <span className="label">Time Out:</span>
                  <span className="value">
                    {participant.timeOut ? new Date(participant.timeOut).toLocaleString() : 'Not timed out'}
                  </span>
                </div>
                
                {participant.reason && (
                  <div className="info-row">
                    <span className="label">Reason:</span>
                    <span className="value reason-text">{participant.reason}</span>
                  </div>
                )}
              </div>
              
              <div className="card-actions">
                <div className="action-buttons">
                  {participant.status === 'Pending' && (
                    <>
                      <button 
                        className={`approve-btn ${!participant.timeOut ? 'disabled' : ''}`}
                        onClick={() => handleApprove(participant.userId._id || participant.userId)}
                        title={!participant.timeOut ? 'Cannot approve: Student has not timed out' : 'Approve Attendance'}
                        disabled={!participant.timeOut || actionLoading[`approve_${participant.userId._id || participant.userId}`]}
                      >
                        <FaCheck />
                        <span>{actionLoading[`approve_${participant.userId._id || participant.userId}`] ? 'Approving...' : 'Approve'}</span>
                      </button>
                      <button 
                        className="disapprove-btn"
                        onClick={() => handleDisapprove(participant.userId._id || participant.userId)}
                        title="Disapprove Attendance"
                        disabled={actionLoading[`disapprove_${participant.userId._id || participant.userId}`]}
                      >
                        <FaTimes />
                        <span>{actionLoading[`disapprove_${participant.userId._id || participant.userId}`] ? 'Disapproving...' : 'Disapprove'}</span>
                      </button>
                    </>
                  )}
                  {(participant.status === 'Approved' || participant.status === 'Disapproved') && (
                    <>
                      <button 
                        className={`approve-btn ${!participant.timeOut ? 'disabled' : ''}`}
                        onClick={() => handleApprove(participant.userId._id || participant.userId)}
                        title={!participant.timeOut ? 'Cannot approve: Student has not timed out' : 'Change to Approved'}
                        disabled={!participant.timeOut || actionLoading[`approve_${participant.userId._id || participant.userId}`]}
                      >
                        <FaCheck />
                        <span>{actionLoading[`approve_${participant.userId._id || participant.userId}`] ? 'Approving...' : 'Approve'}</span>
                      </button>
                      <button 
                        className="disapprove-btn"
                        onClick={() => handleDisapprove(participant.userId._id || participant.userId)}
                        title="Change to Disapproved"
                        disabled={actionLoading[`disapprove_${participant.userId._id || participant.userId}`]}
                      >
                        <FaTimes />
                        <span>{actionLoading[`disapprove_${participant.userId._id || participant.userId}`] ? 'Disapproving...' : 'Disapprove'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventParticipantsPage;