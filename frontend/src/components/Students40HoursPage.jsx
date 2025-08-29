import React, { useState, useEffect } from 'react';
import { getStudents40Hours, generateReport, getPublicSettings } from '../api/api';
import Swal from 'sweetalert2';
import { FaDownload, FaSearch, FaFilter } from 'react-icons/fa';
import './Students40HoursPage.css';
import { Button, Spinner, Alert, Table, Form, Card, Row, Col } from 'react-bootstrap';


function Students40HoursPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  
  // PDF Filter options
  const [pdfFilters, setPdfFilters] = useState({
    department: '',
    yearLevel: '',
    section: '',
    academicYear: ''
  });
  
  // Available options for filters
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    yearLevels: [],
    sections: [],
    academicYears: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, settingsData] = await Promise.all([
          getStudents40Hours(),
          getPublicSettings()
        ]);
        
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        
        // Set filter options
        setFilterOptions({
          departments: settingsData.departments?.filter(d => d.isActive).map(d => d.name) || [],
          yearLevels: settingsData.yearLevels?.filter(y => y.isActive).map(y => y.name) || [],
          sections: settingsData.sections?.filter(s => s.isActive).map(s => s.name) || [],
          academicYears: settingsData.academicYears?.filter(a => a.isActive).map(a => a.year) || []
        });
        
        setError('');
      } catch (err) {
        setError('Failed to fetch students with 40 hours.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Build query parameters for PDF generation
      const params = new URLSearchParams();
      
      if (pdfFilters.department) params.append('department', pdfFilters.department);
      if (pdfFilters.yearLevel) params.append('yearLevel', pdfFilters.yearLevel);
      if (pdfFilters.section) params.append('section', pdfFilters.section);
      if (pdfFilters.academicYear) params.append('academicYear', pdfFilters.academicYear);
      if (search) params.append('search', search);
      
      const token = localStorage.getItem('token');
              const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reports/students-40-hours?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students-40-plus-hours.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded',
        text: 'Students with 40+ hours report has been downloaded successfully!'
      });
    } catch (error) {
      console.error('Failed to download PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: `Failed to download PDF: ${error.message}`
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setPdfFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredStudents = students.filter(student =>
    (
      (!pdfFilters.department || (student.department || '') === pdfFilters.department) &&
      (!pdfFilters.yearLevel || (student.year || '') === pdfFilters.yearLevel) &&
      (!pdfFilters.section || (student.section || '') === pdfFilters.section) &&
      (!pdfFilters.academicYear || (student.academicYear || '') === pdfFilters.academicYear)
    ) && (
      student.name?.toLowerCase().includes(search.toLowerCase()) ||
      student.email?.toLowerCase().includes(search.toLowerCase()) ||
      student.department?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleClearFilters = () => {
    setPdfFilters({ department: '', yearLevel: '', section: '', academicYear: '' });
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="students-40-hours-page">
      <div className="students-40-container">
        <h2>Completed Students In Community Service</h2>
        <p className="students-40-subtitle">Download a filtered report or browse the list below.</p>

        <div className="students-40-controls">
          <Form.Control
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button 
            className="download-btn"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Downloading...
              </>
            ) : (
              <>
                <FaDownload className="me-2" />
                Download PDF Report
              </>
            )}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-4 filters-card">
          <Card.Body>
            <div className="filters-header">
              <h6 className="mb-0" aria-hidden="true"></h6>
              <div className="filters-actions">
                <Button size="sm" variant="light" className="clear-filters-btn" onClick={handleClearFilters}>Clear filters</Button>
              </div>
            </div>
            <Row className="mt-2 students-40-filters">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={pdfFilters.department}
                    onChange={e => handleFilterChange('department', e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {filterOptions.departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Year Level</Form.Label>
                  <Form.Select
                    value={pdfFilters.yearLevel}
                    onChange={e => handleFilterChange('yearLevel', e.target.value)}
                  >
                    <option value="">All Year Levels</option>
                    {filterOptions.yearLevels.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Section</Form.Label>
                  <Form.Select
                    value={pdfFilters.section}
                    onChange={e => handleFilterChange('section', e.target.value)}
                  >
                    <option value="">All Sections</option>
                    {filterOptions.sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Academic Year</Form.Label>
                  <Form.Select
                    value={pdfFilters.academicYear}
                    onChange={e => handleFilterChange('academicYear', e.target.value)}
                  >
                    <option value="">All Academic Years</option>
                    {filterOptions.academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Results */}
        {error ? (
          <Alert variant="danger">{error}</Alert>
        ) : filteredStudents.length === 0 ? (
          <Alert variant="info">No students completed found.</Alert>
        ) : (
          <Card className="students-40-results-card">
            <Card.Header className="students-40-results-header">
              <h5 className="mb-0">
                Students Completed Community Service ({filteredStudents.length} found)
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              <Table responsive striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Year Level</th>
                    <th>Section</th>
                    <th>Academic Year</th>
                    <th>Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student._id}>
                      <td>{index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.department || 'N/A'}</td>
                      <td>{student.year || 'N/A'}</td>
                      <td>{student.section || 'N/A'}</td>
                      <td>{student.academicYear || 'N/A'}</td>
                      <td>
                        <span className="hours-badge">
                          {student.totalHours || 0} hours
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

        {/* Mobile cards view */}
        {!error && filteredStudents.length > 0 && (
          <div className="students-40-cards">
            {filteredStudents.map((student, index) => (
              <div key={student._id} className="students-40-card">
                <div className="card-row card-row-top">
                  <span className="card-index">#{index + 1}</span>
                  <span className="hours-badge">{student.totalHours || 0} hours</span>
                </div>
                <div className="card-name">{student.name}</div>
                <div className="card-meta">{student.email}</div>
                <div className="card-grid">
                  <div className="grid-item"><span className="label">Department</span><span className="value">{student.department || 'N/A'}</span></div>
                  <div className="grid-item"><span className="label">Year</span><span className="value">{student.year || 'N/A'}</span></div>
                  <div className="grid-item"><span className="label">Section</span><span className="value">{student.section || 'N/A'}</span></div>
                  <div className="grid-item"><span className="label">A.Y.</span><span className="value">{student.academicYear || 'N/A'}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Students40HoursPage;