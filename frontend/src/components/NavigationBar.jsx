import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getPublicSchoolSettings } from '../api/api';
import logo from './assets/logo.png';
import './NavigationBar.css';

function NavigationBar() {
  const getUserFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(getUserFromStorage());
  const [role, setRole] = useState(getUserFromStorage()?.role || localStorage.getItem('role'));
  const [schoolSettings, setSchoolSettings] = useState({
    brandName: 'CHARISM',
    logo: null
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncUser = () => {
      const parsedUser = getUserFromStorage();
      setUser(parsedUser);
      setRole(parsedUser?.role || localStorage.getItem('role'));
    };
    window.addEventListener('storage', syncUser);
    window.addEventListener('userChanged', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('userChanged', syncUser);
    };
  }, []);

  // Fetch school settings for navbar
  useEffect(() => {
    const fetchSchoolSettings = async () => {
      try {
        const settings = await getPublicSchoolSettings();
        setSchoolSettings(settings);
      } catch (error) {
        console.error('Failed to fetch school settings:', error);
        // Keep default values
      }
    };
    fetchSchoolSettings();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('userChanged'));
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="navbar-custom fixed-top" collapseOnSelect>
      <Container fluid>
        <div className="d-flex align-items-center">
          <Navbar.Brand as={Link} to="/" className="navbar-brand">
            <img src={logo} alt="CHARISM Logo" className="navbar-logo" />
            <span className="navbar-title">CHARISM</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" className="navbar-toggler" />
        </div>
        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav>
            {/* Not logged in */}
            {!user && (
              <>
                <Nav.Link as={Link} to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
                  Contact
                </Nav.Link>
                <Nav.Link as={Link} to="/feedback" className={location.pathname === '/feedback' ? 'active' : ''}>
                  Feedback
                </Nav.Link>
                <Nav.Link as={Link} to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className={location.pathname === '/register' ? 'active' : ''}>
                  Register
                </Nav.Link>
              </>
            )}

            {/* Student */}
            {user && role === 'Student' && (
              <>
                <Nav.Link as={Link} to="/student/dashboard" className={location.pathname === '/student/dashboard' ? 'active' : ''}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/events" className={location.pathname.startsWith('/events') ? 'active' : ''}>
                  Events
                </Nav.Link>
                <Nav.Link as={Link} to="/my-participation" className={location.pathname === '/my-participation' ? 'active' : ''}>
                  My Participation
                </Nav.Link>
                <Nav.Link as={Link} to="/feedback" className={location.pathname === '/feedback' ? 'active' : ''}>
                  Feedback
                </Nav.Link>
              </>
            )}

            {/* Staff */}
            {user && role === 'Staff' && (
              <>
                <Nav.Link as={Link} to="/staff/dashboard" className={location.pathname === '/staff/dashboard' ? 'active' : ''}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/events" className={location.pathname.startsWith('/events') ? 'active' : ''}>
                  Events
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/manage-events" className={location.pathname === '/admin/manage-events' ? 'active' : ''}>
                  Manage Events
                </Nav.Link>
                <Nav.Link as={Link} to="/staff/create-event" className={location.pathname === '/staff/create-event' ? 'active' : ''}>
                  Create Event
                </Nav.Link>
                <Nav.Link as={Link} to="/registration-approval" className={location.pathname === '/registration-approval' ? 'active' : ''}>
                  Event Registered Approval
                </Nav.Link>
                <Nav.Link as={Link} to="/feedback" className={location.pathname === '/feedback' ? 'active' : ''}>
                  Feedback
                </Nav.Link>
              </>
            )}

            {/* Admin */}
            {user && role === 'Admin' && (
              <NavDropdown title="Admin" id="navbar-admin-dropdown">
                <NavDropdown.Item as={Link} to="/admin/dashboard" active={location.pathname === '/admin/dashboard'}>
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/events" active={location.pathname.startsWith('/events')}>
                  Events
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/manage-events" active={location.pathname === '/admin/manage-events'}>
                  Manage Events
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/create-event" active={location.pathname === '/admin/create-event'}>
                  Create Event
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/registration-approval" active={location.pathname === '/registration-approval'}>
                  Event Registered Approval
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/manage-messages" active={location.pathname === '/admin/manage-messages'}>
                  Manage Messages
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/manage-users" active={location.pathname === '/admin/manage-users'}>
                  Manage Users
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/analytics" active={location.pathname === '/analytics'}>
                  Analytics
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/school-settings" active={location.pathname === '/admin/school-settings'}>
                  School Settings
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/registration-management" active={location.pathname === '/admin/registration-management'}>
                  Manage Registration
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/students-by-year" active={location.pathname === '/students-by-year'}>
                  Students by Year
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/manage-feedback" active={location.pathname === '/admin/manage-feedback'}>
                  Manage Feedback
                </NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Account Dropdown for logged-in users */}
            {user && (
              <NavDropdown title="Account" id="navbar-account-dropdown">
                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/settings">Settings</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/change-password">Change Password</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;