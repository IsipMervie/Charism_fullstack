import React, { useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/sweetAlert.css';

// Components
import NavigationBar from './components/NavigationBar';
import PrivateRoute from './components/PrivateRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceOptimizer from './components/PerformanceOptimizer';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext';

// Utilities
import { setupGlobalErrorHandler } from './utils/apiErrorHandler';
import { setupNetworkMonitoring, showNetworkStatus } from './utils/networkUtils';
import { initSweetAlertTheme } from './utils/sweetAlertUtils';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./components/HomePage'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const RegisterPage = React.lazy(() => import('./components/RegisterPage'));
const EventListPage = React.lazy(() => import('./components/EventListPage'));
const EventDetailsPage = React.lazy(() => import('./components/EventDetailsPage'));
const CreateEventPage = React.lazy(() => import('./components/CreateEventPage'));
const EditEventPage = React.lazy(() => import('./components/EditEventPage'));
const EventAttendancePage = React.lazy(() => import('./components/EventAttendancePage'));
const EventParticipantsPage = React.lazy(() => import('./components/EventParticipants'));
const MyParticipationPage = React.lazy(() => import('./components/MyParticipationPage'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const StaffDashboard = React.lazy(() => import('./components/StaffDashboard'));
const StudentDashboard = React.lazy(() => import('./components/StudentDashboard'));
const ManageUsersPage = React.lazy(() => import('./components/ManageUsersPage'));
const AdminManageEventsPage = React.lazy(() => import('./components/AdminManageEventsPage'));
const AdminManageMessagesPage = React.lazy(() => import('./components/AdminManageMessagesPage'));
const AnalyticsPage = React.lazy(() => import('./components/AnalyticsPage'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const ContactUsPage = React.lazy(() => import('./components/ContactUsPage'));
const ForgotPasswordPage = React.lazy(() => import('./components/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./components/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./components/VerifyEmailPage'));
const ChangePasswordPage = React.lazy(() => import('./components/ChangePasswordPage'));
const RegistrationApprovalPage = React.lazy(() => import('./components/RegistrationApprovalPage'));
const RegistrationManagementPage = React.lazy(() => import('./components/RegistrationManagementPage'));
const StaffApprovalPage = React.lazy(() => import('./components/StaffApprovalPage'));
const StudentsByYearPage = React.lazy(() => import('./components/StudentsByYearPage'));
const Students40HoursPage = React.lazy(() => import('./components/Students40HoursPage'));
const SimpleEventList = React.lazy(() => import('./components/SimpleEventList'));
const EventChatListPage = React.lazy(() => import('./components/EventChatListPage'));
const EventChatPage = React.lazy(() => import('./components/EventChatPage'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const StudentDocumentationPage = React.lazy(() => import('./components/StudentDocumentationPage'));
const AdminViewStudentDocumentation = React.lazy(() => import('./components/AdminViewStudentDocumentation'));
const PublicEventRegistrationPage = React.lazy(() => import('./components/PublicEventRegistrationPage'));
const FeedbackPage = React.lazy(() => import('./components/FeedbackPage'));
const AdminManageFeedbackPage = React.lazy(() => import('./components/AdminManageFeedbackPage'));
const NotFoundPage = React.lazy(() => import('./components/NotFoundPage'));
const TestPage = React.lazy(() => import('./components/TestPage'));

// Loading component
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading...
  </div>
);

function App() {
  // Setup global error handling
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  // Setup network monitoring
  useEffect(() => {
    const cleanup = setupNetworkMonitoring(
      () => showNetworkStatus(true),  // onOnline
      () => showNetworkStatus(false)  // onOffline
    );

    return cleanup;
  }, []);

  // Setup SweetAlert theme
  useEffect(() => {
    const cleanup = initSweetAlertTheme();
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PerformanceOptimizer>
          <Router>
            <NavigationBar />
            <Suspense fallback={<LoadingSpinner />}>
            <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/events" element={<EventListPage />} />
          
          {/* Event Chat routes */}
          <Route path="/event-chat" element={<EventChatListPage />} />
          <Route path="/event-chat/:eventId" element={<EventChatPage />} />
          
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
          <Route path="/feedback" element={<PublicOnlyRoute><FeedbackPage /></PublicOnlyRoute>} />
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
        </Suspense>
        
        
        </Router>
        </PerformanceOptimizer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;