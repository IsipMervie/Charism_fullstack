// frontend/src/components/CreateEventPage.jsx
// Modern Redesigned Create Event Page with Responsive Design

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Spinner, Row, Col, Card, Alert } from 'react-bootstrap';
import { createEvent, getPublicSettings } from '../api/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './CreateEventPage.css';

function CreateEventPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [hours, setHours] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isForAllDepartments, setIsForAllDepartments] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [isPublicRegistrationEnabled, setIsPublicRegistrationEnabled] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const settings = await getPublicSettings();
      if (settings.departments) {
        setDepartments(settings.departments.filter(d => d.isActive).map(d => d.name));
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!title.trim()) {
      Swal.fire({ icon: 'error', title: 'Missing Title', text: 'Please enter an event title.' });
      return;
    }
    
    if (!description.trim()) {
      Swal.fire({ icon: 'error', title: 'Missing Description', text: 'Please enter an event description.' });
      return;
    }
    
    if (!date) {
      Swal.fire({ icon: 'error', title: 'Missing Date', text: 'Please select an event date.' });
      return;
    }
    
    if (!location.trim()) {
      Swal.fire({ icon: 'error', title: 'Missing Location', text: 'Please enter an event location.' });
      return;
    }
    
    if (Number(maxParticipants) <= 0) {
      Swal.fire({ icon: 'error', title: 'Invalid Slots', text: 'Available slots must be greater than 0.' });
      return;
    }
    
    if (Number(hours) <= 0) {
      Swal.fire({ icon: 'error', title: 'Invalid Hours', text: 'Event hours must be greater than 0.' });
      return;
    }
    
    // Validate time
    if (startTime && endTime && startTime >= endTime) {
      Swal.fire({ icon: 'error', title: 'Invalid Time', text: 'End time must be after start time.' });
      return;
    }
    
    // Validate department selection
    if (!isForAllDepartments && selectedDepartments.length === 0) {
      Swal.fire({ icon: 'error', title: 'Department Required', text: 'Please select at least one department or mark the event as available for all departments.' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('date', date);
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
      formData.append('location', location.trim());
      formData.append('maxParticipants', maxParticipants);
      formData.append('hours', hours);
      formData.append('isForAllDepartments', isForAllDepartments);
      formData.append('requiresApproval', requiresApproval);
      formData.append('isPublicRegistrationEnabled', isPublicRegistrationEnabled);
      
      if (image) formData.append('image', image);
      
      // Handle department selection
      if (isForAllDepartments) {
        formData.append('departments', JSON.stringify([])); // Empty array for all departments
      } else {
        formData.append('departments', JSON.stringify(selectedDepartments));
      }

      await createEvent(formData);
      setLoading(false);
      Swal.fire({ 
        icon: 'success', 
        title: '🎉 Event Created Successfully!', 
        text: 'Your event has been created and is now available for registration.',
        confirmButtonText: 'View Events'
      }).then(() => {
        navigate('/admin/manage-events');
      });
    } catch (err) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err.response?.data?.message || 'Failed to create event. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDepartmentToggle = (dept) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  return (
    <Container className={`create-event-page ${isVisible ? 'fade-in' : ''}`}>
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary mb-3">Create New Event</h1>
        <p className="lead text-muted">Design an engaging event for the CHARISM community</p>
      </div>

      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              <Form onSubmit={handleSubmit} className="needs-validation" noValidate>
                <Row>
                  {/* Event Title */}
                  <Col md={12} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Event Title *</Form.Label>
                      <Form.Control
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a compelling event title"
                        className="form-control-lg"
                        required
                      />
                    </Form.Group>
                  </Col>

                  {/* Description */}
                  <Col md={12} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Event Description *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what participants can expect from this event"
                        className="form-control-lg"
                        required
                      />
                    </Form.Group>
                  </Col>

                  {/* Date and Location */}
                  <Col md={6} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Event Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="form-control-lg"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Location *</Form.Label>
                      <Form.Control
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Event venue or location"
                        className="form-control-lg"
                        required
                      />
                    </Form.Group>
                  </Col>

                  {/* Time */}
                  <Col md={6} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">End Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>

                  {/* Capacity and Hours */}
                  <Col md={6} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Available Slots *</Form.Label>
                      <Form.Control
                        type="number"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        placeholder="Maximum participants"
                        className="form-control-lg"
                        min="1"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Event Hours *</Form.Label>
                      <Form.Control
                        type="number"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="Hours for community service"
                        className="form-control-lg"
                        min="0.5"
                        step="0.5"
                        required
                      />
                    </Form.Group>
                  </Col>

                  {/* Department Selection */}
                  <Col md={12} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Department Access</Form.Label>
                      <div className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="allDepartments"
                          label="Available for all departments"
                          checked={isForAllDepartments}
                          onChange={(e) => {
                            setIsForAllDepartments(e.target.checked);
                            if (e.target.checked) {
                              setSelectedDepartments([]);
                            }
                          }}
                          className="mb-2"
                        />
                      </div>
                      
                      {!isForAllDepartments && departments.length > 0 && (
                        <div className="department-tags">
                          {departments.map((dept) => (
                            <Button
                              key={dept}
                              variant={selectedDepartments.includes(dept) ? 'primary' : 'outline-primary'}
                              size="sm"
                              className="me-2 mb-2"
                              onClick={() => handleDepartmentToggle(dept)}
                              type="button"
                            >
                              {dept}
                            </Button>
                          ))}
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  {/* Event Settings */}
                  <Col md={12} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Event Settings</Form.Label>
                      <div className="d-flex flex-column gap-3">
                        <Form.Check
                          type="checkbox"
                          id="requiresApproval"
                          label="Require admin approval for registrations"
                          checked={requiresApproval}
                          onChange={(e) => setRequiresApproval(e.target.checked)}
                        />
                        <Form.Check
                          type="checkbox"
                          id="publicRegistration"
                          label="Enable public registration (no login required)"
                          checked={isPublicRegistrationEnabled}
                          onChange={(e) => setIsPublicRegistrationEnabled(e.target.checked)}
                        />
                      </div>
                    </Form.Group>
                  </Col>

                  {/* Image Upload */}
                  <Col md={12} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">Event Image (Optional)</Form.Label>
                      <Form.Control
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="form-control-lg"
                      />
                      {imagePreview && (
                        <div className="mt-3 text-center">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="img-thumbnail" 
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                {/* Submit Button */}
                <div className="text-center mt-5">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    className="px-5 py-3 fw-bold"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creating Event...
                      </>
                    ) : (
                      '🎉 Create Event'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CreateEventPage;