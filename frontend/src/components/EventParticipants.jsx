import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventParticipants, approveAttendance, disapproveAttendance, removeParticipant, generateReport } from '../api/api';
import Swal from 'sweetalert2';
import { FaCheck, FaTimes, FaDownload, FaTrash } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import { formatDateTimePhilippines, formatDatePhilippines } from '../utils/timeUtils';
import './EventParticipantsPage.css';

function EventParticipantsPage() {
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);

  // Attendance disapproval reasons
  const attendanceDisapprovalReasons = [
    'Act of Misconduct (Student displayed inappropriate behavior or violated rules during the commserv)',
    'Late Arrival (Arrived late and wasn\'t present during the call time)',
    'Left Early (Left in the middle of the duration of commserv)',
    'Did not sign the Community Service Form',
    'Did not sign attendance sheet (if any)',
    'Absent (Student was absent and didn\'t attend the commserv)',
    'Not wearing the required uniform',
    'Other'
  ];

  // Helper function to determine status text
  const getStatusText = (participant) => {
    // If registration is not approved, show pending
    if (!participant.registrationApproved) {
      return 'Pending';
    }
    
    // If registration is approved but no time in/out, show "Approved for Registered"
    if (participant.registrationApproved && (!participant.timeIn || !participant.timeOut)) {
      return 'Approved for Registered';
    }
    
    // If has time in/out but not approved by admin, show "Pending"
    if (participant.timeIn && participant.timeOut && participant.status !== 'Approved') {
      return 'Pending';
    }
    
    // If has time in/out and approved by admin, show "Completed"
    if (participant.timeIn && participant.timeOut && participant.status === 'Approved') {
      return 'Completed';
    }
    
    // Default fallback
    return participant.status || 'Pending';
  };

  // Helper function to determine status CSS class
  const getStatusClass = (participant) => {
    const statusText = getStatusText(participant);
    return statusText.toLowerCase().replace(/\s+/g, '-');
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const data = await getEventParticipants(eventId);
      setParticipants(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Swal.fire('Error', 'Could not load participants.', 'error');
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);



  const handleApproveAttendance = async (userId) => {
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
        Swal.fire('Success', 'Attendance approved successfully!', 'success');
        fetchParticipants();
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to approve attendance.', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [`approve_${userId}`]: false }));
      }
    }
  };

  const handleDisapproveAttendance = async (userId) => {
    const participant = participants.find(p => {
      const pUserId = p.userId._id || p.userId;
      return pUserId === userId;
    });
    
    if (!participant) {
      Swal.fire('Error', 'Participant not found.', 'error');
      return;
    }
    
    // Show dropdown for disapproval reason
    const { value: reasonData } = await Swal.fire({
      title: 'Reason for Disapproval',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px;">Please select a reason for disapproving ${participant.userId.name}'s attendance:</p>
            <select id="disapproval-reason" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--border-primary); border-radius: 4px; font-size: 14px; background: var(--bg-input); color: var(--text-primary);">
            <option value="">Select a reason...</option>
            ${attendanceDisapprovalReasons.map((reason, index) => `<option value="${index}">${reason}</option>`).join('')}
          </select>
          <div id="other-reason-container" style="display: none; margin-top: 10px;">
            <label for="other-reason" style="display: block; margin-bottom: 5px; font-weight: 500;">Please specify other reason:</label>
            <textarea id="other-reason" style="width: 100%; padding: 10px; border: 1px solid var(--border-primary); border-radius: 4px; font-size: 14px; min-height: 80px; background: var(--bg-input); color: var(--text-primary);" placeholder="Enter your specific reason here..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Disapprove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: 'var(--error)',
      preConfirm: () => {
        const selectedReason = document.getElementById('disapproval-reason').value;
        const otherReason = document.getElementById('other-reason').value;
        
        if (!selectedReason) {
          Swal.showValidationMessage('Please select a reason for disapproval');
          return false;
        }
        
        if (selectedReason === '7' && !otherReason.trim()) { // "Other" is index 7
          Swal.showValidationMessage('Please specify the other reason');
          return false;
        }
        
        return {
          reason: selectedReason === '7' ? otherReason.trim() : attendanceDisapprovalReasons[selectedReason],
          selectedReason: selectedReason
        };
      },
      didOpen: () => {
        const reasonSelect = document.getElementById('disapproval-reason');
        const otherContainer = document.getElementById('other-reason-container');
        
        reasonSelect.addEventListener('change', (e) => {
          if (e.target.value === '7') { // "Other" is index 7
            otherContainer.style.display = 'block';
          } else {
            otherContainer.style.display = 'none';
          }
        });
      }
    });

    if (reasonData) {
      setActionLoading(prev => ({ ...prev, [`disapprove_${userId}`]: true }));
      try {
        await disapproveAttendance(eventId, userId, reasonData.reason);
        Swal.fire('Success', 'Attendance disapproved successfully!', 'success');
        fetchParticipants();
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to disapprove attendance.', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [`disapprove_${userId}`]: false }));
      }
    }
  };

  const handleRemove = async (userId) => {
    const participant = participants.find(p => {
      const pUserId = p.userId._id || p.userId;
      return pUserId === userId;
    });
    
    if (!participant) {
      Swal.fire('Error', 'Participant not found.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to remove ${participant.userId.name} from this event? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove them!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d'
    });

    if (result.isConfirmed) {
      setActionLoading(prev => ({ ...prev, [`remove_${userId}`]: true }));
      try {
        await removeParticipant(eventId, userId);
        Swal.fire({
          icon: 'success',
          title: 'Participant Removed!',
          text: `${participant.userId.name} has been successfully removed from the event.`,
          timer: 2000,
          showConfirmButton: false
        });
        // Refresh participants list
        const data = await getEventParticipants(eventId);
        setParticipants(data);
      } catch (err) {
        Swal.fire('Error', err.message || 'Failed to remove participant.', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [`remove_${userId}`]: false }));
      }
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
              <input type="checkbox" id="students-only-filter" style="margin-right: 8px;" checked>
              Show students only (exclude admin/staff)
            </label>
          </div>
          <div style="margin: 10px 0;">
            <label>
              <input type="checkbox" id="status-filter" style="margin-right: 8px;">
              Include only completed participants
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
        const studentsOnlyFilter = document.getElementById('students-only-filter').checked;
        const statusFilter = document.getElementById('status-filter').checked;
        const timedOutFilter = document.getElementById('timed-out-filter').checked;
        return { studentsOnlyFilter, statusFilter, timedOutFilter };
      }
    });

    if (!filters) return;

    setPdfLoading(true);
    try {
      const params = { eventId };
      
      // Add filters based on user selection
      if (filters.studentsOnlyFilter) {
        params.studentsOnly = 'true';
      }
      if (filters.statusFilter) {
        params.status = 'Completed';
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
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner size="medium" variant="primary"/>
          </div>
        ) : null}
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
                  {participants.filter(p => getStatusText(p) === 'Completed').length}
                </span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {participants.filter(p => getStatusText(p) === 'Pending').length}
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
                        <small>Approved: {formatDatePhilippines(participant.registrationApprovedAt)}</small>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="time-status">
                      <div className="time-in">
                        <strong>Time In:</strong> <span className="time-value">{participant.timeIn ? formatDateTimePhilippines(participant.timeIn) : 'Not timed in'}</span>
                      </div>
                      <div className="time-out">
                        <strong>Time Out:</strong> <span className="time-value">{participant.timeOut ? formatDateTimePhilippines(participant.timeOut) : 'Not timed out'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(participant)}`}>
                      {getStatusText(participant)}
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
                            onClick={() => handleApproveAttendance(participant.userId._id || participant.userId)}
                            title={!participant.timeOut ? 'Cannot approve: Student has not timed out' : 'Approve Attendance'}
                            disabled={!participant.timeOut || actionLoading[`approve_${participant.userId._id || participant.userId}`]}
                          >
                            <FaCheck />
                            <span>{actionLoading[`approve_${participant.userId._id || participant.userId}`] ? 'Approving...' : 'Approve'}</span>
                          </button>
                          <button 
                            className="disapprove-btn"
                            onClick={() => handleDisapproveAttendance(participant.userId._id || participant.userId)}
                            title="Disapprove Attendance"
                            disabled={actionLoading[`disapprove_${participant.userId._id || participant.userId}`]}
                          >
                            <FaTimes />
                            <span>{actionLoading[`disapprove_${participant.userId._id || participant.userId}`] ? 'Disapproving...' : 'Disapprove'}</span>
                          </button>
                        </>
                      )}
                      <button 
                        className="remove-btn"
                        onClick={() => handleRemove(participant.userId._id || participant.userId)}
                        title="Remove Participant"
                        disabled={actionLoading[`remove_${participant.userId._id || participant.userId}`]}
                      >
                        <FaTrash />
                        <span>{actionLoading[`remove_${participant.userId._id || participant.userId}`] ? 'Removing...' : 'Remove'}</span>
                      </button>
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
                  <span className={`status-badge ${getStatusClass(participant)}`}>
                    {getStatusText(participant)}
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
                      <small>Approved: {formatDatePhilippines(participant.registrationApprovedAt)}</small>
                    </div>
                  )}
                </div>
                
                <div className="info-row">
                  <span className="label time-label">Time In:</span>
                  <span className="value time-value">
                    {participant.timeIn ? formatDateTimePhilippines(participant.timeIn) : 'Not timed in'}
                  </span>
                </div>
                
                <div className="info-row">
                  <span className="label time-label">Time Out:</span>
                  <span className="value time-value">
                    {participant.timeOut ? formatDateTimePhilippines(participant.timeOut) : 'Not timed out'}
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
                        onClick={() => handleApproveAttendance(participant.userId._id || participant.userId)}
                        title={!participant.timeOut ? 'Cannot approve: Student has not timed out' : 'Approve Attendance'}
                        disabled={!participant.timeOut || actionLoading[`approve_${participant.userId._id || participant.userId}`]}
                      >
                        <FaCheck />
                        <span>{actionLoading[`approve_${participant.userId._id || participant.userId}`] ? 'Approving...' : 'Approve'}</span>
                      </button>
                      <button 
                        className="disapprove-btn"
                        onClick={() => handleDisapproveAttendance(participant.userId._id || participant.userId)}
                        title="Disapprove Attendance"
                        disabled={actionLoading[`disapprove_${participant.userId._id || participant.userId}`]}
                      >
                        <FaTimes />
                        <span>{actionLoading[`disapprove_${participant.userId._id || participant.userId}`] ? 'Disapproving...' : 'Disapprove'}</span>
                      </button>
                    </>
                  )}
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemove(participant.userId._id || participant.userId)}
                    title="Remove Participant"
                    disabled={actionLoading[`remove_${participant.userId._id || participant.userId}`]}
                  >
                    <FaTrash />
                    <span>{actionLoading[`remove_${participant.userId._id || participant.userId}`] ? 'Removing...' : 'Remove'}</span>
                  </button>
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