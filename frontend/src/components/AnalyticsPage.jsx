import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getAnalytics,
  getDepartmentStatistics,
  getYearlyStatistics,
} from '../api/api';
import { Container, Card, Row, Col, Form, Nav } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { FaUsers, FaCalendarAlt, FaCheckCircle, FaComments, FaClock, FaGraduationCap } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './AnalyticsPage.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AnalyticsPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'department' | 'year'
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [departmentDetail, setDepartmentDetail] = useState(null);
  const [yearDetail, setYearDetail] = useState(null);

  // Memoized theme colors to prevent infinite re-renders
  const themeColors = useMemo(() => {
    console.log('🎨 AnalyticsPage theme detection:', {
      isDark,
      dataTheme: document.documentElement.getAttribute('data-theme'),
      bodyBg: getComputedStyle(document.body).backgroundColor
    });
    
    return {
      text: isDark ? '#ffffff' : '#1f2937',
      grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
  }, [isDark]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        console.log('🔄 Fetching analytics data...');
        const analytics = await getAnalytics();
        console.log('✅ Analytics data received:', analytics);
        setData(analytics || {});
        setError('');
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        
        // Provide more specific error messages
        let errorMessage = 'Database connection issue - showing default values';
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out - server may be slow. Please try again.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error - please check your connection.';
        } else if (err.message.includes('multiple attempts')) {
          errorMessage = 'Server is temporarily unavailable. Please try again later.';
        }
        
        // Set default data with error message
        setData({
          totalUsers: 0,
          totalEvents: 0,
          totalMessages: 0,
          totalAttendance: 0,
          studentsCount: 0,
          staffCount: 0,
          adminCount: 0,
          activeEvents: 0,
          completedEvents: 0,
          approvedAttendance: 0,
          totalHours: 0,
          message: 'Database temporarily unavailable'
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Fetch detail when department or year changes
  useEffect(() => {
    const run = async () => {
      try {
        if (activeTab === 'department' && selectedDepartment) {
          const detail = await getDepartmentStatistics(selectedDepartment);
          setDepartmentDetail(detail);
        }
        if (activeTab === 'year' && selectedYear) {
          const detail = await getYearlyStatistics(selectedYear);
          setYearDetail(detail);
        }
      } catch (e) {
        // Surface as inline error card content, keep global error untouched
      }
    };
    run();
  }, [activeTab, selectedDepartment, selectedYear]);

  const getValue = (key) => {
    if (error) return 0;
    try {
      return typeof data[key] === 'number' ? data[key] : 0;
    } catch (err) {
      console.error('Error getting value for key:', key, err);
      return 0;
    }
  };

  // User Role Distribution Pie Chart
  const userRoleData = useMemo(() => ({
    labels: ['Students', 'Staff', 'Admin'],
    datasets: [
      {
        data: [getValue('studentsCount'), getValue('staffCount'), getValue('adminCount')],
        backgroundColor: [
          '#ef4444', // Red for Students
          '#3b82f6', // Blue for Staff  
          '#f59e0b'  // Yellow for Admin
        ],
        borderColor: [
          '#ef4444',
          '#3b82f6',
          '#f59e0b'
        ],
        borderWidth: 2,
      },
    ],
  }), [data, isDark]);

  // Event Status Distribution Doughnut Chart
  const eventStatusData = useMemo(() => ({
    labels: ['Active Events', 'Completed Events'],
    datasets: [
      {
        data: [getValue('activeEvents'), getValue('completedEvents')],
        backgroundColor: [
          '#10b981', // Green for Active Events
          '#f59e0b'  // Yellow for Completed Events
        ],
        borderColor: [
          '#10b981',
          '#f59e0b'
        ],
        borderWidth: 2,
      },
    ],
  }), [data, isDark]);

  // Attendance vs Approved Attendance Bar Chart
  const attendanceData = useMemo(() => ({
    labels: ['Total Attendance', 'Approved Attendance'],
    datasets: [
      {
        label: 'Attendance Count',
        data: [getValue('totalAttendance'), getValue('approvedAttendance')],
        backgroundColor: [
          '#3b82f6', // Blue for Total Attendance
          '#10b981'  // Green for Approved Attendance
        ],
        borderColor: [
          '#3b82f6',
          '#10b981'
        ],
        borderWidth: 2,
      },
    ],
  }), [data, isDark]);

  // Recent Activity Line Chart (real data from backend)
  const recentActivityData = useMemo(() => {
    const events = Array.isArray(data.dailyEvents) ? data.dailyEvents : [0,0,0,0,0,0,0];
    const users = Array.isArray(data.dailyUsers) ? data.dailyUsers : [0,0,0,0,0,0,0];
    const labels = events.map((_, idx) => `${events.length - idx} day${events.length - idx === 1 ? '' : 's'} ago`).slice(0, events.length);
    return {
      labels,
      datasets: [
        {
          label: 'New Events',
          data: events,
          borderColor: '#ef4444', // Red for New Events
          backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light red background
          tension: 0.4,
          fill: true,
        },
        {
          label: 'New Users',
          data: users,
          borderColor: '#3b82f6', // Blue for New Users
          backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue background
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [data.dailyEvents, data.dailyUsers]);

  // Department Statistics Bar Chart
  const departmentData = {
    labels: (data.departmentStats || []).map(dept => dept.department || 'Unknown'),
    datasets: [
      {
        label: 'Students',
        data: (data.departmentStats || []).map(dept => dept.students || 0),
        backgroundColor: '#3b82f6', // Blue for Students
        borderColor: '#3b82f6',
        borderWidth: 2,
      },
      {
        label: 'Events',
        data: (data.departmentStats || []).map(dept => dept.events || 0),
        backgroundColor: '#ef4444', // Red for Events
        borderColor: '#ef4444',
        borderWidth: 2,
      },
    ],
  };

  // Academic Year Statistics Bar Chart
  const yearData = {
    labels: (data.yearStats || []).map(year => `Year ${year.academicYear || 'Unknown'}`),
    datasets: [
      {
        label: 'Students',
        data: (data.yearStats || []).map(year => year.students || 0),
        backgroundColor: '#10b981', // Green for Students
        borderColor: '#10b981',
        borderWidth: 2,
      },
      {
        label: 'Events',
        data: (data.yearStats || []).map(year => year.events || 0),
        backgroundColor: '#f59e0b', // Yellow for Events
        borderColor: '#f59e0b',
        borderWidth: 2,
      },
    ],
  };

  // Chart options
  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: themeColors.text,
          font: { size: 12, weight: '500' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'User Distribution',
        font: { size: 16, weight: 'bold' },
        color: themeColors.text
      },
    },
  }), [themeColors]);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: themeColors.text,
          font: { size: 12, weight: '500' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Event Status Distribution',
        font: { size: 16, weight: 'bold' },
        color: themeColors.text
      },
    },
  }), [themeColors]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: themeColors.text,
          font: { size: 12, weight: '500' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      title: {
        display: true,
        text: 'Attendance Overview',
        font: { size: 16, weight: 'bold' },
        color: themeColors.text
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: themeColors.text,
          font: { size: 11 }
        },
        grid: {
          color: themeColors.grid
        },
        title: {
          display: true,
          text: 'Count',
          color: themeColors.text,
          font: { size: 12, weight: '500' }
        }
      },
      x: {
        ticks: {
          color: themeColors.text,
          font: { size: 11 }
        },
        grid: {
          color: themeColors.grid
        }
      }
    },
  }), [themeColors]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: themeColors.text,
          font: { size: 12, weight: '500' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'line'
        }
      },
      title: {
        display: true,
        text: 'Recent Activity (Last 7 Days)',
        font: { size: 16, weight: 'bold' },
        color: themeColors.text
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: themeColors.text,
          font: { size: 11 }
        },
        grid: {
          color: themeColors.grid
        },
        title: {
          display: true,
          text: 'Count',
          color: themeColors.text,
          font: { size: 12, weight: '500' }
        }
      },
      x: {
        ticks: {
          color: themeColors.text,
          font: { size: 11 }
        },
        grid: {
          color: themeColors.grid
        },
        title: {
          display: true,
          text: 'Days',
          color: themeColors.text,
          font: { size: 12, weight: '500' }
        }
      }
    },
  }), [themeColors]);

  const departmentBarOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: themeColors.text,
          font: { size: 12, weight: '500' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      title: {
        display: true,
        text: 'Department Statistics',
        font: { size: 16, weight: 'bold' },
        color: themeColors.text
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: themeColors.text,
          font: { size: 11 }
        },
        grid: {
          color: themeColors.grid
        },
        title: {
          display: true,
          text: 'Count',
          color: themeColors.text,
          font: { size: 12, weight: '500' }
        }
      },
      x: {
        ticks: {
          color: themeColors.text,
          font: { size: 11 }
        },
        grid: {
          color: themeColors.grid
        },
        title: {
          display: true,
          text: 'Department',
          color: themeColors.text,
          font: { size: 12, weight: '500' }
        }
      }
    },
  }), [themeColors]);

  const yearBarOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: themeColors.text,
          font: { size: 12, weight: '500' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      title: {
        display: true,
        text: 'Academic Year Statistics',
        font: { size: 16, weight: 'bold' },
        color: themeColors.text
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: themeColors.text,
          font: { size: 11 }
        },
        grid: {
          color: themeColors.grid
        },
        title: {
          display: true,
          text: 'Count',
          color: themeColors.text,
          font: { size: 12, weight: '500' }
        }
      },
      x: {
        ticks: {
          color: themeColors.text,
          font: { size: 11 }
        },
        grid: {
          color: themeColors.grid
        },
        title: {
          display: true,
          text: 'Academic Year',
          color: themeColors.text,
          font: { size: 12, weight: '500' }
        }
      }
    },
  }), [themeColors]);

  const metricCards = [
    { 
      key: 'totalUsers', 
      label: 'Total Users', 
      icon: <FaUsers size={24} />
    },
    { 
      key: 'totalEvents', 
      label: 'Total Events', 
      icon: <FaCalendarAlt size={24} />
    },
    { 
      key: 'totalAttendance', 
      label: 'Total Attendance', 
      icon: <FaCheckCircle size={24} />
    },
    { 
      key: 'totalMessages', 
      label: 'Total Messages', 
      icon: <FaComments size={24} />
    },
    { 
      key: 'totalHours', 
      label: 'Total Hours', 
      icon: <FaClock size={24} />
    },
    { 
      key: 'approvedAttendance', 
      label: 'Approved Attendance', 
      icon: <FaGraduationCap size={24} />
    },
  ];

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-section">
          <h3>Preparing insights…</h3>
          <p>Fetching analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="header-content">
          <h1>📊 Analytics Dashboard</h1>
          <p>Comprehensive overview of your community engagement platform</p>
        </div>
      </div>

      <Container fluid>
        {error && (
          <div className="error-alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-3 justify-content-center">
          <Nav.Item>
            <Nav.Link eventKey="overview">Overview</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="department">By Department</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="year">By Academic Year</Nav.Link>
          </Nav.Item>
        </Nav>

        {activeTab === 'overview' && (
          <>
            <div className="metrics-section">
              {metricCards.map(({ key, label, icon }) => (
                <div key={key} className="metric-card" tabIndex={0}>
                  <div className="metric-icon users">{icon}</div>
                  <div className="metric-content">
                    <h3>{getValue(key).toLocaleString()}</h3>
                    <p>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="charts-section">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>User Distribution</h3>
                  <p>Proportion of users by role</p>
                </div>
                <div className="chart-container">
                  {userRoleData && pieOptions ? (
                    <Pie key={`pie-${isDark}`} data={userRoleData} options={pieOptions} />
                  ) : (
                    <div className="chart-error">Chart data unavailable</div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Event Status Distribution</h3>
                  <p>Active vs Completed events</p>
                </div>
                <div className="chart-container">
                  {eventStatusData && doughnutOptions ? (
                    <Doughnut key={`doughnut-${isDark}`} data={eventStatusData} options={doughnutOptions} />
                  ) : (
                    <div className="chart-error">Chart data unavailable</div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Attendance Overview</h3>
                  <p>Total vs approved attendance</p>
                </div>
                <div className="chart-container">
                  {attendanceData && barOptions ? (
                    <Bar key={`bar-${isDark}`} data={attendanceData} options={barOptions} />
                  ) : (
                    <div className="chart-error">Chart data unavailable</div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Recent Activity (Last 7 Days)</h3>
                  <p>Daily new events and users</p>
                </div>
                <div className="chart-container">
                  {recentActivityData && lineOptions ? (
                    <Line key={`line-${isDark}`} data={recentActivityData} options={lineOptions} />
                  ) : (
                    <div className="chart-error">Chart data unavailable</div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Department Statistics</h3>
                  <p>Students and events per department</p>
                </div>
                <div className="chart-container">
                  <Bar key={`dept-bar-${isDark}`} data={departmentData} options={departmentBarOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Academic Year Statistics</h3>
                  <p>Students and events by academic year</p>
                </div>
                <div className="chart-container">
                  <Bar key={`year-bar-${isDark}`} data={yearData} options={yearBarOptions} />
                </div>
              </div>
            </div>

            <div className="stats-section mb-4">
              <div className="stat-card" tabIndex={0}>
                <div className="stat-icon"><FaCalendarAlt /></div>
                <div className="stat-content">
                  <h4>Recent Events (30 days)</h4>
                  <p>{getValue('recentEvents')}</p>
                </div>
              </div>
              <div className="stat-card" tabIndex={0}>
                <div className="stat-icon"><FaUsers /></div>
                <div className="stat-content">
                  <h4>Recent Users (30 days)</h4>
                  <p>{getValue('recentUsers')}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'department' && (
          <>
            <Card className="shadow-sm mb-3 analytics-card">
              <Card.Body>
                <Form>
                  <Row className="align-items-end">
                    <Col md={6} className="mb-3">
                      <Form.Label className="analytics-label">Select Department</Form.Label>
                      <Form.Select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="analytics-select"
                      >
                        <option value="">-- Choose department --</option>
                        {(data.departmentStats || [])
                          .map(d => d.department)
                          .filter(Boolean)
                          .sort((a,b)=>a.localeCompare(b))
                          .map(dep => (
                            <option key={dep} value={dep}>{dep}</option>
                          ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

                         {selectedDepartment && (
               <Row>
                 <Col md={6} className="mb-3">
                   <Card className="shadow-sm h-100 analytics-card"><Card.Body>
                     <div className="analytics-stat-label">Students</div>
                     <div className="analytics-stat-value">{departmentDetail?.studentCount ?? '—'}</div>
                   </Card.Body></Card>
                 </Col>
                 <Col md={6} className="mb-3">
                   <Card className="shadow-sm h-100 analytics-card"><Card.Body>
                     <div className="analytics-stat-label">Events</div>
                     <div className="analytics-stat-value">{departmentDetail?.eventCount ?? '—'}</div>
                   </Card.Body></Card>
                 </Col>
               </Row>
             )}
          </>
        )}

        {activeTab === 'year' && (
          <>
            <Card className="shadow-sm mb-3 analytics-card">
              <Card.Body>
                <Form>
                  <Row className="align-items-end">
                    <Col md={6} className="mb-3">
                      <Form.Label className="analytics-label">Select Academic Year</Form.Label>
                      <Form.Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="analytics-select"
                      >
                        <option value="">-- Choose year --</option>
                        {(data.yearStats || [])
                          .map(y => y.academicYear)
                          .filter(Boolean)
                          .sort((a,b)=>a.localeCompare(b))
                          .map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

                         {selectedYear && (
               <Row>
                 <Col md={6} className="mb-3">
                   <Card className="shadow-sm h-100 analytics-card"><Card.Body>
                     <div className="analytics-stat-label">Students</div>
                     <div className="analytics-stat-value">{yearDetail?.studentCount ?? '—'}</div>
                   </Card.Body></Card>
                 </Col>
                 <Col md={6} className="mb-3">
                   <Card className="shadow-sm h-100 analytics-card"><Card.Body>
                     <div className="analytics-stat-label">Events</div>
                     <div className="analytics-stat-value">{yearDetail?.eventCount ?? '—'}</div>
                   </Card.Body></Card>
                 </Col>
               </Row>
             )}
          </>
        )}
      </Container>
    </div>
  );
}

export default AnalyticsPage;