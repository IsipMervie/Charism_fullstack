// frontend/src/components/StudentsByYearPage.jsx
// Fresh Simple but Creative Manage Users Page Design

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  FaGraduationCap, FaDownload, FaUsers, FaSpinner, 
  FaExclamationTriangle, FaFilter, FaCheckCircle, FaTimesCircle,
  FaCalendar, FaIdCard, FaBuilding, FaClock, FaUserGraduate,
  FaChartBar, FaFileAlt, FaTimes
} from 'react-icons/fa';
import { getStudentsByYear, getStudentsByYearFilterOptions } from '../api/api';
import './StudentsByYearPage.css';

function StudentsByYearPage() {
  const [studentsByYear, setStudentsByYear] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    years: [],
    sections: []
  });
  const [pdfFilters, setPdfFilters] = useState({
    department: '',
    year: '',
    section: '',
    hoursMin: '',
    hoursMax: ''
  });
  const [frontendFilters, setFrontendFilters] = useState({
    department: '',
    year: '',
    section: '',
    hoursMin: '',
    hoursMax: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view this page.');
          setLoading(false);
          return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = user.role || localStorage.getItem('role');
        
        if (!role || (role !== 'Admin' && role !== 'Staff')) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const role = user.role || localStorage.getItem('role');
          setError(`Access denied. This page requires Admin or Staff role. Your current role is: ${role || 'Unknown'}`);
          setLoading(false);
          return;
        }

        const data = await getStudentsByYear();
        setStudentsByYear(data || {});
        setError('');
      } catch (err) {
        console.error('Error fetching students:', err);
        let errorMessage = '';
        let errorTitle = 'Error';
        
        if (err.response?.status === 401) {
          errorTitle = 'Session Expired';
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response?.status === 403) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const role = user.role || localStorage.getItem('role');
          errorTitle = 'Access Denied';
          errorMessage = `This page requires Admin or Staff role. Your current role is: ${role || 'Unknown'}`;
        } else {
          errorTitle = 'Failed to Fetch Students';
          errorMessage = err.response?.data?.message || 'Failed to fetch students by year. Please try again.';
        }
        
        setError(errorMessage);
        
        // Show SweetAlert for the error
        Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'OK'
        });
        return;
      } finally {
        setLoading(false);
      }
    };

    const fetchFilterOptions = async () => {
      try {
        const data = await getStudentsByYearFilterOptions();
        setFilterOptions(data);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchStudents();
    fetchFilterOptions();
  }, []);

  const handlePdfFilterChange = (filterType, value) => {
    if (filterType === 'hoursMin' || filterType === 'hoursMax') {
      const numValue = value === '' ? '' : parseInt(value);
      
      if (filterType === 'hoursMin') {
        // Ensure min hours isn't greater than max hours if both are set
        if (pdfFilters.hoursMax && numValue !== '' && numValue > parseInt(pdfFilters.hoursMax)) {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Hours Range',
            text: 'Minimum hours cannot be greater than maximum hours.',
            confirmButtonColor: '#f59e0b',
            confirmButtonText: 'OK'
          });
          return;
        }
        // Ensure min hours is not negative
        if (numValue !== '' && numValue < 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Hours Value',
            text: 'Minimum hours cannot be negative.',
            confirmButtonColor: '#f59e0b',
            confirmButtonText: 'OK'
          });
          return;
        }
      } else if (filterType === 'hoursMax') {
        // Ensure max hours isn't less than min hours if both are set
        if (pdfFilters.hoursMin && numValue !== '' && numValue < parseInt(pdfFilters.hoursMin)) {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Hours Range',
            text: 'Maximum hours cannot be less than minimum hours.',
            confirmButtonColor: '#f59e0b',
            confirmButtonText: 'OK'
          });
          return;
        }
        // Ensure max hours is not negative
        if (numValue !== '' && numValue < 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Hours Value',
            text: 'Maximum hours cannot be negative.',
            confirmButtonColor: '#f59e0b',
            confirmButtonText: 'OK'
          });
          return;
        }
      }
    }
    
    setPdfFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleFrontendFilterChange = (filterType, value) => {
    setFrontendFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    Swal.fire({
      icon: 'question',
      title: 'Clear All Filters?',
      text: 'Are you sure you want to clear all search and filter criteria? This will reset the current view.',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Clear All',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setFrontendFilters({
          department: '',
          year: '',
          section: '',
          hoursMin: '',
          hoursMax: ''
        });
        setSearch('');
        
        Swal.fire({
          icon: 'success',
          title: 'Filters Cleared!',
          text: 'All search and filter criteria have been cleared successfully.',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'OK',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  };

  const clearPdfFilters = () => {
    Swal.fire({
      icon: 'question',
      title: 'Clear PDF Filters?',
      text: 'Are you sure you want to clear all PDF filters? This action cannot be undone.',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Clear All',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setPdfFilters({
          department: '',
          year: '',
          section: '',
          hoursMin: '',
          hoursMax: ''
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Filters Cleared!',
          text: 'All PDF filters have been cleared successfully.',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'OK',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  };

  const clearFilter = (filterType) => {
    Swal.fire({
      icon: 'question',
      title: 'Clear Filter?',
      text: `Are you sure you want to clear the ${filterType} filter?`,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Clear',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setFrontendFilters(prev => ({
          ...prev,
          [filterType]: ''
        }));
        
        Swal.fire({
          icon: 'success',
          title: 'Filter Cleared!',
          text: `The ${filterType} filter has been cleared.`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'OK',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  };

  const handleDownloadPDF = async () => {
    if (!selectedYear) {
      Swal.fire({
        icon: 'warning',
        title: 'No Academic Year Selected',
        text: 'Please select an academic year first before generating a PDF report.',
        confirmButtonColor: '#667eea',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Check if there are students in the current view
    const currentStudents = studentsByYear[selectedYear];
    if (!currentStudents || currentStudents.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Students Available',
        text: `No students found for ${selectedYear}. Please check if there are students in this academic year.`,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Check if current filters result in no students displayed
    const filteredStudents = filterStudents(currentStudents);
    if (filteredStudents.length === 0 && hasActiveFilters) {
      Swal.fire({
        icon: 'info',
        title: 'No Students Match Current Filters',
        text: 'The current search and filter criteria result in no students being displayed. You can still generate a PDF with the PDF filters above, or adjust your current filters.',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Continue with PDF',
        cancelButtonText: 'Adjust Filters'
      }).then((result) => {
        if (result.isConfirmed) {
          // Continue with PDF generation
          generatePDF();
        }
      });
      return;
    }

    // Start PDF generation
    generatePDF();
  };

  const generatePDF = async () => {
    setDownloading(true);
    try {
      // Validate hours range if both are provided
      if (pdfFilters.hoursMin && pdfFilters.hoursMax) {
        const min = parseInt(pdfFilters.hoursMin);
        const max = parseInt(pdfFilters.hoursMax);
        if (min > max) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid Hours Range',
            text: 'Minimum hours cannot be greater than maximum hours.',
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'OK'
          });
          setDownloading(false);
          return;
        }
      }

      const params = new URLSearchParams();
      params.append('year', selectedYear);
      
      if (pdfFilters.department && pdfFilters.department.trim() !== '') params.append('department', pdfFilters.department.trim());
      if (pdfFilters.year && pdfFilters.year.trim() !== '') params.append('year', pdfFilters.year.trim());
      if (pdfFilters.section && pdfFilters.section.trim() !== '') params.append('section', pdfFilters.section.trim());
      if (pdfFilters.hoursMin && pdfFilters.hoursMin.trim() !== '') params.append('hoursMin', pdfFilters.hoursMin.trim());
      if (pdfFilters.hoursMax && pdfFilters.hoursMax.trim() !== '') params.append('hoursMax', pdfFilters.hoursMax.trim());

      console.log('PDF Generation URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reports/students-by-year?${params}`);
      console.log('PDF Filters:', pdfFilters);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reports/students-by-year?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('PDF Generation Error Response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-by-year-${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire({
        icon: 'success',
        title: 'PDF Generated Successfully!',
        text: `Students by Year report for ${selectedYear} has been downloaded.`,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Great!'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: `Could not download PDF: ${err.message}. Please try again.`,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    } finally {
      setDownloading(false);
    }
  };

  const filterStudents = (students) => {
    if (!students) return [];
    
    return students.filter(student => {
      const matchesSearch = !search || 
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        (student.userId && student.userId.toLowerCase().includes(search.toLowerCase()));
      
      const matchesDepartment = !frontendFilters.department || 
        student.department === frontendFilters.department;
      
      const matchesYearLevel = !frontendFilters.year || 
        student.year === frontendFilters.year;
      
      const matchesSection = !frontendFilters.section || 
        student.section === frontendFilters.section;
      
      const matchesHours = (!frontendFilters.hoursMin || (student.totalHours || 0) >= parseInt(frontendFilters.hoursMin)) &&
                          (!frontendFilters.hoursMax || (student.totalHours || 0) <= parseInt(frontendFilters.hoursMax));
      
      return matchesSearch && matchesDepartment && matchesYearLevel && matchesSection && matchesHours;
    });
  };

  const getCompletionStatus = (hours) => {
    if (hours >= 40) return { text: 'Completed', color: '#10b981' };
    if (hours >= 30) return { text: 'Near Complete', color: '#f59e0b' };
    if (hours >= 20) return { text: 'Halfway', color: '#3b82f6' };
    if (hours >= 10) return { text: 'Started', color: '#8b5cf6' };
    return { text: 'Not Started', color: '#6b7280' };
  };

  const hasActiveFilters = search || Object.values(frontendFilters).some(val => val !== '');
  const hasPdfFilters = Object.values(pdfFilters).some(val => val !== '');
  const years = Object.keys(studentsByYear).sort().reverse();

  if (loading) {
    return (
      <div className="students-by-year-page">
        <div className="loading-section">
          <div className="loading-spinner">
            <FaSpinner className="spinner-icon" />
            <p>Loading student data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="students-by-year-page">
        <div className="error-section">
          <div className="error-content">
            <FaExclamationTriangle className="error-icon" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="students-by-year-page">
      <div className="students-by-year-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`students-by-year-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
                    <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">👥</div>
            </div>
            <div className="header-text">
              <h1 className="header-title">Students by Year</h1>
              <p className="header-subtitle">View and manage student information by academic year</p>
            </div>
          </div>
          
          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-icon">
                <FaCalendar />
              </div>
              <div className="stat-content">
                <div className="stat-number">{years.length}</div>
                <div className="stat-label">Academic Years</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {Object.values(studentsByYear).reduce((total, students) => total + (students?.length || 0), 0)}
                </div>
                <div className="stat-label">Total Students</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Controls Section */}
        <div className="controls-section">
          <div className="controls-left">
            <div className="year-selector">
              <label className="control-label">
                <FaCalendar className="label-icon" />
                Academic Year
              </label>
              <select 
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="year-select"
              >
                <option value="">Select Academic Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="search-box">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              <span>Filters</span>
              {hasActiveFilters && <span className="filter-badge">•</span>}
            </button>
          </div>
          

        </div>

        {/* Frontend Filters Section */}
        {showFilters && (
          <div className="frontend-filters-section">
            <div className="filters-header">
              <h3 className="filters-title">
                <FaFilter className="filters-icon" />
                Filter Students
              </h3>
              <button 
                className="clear-filters-button"
                onClick={clearAllFilters}
              >
                <FaTimes />
                <span>Clear All</span>
              </button>
            </div>
            
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">
                  <FaBuilding className="filter-icon" />
                  Department
                </label>
                <select 
                  className="filter-select"
                  value={frontendFilters.department}
                  onChange={e => handleFrontendFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
                  {filterOptions.departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {frontendFilters.department && (
                  <button 
                    className="clear-filter-button"
                    onClick={() => clearFilter('department')}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              
              <div className="filter-group">
                <label className="filter-label">
                  <FaUserGraduate className="filter-icon" />
                  Year Level
                </label>
                <select 
                  className="filter-select"
                  value={frontendFilters.year}
                  onChange={e => handleFrontendFilterChange('year', e.target.value)}
                >
                  <option value="">All Year Levels</option>
                  {filterOptions.years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {frontendFilters.year && (
                  <button 
                    className="clear-filter-button"
                    onClick={() => clearFilter('year')}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              
              <div className="filter-group">
                <label className="filter-label">
                  <FaUsers className="filter-icon" />
                  Section
                </label>
                <select 
                  className="filter-select"
                  value={frontendFilters.section}
                  onChange={e => handleFrontendFilterChange('section', e.target.value)}
                >
                  <option value="">All Sections</option>
                  {filterOptions.sections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
                {frontendFilters.section && (
                  <button 
                    className="clear-filter-button"
                    onClick={() => clearFilter('section')}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              
              <div className="filter-group">
                <label className="filter-label">
                  <FaClock className="filter-icon" />
                  Hours Range
                </label>
                <div className="hours-range-inputs">
                  <input
                    type="number"
                    placeholder="Min hours"
                    min="0"
                    max="100"
                    value={frontendFilters.hoursMin}
                    onChange={e => handleFrontendFilterChange('hoursMin', e.target.value)}
                    className="hours-input"
                  />
                  <span className="hours-separator">to</span>
                  <input
                    type="number"
                    placeholder="Max hours"
                    min="0"
                    max="100"
                    value={frontendFilters.hoursMax}
                    onChange={e => handleFrontendFilterChange('hoursMax', e.target.value)}
                    className="hours-input"
                  />
                </div>
                {(frontendFilters.hoursMin || frontendFilters.hoursMax) && (
                  <button 
                    className="clear-filter-button"
                    onClick={() => {
                      clearFilter('hoursMin');
                      clearFilter('hoursMax');
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="active-filters">
                <span className="active-filters-label">Active Filters:</span>
                {search && (
                  <span className="active-filter-tag">
                    Search: "{search}"
                    <button 
                      className="remove-filter"
                      onClick={() => setSearch('')}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
                {frontendFilters.department && (
                  <span className="active-filter-tag">
                    Department: {frontendFilters.department}
                    <button 
                      className="remove-filter"
                      onClick={() => clearFilter('department')}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
                {frontendFilters.year && (
                  <span className="active-filter-tag">
                    Year Level: {frontendFilters.year}
                    <button 
                      className="remove-filter"
                      onClick={() => clearFilter('year')}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
                {frontendFilters.section && (
                  <span className="active-filter-tag">
                    Section: {frontendFilters.section}
                    <button 
                      className="remove-filter"
                      onClick={() => clearFilter('section')}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
                {(frontendFilters.hoursMin || frontendFilters.hoursMax) && (
                  <span className="active-filter-tag">
                    Hours: {frontendFilters.hoursMin || '0'}-{frontendFilters.hoursMax || '40+'}
                    <button 
                      className="remove-filter"
                      onClick={() => {
                        clearFilter('hoursMin');
                        clearFilter('hoursMax');
                      }}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* PDF Options Section */}
        <div className="pdf-options-section">
          <div className="pdf-options-header">
            <h3 className="pdf-options-title">
              <FaDownload className="pdf-options-icon" />
              PDF Report Options
            </h3>
            <p className="pdf-options-subtitle">Configure filters for PDF generation</p>
          </div>
          
          <div className="pdf-options-grid">
            <div className="pdf-option-group">
              <label className="pdf-option-label">
                <FaBuilding className="option-icon" />
                Department Filter
              </label>
              <select 
                className="pdf-option-select"
                value={pdfFilters.department}
                onChange={e => handlePdfFilterChange('department', e.target.value)}
              >
                <option value="">All Departments</option>
                {filterOptions.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="pdf-option-group">
              <label className="pdf-option-label">
                <FaUserGraduate className="option-icon" />
                Year Level Filter
              </label>
              <select 
                className="pdf-option-select"
                value={pdfFilters.year}
                onChange={e => handlePdfFilterChange('year', e.target.value)}
              >
                <option value="">All Year Levels</option>
                {filterOptions.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="pdf-option-group">
              <label className="pdf-option-label">
                <FaUsers className="option-icon" />
                Section Filter
              </label>
              <select 
                className="pdf-option-select"
                value={pdfFilters.section}
                onChange={e => handlePdfFilterChange('section', e.target.value)}
              >
                <option value="">All Sections</option>
                {filterOptions.sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            
            <div className="pdf-option-group">
              <label className="pdf-option-label">
                <FaClock className="option-icon" />
                Hours Range Filter
              </label>
              <div className="pdf-hours-range-inputs">
                <input
                  type="number"
                  placeholder="Min hours"
                  min="0"
                  max="100"
                  value={pdfFilters.hoursMin}
                  onChange={e => handlePdfFilterChange('hoursMin', e.target.value)}
                  className="pdf-hours-input"
                />
                <span className="pdf-hours-separator">to</span>
                <input
                  type="number"
                  placeholder="Max hours"
                  min="0"
                  max="100"
                  value={pdfFilters.hoursMax}
                  onChange={e => handlePdfFilterChange('hoursMax', e.target.value)}
                  className="pdf-hours-input"
                />
              </div>
              {(pdfFilters.hoursMin || pdfFilters.hoursMax) && (
                <button 
                  className="clear-hours-filter"
                  onClick={() => {
                    Swal.fire({
                      icon: 'question',
                      title: 'Clear Hours Filter?',
                      text: 'Are you sure you want to clear the hours range filter?',
                      showCancelButton: true,
                      confirmButtonColor: '#ef4444',
                      cancelButtonColor: '#6b7280',
                      confirmButtonText: 'Yes, Clear',
                      cancelButtonText: 'Cancel'
                    }).then((result) => {
                      if (result.isConfirmed) {
                        setPdfFilters(prev => ({ ...prev, hoursMin: '', hoursMax: '' }));
                        
                        Swal.fire({
                          icon: 'success',
                          title: 'Hours Filter Cleared!',
                          text: 'The hours range filter has been cleared.',
                          confirmButtonColor: '#10b981',
                          confirmButtonText: 'OK',
                          timer: 2000,
                          timerProgressBar: true
                        });
                      }
                    });
                  }}
                  title="Clear hours filter"
                >
                  <FaTimesCircle />
                </button>
              )}
              <div className="pdf-hours-help-text">
                <small>Enter minimum and/or maximum hours to filter students by their total community service hours</small>
              </div>
            </div>
          </div>

          {/* PDF Download Button */}
          <div className="pdf-download-section">
            {hasPdfFilters && (
              <button 
                className="clear-pdf-filters-button"
                onClick={clearPdfFilters}
                title="Clear all PDF filters"
              >
                <FaTimesCircle className="button-icon" />
                <span>Clear PDF Filters</span>
              </button>
            )}
            <button 
              className="download-button"
              onClick={handleDownloadPDF} 
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <FaSpinner className="spinner-icon" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FaDownload className="button-icon" />
                  <span>
                    Generate PDF Report
                    {hasPdfFilters && (
                      <span className="filter-indicator">
                        {pdfFilters.department && ` • ${pdfFilters.department}`}
                        {pdfFilters.year && ` • ${pdfFilters.year}`}
                        {pdfFilters.section && ` • ${pdfFilters.section}`}
                        {(pdfFilters.hoursMin || pdfFilters.hoursMax) && ` • Hours: ${pdfFilters.hoursMin || '0'}-${pdfFilters.hoursMax || '40+'}`}
                      </span>
                    )}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {!selectedYear ? (
          <div className="empty-state">
            <div className="empty-content">
              <FaGraduationCap className="empty-icon" />
              <h3>Select an Academic Year</h3>
              <p>Choose an academic year from the dropdown above to view student information</p>
              <div className="debug-info">
                <p><strong>Available Years:</strong> {years.length > 0 ? years.join(', ') : 'None'}</p>
                <p><strong>Total Students:</strong> {Object.values(studentsByYear).reduce((total, students) => total + (students?.length || 0), 0)}</p>
              </div>
            </div>
          </div>
        ) : !studentsByYear[selectedYear] || filterStudents(studentsByYear[selectedYear]).length === 0 ? (
          <div className="empty-state">
            <div className="empty-content">
              <FaUsers className="empty-icon" />
              <h3>No Students Found</h3>
              <p>No students found for {selectedYear} with the current search criteria</p>
              <div className="debug-info">
                <p><strong>Total Students in {selectedYear}:</strong> {studentsByYear[selectedYear]?.length || 0}</p>
                <p><strong>Active Filters:</strong> {hasActiveFilters ? 'Yes' : 'No'}</p>
                {hasActiveFilters && (
                  <div className="active-filters-debug">
                    <p>Search: "{search || 'None'}"</p>
                    <p>Department: {frontendFilters.department || 'All'}</p>
                    <p>Year Level: {frontendFilters.year || 'All'}</p>
                    <p>Section: {frontendFilters.section || 'All'}</p>
                    <p>Hours Range: {frontendFilters.hoursMin || '0'} - {frontendFilters.hoursMax || '∞'}</p>
                  </div>
                )}
              </div>
              <p className="pdf-note">
                <FaDownload className="note-icon" />
                You can still generate a PDF report using the filters above, even if no students are displayed
              </p>
            </div>
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <div className="results-info">
                <h3 className="results-title">
                  <FaUsers className="results-icon" />
                  {selectedYear} - Students
                </h3>
                <span className="results-count">
                  {filterStudents(studentsByYear[selectedYear]).length} students found
                  {hasActiveFilters && (
                    <span className="filtered-indicator">
                      (filtered from {studentsByYear[selectedYear].length} total)
                    </span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="students-list">
                <div className="list-header">
                  <div className="list-column">#</div>
                  <div className="list-column">Name</div>
                  <div className="list-column">Email</div>
                  <div className="list-column">Department</div>
                  <div className="list-column">Year Level</div>
                  <div className="list-column">Section</div>
                  <div className="list-column">Hours</div>
                  <div className="list-column">Status</div>
                </div>
                
                {filterStudents(studentsByYear[selectedYear]).map((student, index) => {
                  const completionStatus = getCompletionStatus(student.totalHours || 0);
                  return (
                    <div key={student._id} className="list-item">
                      <div className="list-column">{index + 1}</div>
                      <div className="list-column">
                        <div className="student-name">{student.name}</div>
                      </div>
                      <div className="list-column">
                        <div className="student-email">{student.email}</div>
                      </div>
                      <div className="list-column">
                        <div className="student-department">{student.department || 'Unknown'}</div>
                      </div>
                      <div className="list-column">
                        <div className="student-year-level">{student.year || 'N/A'}</div>
                      </div>
                      <div className="list-column">
                        <div className="student-section">{student.section || 'N/A'}</div>
                      </div>
                      <div className="list-column">
                        <span 
                          className="hours-badge"
                          style={{ backgroundColor: completionStatus.color }}
                        >
                          {student.totalHours || 0} hours
                        </span>
                      </div>
                      <div className="list-column">
                        <div className="status-item">
                          <FaCheckCircle className="status-icon" />
                          <span>{completionStatus.text}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentsByYearPage;