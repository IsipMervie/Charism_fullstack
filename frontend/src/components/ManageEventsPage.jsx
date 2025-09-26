import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaEye, FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '../api/api';
import Swal from 'sweetalert2';
import './ManageEventsPage.css';

const ManageEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    requiresApproval: false,
    departments: [],
    isVisibleToStudents: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getAllEvents();
      setEvents(response.events || response);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
      Swal.fire('Error', 'Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    }

    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }

    if (!formData.maxParticipants || formData.maxParticipants < 1) {
      errors.maxParticipants = 'Max participants must be at least 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire('Validation Error', 'Please fix the errors in the form', 'warning');
      return;
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent._id, formData);
        Swal.fire('Success!', 'Event updated successfully', 'success');
      } else {
        await createEvent(formData);
        Swal.fire('Success!', 'Event created successfully', 'success');
      }
      
      setShowModal(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        maxParticipants: '',
        requiresApproval: false,
        departments: [],
        isVisibleToStudents: true
      });
      setFormErrors({});
      await fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      Swal.fire('Error', 'Failed to save event', 'error');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      date: event.date ? event.date.split('T')[0] : '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      maxParticipants: event.maxParticipants || '',
      requiresApproval: event.requiresApproval || false,
      departments: event.departments || [],
      isVisibleToStudents: event.isVisibleToStudents !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (eventId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteEvent(eventId);
          Swal.fire('Deleted!', 'The event has been deleted.', 'success');
          await fetchEvents();
        } catch (err) {
          console.error('Error deleting event:', err);
          Swal.fire('Error', 'Failed to delete event', 'error');
        }
      }
    });
  };

  const handleView = (event) => {
    Swal.fire({
      title: event.title,
      html: `
        <p><strong>Description:</strong> ${event.description}</p>
        <p><strong>Date:</strong> ${event.date}</p>
        <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Max Participants:</strong> ${event.maxParticipants}</p>
        <p><strong>Requires Approval:</strong> ${event.requiresApproval ? 'Yes' : 'No'}</p>
        <p><strong>Status:</strong> ${event.status}</p>
      `,
      showConfirmButton: false,
      showCloseButton: true
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="manage-events-page">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="manage-events-page">
      <div className="page-header">
        <h1>Manage Events</h1>
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
          className="add-event-btn"
        >
          <FaPlus /> Add New Event
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <Card className="events-table-card">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(event => (
                <tr key={event._id}>
                  <td>
                    <div className="event-title">
                      <strong>{event.title}</strong>
                      <small className="text-muted d-block">{event.description.substring(0, 50)}...</small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div>{new Date(event.date).toLocaleDateString()}</div>
                      <small className="text-muted">{event.startTime} - {event.endTime}</small>
                    </div>
                  </td>
                  <td>{event.location}</td>
                  <td>
                    <Badge variant="info">
                      {event.attendance || 0}/{event.maxParticipants}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={
                      event.status === 'active' ? 'success' :
                      event.status === 'completed' ? 'secondary' :
                      event.status === 'cancelled' ? 'danger' : 'warning'
                    }>
                      {event.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleView(event)}
                        title="View Details"
                      >
                        <FaEye />
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleEdit(event)}
                        title="Edit Event"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(event._id)}
                        title="Delete Event"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {filteredEvents.length === 0 && (
            <div className="no-events">
              <p>No events found matching your criteria.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Event Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingEvent ? 'Edit Event' : 'Create New Event'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Event Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                isInvalid={!!formErrors.title}
                placeholder="Enter event title"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.title}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                isInvalid={!!formErrors.description}
                placeholder="Enter event description"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.date}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Start Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.startTime}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.startTime}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>End Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.endTime}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.endTime}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-8">
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.location}
                    placeholder="Enter event location"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.location}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Max Participants *</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.maxParticipants}
                    min="1"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.maxParticipants}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="requiresApproval"
                    label="Requires Approval"
                    checked={formData.requiresApproval}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isVisibleToStudents"
                    label="Visible to Students"
                    checked={formData.isVisibleToStudents}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ManageEventsPage;
