// frontend/src/components/ManageUsersPage.jsx
// Fresh Simple but Creative Manage Users Page Design

import React, { useEffect, useState } from 'react';
import { Container, Button, Form, Spinner, Alert, Modal, Row, Col, Card, Badge } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { FaUsers, FaEdit, FaTrash, FaFilter, FaSort, FaUser, FaEnvelope, FaIdCard, FaBuilding, FaGraduationCap, FaCalendar, FaBell, FaEye, FaCrown, FaUserTie, FaUserGraduate, FaImage, FaTimes } from 'react-icons/fa';
import {
  getUsers, updateUser, deleteUser
} from '../api/api';
import './ManageUsersPage.css';

function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Client-side sorting & pagination
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const data = await getUsers(params);
      setUsers(data);
    } catch (err) {
      setError('Error fetching users. Please try again later.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  // Search handler
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // Filter handlers
  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearch('');
    setRoleFilter('');
    setPage(1);
  };

  // Search on enter or button
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // View user profile
  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  // Edit user
  const handleEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      userId: user.userId,
      role: user.role,
      academicYear: user.academicYear || '',
      year: user.year || '',
      section: user.section || '',
      department: user.department || '',
      approvalStatus: user.approvalStatus || 'pending'
    });
    setShowEditModal(true);
  };

  // Handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save edit changes
  const handleEditSave = async () => {
    try {
      await updateUser(editUser._id, editForm);
      Swal.fire({
        icon: 'success',
        title: 'User Updated!',
        text: 'User information has been updated successfully.',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Great!'
      });
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Failed to update user. Please try again.',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    }
  };

  // Delete user
  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(userId);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'User has been deleted successfully.',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!'
        });
        fetchUsers();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err.message || 'Failed to delete user. Please try again.',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <FaCrown className="role-icon admin" />;
      case 'Staff':
        return <FaUserTie className="role-icon staff" />;
      case 'Student':
        return <FaUserGraduate className="role-icon student" />;
      default:
        return <FaUser className="role-icon" />;
    }
  };

  // Get profile picture URL
  const getProfilePictureUrl = (user) => {
    if (user.profilePicture) {
              return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/profile-pictures/${user.profilePicture}`;
    }
    return null;
  };

  // Get profile picture fallback
  const getProfilePictureFallback = (user) => {
    if (user.profilePicture) {
      return (
        <img 
          src={getProfilePictureUrl(user)} 
          alt={`${user.name}'s profile`}
          className="profile-picture"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    return (
      <div className="profile-picture-fallback">
        {getRoleIcon(user.role)}
      </div>
    );
  };

  // Sort and paginate users
  const sortedUsers = [...users].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    
    if (sortBy === 'name' || sortBy === 'email') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortDir === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const currentPage = page;
  const startIndex = (page - 1) * pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <div className="manage-users-page">
        <div className="loading-section">
          <div className="loading-spinner">
            <Spinner animation="border" role="status" className="spinner" />
            <p>Please wait while we fetch the user data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-users-page">
        <div className="error-section">
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <Button className="retry-button" onClick={() => fetchUsers()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-users-page">
      <div className="manage-users-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`manage-users-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">👥</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">User Management</h1>
              <p className="header-subtitle">Manage and organize user accounts in your community</p>
            </div>
          </div>
          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-number">{users.length}</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{users.filter(u => u.role === 'Student').length}</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{users.filter(u => u.role === 'Staff').length}</span>
              <span className="stat-label">Staff</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{users.filter(u => u.role === 'Admin').length}</span>
              <span className="stat-label">Admins</span>
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="search-filters-section">
          <Form onSubmit={handleSearchSubmit} className="search-filters-form">
            <div className="search-box">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={handleSearch}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filters-box">
              <Form.Select 
                value={roleFilter} 
                onChange={handleRoleFilter} 
                className="filter-select"
                aria-label="Filter users by role"
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Student">Student</option>
              </Form.Select>
            </div>
          </Form>
        </div>

        {/* Toolbar Section */}
        <div className="toolbar-section">
          <div className="toolbar-info">
            <span className="user-count">{users.length} users found</span>
          </div>
          <div className="toolbar-controls">
            <Form.Select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)} 
              className="sort-select"
              aria-label="Sort users by field"
            >
              <option value="name">Sort by: Name</option>
              <option value="email">Sort by: Email</option>
              <option value="role">Sort by: Role</option>
            </Form.Select>
            <Form.Select 
              value={sortDir} 
              onChange={(e) => setSortDir(e.target.value)} 
              className="sort-direction"
              aria-label="Sort direction"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Form.Select>
            <Form.Select 
              value={pageSize} 
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} 
              className="page-size"
              aria-label="Users per page"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </Form.Select>
          </div>
        </div>

        {/* Users Grid */}
        <div className="users-section">
          {paginatedUsers.length === 0 ? (
            <div className="no-users">
              <div className="no-users-icon">👥</div>
              <h3>No Users Found</h3>
              <p>{search || roleFilter ? 'Try adjusting your search or filter criteria' : 'No users have been added yet.'}</p>
            </div>
          ) : (
            <div className="users-grid">
              {paginatedUsers.map(user => (
                <div key={user._id} className="user-card">
                  {/* User Card Header with Enhanced Design */}
                  <div className="user-card-header">
                    <div className="user-profile-section">
                      <div className="user-profile-picture">
                        {getProfilePictureFallback(user)}
                        {user.profilePicture && (
                          <div className="profile-picture-fallback" style={{ display: 'none' }}>
                            {getRoleIcon(user.role)}
                          </div>
                        )}
                      </div>
                      <div className="user-info">
                        <h3 className="user-name">{user.name}</h3>
                        <p className="user-email">{user.email}</p>
                        <div className="user-meta">
                          <span className="user-id-badge">
                            <FaIdCard className="meta-icon" />
                            {user.userId || 'No ID'}
                          </span>
                          <span className="member-since">
                            <FaCalendar className="meta-icon" />
                            Member since {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="user-role-section">
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                      {user.role === 'Staff' && (
                        <span className={`approval-status-badge ${user.approvalStatus}`}>
                          {user.approvalStatus === 'approved' ? '✓ Approved' : 
                           user.approvalStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User Card Content with Better Layout */}
                  <div className="user-card-content">
                    <div className="user-details-grid">
                      <div className="detail-item">
                        <FaBuilding className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Department</span>
                          <span className="detail-value">{user.department || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaGraduationCap className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Section</span>
                          <span className="detail-value">{user.section || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaCalendar className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Year Level</span>
                          <span className="detail-value">{user.year || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaCalendar className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Academic Year</span>
                          <span className="detail-value">{user.academicYear || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="user-card-actions">
                    <Button className="action-button view-button" onClick={() => handleViewProfile(user)}>
                      View Profile
                    </Button>
                    <Button className="action-button edit-button" onClick={() => handleEdit(user)}>
                      Edit User
                    </Button>
                    <Button className="action-button delete-button" onClick={() => handleDelete(user._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && paginatedUsers.length > 0 && (
          <div className="pagination-section">
            <div className="pagination-info">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            <div className="pagination-controls">
              <Button className="pagination-button" disabled={currentPage === 1} onClick={() => setPage(1)}>
                {'<<'}
              </Button>
              <Button className="pagination-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                {'<'}
              </Button>
              <Button className="pagination-button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                {'>'}
              </Button>
              <Button className="pagination-button" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>
                {'>>'}
              </Button>
            </div>
          </div>
        )}

        {/* User Profile Modal */}
        <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} className="profile-modal" size="lg">
          <Modal.Header closeButton>
            <Modal.Title>User Profile</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser && (
              <div className="profile-content">
                <div className="profile-header">
                  <div className="profile-picture-large">
                    {getProfilePictureFallback(selectedUser)}
                    {selectedUser.profilePicture && (
                      <div className="profile-picture-fallback-large" style={{ display: 'none' }}>
                        {getRoleIcon(selectedUser.role)}
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <h2 className="profile-name">{selectedUser.name}</h2>
                    <p className="profile-email">{selectedUser.email}</p>
                    <span className={`role-badge-large ${selectedUser.role.toLowerCase()}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
                
                <div className="profile-details">
                  <div className="detail-row">
                    <div className="detail-group">
                      <label>User ID</label>
                      <span>{selectedUser.userId || 'Not provided'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Department</label>
                      <span>{selectedUser.department || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-group">
                      <label>Section</label>
                      <span>{selectedUser.section || 'Not specified'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Year Level</label>
                      <span>{selectedUser.year || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-group">
                      <label>Academic Year</label>
                      <span>{selectedUser.academicYear || 'Not specified'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Email Verified</label>
                      <span className={selectedUser.isVerified ? 'verified' : 'not-verified'}>
                        {selectedUser.isVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedUser.role === 'Staff' && (
                    <div className="detail-row">
                      <div className="detail-group">
                        <label>Approval Status</label>
                        <span className={`status-badge-large ${selectedUser.approvalStatus}`}>
                          {selectedUser.approvalStatus === 'approved' ? 'Approved' : 
                           selectedUser.approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </div>
                      <div className="detail-group">
                        <label>Approval Date</label>
                        <span>{selectedUser.approvalDate ? new Date(selectedUser.approvalDate).toLocaleDateString() : 'Not approved yet'}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="detail-row">
                    <div className="detail-group">
                      <label>Member Since</label>
                      <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowProfileModal(false)} className="close-button">
              Close
            </Button>
            <Button variant="primary" onClick={() => { setShowProfileModal(false); handleEdit(selectedUser); }} className="edit-profile-button">
              Edit Profile
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit User Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} className="edit-modal">
          <Modal.Header closeButton>
            <Modal.Title>Edit User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={editForm.name || ''}
                  onChange={handleEditFormChange}
                  required
                  className="form-input"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={editForm.email || ''}
                  onChange={handleEditFormChange}
                  required
                  className="form-input"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>User ID</Form.Label>
                <Form.Control
                  type="text"
                  name="userId"
                  value={editForm.userId || ''}
                  onChange={handleEditFormChange}
                  className="form-input"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  name="role"
                  value={editForm.role || ''}
                  onChange={handleEditFormChange}
                  required
                  className="form-input"
                >
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                  <option value="Student">Student</option>
                </Form.Select>
              </Form.Group>
              {(editForm.role === 'Staff' || editForm.role === 'Student') && (
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    name="department"
                    value={editForm.department || ''}
                    onChange={handleEditFormChange}
                    className="form-input"
                  >
                    <option value="">Select Department</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Education">Education</option>
                    <option value="Arts and Sciences">Arts and Sciences</option>
                    <option value="Computer Studies">Computer Studies</option>
                  </Form.Select>
                </Form.Group>
              )}
              {editForm.role === 'Student' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Year</Form.Label>
                    <Form.Select
                      name="academicYear"
                      value={editForm.academicYear || ''}
                      onChange={handleEditFormChange}
                      className="form-input"
                    >
                      <option value="">Select Academic Year</option>
                      <option value="2020-2021">2020-2021</option>
                      <option value="2021-2022">2021-2022</option>
                      <option value="2022-2023">2022-2023</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Year Level</Form.Label>
                    <Form.Select
                      name="year"
                      value={editForm.year || ''}
                      onChange={handleEditFormChange}
                      className="form-input"
                    >
                      <option value="">Select Year Level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Section</Form.Label>
                    <Form.Select
                      name="section"
                      value={editForm.section || ''}
                      onChange={handleEditFormChange}
                      className="form-input"
                    >
                      <option value="">Select Section</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                    </Form.Select>
                  </Form.Group>
                </>
              )}
              {editForm.role === 'Staff' && (
                <Form.Group className="mb-3">
                  <Form.Label>Approval Status</Form.Label>
                  <Form.Select
                    name="approvalStatus"
                    value={editForm.approvalStatus || 'pending'}
                    onChange={handleEditFormChange}
                    className="form-input"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
              )}

            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} className="cancel-button">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSave} className="save-button">
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default ManageUsersPage;