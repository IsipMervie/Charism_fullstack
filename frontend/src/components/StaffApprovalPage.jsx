import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Spinner, Badge, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import {
  getPendingStaffApprovals,
  approveStaff,
  rejectStaff
} from '../api/api';
import './StaffApprovalPage.css';

function StaffApprovalPage() {
  const [pendingStaff, setPendingStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [action, setAction] = useState(''); // 'approve' or 'reject'
  const [approvalNotes, setApprovalNotes] = useState('');

  // Fetch pending staff approvals
  const fetchPendingStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingStaffApprovals();
      setPendingStaff(data);
    } catch (err) {
      setError('Error fetching pending staff approvals. Please try again later.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingStaff();
  }, []);

  // Handle approve/reject action
  const handleAction = (staff, actionType) => {
    setSelectedStaff(staff);
    setAction(actionType);
    setApprovalNotes('');
    setShowModal(true);
  };

  // Submit approval/rejection
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (action === 'approve') {
        await approveStaff(selectedStaff._id, approvalNotes);
        Swal.fire({ 
          icon: 'success', 
          title: 'Success', 
          text: 'Staff member approved successfully!' 
        });
      } else {
        await rejectStaff(selectedStaff._id, approvalNotes);
        Swal.fire({ 
          icon: 'success', 
          title: 'Success', 
          text: 'Staff member rejected successfully!' 
        });
      }
      
      setShowModal(false);
      setSelectedStaff(null);
      setAction('');
      setApprovalNotes('');
      fetchPendingStaff(); // Refresh the list
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message 
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container className="mt-5 staff-approval-page">
      <div className="header-section d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="header-title">Staff Approval Management</h1>
          <p className="header-subtitle mb-0">Review and approve or reject pending staff accounts.</p>
        </div>
        <Badge className="fs-6 pending-badge">
          {pendingStaff.length} Pending Approval{pendingStaff.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : pendingStaff.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h4 className="text-muted">No Pending Approvals</h4>
            <p className="text-muted">All staff members have been processed.</p>
          </Card.Body>
        </Card>
      ) : (
        <Table striped hover responsive className="staff-approval-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>User ID</th>
              <th>Department</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingStaff.map(staff => (
              <tr key={staff._id}>
                <td>
                  <strong>{staff.name}</strong>
                </td>
                <td>{staff.email}</td>
                <td>{staff.userId || '-'}</td>
                <td>{staff.department || '-'}</td>
                <td>{formatDate(staff.createdAt)}</td>
                <td>
                  <Button 
                    size="sm" 
                    variant="success" 
                    onClick={() => handleAction(staff, 'approve')}
                    className="me-2 approve-btn"
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleAction(staff, 'reject')}
                    className="reject-btn"
                  >
                    Reject
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Approval/Rejection Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} dialogClassName="approval-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {action === 'approve' ? 'Approve Staff Member' : 'Reject Staff Member'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {selectedStaff && (
              <div className="mb-3">
                <h6>Staff Member Details:</h6>
                <p><strong>Name:</strong> {selectedStaff.name}</p>
                <p><strong>Email:</strong> {selectedStaff.email}</p>
                <p><strong>User ID:</strong> {selectedStaff.userId || 'Not provided'}</p>
                <p><strong>Department:</strong> {selectedStaff.department || 'Not specified'}</p>
                <p><strong>Registration Date:</strong> {formatDate(selectedStaff.createdAt)}</p>
              </div>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>
                {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={
                  action === 'approve' 
                    ? 'Add any notes about the approval...' 
                    : 'Please provide a reason for rejection...'
                }
                required={action === 'reject'}
              />
              {action === 'reject' && (
                <Form.Text className="text-muted">
                  This reason will be included in the rejection email sent to the staff member.
                </Form.Text>
              )}
            </Form.Group>

            <Alert variant={action === 'approve' ? 'success' : 'warning'}>
              <strong>
                {action === 'approve' 
                  ? 'Approving this staff member will:' 
                  : 'Rejecting this staff member will:'
                }
              </strong>
              <ul className="mb-0 mt-2">
                {action === 'approve' ? (
                  <>
                    <li>Grant them access to the system</li>
                    <li>Send them an approval email</li>
                    <li>Allow them to log in immediately</li>
                  </>
                ) : (
                  <>
                    <li>Prevent them from accessing the system</li>
                    <li>Send them a rejection email with the reason</li>
                    <li>Keep their account in rejected status</li>
                  </>
                )}
              </ul>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={action === 'approve' ? 'success' : 'danger'} 
              type="submit"
            >
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default StaffApprovalPage; 