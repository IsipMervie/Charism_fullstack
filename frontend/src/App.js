import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import NavigationBar from './components/NavigationBar';
import PrivateRoute from './components/PrivateRoute';


// Pages
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import EventListPage from './components/EventListPage';
import EventDetailsPage from './components/EventDetailsPage';
import CreateEventPage from './components/CreateEventPage';
import EditEventPage from './components/EditEventPage';
import EventAttendancePage from './components/EventAttendancePage';
import EventParticipantsPage from './components/EventParticipants';
import MyParticipationPage from './components/MyParticipationPage';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';
import StudentDashboard from './components/StudentDashboard';
import ManageUsersPage from './components/ManageUsersPage';
import AdminManageEventsPage from './components/AdminManageEventsPage';
import AdminManageMessagesPage from './components/AdminManageMessagesPage';
import AnalyticsPage from './components/AnalyticsPage';
import SettingsPage from './components/SettingsPage';
import SchoolSettingsPage from './components/SchoolSettingsPage';
import ContactUsPage from './components/ContactUsPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import RegistrationApprovalPage from './components/RegistrationApprovalPage';
import RegistrationManagementPage from './components/RegistrationManagementPage';
import StaffApprovalPage from './components/StaffApprovalPage';
import StudentsByYearPage from './components/StudentsByYearPage';
import Students40HoursPage from './components/Students40HoursPage';
import SimpleEventList from './components/SimpleEventList';
import ProfilePage from './components/ProfilePage';
import StudentDocumentationPage from './components/StudentDocumentationPage';
import AdminViewStudentDocumentation from './components/AdminViewStudentDocumentation';
import PublicEventRegistrationPage from './components/PublicEventRegistrationPage';
import FeedbackPage from './components/FeedbackPage';
import AdminManageFeedbackPage from './components/AdminManageFeedbackPage';
import NotFoundPage from './components/NotFoundPage';

function App() {
  return (
    <Router>
      <NavigationBar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/events" element={<EventListPage />} />
        
        {/* Specific event routes must come BEFORE dynamic routes */}
        <Route path="/events/register/:token" element={<PublicEventRegistrationPage />} /> {/* Public Registration */}
        
        {/* Dynamic event routes */}
        <Route path="/events/:eventId" element={<EventDetailsPage />} /> {/* View Details */}
        <Route
          path="/events/:eventId/participants"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <EventParticipantsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/:eventId/edit"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <EditEventPage />
            </PrivateRoute>
          }
        />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/simple-events" element={<SimpleEventList />} />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/manage-events"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <AdminManageEventsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/manage-messages"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <AdminManageMessagesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/manage-feedback"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <AdminManageFeedbackPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/create-event"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <CreateEventPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/manage-users"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <ManageUsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/school-settings"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <SchoolSettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/registration-management"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <RegistrationManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/registration-approvals"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <RegistrationApprovalPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/staff-approvals"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <StaffApprovalPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/student-documentation"
          element={
            <PrivateRoute requiredRoles={['Admin']}>
              <AdminViewStudentDocumentation />
            </PrivateRoute>
          }
        />

        {/* Staff routes */}
        <Route
          path="/staff/dashboard"
          element={
            <PrivateRoute requiredRoles={['Staff']}>
              <StaffDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/attendance"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <EventAttendancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/create-event"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <CreateEventPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/staff/student-documentation"
          element={
            <PrivateRoute requiredRoles={['Staff']}>
              <AdminViewStudentDocumentation />
            </PrivateRoute>
          }
        />

        {/* Shared Admin/Staff routes */}
        <Route
          path="/registration-approval"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <RegistrationApprovalPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <AnalyticsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/students-40-hours"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <Students40HoursPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/students-by-year"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff']}>
              <StudentsByYearPage />
            </PrivateRoute>
          }
        />

        {/* Student routes */}
        <Route
          path="/student/dashboard"
          element={
            <PrivateRoute requiredRoles={['Student']}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-participation"
          element={
            <PrivateRoute requiredRoles={['Student']}>
              <MyParticipationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/student-documentation"
          element={
            <PrivateRoute requiredRoles={['Student']}>
              <StudentDocumentationPage />
            </PrivateRoute>
          }
        />

        {/* User account pages */}
        <Route
          path="/profile"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff', 'Student']}>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff', 'Student']}>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute requiredRoles={['Admin', 'Staff', 'Student']}>
              <ChangePasswordPage />
            </PrivateRoute>
          }
        />

        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;