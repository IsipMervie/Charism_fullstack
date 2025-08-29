import React, { useEffect, useState } from 'react';
import { getEventDetails, updateEvent } from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaSave, FaTimes, FaImage } from 'react-icons/fa';
import { formatTimeRange12Hour } from '../utils/timeUtils';
import { getEventImageUrl } from '../utils/imageUtils';
import './EditEventPage.css';

function EditEventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    hours: '',
    image: null,
    requiresApproval: true,
    isPublicRegistrationEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const data = await getEventDetails(eventId);
        setEvent(data);
        setForm({
          title: data.title || '',
          description: data.description || '',
          date: data.date ? data.date.slice(0, 10) : '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          location: data.location || '',
          maxParticipants: data.maxParticipants || '',
          hours: data.hours || '',
          image: null,
          requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : true,
          isPublicRegistrationEnabled: data.isPublicRegistrationEnabled || false
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch event details.');
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.maxParticipants) <= 0) {
      Swal.fire({ icon: 'error', title: 'Invalid Slots', text: 'Available slots must be greater than 0.' });
      return;
    }
    if (Number(form.hours) <= 0) {
      Swal.fire({ icon: 'error', title: 'Invalid Hours', text: 'Event hours must be greater than 0.' });
      return;
    }
    
    // Validate time
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      Swal.fire({ icon: 'error', title: 'Invalid Time', text: 'End time must be after start time.' });
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('date', form.date);
      formData.append('startTime', form.startTime);
      formData.append('endTime', form.endTime);
      formData.append('location', form.location);
      formData.append('maxParticipants', form.maxParticipants);
      formData.append('hours', form.hours);
      formData.append('requiresApproval', form.requiresApproval);
      formData.append('isPublicRegistrationEnabled', form.isPublicRegistrationEnabled);
      if (form.image) formData.append('image', form.image);

      await updateEvent(eventId, formData);
      Swal.fire({ icon: 'success', title: 'Event Updated!', text: 'The event has been successfully updated.' });
      navigate('/admin/manage-events');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err?.response?.data?.message || 'Failed to update event. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: 'Discard Changes?',
      text: 'Are you sure you want to discard your changes?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Discard',
      cancelButtonText: 'Keep Editing',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) navigate('/admin/manage-events');
    });
  };



  if (loading) {
    return (
      <div className="edit-event-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h3>Loading Event...</h3>
          <p>Please wait while we fetch the event details</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-event-container">
        <div className="error-section">
          <h3>Error Loading Event</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-event-container">
      <div className="edit-event-content">
        <div className="edit-event-header">
          <h2>Edit Event</h2>
          <p>Update the event information below</p>
        </div>

        <form onSubmit={handleSubmit} className="edit-event-form">
          <div className="form-group">
            <label htmlFor="title"><FaCalendar /> Event Title</label>
            <input type="text" id="title" name="title" value={form.title} onChange={handleChange} required placeholder="Enter event title" />
          </div>

          <div className="form-group">
            <label htmlFor="description"><FaMapMarkerAlt /> Description</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} required placeholder="Enter event description" rows="4" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date"><FaCalendar /> Date</label>
              <input type="date" id="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime"><FaClock /> Start Time</label>
              <input type="time" id="startTime" name="startTime" value={form.startTime} onChange={handleChange} required step="900" />
              <div className="form-text">Select the start time (12-hour format)</div>
            </div>

            <div className="form-group">
              <label htmlFor="endTime"><FaClock /> End Time</label>
              <input type="time" id="endTime" name="endTime" value={form.endTime} onChange={handleChange} required step="900" />
              <div className="form-text">Select the end time (12-hour format)</div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location"><FaMapMarkerAlt /> Location</label>
            <input type="text" id="location" name="location" value={form.location} onChange={handleChange} required placeholder="Enter event location" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxParticipants"><FaUsers /> Available Slots</label>
              <input type="number" id="maxParticipants" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} required min="1" placeholder="Enter number of slots" />
              <div className="form-text">Maximum number of approved participants. Pending registrations don't count toward this limit.</div>
            </div>

            <div className="form-group">
              <label htmlFor="hours"><FaClock /> Event Hours</label>
              <input type="number" id="hours" name="hours" value={form.hours} onChange={handleChange} required min="1" step="0.5" placeholder="Enter service hours" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image"><FaImage /> Event Image (optional)</label>
            <input type="file" id="image" name="image" onChange={handleImageChange} accept="image/*" />
            <div className="form-text">Recommended aspect ratio 16:9 (e.g., 1280x720). Supported formats: JPG, PNG.</div>
            {event?.image && !form.image && (
              <div className="current-image image-preview">
                <p>Current Image:</p>
                <div className="image-frame">
                  <img src={getEventImageUrl(event.image)} alt="Current event" />
                </div>
              </div>
            )}
            {form.image && (
              <div className="new-image image-preview">
                <p>New Image Selected:</p>
                <div className="image-frame">
                  <img src={URL.createObjectURL(form.image)} alt="New event" />
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setForm(prev => ({ ...prev, requiresApproval: e.target.checked }))}
              />
              Require staff/admin approval for student registrations
            </label>
            <div className="form-text">If checked, students must wait for approval before they can time in/out</div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isPublicRegistrationEnabled}
                onChange={(e) => setForm(prev => ({ ...prev, isPublicRegistrationEnabled: e.target.checked }))}
              />
              Enable public registration for this event
            </label>
            <div className="form-text">If enabled, anyone with the registration link can view and register for this event</div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Saving...' : (<><FaSave /> Save Changes</>)}
            </button>
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEventPage;
