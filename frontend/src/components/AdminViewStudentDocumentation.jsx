import React, { useState, useEffect } from 'react';
import { Badge, Modal, Table, Button } from 'react-bootstrap';
import { FaFile, FaSearch, FaFilter, FaEye, FaUser, FaCalendar, FaClock, FaFileAlt, FaUsers, FaCheckCircle, FaExclamationTriangle, FaTimes, FaList, FaBuilding, FaDownload } from 'react-icons/fa';
import { getEvents, getEventsWithUserData, downloadDocumentationFile } from '../api/api';
import { formatTimeRange12Hour, formatTime12Hour } from '../utils/timeUtils';
import Swal from 'sweetalert2';
import './AdminViewStudentDocumentation.css';

const AdminViewStudentDocumentation = () => {
  const [events, setEvents] = useState([]);
  const [allDocumentation, setAllDocumentation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  
  const [selectedDocumentation, setSelectedDocumentation] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔐 Current user token:', localStorage.getItem('token'));
      console.log('👤 Current user:', JSON.parse(localStorage.getItem('user') || '{}'));
      
      // Check user role
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔐 User role:', currentUser.role);
      console.log('🔐 User ID:', currentUser.userId);
      console.log('🔐 Full user object:', currentUser);
      
      // TEMPORARY: Check if user has Admin/Staff role from localStorage
      if (currentUser.role === 'Admin' || currentUser.role === 'Staff') {
        console.log('✅ User has Admin/Staff role - proceeding with direct extraction');
      } else {
        console.log('❌ User does not have Admin/Staff role:', currentUser.role);
      }
      
      // Fetch all events with populated user data
      const eventsData = await getEventsWithUserData();
      console.log('📅 Events with user data fetched:', eventsData.length);
      console.log('🔍 Sample event data:', eventsData[0]);
      console.log('🔍 Sample attendance data:', eventsData[0]?.attendance?.[0]);
      setEvents(eventsData);

             // Fetch documentation for all events
       const documentationData = [];
       for (const event of eventsData) {
         try {
           console.log(`🔍 Fetching documentation for event: ${event.title} (${event._id})`);
           console.log(`👥 Event attendance count: ${event.attendance?.length || 0}`);
           
                       // Use direct extraction from event data (more reliable)
            if (event.attendance && event.attendance.length > 0) {
              console.log(`🔍 Checking attendance for documentation...`);
              event.attendance.forEach((att, index) => {
                console.log(`👤 Attendance ${index}: userId=${att.userId?._id || att.userId}, has documentation: ${!!att.documentation}`);
                console.log(`👤 Registration approved: ${att.registrationApproved}`);
                console.log(`👤 Documentation files count: ${att.documentation?.files?.length || 0}`);
                console.log(`👤 User data:`, att.userId);
                // Include students who have documentation files (regardless of registration approval status)
                if (att.documentation && att.documentation.files && att.documentation.files.length > 0) {
                  console.log(`🔍 Direct extraction: Found ${att.documentation.files.length} files for user ${att.userId?.name || att.userId}`);
                  
                  // Extract user information from populated user data
                  let userName = 'Unknown Student';
                  let userEmail = 'No email available';
                  let userId = att.userId;
                  
                  if (att.userId && typeof att.userId === 'object') {
                    // User data is now populated, so we can access the fields directly
                    console.log('✅ User data is populated object:', att.userId);
                    userName = att.userId.name || 
                              (att.userId.firstName && att.userId.lastName ? `${att.userId.firstName} ${att.userId.lastName}` : null) ||
                              att.userId.firstName ||
                              att.userId.lastName ||
                              'Unknown Student';
                    
                    userEmail = att.userId.email || 'No email available';
                    userId = att.userId._id || att.userId;
                    console.log('✅ Extracted from populated data - Name:', userName, 'Email:', userEmail, 'ID:', userId);
                  } else if (att.userId && typeof att.userId === 'string') {
                    // If userId is still just a string ID, we need to fetch user data separately
                    console.log('⚠️ User data not populated, userId is string:', att.userId);
                    userName = 'Unknown Student';
                    userEmail = 'No email available';
                    userId = att.userId;
                  } else {
                    console.log('❌ No userId found in attendance:', att);
                    userName = 'Unknown Student';
                    userEmail = 'No email available';
                    userId = null;
                  }
                  
                  console.log(`👤 Extracted user info: name="${userName}", email="${userEmail}"`);
                  console.log(`👤 User data type:`, typeof att.userId, att.userId);
                  
                  // Format event time properly
                  const formatEventTime = () => {
                    // Debug logging
                    console.log('Event time data for admin view:', {
                      eventTitle: event.title,
                      startTime: event.startTime,
                      endTime: event.endTime,
                      hasStartTime: !!event.startTime,
                      hasEndTime: !!event.endTime,
                      startTimeType: typeof event.startTime,
                      endTimeType: typeof event.endTime
                    });
                    
                    // If we have both start and end times, show the range
                    if (event.startTime && event.endTime && 
                        event.startTime.trim() !== '' && event.endTime.trim() !== '') {
                      return formatTimeRange12Hour(event.startTime, event.endTime);
                    }
                    // If we only have start time, try to calculate end time from hours
                    else if (event.startTime && event.startTime.trim() !== '') {
                      if (event.hours) {
                        try {
                          // Calculate end time by adding hours to start time
                          const [startHours, startMinutes] = event.startTime.split(':').map(Number);
                          const startTimeInMinutes = startHours * 60 + startMinutes;
                          const endTimeInMinutes = startTimeInMinutes + (event.hours * 60);
                          
                          const endHours = Math.floor(endTimeInMinutes / 60);
                          const endMinutes = endTimeInMinutes % 60;
                          
                          // Handle day overflow (if event goes past midnight)
                          const displayEndHours = endHours >= 24 ? endHours - 24 : endHours;
                          const endTimeString = `${displayEndHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
                          
                          return formatTimeRange12Hour(event.startTime, endTimeString);
                        } catch (error) {
                          console.error('Error calculating end time:', error);
                          return `${formatTime12Hour(event.startTime)} (start time only)`;
                        }
                      } else {
                        return `${formatTime12Hour(event.startTime)} (start time only)`;
                      }
                    }
                    // If we only have end time, show it with a note
                    else if (event.endTime && event.endTime.trim() !== '') {
                      return `${formatTime12Hour(event.endTime)} (end time only)`;
                    }
                    // No time information available
                    else {
                      return 'Time not specified';
                    }
                  };

                  documentationData.push({
                    userId: {
                      _id: userId,
                      name: userName,
                      email: userEmail
                    },
                    files: att.documentation.files,
                    lastUpdated: att.documentation.lastUpdated,
                    eventId: event._id,
                    eventTitle: event.title,
                    eventDate: event.date,
                    eventTime: formatEventTime(),
                    eventLocation: event.location,
                    userName: userName,
                    userEmail: userEmail
                  });
                  console.log(`✅ Direct extraction: Added documentation for ${event.title}`);
                }
              });
            }
           
           // Comment out API call to avoid duplication
           // const docData = await getEventDocumentation(event._id);
           // console.log(`📄 Documentation data for ${event.title}:`, docData);
           
         } catch (err) {
           console.error(`❌ Error fetching documentation for event ${event._id}:`, err);
         }
       }
      
      console.log(`📊 Total documentation entries collected:`, documentationData.length);
      console.log(`📊 Documentation data sample:`, documentationData[0]);
      setAllDocumentation(documentationData);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (eventId, filename, originalName) => {
    try {
      await downloadDocumentationFile(eventId, filename, originalName);
    } catch (err) {
      Swal.fire('Download Error', 'Failed to download file. Please try again.', 'error');
    }
  };



     const handleViewDocumentation = (doc) => {
     setSelectedDocumentation(doc);
     setShowViewModal(true);
   };

   const handleEventFilterChange = (eventTitle) => {
     setFilterEvent(eventTitle);
     // Reset student filter when event changes
     setFilterStudent('');
   };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedDocumentation(null);
  };

     // Filter documentation based on search and filters
   const filteredDocumentation = allDocumentation.filter(doc => {
     const matchesSearch = !searchTerm || 
       doc.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       doc.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       doc.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase());
     
     const matchesEvent = !filterEvent || doc.eventTitle === filterEvent;
     const matchesStudent = !filterStudent || doc.userName === filterStudent;
     
     // Show all documentation regardless of registration approval status
     // The important thing is that the student uploaded files
     return matchesSearch && matchesEvent && matchesStudent;
    });

    // Get unique events for filter dropdown
    const uniqueEvents = [...new Set(events.map(event => event.title))];
    
         // Get unique students for filter dropdown (all students who have uploaded documentation)
     const uniqueStudents = filterEvent 
       ? [...new Set(
           allDocumentation
             .filter(doc => doc.eventTitle === filterEvent)
             .map(doc => doc.userName)
             .filter(Boolean)
         )]
       : [...new Set(
           allDocumentation
             .map(doc => doc.userName)
             .filter(Boolean)
         )];

    console.log(`🔍 Filtered documentation:`, filteredDocumentation);
    console.log(`📊 All documentation:`, allDocumentation);
    console.log(`👥 Unique students from events:`, uniqueStudents);
    console.log(`📅 Unique events:`, uniqueEvents);

  

     // Check if any filters are active
   const hasActiveFilters = filterEvent || filterStudent || searchTerm;

  if (loading) {
    return (
      <div className="documentation-page">
        <div className="loading-section">
          <div className="loading-content">
            <h3>Loading Student Documentation</h3>
            <p>Please wait while we fetch the documentation information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="documentation-page">
        <div className="error-section">
          <div className="error-content">
            <FaExclamationTriangle className="error-icon" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="documentation-page">
      <div className="documentation-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`documentation-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">📁</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">Student Documentation </h1>
              <p className="header-subtitle">Comprehensive view of all student documentation uploads across events</p>
            </div>
          </div>
          
          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-icon">
                <FaFileAlt />
              </div>
              <div className="stat-content">
                <span className="stat-number">{events.length}</span>
                <span className="stat-label">Total Events</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <span className="stat-number">{allDocumentation.length}</span>
                <span className="stat-label">Documentation Entries</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <span className="stat-number">{filteredDocumentation.length}</span>
                <span className="stat-label">Filtered Results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="controls-section">
          <div className="controls-left">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by student or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              <span>Filters</span>
              {hasActiveFilters && <span className="filter-badge">•</span>}
            </button>
          </div>
          
          <div className="controls-right">
            <div className="view-toggle">
              <button 
                className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <FaFileAlt />
                <span>Grid</span>
              </button>
              <button 
                className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <FaList />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="filters-section">
            <div className="filters-grid">
                             <div className="filter-group">
                 <label className="filter-label">
                   <FaCalendar className="label-icon" />
                   Event
                 </label>
                 <div className="event-filter-container">
                                                            <select
                      value={filterEvent}
                      onChange={(e) => handleEventFilterChange(e.target.value)}
                      className="filter-select event-filter-select"
                    >
                      <option value="">All Events</option>
                      {uniqueEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </select>
                   
                 </div>
               </div>

                             <div className="filter-group">
                 <label className="filter-label">
                   <FaUser className="label-icon" />
                   Student
                 </label>
                 <select
                   value={filterStudent}
                   onChange={(e) => setFilterStudent(e.target.value)}
                   className="filter-select"
                 >
                   <option value="">All Students</option>
                   {uniqueStudents.map(student => (
                     <option key={student} value={student}>{student}</option>
                   ))}
                 </select>
               </div>

              

              <div className="filter-group">
                <button 
                  className="clear-filters-btn"
                  onClick={() => {
                    setFilterEvent('');
                    setFilterStudent('');
                    setSearchTerm('');
                  }}
                >
                  <FaTimes />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Documentation Content */}
        <div className="documentation-content">
          {filteredDocumentation.length === 0 ? (
            <div className="no-data-section">
              <div className="no-data-content">
                <FaFileAlt className="no-data-icon" />
                <h3>No Documentation Found</h3>
                <p>No documentation matches your current search criteria.</p>
                {hasActiveFilters && (
                  <button 
                    className="clear-filters-btn large"
                    onClick={() => {
                      setFilterEvent('');
                      setFilterStudent('');
                      setSearchTerm('');
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="results-header">
                <h3>Student Documentation ({filteredDocumentation.length} entries)</h3>
                <div className="results-summary">
                  Showing {filteredDocumentation.length} of {allDocumentation.length} total entries
                </div>
              </div>

              {/* Documentation Display */}
              {viewMode === 'grid' ? (
                <div className="documentation-grid">
                  {filteredDocumentation.map((doc, index) => (
                    <div key={`${doc.eventId}-${doc.userId._id}-${index}`} className="documentation-card">
                      <div className="card-header">
                        <div className="student-info">
                          <div className="student-avatar">
                            <FaUser />
                          </div>
                          <div className="student-details">
                            <h4 className="student-name">{doc.userId.name}</h4>
                            <span className="student-email">{doc.userId.email}</span>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleViewDocumentation(doc)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="event-info">
                          <h5 className="event-title">{doc.eventTitle}</h5>
                          <div className="event-meta">
                            <span className="event-date">
                              <FaCalendar />
                              {new Date(doc.eventDate).toLocaleDateString()}
                            </span>
                            <span className="event-time">
                              <FaClock />
                              {doc.eventTime}
                            </span>
                            <span className="event-location">
                              <FaBuilding />
                              {doc.eventLocation}
                            </span>
                          </div>
                        </div>

                        <div className="files-info">
                          <div className="files-count">
                            <FaFileAlt />
                            <span>{doc.files.length} file(s)</span>
                          </div>
                          <div className="file-types">
                            {doc.files.map((file, fileIndex) => (
                              <Badge key={fileIndex} bg="secondary" className="file-type-badge">
                                {file.fileType}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="upload-info">
                          <span className="upload-date">
                            Uploaded: {new Date(doc.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="documentation-table-container">
                  <Table striped hover className="documentation-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Event</th>
                        <th>Files</th>
                        <th>Upload Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocumentation.map((doc, index) => (
                        <tr key={`${doc.eventId}-${doc.userId._id}-${index}`}>
                          <td>
                            <div className="student-info">
                              <FaUser className="student-icon" />
                              <span>{doc.userId.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="event-info">
                              <div className="event-title">{doc.eventTitle}</div>
                              <div className="event-details">
                                <FaCalendar className="detail-icon" />
                                {new Date(doc.eventDate).toLocaleDateString()}
                                <FaClock className="detail-icon" />
                                {doc.eventTime}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="files-info">
                              <Badge bg="info" className="file-count">
                                {doc.files.length} file(s)
                              </Badge>
                              <div className="file-types">
                                {doc.files.map((file, fileIndex) => (
                                  <Badge key={fileIndex} bg="secondary" className="file-type-badge">
                                    {file.fileType}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td>
                            {new Date(doc.lastUpdated).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleViewDocumentation(doc)}
                                className="view-btn"
                              >
                                <FaEye /> View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Documentation Modal */}
      <Modal show={showViewModal} onHide={closeViewModal} size="lg" className="documentation-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileAlt className="modal-icon" />
            Documentation Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDocumentation && (
            <div className="documentation-details">
              <div className="detail-section">
                <h5>
                  <FaUser className="section-icon" />
                  Student Information
                </h5>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedDocumentation.userName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedDocumentation.userEmail}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h5>
                  <FaCalendar className="section-icon" />
                  Event Information
                </h5>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Event:</span>
                    <span className="detail-value">{selectedDocumentation.eventTitle}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{new Date(selectedDocumentation.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{selectedDocumentation.eventTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{selectedDocumentation.eventLocation}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h5>
                  <FaFileAlt className="section-icon" />
                  Uploaded Files ({selectedDocumentation.files.length})
                </h5>
                <div className="files-list">
                  {selectedDocumentation.files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <FaFile className="file-icon" />
                        <div className="file-details">
                          <div className="file-name">{file.originalName}</div>
                          <div className="file-meta">
                            <span className="file-type">{file.fileType}</span>
                            <span className="file-size">({(file.fileSize / 1024).toFixed(2)} KB)</span>
                          </div>
                          <div className="file-description">
                            {file.description || 'No description provided'}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => handleDownload(selectedDocumentation.eventId, file.filename, file.originalName)}
                        className="download-btn"
                      >
                        <FaDownload /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="detail-section">
                <h5>
                  <FaClock className="section-icon" />
                  Upload Information
                </h5>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Upload Date:</span>
                    <span className="detail-value">{new Date(selectedDocumentation.lastUpdated).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeViewModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminViewStudentDocumentation;
