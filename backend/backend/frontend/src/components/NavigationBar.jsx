import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './NavigationBar.css';

// Logo path - using public folder for better build compatibility
const logo = '/logo.png';

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
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Close mobile menu when location changes
  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);


  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('userChanged'));
    setIsExpanded(false);
    navigate('/login');
  };

  // Handle navigation link clicks
  const handleNavLinkClick = () => {
    setIsExpanded(false);
  };

  // Handle dropdown toggle clicks - don't close mobile menu
  const handleDropdownToggleClick = (event) => {
    // Prevent the click from bubbling up and closing the mobile menu
    event.stopPropagation();
    // Don't close the mobile menu when toggling dropdowns
  };

  // Handle dropdown item clicks - close mobile menu
  const handleDropdownItemClick = () => {
    setIsExpanded(false);
  };

  // Handle mobile menu toggle
  const handleMobileToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isExpanded && !event.target.closest('.navbar')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isExpanded]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isExpanded) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isExpanded]);


  return (
    <Navbar 
      expand="lg" 
      className="navbar-custom fixed-top" 
      collapseOnSelect
      expanded={isExpanded}
      onToggle={(expanded) => setIsExpanded(expanded)}
    >
      <Container fluid>
        <div className="d-flex align-items-center">
          <Navbar.Brand as={Link} to="/" className="navbar-brand" onClick={handleNavLinkClick}>
            <img 
              src={logo} 
              alt="CHARISM Logo" 
              className="navbar-logo"
            />
            <span className="navbar-title">
              CHARISM
            </span>
          </Navbar.Brand>
          <Navbar.Toggle 
            aria-controls="navbar-nav" 
            className="navbar-toggler"
            onClick={handleMobileToggle}
            aria-expanded={isExpanded}
            aria-label="Toggle navigation"
          />
        </div>
        <Navbar.Collapse 
          id="navbar-nav" 
          className={`justify-content-end ${isExpanded ? 'show' : ''}`}
        >
          <Nav className="navbar-nav-mobile">
            {/* Not logged in */}
            {!user && (
              <>
               
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  className={location.pathname === '/login' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Login/Register
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/contact" 
                  className={location.pathname === '/contact' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Contact Us
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/feedback" 
                  className={location.pathname === '/feedback' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Feedback
                </Nav.Link>
              </>
            )}

            {/* Student */}
            {user && role === 'Student' && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/student/dashboard" 
                  className={location.pathname === '/student/dashboard' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/events" 
                  className={location.pathname.startsWith('/events') ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Events
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/event-chat" 
                  className={location.pathname.startsWith('/event-chat') ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Event Chats
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/my-participation" 
                  className={location.pathname === '/my-participation' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  My Participation
                </Nav.Link>
              </>
            )}

            {/* Staff */}
            {user && role === 'Staff' && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/staff/dashboard" 
                  className={location.pathname === '/staff/dashboard' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/events" 
                  className={location.pathname.startsWith('/events') ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Events
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/event-chat" 
                  className={location.pathname.startsWith('/event-chat') ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Event Chats
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/admin/manage-events" 
                  className={location.pathname === '/admin/manage-events' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Manage Events
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/staff/create-event" 
                  className={location.pathname === '/staff/create-event' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Create Event
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/registration-approval" 
                  className={location.pathname === '/registration-approval' ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  Registration Management
                </Nav.Link>
              </>
            )}

            {/* Admin */}
            {user && role === 'Admin' && (
              <NavDropdown 
                title="Admin" 
                id="navbar-admin-dropdown"
                onClick={handleDropdownToggleClick}
              >
                <NavDropdown.Item 
                  as={Link} 
                  to="/admin/dashboard" 
                  active={location.pathname === '/admin/dashboard'}
                  onClick={handleDropdownItemClick}
                >
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/events" 
                  active={location.pathname.startsWith('/events')}
                  onClick={handleDropdownItemClick}
                >
                  Events
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/event-chat" 
                  active={location.pathname.startsWith('/event-chat')}
                  onClick={handleDropdownItemClick}
                >
                  Event Chats
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/admin/manage-events" 
                  active={location.pathname === '/admin/manage-events'}
                  onClick={handleDropdownItemClick}
                >
                  Manage Events
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/admin/create-event" 
                  active={location.pathname === '/admin/create-event'}
                  onClick={handleDropdownItemClick}
                >
                  Create Event
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/registration-approval" 
                  active={location.pathname === '/registration-approval'}
                  onClick={handleDropdownItemClick}
                >
                  Manage Event Registration
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/admin/manage-messages" 
                  active={location.pathname === '/admin/manage-messages'}
                  onClick={handleDropdownItemClick}
                >
                  Manage Messages
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/admin/manage-users" 
                  active={location.pathname === '/admin/manage-users'}
                  onClick={handleDropdownItemClick}
                >
                  Manage Users
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/analytics" 
                  active={location.pathname === '/analytics'}
                  onClick={handleDropdownItemClick}
                >
                  Analytics
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/admin/registration-management" 
                  active={location.pathname === '/admin/registration-management'}
                  onClick={handleDropdownItemClick}
                >
                  Manage Registration
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/students-by-year" 
                  active={location.pathname === '/students-by-year'}
                  onClick={handleDropdownItemClick}
                >
                  Students by Year
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/admin/manage-feedback" 
                  active={location.pathname === '/admin/manage-feedback'}
                  onClick={handleDropdownItemClick}
                >
                  Manage Feedback
                </NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Account Dropdown for logged-in users */}
            {user && (
              <NavDropdown 
                title="Account" 
                id="navbar-account-dropdown"
                onClick={handleDropdownToggleClick}
              >
                <NavDropdown.Item 
                  as={Link} 
                  to="/profile"
                  onClick={handleDropdownItemClick}
                >
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/settings"
                  onClick={handleDropdownItemClick}
                >
                  Settings
                </NavDropdown.Item>
                <NavDropdown.Item 
                  as={Link} 
                  to="/change-password"
                  onClick={handleDropdownItemClick}
                >
                  Change Password
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Theme Toggle - Always visible */}
            <div className="navbar-theme-toggle">
              <ThemeToggle className="compact" />
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;