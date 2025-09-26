// frontend/src/components/RegisterPage.jsx
// Simple but Creative Register Page Design

import React, { useState, useEffect } from 'react';
import { Button, Form, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { registerUser, getPublicSettings } from '../api/api';
import './RegisterPage.css';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null);
  const [userId, setUserId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!userId.trim()) {
      errors.userId = 'User ID is required';
    }
    
    if (!academicYear.trim()) {
      errors.academicYear = 'Academic Year is required';
    }
    
    if (!year.trim()) {
      errors.year = 'Year is required';
    }
    
    if (!section.trim()) {
      errors.section = 'Section is required';
    }
    
    if (!department.trim()) {
      errors.department = 'Department is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update state based on field name
    switch (name) {
      case 'name':
        setName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
      case 'userId':
        setUserId(value);
        break;
      case 'academicYear':
        setAcademicYear(value);
        break;
      case 'year':
        setYear(value);
        break;
      case 'section':
        setSection(value);
        break;
      case 'department':
        setDepartment(value);
        break;
      case 'role':
        setRole(value);
        break;
      default:
        break;
    }
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Check password matching in real-time
  useEffect(() => {
    if (confirmPassword && password) {
      if (password === confirmPassword) {
        setPasswordMatch(true);
      } else {
        setPasswordMatch(false);
      }
    } else {
      setPasswordMatch(null);
    }
  }, [password, confirmPassword]);

  // Fetch settings for dynamic options
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getPublicSettings();
        setAcademicYears(settings.academicYears?.map(a => ({ year: a.year })) || []);
        setYearOptions(settings.yearLevels?.map(y => y.name) || []);
        setSectionOptions(settings.sections?.map(s => s.name) || []);
        setDepartmentOptions(settings.departments?.map(d => d.name) || []);
      } catch (error) {
      console.error('Form submission error:', error);
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        showError('Server is taking longer than usual. Please try again in a moment.');
      } else if (error.response?.status === 500) {
        showError('Server error. Please try again later.');
      } else if (error.response?.status === 404) {
        showError('Service temporarily unavailable. Please try again.');
      } else {
        console.error('Error fetching settings:', error);
        setAcademicYears([]);
        setYearOptions([]);
        setSectionOptions([]);
        setDepartmentOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fix the errors in the form.',
        icon: 'warning'
      });
      return;
    }

    if (!email.endsWith('@ua.edu.ph')) {
      Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please use a valid @ua.edu.ph email address.' });
      return;
    }
    if (password.length < 8) {
      Swal.fire({ icon: 'error', title: 'Password Too Short', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (password !== confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Password Mismatch', text: 'Passwords do not match. Please try again.' });
      return;
    }
    if (role === 'Student') {
      if (!academicYear) {
        Swal.fire({ icon: 'error', title: 'Missing Academic Year', text: 'Please enter your academic year.' });
        return;
      }
      if (!year) {
        Swal.fire({ icon: 'error', title: 'Missing Year Level', text: 'Please select your year level.' });
        return;
      }
      if (!section) {
        Swal.fire({ icon: 'error', title: 'Missing Section', text: 'Please enter your section.' });
        return;
      }
      if (!department) {
        Swal.fire({ icon: 'error', title: 'Missing Department', text: 'Please select your department.' });
        return;
      }
    }

    setLoading(true);
    try {
      await registerUser(name, email, password, userId, academicYear, year, section, role, department);
      
      // Enhanced success alert with email verification emphasis
      Swal.fire({
        icon: 'success',
        title: '🎉 Registration Successful!',
        html: `
          <div class="registration-success-content">
            <p class="welcome-message">
              <strong>Welcome to CHARISM!</strong> Your account has been created successfully.
            </p>
            
            <div class="email-verification-box">
              <h4 class="verification-title">
                📧 <span>Email Verification Required</span>
              </h4>
              <p class="verification-important">
                <strong>Important:</strong> You must verify your email address before you can log in.
              </p>
              
              <div class="email-address-box">
                <p class="email-label">
                  📬 <strong>Check this email address:</strong>
                </p>
                <p class="email-value">
                  ${email}
                </p>
              </div>
              
              <ul class="verification-steps">
                <li>Check your email inbox (including spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here to log in after verification</li>
              </ul>
            </div>
            
            ${role === 'Staff' ? `
              <div class="staff-approval-box">
                <h4 class="approval-title">
                  ⏳ <span>Admin Approval Required</span>
                </h4>
                <p class="approval-note">
                  <strong>Note:</strong> Staff accounts require administrator approval. 
                  You'll receive another email once your account is approved.
                </p>
              </div>
            ` : ''}
            
            <p class="help-text">
              <strong>Need help?</strong> Check your spam folder or contact support if you don't receive the email within 5 minutes.
            </p>
          </div>
        `,
        confirmButtonText: 'Got it!',
        confirmButtonColor: 'var(--info)',
        width: '600px',
        customClass: {
          popup: 'email-verification-alert',
          confirmButton: 'email-verification-btn'
        }
      });
      
      navigate('/login');
    } catch (err) {
      const errorMessage = err?.message || err?.response?.data?.message;
      let title = 'Registration Failed';
      let icon = 'error';
      let text = 'An unexpected error occurred. Please try again.';
      
      if (errorMessage) {
        if (errorMessage.includes('User already exists')) {
          title = 'Account Already Exists';
          text = 'An account with this email address already exists. Please try logging in instead.';
          icon = 'warning';
        } else if (errorMessage.includes('Error registering user')) {
          title = 'Registration Error';
          text = 'There was a problem creating your account. Please check your information and try again.';
          icon = 'error';
        } else {
          text = errorMessage;
        }
      }
      
      Swal.fire({
        icon: icon,
        title: title,
        text: text,
        confirmButtonColor: icon === 'error' ? 'var(--error)' : 'var(--warning)',
        confirmButtonText: 'OK'
      });
    }
    setLoading(false);
  };

  return (
    <div className="register-page">
      <div className="register-background">
        <div className="background-pattern"></div>
      </div>

      <Container className={`register-container ${isVisible ? 'visible' : ''}`}>
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="register-icon">
              <div className="icon-symbol">✨</div>
            </div>
            <h1 className="register-title">Join CHARISM</h1>
            <p className="register-subtitle">Create your account to start your journey</p>
          </div>

          {/* Registration Form */}
          <Form onSubmit={handleSubmit} className="register-form">
            <div className="form-section">
              <h3 className="section-title">Personal Information</h3>
              
              <div className="form-field">
                <div className="input-wrapper">
                  <Form.Control
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="form-input"
                  />
                  <div className="input-focus-line"></div>
                </div>
              </div>

              <div className="form-field">
                <div className="input-wrapper">
                  <Form.Control
                    type="email"
                    placeholder="School email (@ua.edu.ph)"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="form-input"
                  />
                  <div className="input-focus-line"></div>
                </div>
                <div className="form-hint">Use your official @ua.edu.ph email address</div>
              </div>

              <div className="form-field">
                <div className="input-wrapper">
                  <Form.Control
                    type="text"
                    placeholder="User ID"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    required
                    className="form-input"
                  />
                  <div className="input-focus-line"></div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Account Security</h3>
              
              <div className="form-row">
                <div className="form-field">
                  <div className="input-wrapper">
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className={`form-input ${passwordMatch !== null ? (passwordMatch ? 'password-match' : 'password-mismatch') : ''}`}
                    />
                    <div className="input-focus-line"></div>
                  </div>
                </div>

                <div className="form-field">
                  <div className="input-wrapper">
                    <Form.Control
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className={`form-input ${passwordMatch !== null ? (passwordMatch ? 'password-match' : 'password-mismatch') : ''}`}
                    />
                    <div className="input-focus-line"></div>
                  </div>
                </div>
              </div>
              
              {/* Password Match Indicator */}
              {passwordMatch !== null && (
                <div className={`password-match-indicator ${passwordMatch ? 'match' : 'mismatch'}`}>
                  {passwordMatch ? '✅ Passwords match!' : '❌ Passwords do not match'}
                </div>
              )}
            </div>

            <div className="form-section">
              <h3 className="section-title">Role & Academic Details</h3>
              
              <div className="form-field">
                <div className="input-wrapper">
                  <Form.Select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="form-input"
                  >
                    <option value="Student">Student</option>
                    <option value="Staff">Staff</option>
                  </Form.Select>
                  <div className="input-focus-line"></div>
                </div>
                {role === 'Staff' && (
                  <div className="form-hint">Note: Staff registrations require admin approval before login</div>
                )}
              </div>

              {role === 'Student' && (
                <>
                  <div className="form-field">
                    <div className="input-wrapper">
                      <Form.Select
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        required
                        disabled={loadingOptions}
                        className="form-input"
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.length === 0 ? (
                          <option value="" disabled>No academic years configured</option>
                        ) : (
                          academicYears.map(ay => (
                            <option key={ay.year} value={ay.year}>
                              {ay.year}
                            </option>
                          ))
                        )}
                      </Form.Select>
                      <div className="input-focus-line"></div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <div className="input-wrapper">
                        <Form.Select
                          value={year}
                          onChange={e => setYear(e.target.value)}
                          required
                          disabled={loadingOptions}
                          className="form-input"
                        >
                          <option value="">Year Level</option>
                          {yearOptions.length === 0 ? (
                            <option value="" disabled>No year levels configured</option>
                          ) : (
                            yearOptions.map(yearOption => (
                              <option key={yearOption} value={yearOption}>{yearOption}</option>
                            ))
                          )}
                        </Form.Select>
                        <div className="input-focus-line"></div>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="input-wrapper">
                        <Form.Select
                          value={section}
                          onChange={e => setSection(e.target.value)}
                          required
                          disabled={loadingOptions}
                          className="form-input"
                        >
                          <option value="">Section</option>
                          {sectionOptions.length === 0 ? (
                            <option value="" disabled>No sections configured</option>
                          ) : (
                            sectionOptions.map(sectionOption => (
                              <option key={sectionOption} value={sectionOption}>{sectionOption}</option>
                            ))
                          )}
                        </Form.Select>
                        <div className="input-focus-line"></div>
                      </div>
                    </div>
                  </div>

                  <div className="form-field">
                    <div className="input-wrapper">
                      <Form.Select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        required
                        disabled={loadingOptions}
                        className="form-input"
                      >
                        <option value="">Select Department</option>
                        {departmentOptions.length === 0 ? (
                          <option value="" disabled>No departments configured</option>
                        ) : (
                          departmentOptions.map(dep => (
                            <option key={dep} value={dep}>{dep}</option>
                          ))
                        )}
                      </Form.Select>
                      <div className="input-focus-line"></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button type="submit" disabled={loading} variant="primary">
              <span className="button-content">
                {loading ? 'Creating account...' : 'Create Account'}
              </span>
            </Button>
            
            {/* Email Verification Reminder */}
            <div className="verification-reminder">
              <div className="reminder-icon">📧</div>
              <div className="reminder-text">
                <strong>Important:</strong> After registration, you'll receive a verification email. 
                You must verify your email before you can log in. The Email will send by "nexacore91@gmail.com"
              </div>
            </div>
          </Form>
        </div>
      </Container>
    </div>
  );
}

export default RegisterPage;