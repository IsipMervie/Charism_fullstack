import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaUpload, FaFile, FaTrash, FaDownload, FaEye } from 'react-icons/fa';
import { uploadEventDocumentation, getEventDocumentation, downloadDocumentationFile, deleteDocumentationFile } from '../api/api';
import Swal from 'sweetalert2';
import './EventDocumentationUpload.css';

const EventDocumentationUpload = ({ eventId, eventTitle }) => {
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documentation, setDocumentation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocumentation();
  }, [eventId]);

  const fetchDocumentation = async () => {
    try {
      setLoading(true);
      const data = await getEventDocumentation(eventId);
      setDocumentation(data.documentation || []);
    } catch (err) {
      setError('Failed to fetch documentation.');
      console.error('Error fetching documentation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
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
    
    const validFiles = selectedFiles.filter(file => {
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
    
    setFiles(validFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      await uploadEventDocumentation(eventId, files, description);
      
      Swal.fire({
        icon: 'success',
        title: 'Upload Successful!',
        text: `${files.length} file(s) uploaded successfully.`
      });
      
      // Reset form
      setFiles([]);
      setDescription('');
      
      // Refresh documentation list
      await fetchDocumentation();
      
    } catch (err) {
      setError(err.message || 'Failed to upload files.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
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

  const handleDelete = async (filename) => {
    const result = await Swal.fire({
      title: 'Delete File?',
      text: 'Are you sure you want to delete this file? This action cannot be undone.',
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

  return (
    <div className="event-documentation-upload">
      <div className="upload-section">
        <h4 className="section-title">
          <FaUpload className="section-icon" />
          Upload Event Documentation
        </h4>
        <p className="section-description">
          Upload documentation files (PDF, DOC, DOCX, images) for the event "{eventTitle}".
          Maximum 5 files, 10MB each.
        </p>
        
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
          
          {files.length > 0 && (
            <div className="selected-files mb-3">
              <h6>Selected Files ({files.length}):</h6>
              <div className="file-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <FaFile className="file-icon" />
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({formatFileSize(file.size)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Button
            type="submit"
            variant="primary"
            disabled={uploading || files.length === 0}
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
        </Form>
      </div>
      
      <div className="documentation-section">
        <h4 className="section-title">
          <FaFile className="section-icon" />
          Uploaded Documentation
        </h4>
        
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading documentation...</p>
          </div>
        ) : documentation.length === 0 ? (
          <div className="no-documentation">
            <p>No documentation uploaded yet.</p>
          </div>
        ) : (
          <div className="documentation-list">
            {documentation.map((doc, index) => (
              <div key={index} className="documentation-item">
                <div className="user-info">
                  <strong>{doc.userId.name}</strong>
                  <span className="user-details">
                    {doc.userId.department} • {doc.userId.academicYear} • {doc.userId.year}
                  </span>
                </div>
                
                <div className="files-list">
                  {doc.files.map((file, fileIndex) => (
                    <div key={fileIndex} className="file-item">
                      <div className="file-info">
                        <span className="file-icon">{getFileIcon(file.fileType)}</span>
                        <div className="file-details">
                          <span className="file-name">{file.originalName}</span>
                          <span className="file-meta">
                            {formatFileSize(file.fileSize)} • {formatDate(file.uploadDate)}
                          </span>
                          {file.description && (
                            <span className="file-description">{file.description}</span>
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
                          onClick={() => handleDelete(file.filename)}
                          title="Delete file"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="last-updated">
                  Last updated: {formatDate(doc.lastUpdated)}
                </div>
              </div>
            ))}
         
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDocumentationUpload;
