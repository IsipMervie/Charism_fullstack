import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Form, InputGroup, Modal } from 'react-bootstrap';
import { FaFile, FaUpload, FaDownload, FaTrash, FaSearch, FaFilter, FaPlus, FaEye } from 'react-icons/fa';
import { getEvents, getEventDocumentation, downloadDocumentationFile, deleteDocumentationFile, uploadEventDocumentation } from '../api/api';
import Swal from 'sweetalert2';
import './StudentDocumentationPage.css';

const StudentDocumentationPage = () => {
  const [events, setEvents] = useState([]);
  const [documentation, setDocumentation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [description, setDescription] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user._id;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch events where student is registered
      const eventsData = await getEvents();
      const userEvents = eventsData.filter(event => 
        event.attendance && 
        event.attendance.some(att => 
          (att.userId._id === userId || att.userId === userId) && 
          att.registrationApproved
        )
      );
      setEvents(userEvents);

      // Fetch documentation for all user events
      const allDocumentation = [];
      for (const event of userEvents) {
        try {
          const docData = await getEventDocumentation(event._id);
          if (docData.documentation && docData.documentation.length > 0) {
            // Filter to only show current user's documentation
            const userDocs = docData.documentation.filter(doc => 
              doc.userId._id === userId || doc.userId === userId
            );
            if (userDocs.length > 0) {
              allDocumentation.push({
                eventId: event._id,
                eventTitle: event.title,
                eventDate: event.date,
                documentation: userDocs
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching documentation for event ${event._id}:`, err);
        }
      }
      
      setDocumentation(allDocumentation);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      Swal.fire('No Files Selected', 'Please select at least one file to upload.', 'warning');
      return;
    }

    try {
      setUploading(true);
      
      await uploadEventDocumentation(selectedEvent._id, selectedFiles, description);
      
      Swal.fire({
        icon: 'success',
        title: 'Upload Successful!',
        text: `${selectedFiles.length} file(s) uploaded successfully.`
      });
      
      // Reset form and close modal
      setSelectedFiles([]);
      setDescription('');
      setShowUploadModal(false);
      setSelectedEvent(null);
      
      // Refresh data
      await fetchData();
      
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err.message || 'Failed to upload files. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid File Type',
          text: `${file.name} is not a supported file type. Please upload PDF, DOC, DOCX, or image files only.`
        });
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        Swal.fire({
          icon: 'warning',
          title: 'File Too Large',
          text: `${file.name} is too large. Maximum file size is 10MB.`
        });
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(validFiles);
  };

  const handleDownload = async (eventId, filename, originalName) => {
    try {
      await downloadDocumentationFile(eventId, filename, originalName);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Failed to download file. Please try again.'
      });
    }
  };

  const handleDelete = async (eventId, filename, originalName) => {
    const result = await Swal.fire({
      title: 'Delete File?',
      text: `Are you sure you want to delete "${originalName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (result.isConfirmed) {
      try {
        await deleteDocumentationFile(eventId, filename);
        Swal.fire('Deleted!', 'File has been deleted.', 'success');
        await fetchData();
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete file.', 'error');
      }
    }
  };

  const openUploadModal = (event) => {
    setSelectedEvent(event);
    setShowUploadModal(true);
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  const getFileTypeBadge = (fileType) => {
    if (fileType.includes('pdf')) return <Badge bg="danger">PDF</Badge>;
    if (fileType.includes('word') || fileType.includes('document')) return <Badge bg="primary">DOC</Badge>;
    if (fileType.includes('image')) return <Badge bg="success">IMAGE</Badge>;
    return <Badge bg="secondary">FILE</Badge>;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter documentation based on search and filters
  const filteredDocumentation = documentation.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentation.some(userDoc => 
        userDoc.files.some(file => 
          file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    
    const matchesEvent = filterEvent === '' || doc.eventId === filterEvent;
    
    return matchesSearch && matchesEvent;
  });



  const totalFiles = documentation.reduce((total, doc) => 
    total + doc.documentation.reduce((eventTotal, userDoc) => 
      eventTotal + userDoc.files.length, 0
    ), 0
  );

  if (loading) {
    return (
      <div className="student-documentation-page">
        <div className="text-center py-5">
          <Spinner animation="border" size="lg" />
          <p className="mt-3">Loading your documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-documentation-page">
      {/* Header */}
      <div className="documentation-header">
        <div className="header-content">
          <h2 className="page-title">
            <FaFile className="title-icon" />
            My Event's Documentation
          </h2>
          <p className="page-subtitle">
            Manage all your uploaded documentation files across events
          </p>
        </div>
        
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{events.length}</span>
            <span className="stat-label">Events</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{totalFiles}</span>
            <span className="stat-label">Files</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="search-filters-card">
        <Card.Body>
          <div className="search-filters-row">
            <div className="search-section">
              <div className="search-box">
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by event name, filename, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="filters-section">
              <Form.Select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="filter-select"
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>{event.title}</option>
                ))}
              </Form.Select>
              

            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="danger" className="error-alert">
          {error}
        </Alert>
      )}

      {/* Documentation List */}
      {filteredDocumentation.length === 0 ? (
        <Card className="no-documentation-card">
          <Card.Body className="text-center py-5">
            <FaFile className="no-docs-icon" />
            <h4 className="no-docs-title">
                          {searchTerm || filterEvent 
              ? 'No documentation matches your filters' 
              : 'No documentation uploaded yet'}
            </h4>
            <p className="no-docs-text">
              {searchTerm || filterEvent 
                ? 'Try adjusting your search terms or filters.' 
                : 'Start by uploading documentation for your registered events.'}
            </p>
            {!searchTerm && !filterEvent && (
              <Button
                variant="primary"
                onClick={() => setShowUploadModal(true)}
                className="mt-3"
              >
                <FaUpload className="me-2" />
                Upload Your First File
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <div className="documentation-grid">
          {filteredDocumentation.map((doc, index) => (
            <Card key={index} className="documentation-card">
              <Card.Header className="card-header">
                <div className="event-info">
                  <h5 className="event-name">{doc.eventTitle}</h5>
                  <div className="event-details">
                    <span className="event-date">
                      {new Date(doc.eventDate).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => openUploadModal({ _id: doc.eventId, title: doc.eventTitle })}
                      className="upload-more-btn"
                    >
                      <FaPlus className="me-1" />
                      Upload More
                    </Button>
                  </div>
                </div>
              </Card.Header>
              
              <Card.Body>
                <div className="files-section">
                  <h6 className="files-title">
                    Your Files ({doc.documentation.reduce((total, userDoc) => total + userDoc.files.length, 0)})
                  </h6>
                  
                  <div className="files-list">
                    {doc.documentation.flatMap(userDoc => 
                      userDoc.files.map((file, fileIndex) => (
                        <div key={fileIndex} className="file-item">
                          <div className="file-info">
                            <span className="file-icon">{getFileIcon(file.fileType)}</span>
                            <div className="file-details">
                              <div className="file-header">
                                <span className="file-name">{file.originalName}</span>
                                {getFileTypeBadge(file.fileType)}
                              </div>
                              <div className="file-meta">
                                <span className="file-size">{formatFileSize(file.fileSize)}</span>
                                <span className="file-date">{formatDate(file.uploadDate)}</span>
                              </div>
                              {file.description && (
                                <p className="file-description">{file.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="file-actions">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleDownload(doc.eventId, file.filename, file.originalName)}
                              title="Download file"
                            >
                              <FaDownload />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(doc.eventId, file.filename, file.originalName)}
                              title="Delete file"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUpload className="me-2" />
            Upload Documentation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent ? (
            <div className="upload-form">
              <div className="event-selection mb-3">
                <strong>Event:</strong> {selectedEvent.title}
              </div>
              
              <Form onSubmit={handleUpload}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Files</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <Form.Text className="text-muted">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF (Max 5 files, 10MB each)
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows="3"
                    placeholder="Describe what these files contain..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={uploading}
                  />
                </Form.Group>
                
                {selectedFiles.length > 0 && (
                  <div className="selected-files mb-3">
                    <h6>Selected Files ({selectedFiles.length}):</h6>
                    <div className="file-list">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <FaFile className="file-icon" />
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">({formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="modal-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={uploading || selectedFiles.length === 0}
                    className="upload-button"
                  >
                    {uploading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaUpload className="me-2" />
                        Upload Files
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </div>
          ) : (
            <div className="event-selection-form">
              <h6>Select an Event to Upload Documentation</h6>
              <div className="events-list">
                {events.map(event => (
                  <Button
                    key={event._id}
                    variant="outline-primary"
                    className="event-option-btn"
                    onClick={() => setSelectedEvent(event)}
                  >
                    {event.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Refresh Button */}
      <div className="refresh-section">
        <Button
          variant="outline-secondary"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Refreshing...
            </>
          ) : (
            <>
              <FaEye className="me-2" />
              Refresh Documentation
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StudentDocumentationPage;
