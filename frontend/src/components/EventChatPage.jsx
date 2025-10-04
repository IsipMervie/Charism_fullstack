// EventChatPage.jsx - Modern Event Chat Interface
// Complete redesign with enhanced UX and modern design patterns

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaComments, 
  FaUsers, 
  FaExpand, 
  FaCompress, 
  FaSearch,
  FaFilter,
  FaUserPlus,
  FaCog,
  FaPaperPlane,
  FaImage,
  FaFile,
  FaSmile,
  FaHeart,
  FaThumbsUp,
  FaReply,
  FaEdit,
  FaTrash,
  FaDownload,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import EventChat from './EventChat';
import { getProfilePictureUrl, getEventImageUrl } from '../utils/imageUtils';
import SimpleEventImage from './SimpleEventImage';
import { formatTimeRange12Hour } from '../utils/timeUtils';
import './EventChatPage.css';

const EventChatPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Send message function
  const sendMessage = async (messageData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://charism-api-xtw9.onrender.com'}/api/events/${eventId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Handle submit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Implementation for form submission
  };
  
  // Core state
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'participants', 'info'
  
  // Participants and approvals
  const [participants, setParticipants] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showApprovals, setShowApprovals] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState('');
  
  // Profile modal
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Chat access
  const [chatJoinRequested, setChatJoinRequested] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // User data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');

  // Utility functions
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatEventTime = (startTime, endTime) => {
    return formatTimeRange12Hour(startTime, endTime);
  };

  const getEventStatus = (event) => {
    if (!event) return 'unknown';
    const now = new Date();
    const eventDate = new Date(event.date);
    const eventStartTime = new Date(`${eventDate.toDateString()} ${event.startTime || '00:00'}`);
    const eventEndTime = new Date(`${eventDate.toDateString()} ${event.endTime || '23:59'}`);
    
    if (now < eventStartTime) return 'upcoming';
    if (now >= eventStartTime && now <= eventEndTime) return 'ongoing';
    return 'completed';
  };

  const getEventStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'var(--info)';
      case 'ongoing': return 'var(--success)';
      case 'completed': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  const getEventStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return '⏰';
      case 'ongoing': return '🟢';
      case 'completed': return '✅';
      default: return '❓';
    }
  };

  // Check if user can access chat for this event
  const canAccessChat = (event) => {
    console.log('🔍 canAccessChat called with:', {
      eventId: event?._id,
      eventTitle: event?.title,
      hasEvent: !!event,
      hasAttendance: !!event?.attendance,
      attendanceLength: event?.attendance?.length || 0,
      userRole: role,
      userId: user._id,
      userEmail: user.email
    });
    
    // Admin and Staff can access chat for all events
    if (role === 'Admin' || role === 'Staff') {
      console.log('✅ Admin/Staff access granted');
      return true;
    }
    
    // Students can access chat if they are registered and approved for chat
    if (role === 'Student' && event?.attendance) {
      // First try to find by user ID
      let userAttendance = event.attendance.find(att => 
        (att.userId?._id || att.userId) === user._id
      );
      
      // If not found by ID, try to find by email (fallback)
      if (!userAttendance && user.email) {
        userAttendance = event.attendance.find(att => 
          att.userId?.email === user.email
        );
        console.log('🔄 Fallback email search:', {
          userEmail: user.email,
          foundByEmail: !!userAttendance
        });
      }
      
      console.log('🎓 Student access check:', {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        hasAttendance: !!userAttendance,
        attendanceData: userAttendance ? {
          registrationApproved: userAttendance.registrationApproved,
          status: userAttendance.status,
          fullAttendance: userAttendance
        } : null,
        allAttendanceRecords: event.attendance.map(att => ({
          userId: att.userId?._id || att.userId,
          userName: att.userId?.name || 'Unknown',
          userEmail: att.userId?.email || 'Unknown',
          registrationApproved: att.registrationApproved,
          status: att.status
        }))
      });
      
      // Allow access if student is registered and approved for chat
      // Check multiple approval indicators
      const isApproved = userAttendance?.registrationApproved || 
                        userAttendance?.status === 'Approved' ||
                        userAttendance?.status === 'Attended' ||
                        userAttendance?.status === 'Completed';
      
      console.log('🎓 Approval check result:', {
        registrationApproved: userAttendance?.registrationApproved,
        status: userAttendance?.status,
        isApproved: isApproved
      });
      
      return isApproved;
    }
    
    console.log('❌ Access denied:', { 
      role, 
      hasEvent: !!event, 
      hasAttendance: !!event?.attendance,
      eventId: event?._id,
      eventTitle: event?.title,
      attendanceCount: event?.attendance?.length || 0,
      attendanceStructure: event?.attendance ? 'Array' : 'Not Array',
      sampleAttendance: event?.attendance?.slice(0, 2) || 'No attendance data'
    });
    return false;
  };

  // Check if student can request chat access
  const canRequestChatAccess = (event) => {
    if (role !== 'Student' || !event?.attendance) return false;
    
    // First try to find by user ID
    let userAttendance = event.attendance.find(att => 
      (att.userId?._id || att.userId) === user._id
    );
    
    // If not found by ID, try to find by email (fallback)
    if (!userAttendance && user.email) {
      userAttendance = event.attendance.find(att => 
        att.userId?.email === user.email
      );
    }
    
    // Can request if registered but not approved for chat
    const isApproved = userAttendance?.registrationApproved || 
                      userAttendance?.status === 'Approved' ||
                      userAttendance?.status === 'Attended' ||
                      userAttendance?.status === 'Completed';
    
    return userAttendance && !isApproved;
  };

  // Request chat access
  const requestChatAccess = async () => {
    try {
      const { requestEventChatAccess } = await import('../api/api');
      await requestEventChatAccess(eventId);
      setChatJoinRequested(true);
      Swal.fire({
        icon: 'success',
        title: 'Chat Access Requested!',
        text: 'Your request to join the chat has been submitted. Please wait for admin/staff approval.',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error requesting chat access:', err);
      Swal.fire('Error', 'Failed to request chat access. Please try again.', 'error');
    }
  };

  // Remove participant from chat
  const removeParticipant = async (participantId, participantName) => {
    try {
      const { removeEventChatParticipant } = await import('../api/api');
      
      const result = await Swal.fire({
        title: 'Remove Participant',
        text: `Are you sure you want to remove ${participantName} from this event chat?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, remove them',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        await removeEventChatParticipant(eventId, participantId);
        
        Swal.fire({
          title: 'Participant Removed',
          text: `${participantName} has been removed from the event chat.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload participants to update the list
        await loadParticipants();
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      Swal.fire('Error', 'Failed to remove participant. Please try again.', 'error');
    }
  };

  // Load participants with enhanced functionality
  const loadParticipants = useCallback(async () => {
    try {
      setParticipantsLoading(true);
      setParticipantsError('');
      console.log('🔄 Loading participants for event:', eventId);
      
      // Clear any cached participant data to ensure fresh data
      const { clearAllCache } = await import('../api/api');
      clearAllCache();
      
      // Try to load event participants first (this should be the primary source)
      const { getEventParticipantsPublic } = await import('../api/api');
      
      let eventParticipants = [];
      try {
        const eventData = await getEventParticipantsPublic(eventId);
        eventParticipants = eventData.participants || [];
        console.log('✅ Event participants loaded:', eventParticipants.length);
        console.log('Event participants data:', eventParticipants);
      } catch (error) {
        console.error('❌ Failed to load event participants:', error);
      }
      
      // Try to load chat participants as backup
      let chatParticipants = [];
      try {
        const { getEventChatParticipants } = await import('../api/api');
        const chatData = await getEventChatParticipants(eventId);
        chatParticipants = chatData.participants || [];
        console.log('✅ Chat participants loaded:', chatParticipants.length);
        console.log('Chat participants data:', chatParticipants);
      } catch (error) {
        console.error('❌ Failed to load chat participants:', error);
      }
      
      // Use event participants as primary source, fallback to chat participants
      let allParticipants = eventParticipants.length > 0 ? eventParticipants : chatParticipants;
      
      console.log('📊 Final participant count:', allParticipants.length);
      console.log('📊 Using data source:', eventParticipants.length > 0 ? 'event participants' : 'chat participants');
      
      // Ensure all participants have required fields with fallbacks and validate data
      const processedParticipants = allParticipants
        .filter(participant => {
          // Filter out participants with missing essential data
          if (!participant._id || !participant.name || !participant.email) {
            console.log('⚠️ Filtering out participant with missing data:', participant);
            return false;
          }
          return true;
        })
        .map(participant => ({
          ...participant,
          role: participant.role || 'Student',
          department: participant.role === 'Student' ? (participant.department || 'Not specified') : null,
          academicYear: participant.academicYear || (participant.role === 'Student' ? 'Not specified' : null),
          section: participant.section || (participant.role === 'Student' ? 'Not specified' : null),
          year: participant.year || (participant.role === 'Student' ? 'Not specified' : null),
          name: participant.name || 'Unknown User',
          email: participant.email || 'No email provided',
          profilePicture: participant.profilePicture || null
        }));
      
      // Sort participants by role (Admin/Staff first, then Students)
      const sortedParticipants = processedParticipants.sort((a, b) => {
        const roleOrder = { 'Admin': 0, 'Staff': 1, 'Student': 2 };
        return (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3);
      });
      
      console.log('✅ Final processed participants:', sortedParticipants.length);
      console.log('Participants:', sortedParticipants.map(p => ({ name: p.name, email: p.email, role: p.role })));
      setParticipants(sortedParticipants);
      
      if (sortedParticipants.length === 0) {
        setParticipantsError('No participants found for this event. This might be due to data issues or the event not having any registered participants.');
      }
    } catch (err) {
      console.error('❌ Error loading participants:', err);
      setParticipants([]);
      setParticipantsError('Failed to load participants. Please try refreshing the page.');
    } finally {
      setParticipantsLoading(false);
    }
  }, [eventId]);

  // Filter participants based on search
  const filteredParticipants = participants.filter(participant => 
    participant.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
    participant.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
    (participant.role && participant.role.toLowerCase().includes(participantSearch.toLowerCase()))
  );

  // Load pending chat approvals
  const loadPendingApprovals = async () => {
    try {
      if (role === 'Admin' || role === 'Staff') {
        const { getEventDetails } = await import('../api/api');
        const eventData = await getEventDetails(eventId);
        
        // Get students who are registered but not approved for chat
        const pendingStudents = eventData.attendance?.filter(att => 
          att.userId && 
          att.userId.role === 'Student' && 
          !att.registrationApproved && 
          att.status !== 'Approved'
        ) || [];
        
        console.log('📋 Pending approvals loaded:', {
          totalAttendance: eventData.attendance?.length || 0,
          pendingCount: pendingStudents.length,
          pendingStudents: pendingStudents.map(p => ({
            name: p.userId?.name,
            email: p.userId?.email,
            registrationApproved: p.registrationApproved,
            status: p.status
          }))
        });
        
        setPendingApprovals(pendingStudents);
      }
    } catch (err) {
      console.error('Error loading pending approvals:', err);
    }
  };

  // Approve student for chat
  const approveStudentForChat = async (userId) => {
    try {
      const { approveRegistration } = await import('../api/api');
      await approveRegistration(eventId, userId);
      
      // Refresh data
      await loadParticipants();
      await loadPendingApprovals();
      
      alert('Student approved for chat access!');
    } catch (err) {
      console.error('Error approving student:', err);
      alert('Failed to approve student. Please try again.');
    }
  };

  // Reject student for chat
  const rejectStudentForChat = async (userId) => {
    // Predefined disapproval reasons
    const disapprovalReasons = [
      'Act of Misconduct (Student displayed inappropriate behavior or violated rules during the commserv)',
      'Late Arrival (Arrived late and wasn\'t present during the call time)',
      'Left Early (Left in the middle of the duration of commserv)',
      'Did not sign the Community Service Form',
      'Did not sign attendance sheet (if any)',
      'Absent (Student was absent and didn\'t attend the commserv)',
      'Not wearing the required uniform',
      'Full slot',
      'Other'
    ];
    
    const { value: formData } = await Swal.fire({
      title: 'Reason for Disapproval',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px; font-weight: 500;">Reasons why this student is disapproved (Attendance and During Duration of commserv):</p>
          <select id="disapproval-reason" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            <option value="">Select a reason...</option>
            ${disapprovalReasons.map(reason => `<option value="${reason}">${reason}</option>`).join('')}
          </select>
          <div id="other-reason-container" style="display: none; margin-top: 10px;">
            <label for="other-reason" style="display: block; margin-bottom: 5px; font-weight: 500;">Please specify other reason:</label>
            <textarea id="other-reason" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; min-height: 80px;" placeholder="Enter your specific reason here..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const selectedReason = document.getElementById('disapproval-reason').value;
        const otherReason = document.getElementById('other-reason').value;
        
        if (!selectedReason) {
          Swal.showValidationMessage('Please select a reason for disapproval');
          return false;
        }
        
        if (selectedReason === 'Other' && !otherReason.trim()) {
          Swal.showValidationMessage('Please specify the other reason');
          return false;
        }
        
        return {
          reason: selectedReason === 'Other' ? otherReason.trim() : selectedReason,
          selectedReason: selectedReason
        };
      },
      didOpen: () => {
        const reasonSelect = document.getElementById('disapproval-reason');
        const otherContainer = document.getElementById('other-reason-container');
        
        reasonSelect.addEventListener('change', (e) => {
          if (e.target.value === 'Other') {
            otherContainer.style.display = 'block';
          } else {
            otherContainer.style.display = 'none';
          }
        });
      }
    });

    if (formData) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to disapprove this student's registration?\n\nReason: ${formData.reason}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, disapprove it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        try {
          const { disapproveRegistration } = await import('../api/api');
          await disapproveRegistration(eventId, userId, formData.reason);
          
          // Refresh data
          await loadParticipants();
          await loadPendingApprovals();
          
          Swal.fire({
            icon: 'success',
            title: 'Registration Disapproved!',
            text: 'The student\'s registration has been disapproved with the provided reason.',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (err) {
          console.error('Error rejecting student:', err);
          Swal.fire('Error', 'Failed to reject student. Please try again.', 'error');
        }
      }
    }
  };

  // View user profile
  const viewProfile = async (participant) => {
    try {
      console.log('Viewing profile for participant:', participant);
      
      // Use the participant data directly since it already has all the information we need
      const completeProfile = {
        ...participant,
        // Ensure we have fallbacks for missing data
        name: participant.name || 'Unknown User',
        email: participant.email || 'No email provided',
        role: participant.role || 'Student',
        department: participant.role === 'Student' ? (participant.department || 'Not specified') : null,
        academicYear: participant.academicYear || (participant.role === 'Student' ? 'Not specified' : null),
        section: participant.section || (participant.role === 'Student' ? 'Not specified' : null),
        year: participant.year || (participant.role === 'Student' ? 'Not specified' : null),
        profilePicture: participant.profilePicture || null
      };
      
      console.log('Complete profile data:', completeProfile);
      setSelectedProfile(completeProfile);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to participant data if anything fails
      setSelectedProfile({
        ...participant,
        role: participant.role || 'Student',
        department: participant.role === 'Student' ? (participant.department || 'Not specified') : null,
        academicYear: participant.academicYear || 'Not specified',
        section: participant.section || 'Not specified',
        year: participant.year || 'Not specified'
      });
      setShowProfileModal(true);
    }
  };

  // Load event details
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Import the API functions
        const { getEventDetails } = await import('../api/api');
        const eventData = await getEventDetails(eventId);
        
        // getEventDetails already includes attendance data
        
        // Calculate approved participants count
        const approvedParticipants = eventData?.attendance ? 
          eventData.attendance.filter(a => 
            a.registrationApproved === true || 
            a.status === 'Approved' || 
            a.status === 'Attended' || 
            a.status === 'Completed'
          ).length : 0;
        
        console.log('📊 Event data loaded:', {
          eventId: eventData?._id,
          eventTitle: eventData?.title,
          hasAttendance: !!eventData?.attendance,
          attendanceLength: eventData?.attendance?.length || 0,
          approvedParticipants: approvedParticipants
        });
        
        setEvent(eventData);
        
        // Check if user can access chat
        if (!canAccessChat(eventData)) {
          setError('You are not authorized to access the chat for this event. You must be registered and approved for this event to participate in the chat.');
          return;
        }
        
        // Auto-open chat if user has access
        setShowChat(true);
        
        // Load participants and pending approvals
        await loadParticipants();
        await loadPendingApprovals();
        
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  // Add polling mechanism to check for approval status updates
  useEffect(() => {
    // Only poll if user is a Student and doesn't have chat access yet
    if (role === 'Student' && event && !canAccessChat(event)) {
      console.log('🔄 Starting approval status polling for student...');
      
      const pollInterval = setInterval(async () => {
        try {
          const { getEventDetails } = await import('../api/api');
          const eventData = await getEventDetails(eventId);
          
          // Check if user now has access
          if (canAccessChat(eventData)) {
            console.log('✅ Student approval detected! Refreshing event data...');
            setEvent(eventData);
            setError(''); // Clear any previous error
            setShowChat(true); // Enable chat
            
            // Load updated participants
            await loadParticipants();
            
            // Stop polling since we have access now
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error('Error polling for approval status:', err);
        }
      }, 5000); // Poll every 5 seconds

      // Clean up interval on unmount or when access is granted
      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [eventId, event, role, user._id]);

  if (loading) {
    return (
      <div className="event-chat-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-chat-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Chat Access</h2>
          <p>{error}</p>
          
          {/* Show different options based on user role and status */}
          {role === 'Student' && event && canRequestChatAccess(event) && !chatJoinRequested && (
            <div className="chat-access-options">
              <p>You are registered for this event but need approval to join the chat.</p>
              <button 
                className="request-chat-access-btn"
                onClick={requestChatAccess}
              >
                Request Chat Access
              </button>
            </div>
          )}
          
          {role === 'Student' && chatJoinRequested && (
            <div className="chat-request-status">
              <p>✅ Your chat access request has been submitted!</p>
              <p>Please wait for admin/staff approval to join the chat.</p>
            </div>
          )}

          {role === 'Student' && event && !canAccessChat(event) && (
            <div className="chat-waiting-status">
              <p>⏳ Waiting for approval to access chat...</p>
              <p>We're checking for updates every few seconds. You can also refresh manually.</p>
              <button 
                className="refresh-approval-btn"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { getEventDetails } = await import('../api/api');
                    const eventData = await getEventDetails(eventId);
                    setEvent(eventData);
                    
                    if (canAccessChat(eventData)) {
                      setError('');
                      setShowChat(true);
                      await loadParticipants();
                    }
                  } catch (err) {
                    console.error('Error refreshing approval status:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                🔄 Check Approval Status
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-chat-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Event Not Found</h2>
          <p>The event you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-chat-page">
      {/* Modern Background */}
      <div className="event-chat-background">
        <div className="background-gradient"></div>
        <div className="floating-elements">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
        </div>
      </div>

      {/* Main Container */}
      <div className="event-chat-container">
        {/* Modern Header */}
        <header className="chat-page-header">
          <div className="header-left">
            <div className="event-image-container">
              <SimpleEventImage 
                event={event}
                className="event-header-image"
                alt={event.title}
              />
            </div>
            <div className="event-info">
              <h1 className="event-title">{event.title}</h1>
              <div className="event-status">
                <span 
                  className="status-indicator"
                  style={{ color: getEventStatusColor(getEventStatus(event)) }}
                >
                  {getEventStatusIcon(getEventStatus(event))}
                </span>
                <span className="status-text">{getEventStatus(event)}</span>
              </div>
            </div>
          </div>

          <div className="header-center">
            <div className="event-meta">
              <div className="meta-item">
                <FaCalendarAlt />
                <span>{formatEventDate(event.date)}</span>
              </div>
              <div className="meta-item">
                <FaClock />
                <span>{formatEventTime(event.startTime, event.endTime)}</span>
              </div>
              <div className="meta-item">
                <FaMapMarkerAlt />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            
          </div>
        </header>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Chat Area */}
          <div className="chat-area">
            <div className="chat-tabs">
              <button 
                className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <FaComments />
                <span>Chat</span>
              </button>
              <button 
                className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
                onClick={() => setActiveTab('participants')}
              >
                <FaUsers />
                <span>Participants <span className="participant-count">{
                  event && event.attendance ? 
                    event.attendance.filter(a => 
                      a.registrationApproved === true || 
                      a.status === 'Approved' || 
                      a.status === 'Attended' || 
                      a.status === 'Completed' ||
                      a.status === 'Pending' // Include pending registrations in count
                    ).length : 
                    (participants.length || 0)
                } registrations</span></span>
              </button>
              <button 
                className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <FaInfoCircle />
                <span>Event Info</span>
              </button>
              
              <button 
                className="fullscreen-toggle"
                onClick={() => setShowFullscreenChat(true)}
                title="Fullscreen Chat"
              >
                <FaExpand />
                <span>Fullscreen</span>
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'chat' && (
                <div className="chat-container">
                  <EventChat 
                    eventId={eventId}
                    eventTitle={event.title}
                    onClose={() => navigate('/events')}
                    viewProfile={viewProfile}
                    notificationsEnabled={notificationsEnabled}
                  />
                </div>
              )}

              {activeTab === 'participants' && (
                <div className="participants-container">
                  <div className="participants-header">
                    <div className="search-box">
                      <FaSearch />
                      <input
                        type="text"
                        placeholder="Search participants..."
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                      />
                    </div>
                    
                    {(role === 'Admin' || role === 'Staff') && pendingApprovals.length > 0 && (
                      <button 
                        className="approvals-button"
                        onClick={() => setShowApprovals(!showApprovals)}
                      >
                        <FaUserPlus />
                        <span>Pending ({pendingApprovals.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="participants-list">
                    {participantsLoading ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                      </div>
                    ) : participantsError ? (
                      <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Error Loading Participants</h3>
                        <p>{participantsError}</p>
                        <button 
                          className="retry-button"
                          onClick={loadParticipants}
                        >
                          Try Again
                        </button>
                      </div>
                    ) : filteredParticipants.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No participants found</h3>
                        <p>{participantSearch ? 'No participants match your search' : 'Participants will appear here once they join the chat'}</p>
                      </div>
                    ) : (
                      filteredParticipants.map((participant) => (
                        <div 
                          key={participant._id} 
                          className="participant-card"
                        >
                          <div 
                            className="participant-main"
                            onClick={() => viewProfile(participant)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="participant-avatar">
                              <img 
                                src={getProfilePictureUrl(participant.profilePicture, participant._id)} 
                                alt={participant.name}
                              />
                            </div>
                            <div className="participant-info">
                              <h4 className="participant-name">{participant.name}</h4>
                              <p className="participant-email">{participant.email}</p>
                              <div className="participant-role">
                                <span className={`role-badge role-${participant.role?.toLowerCase() || 'unknown'}`}>
                                  {participant.role || 'Student'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Remove button for Admin/Staff */}
                          {(role === 'Admin' || role === 'Staff') && (
                            <button
                              className="remove-participant-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeParticipant(participant._id, participant.name);
                              }}
                              title={`Remove ${participant.name} from chat`}
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="event-info-container">
                  <div className="info-section">
                    <h3>Event Description</h3>
                    <p className="event-description">{event.description}</p>
                  </div>
                  
                  <div className="info-section">
                    <h3>Event Details</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <FaCalendarAlt />
                        <div>
                          <label>Date</label>
                          <span>{formatEventDate(event.date)}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaClock />
                        <div>
                          <label>Time</label>
                          <span>{formatEventTime(event.startTime, event.endTime)}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaMapMarkerAlt />
                        <div>
                          <label>Location</label>
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaUsers />
                        <div>
                          <label>Participants</label>
                          <span>{
                            event && event.attendance ? 
                              event.attendance.filter(a => 
                                a.registrationApproved === true || 
                                a.status === 'Approved' || 
                                a.status === 'Attended' || 
                                a.status === 'Completed' ||
                                a.status === 'Pending' // Include pending registrations in count
                              ).length : 
                              (participants.length || 0)
                          } registrations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Fullscreen Chat Modal */}
      {showFullscreenChat && (
        <div className="fullscreen-overlay">
          <div className="fullscreen-header">
            <div className="fullscreen-title">
              <FaComments />
              <span>{event.title}</span>
            </div>
            <div className="fullscreen-controls">
              <button 
                className="exit-fullscreen"
                onClick={() => setShowFullscreenChat(false)}
                title="Exit Fullscreen"
              >
                <FaCompress />
              </button>
            </div>
          </div>
          
          <div className="fullscreen-content">
            <EventChat 
              eventId={eventId}
              eventTitle={event.title}
              onClose={() => setShowFullscreenChat(false)}
              viewProfile={viewProfile}
              isFullscreen={true}
              notificationsEnabled={notificationsEnabled}
            />
          </div>
        </div>
      )}

      {/* Enhanced Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header">
              <button 
                className="close-profile-btn"
                onClick={() => setShowProfileModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="profile-content">
              <div className="profile-avatar-section">
                <img 
                  src={getProfilePictureUrl(selectedProfile.profilePicture, selectedProfile._id)} 
                  alt={selectedProfile.name}
                  className="profile-avatar"
                />
                <div className="profile-status">
                  <span className="status-dot"></span>
                  <span>Online</span>
                </div>
              </div>
              
              <div className="profile-info-section">
                <h2 className="profile-name">{selectedProfile.name}</h2>
                <p className="profile-email">{selectedProfile.email}</p>
                
                <div className="profile-details">
                  <div className="detail-row">
                    <label>Role</label>
                    <span className={`role-badge role-${selectedProfile.role?.toLowerCase() || 'unknown'}`}>
                      {selectedProfile.role || 'Student'}
                    </span>
                  </div>
                  
                  {selectedProfile.role === 'Student' && (
                    <div className="detail-row">
                      <label>Department</label>
                      <span>{selectedProfile.department || 'Not specified'}</span>
                    </div>
                  )}
                  
                  {selectedProfile.role === 'Student' && (
                    <>
                      <div className="detail-row">
                        <label>Academic Year</label>
                        <span>{selectedProfile.academicYear || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Section</label>
                        <span>{selectedProfile.section || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Year Level</label>
                        <span>{selectedProfile.year || 'Not specified'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventChatPage;
