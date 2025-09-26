// DashboardPage.jsx - Main dashboard component
import React from 'react';
import { useSelector } from 'react-redux';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import StudentDashboard from './StudentDashboard';

const DashboardPage = () => {
  const user = useSelector(state => state.auth.user);
  const role = user?.role || 'student';

  // Render appropriate dashboard based on user role
  switch (role.toLowerCase()) {
    case 'admin':
      return <AdminDashboard />;
    case 'staff':
      return <StaffDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
};

export default DashboardPage;
