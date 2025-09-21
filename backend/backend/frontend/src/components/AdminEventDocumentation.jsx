import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { FaFile, FaDownload, FaTrash, FaSearch, FaFilter, FaEye } from 'react-icons/fa';
import { getEventDocumentation, downloadDocumentationFile, deleteDocumentationFile } from '../api/api';
import Swal from 'sweetalert2';
import './AdminEventDocumentation.css';

const AdminEventDocumentation = ({ eventId, eventTitle }) => {
  const [documentation, setDocumentation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterFileType, setFilterFileType] = useState('');

  useEffect(() => {
    fetchDocumentation();
  }, [eventId]);

  const fetchDocumentation = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getEventDocumentation(eventId);
      setDocumentation(data.documentation || []);
    } catch (err) {
      setError('Failed to fetch documentation.');
      console.error('Error fetching documentation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filename, originalName) => {
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

  const handleDelete = async (filename, originalName) => {
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
        await fetchDocumentation();
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete file.', 'error');
      }
    }
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
      doc.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.files.some(file => 
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    
    const matchesDepartment = filterDepartment === '' || 
      doc.userId.department === filterDepartment;
    
    const matchesFileType = filterFileType === '' || 
      doc.files.some(file => file.fileType.includes(filterFileType));
    
    return matchesSearch && matchesDepartment && matchesFileType;
  });

  // Get unique departments for filter
  const departments = [...new Set(documentation.map(doc => doc.userId.department))].filter(Boolean);

  // Get unique file types for filter
  const fileTypes = [...new Set(
    documentation.flatMap(doc => doc.files.map(file => {
      if (file.fileType.includes('pdf')) return 'pdf';
      if (file.fileType.includes('word') || file.fileType.includes('document')) return 'document';
      if (file.fileType.includes('image')) return 'image';
      return 'other';
    }))
  )];

  const totalFiles = documentation.reduce((total, doc) => total + doc.files.length, 0);
  const totalUsers = documentation.length;

  if (loading) {
    return (
      <div className="admin-event-documentation">
        <div className="text-center py-5">
          <Spinner animation="border" size="lg" />
          <p className="mt-3">Loading event documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-event-documentation">
      {/* Header */}
      <div className="documentation-header">
        <div className="header-content">
          <h2 className="page-title">
            <FaFile className="title-icon" />
            Event Documentation Management
          </h2>
          <p className="page-subtitle">
            Manage documentation files for "{eventTitle}"
          </p>
        </div>
        
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{totalUsers}</span>
            <span className="stat-label">Students</span>
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
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by student name, email, filename, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            
            <div className="filters-section">
              <Form.Select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="filter-select"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </Form.Select>
              
              <Form.Select
                value={filterFileType}
                onChange={(e) => setFilterFileType(e.target.value)}
                className="filter-select"
              >
                <option value="">All File Types</option>
                {fileTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'pdf' ? 'PDF Files' : 
                     type === 'document' ? 'Word Documents' : 
                     type === 'image' ? 'Image Files' : 'Other Files'}
                  </option>
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
              {searchTerm || filterDepartment || filterFileType 
                ? 'No documentation matches your filters' 
                : 'No documentation uploaded yet'}
            </h4>
            <p className="no-docs-text">
              {searchTerm || filterDepartment || filterFileType 
                ? 'Try adjusting your search terms or filters.' 
                : 'Students can upload documentation files when they register for this event.'}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="documentation-grid">
          {filteredDocumentation.map((doc, index) => (
            <Card key={index} className="documentation-card">
              <Card.Header className="card-header">
                <div className="student-info">
                  <h5 className="student-name">{doc.userId.name}</h5>
                  <div className="student-details">
                    <Badge bg="info" className="department-badge">
                      {doc.userId.department}
                    </Badge>
                    <span className="academic-info">
                      {doc.userId.academicYear} • {doc.userId.year}
                      {doc.userId.section && ` • ${doc.userId.section}`}
                    </span>
                  </div>
                </div>
                <div className="last-updated">
                  Updated: {formatDate(doc.lastUpdated)}
                </div>
              </Card.Header>
              
              <Card.Body>
                <div className="files-section">
                  <h6 className="files-title">
                    Files ({doc.files.length})
                  </h6>
                  
                  <div className="files-list">
                    {doc.files.map((file, fileIndex) => (
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
                            onClick={() => handleDownload(file.filename, file.originalName)}
                            title="Download file"
                          >
                            <FaDownload />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(file.filename, file.originalName)}
                            title="Delete file"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="refresh-section">
        <Button
          variant="outline-secondary"
          onClick={fetchDocumentation}
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

export default AdminEventDocumentation;
