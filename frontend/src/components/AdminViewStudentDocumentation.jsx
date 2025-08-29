import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Form, InputGroup, Modal, Table, Row, Col } from 'react-bootstrap';
import { FaFile, FaDownload, FaSearch, FaFilter, FaEye, FaUser, FaCalendar, FaClock, FaFileAlt, FaUsers, FaCheckCircle, FaExclamationTriangle, FaTimes, FaGraduationCap, FaBuilding, FaIdCard, FaSpinner, FaList } from 'react-icons/fa';
import { getEvents, downloadDocumentationFile } from '../api/api';
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
      
      // Fetch all events
      const eventsData = await getEvents();
      console.log('📅 Events fetched:', eventsData.length);
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
                // Only include students who have approved registrations
                if (att.registrationApproved && att.documentation && att.documentation.files && att.documentation.files.length > 0) {
                  console.log(`🔍 Direct extraction: Found ${att.documentation.files.length} files for user ${att.userId?.name || att.userId}`);
                  documentationData.push({
                    userId: att.userId,
                    files: att.documentation.files,
                    lastUpdated: att.documentation.lastUpdated,
                    eventId: event._id,
                    eventTitle: event.title,
                    eventDate: event.date,
                    eventTime: event.time,
                    eventLocation: event.location
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
       doc.userId.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       doc.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase());
     
     const matchesEvent = !filterEvent || doc.eventTitle === filterEvent;
     const matchesStudent = !filterStudent || doc.userId.name === filterStudent;
     
     // Additional check: ensure student has actually joined the event
     const studentHasJoinedEvent = events.some(event => 
       event._id === doc.eventId && 
       event.attendance?.some(att => 
         (att.userId._id === doc.userId._id || att.userId === doc.userId._id) && 
         att.registrationApproved
       )
     );
     
           return matchesSearch && matchesEvent && matchesStudent && studentHasJoinedEvent;
    });

    // Get unique events for filter dropdown
    const uniqueEvents = [...new Set(events.map(event => event.title))];
    
         // Get unique students for filter dropdown (only those who have joined the selected event)
     const uniqueStudents = filterEvent 
       ? [...new Set(
           events
             .find(event => event.title === filterEvent)
             ?.attendance
               ?.filter(att => att.registrationApproved) // Only approved registrations
               ?.map(att => att.userId?.name)
               ?.filter(Boolean) || []
         )]
       : [];

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
            <FaSpinner className="loading-spinner" />
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
                   disabled={!filterEvent}
                 >
                   <option value="">
                     {filterEvent ? 'All Students in Event' : 'Select an event first'}
                   </option>
                   {filterEvent && uniqueStudents.map(student => (
                     <option key={student} value={student}>{student}</option>
                   ))}
                 </select>
                 {!filterEvent && (
                   <small className="filter-hint">
                     Please select an event first to see available students
                   </small>
                 )}
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
                    <span className="detail-value">{selectedDocumentation.userId.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedDocumentation.userId.email}</span>
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
