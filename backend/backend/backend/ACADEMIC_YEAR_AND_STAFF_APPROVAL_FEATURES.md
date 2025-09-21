# Academic Year and Staff Approval Features

This document describes the new features added to the CommunityLink system for managing academic years and staff approval workflows.

## Features Implemented

### 1. Academic Year Management

#### Backend Changes
- **New Model**: `AcademicYear` model with fields:
  - `year`: Academic year (e.g., "2024-2025")
  - `description`: Optional description
  - `isActive`: Boolean to control visibility in registration
  - `startDate` and `endDate`: Optional date ranges
  - Validation for year format (YYYY-YYYY)

- **New Controller**: `academicYearController.js` with functions:
  - `getAcademicYears()`: Get all academic years (admin only)
  - `getActiveAcademicYears()`: Get active years for registration dropdown
  - `createAcademicYear()`: Create new academic year
  - `updateAcademicYear()`: Update existing academic year
  - `deleteAcademicYear()`: Delete academic year
  - `toggleActiveStatus()`: Toggle active/inactive status

- **New Routes**: `/api/academic-years` with proper authentication and role middleware

#### Frontend Changes
- **Updated RegisterPage**: 
  - Academic year field now uses dropdown populated from API
  - Fetches active academic years on component mount
  - Fallback to default years if API fails

- **New Page**: `AcademicYearManagementPage.jsx`
  - Admin-only page for managing academic years
  - CRUD operations with modal forms
  - Toggle active/inactive status
  - Responsive design with Bootstrap

### 2. Staff Approval System

#### Backend Changes
- **Updated User Model**: Added approval fields:
  - `isApproved`: Boolean for approval status
  - `approvalStatus`: Enum ('pending', 'approved', 'rejected')
  - `approvalDate`: When approval/rejection occurred
  - `approvedBy`: Reference to admin who approved/rejected
  - `approvalNotes`: Notes from admin

- **Updated Auth Controller**:
  - Registration now sets appropriate approval status based on role
  - Students and Admins: Auto-approved
  - Staff: Requires admin approval
  - Login checks for staff approval before allowing access
  - Enhanced email notifications for staff registration

- **New Admin Controller Functions**:
  - `getPendingStaffApprovals()`: Get all pending staff
  - `approveStaff()`: Approve staff member with email notification
  - `rejectStaff()`: Reject staff member with email notification

- **New Routes**: `/api/admin/staff-approvals` for approval management

#### Frontend Changes
- **Updated ManageUsersPage**: 
  - Shows approval status for staff users
  - Edit form includes approval status for staff
  - Visual badges for approval status

- **New Page**: `StaffApprovalPage.jsx`
  - Admin-only page for managing staff approvals
  - List of pending staff with details
  - Approve/reject actions with modal confirmation
  - Required notes for rejections
  - Email notifications sent automatically

- **Updated AdminDashboard**: 
  - Added buttons for new management pages
  - Staff Approvals button with pending count
  - Academic Years management button

## API Endpoints

### Academic Years
- `GET /api/academic-years/active` - Get active academic years (public)
- `GET /api/academic-years` - Get all academic years (admin)
- `POST /api/academic-years` - Create academic year (admin)
- `PUT /api/academic-years/:id` - Update academic year (admin)
- `DELETE /api/academic-years/:id` - Delete academic year (admin)
- `PATCH /api/academic-years/:id/toggle` - Toggle active status (admin)

### Staff Approvals
- `GET /api/admin/staff-approvals` - Get pending staff (admin)
- `POST /api/admin/staff-approvals/:userId/approve` - Approve staff (admin)
- `POST /api/admin/staff-approvals/:userId/reject` - Reject staff (admin)

## Database Migration

### New Collections
- `academicyears`: Stores academic year data

### Updated Collections
- `users`: Added approval-related fields

## Setup Instructions

1. **Run the academic year seeding script**:
   ```bash
   cd backend
   node scripts/seedAcademicYears.js
   ```

2. **Restart the backend server** to load new routes and models

3. **Access the new admin pages**:
   - Academic Years: `/admin/academic-years`
   - Staff Approvals: `/admin/staff-approvals`

## User Workflow

### Staff Registration Workflow
1. Staff member registers with role "Staff"
2. Account created with `approvalStatus: 'pending'`
3. Staff receives email about pending approval
4. Admin reviews staff in Staff Approvals page
5. Admin approves/rejects with optional notes
6. Staff receives approval/rejection email
7. Approved staff can now log in

### Academic Year Workflow
1. Admin creates academic years in Academic Years page
2. Active academic years appear in registration dropdown
3. Students select from available academic years during registration
4. Admin can manage (create, edit, delete, toggle) academic years

## Security Considerations

- All admin routes require authentication and admin role
- Staff approval prevents unauthorized access
- Email notifications keep users informed
- Approval notes provide audit trail
- Academic year validation prevents invalid formats

## Future Enhancements

- Bulk staff approval/rejection
- Academic year templates
- Approval workflow with multiple admin levels
- Integration with student information systems
- Academic year-based analytics 