import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventParticipants, approveAttendance, disapproveAttendance } from '../api/api';
import Swal from 'sweetalert2';
import { FaCheck, FaTimes, FaDownload, FaEye } from 'react-icons/fa';
import './EventParticipantsPage.css';

function EventParticipantsPage() {
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const participant = participants.find(p => p.userId._id === userId || p.userId === userId);
    
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
      try {
        await approveAttendance(eventId, userId);
        Swal.fire('Success', 'Attendance approved!', 'success');
        // Refresh participants list
        const data = await getEventParticipants(eventId);
        setParticipants(data);
      } catch (err) {
        Swal.fire('Error', err.message || 'Failed to approve attendance.', 'error');
      }
    }
  };

  const handleDisapprove = async (userId) => {
    const participant = participants.find(p => p.userId._id === userId || p.userId === userId);
    
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
        try {
          await disapproveAttendance(eventId, userId, reason);
          Swal.fire('Success', 'Attendance disapproved!', 'success');
          // Refresh participants list
          const data = await getEventParticipants(eventId);
          setParticipants(data);
        } catch (err) {
          Swal.fire('Error', 'Failed to disapprove attendance.', 'error');
        }
      }
    } else {
      Swal.fire('Error', 'Reason is required to disapprove attendance.', 'error');
    }
  };

  return (
    <div className="event-participants-container">
      <div className="event-participants-card">
        {loading ? <p>Loading...</p> : null}
        <h2>Participants</h2>
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
                        disabled={!participant.timeOut}
                      >
                        <FaCheck />
                      </button>
                      <button 
                        className="disapprove-btn"
                        onClick={() => handleDisapprove(participant.userId._id || participant.userId)}
                        title="Disapprove Attendance"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                  {(participant.status === 'Approved' || participant.status === 'Disapproved') && (
                    <>
                      <button 
                        className={`approve-btn ${!participant.timeOut ? 'disabled' : ''}`}
                        onClick={() => handleApprove(participant.userId._id || participant.userId)}
                        title={!participant.timeOut ? 'Cannot approve: Student has not timed out' : 'Change to Approved'}
                        disabled={!participant.timeOut}
                      >
                        <FaCheck />
                      </button>
                      <button 
                        className="disapprove-btn"
                        onClick={() => handleDisapprove(participant.userId._id || participant.userId)}
                        title="Change to Disapproved"
                      >
                        <FaTimes />
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
    </div>
  );
}

export default EventParticipantsPage;