import React, { useEffect, useMemo, useState } from 'react';
import {
  getAnalytics,
  getDepartmentStatistics,
  getYearlyStatistics,
} from '../api/api';
import { Container, Card, Row, Col, Spinner, Alert, Form, Nav } from 'react-bootstrap';
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
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'department' | 'year'
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [departmentDetail, setDepartmentDetail] = useState(null);
  const [yearDetail, setYearDetail] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const analytics = await getAnalytics();
        setData(analytics || {});
        setError('');
      } catch (err) {
        setData({});
        setError('Failed to fetch analytics data.');
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
    if (error) return <span style={{ color: 'red' }}>Error</span>;
    return typeof data[key] === 'number' ? data[key] : 0;
  };

  // User Role Distribution Pie Chart
  const userRoleData = {
    labels: ['Students', 'Staff', 'Admin'],
    datasets: [
      {
        data: [getValue('studentsCount'), getValue('staffCount'), getValue('adminCount')],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56'
        ],
        borderColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56'
        ],
        borderWidth: 2,
      },
    ],
  };

  // Event Status Distribution Doughnut Chart
  const eventStatusData = {
    labels: ['Active Events', 'Completed Events'],
    datasets: [
      {
        data: [getValue('activeEvents'), getValue('completedEvents')],
        backgroundColor: [
          '#4BC0C0',
          '#FF9F40'
        ],
        borderColor: [
          '#4BC0C0',
          '#FF9F40'
        ],
        borderWidth: 2,
      },
    ],
  };

  // Attendance vs Approved Attendance Bar Chart
  const attendanceData = {
    labels: ['Total Attendance', 'Approved Attendance'],
    datasets: [
      {
        label: 'Attendance Count',
        data: [getValue('totalAttendance'), getValue('approvedAttendance')],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 2,
      },
    ],
  };

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
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'New Users',
          data: users,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
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
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
      },
      {
        label: 'Events',
        data: (data.departmentStats || []).map(dept => dept.events || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
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
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      },
      {
        label: 'Events',
        data: (data.yearStats || []).map(year => year.events || 0),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'User Distribution',
        font: { size: 16, weight: 'bold' }
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Event Status Distribution',
        font: { size: 16, weight: 'bold' }
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Attendance Overview',
        font: { size: 16, weight: 'bold' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Recent Activity (Last 7 Days)',
        font: { size: 16, weight: 'bold' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const departmentBarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Department Statistics',
        font: { size: 16, weight: 'bold' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const yearBarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Academic Year Statistics',
        font: { size: 16, weight: 'bold' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const metricCards = [
    { 
      key: 'totalUsers', 
      label: 'Total Users', 
      icon: <FaUsers size={24} />,
      color: '#007bff'
    },
    { 
      key: 'totalEvents', 
      label: 'Total Events', 
      icon: <FaCalendarAlt size={24} />,
      color: '#28a745'
    },
    { 
      key: 'totalAttendance', 
      label: 'Total Attendance', 
      icon: <FaCheckCircle size={24} />,
      color: '#ffc107'
    },
    { 
      key: 'totalMessages', 
      label: 'Total Messages', 
      icon: <FaComments size={24} />,
      color: '#dc3545'
    },
    { 
      key: 'totalHours', 
      label: 'Total Hours', 
      icon: <FaClock size={24} />,
      color: '#17a2b8'
    },
    { 
      key: 'approvedAttendance', 
      label: 'Approved Attendance', 
      icon: <FaGraduationCap size={24} />,
      color: '#6f42c1'
    },
  ];

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-section">
          <div className="loading-spinner" />
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
                  <Pie data={userRoleData} options={pieOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Event Status Distribution</h3>
                  <p>Active vs Completed events</p>
                </div>
                <div className="chart-container">
                  <Doughnut data={eventStatusData} options={doughnutOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Attendance Overview</h3>
                  <p>Total vs approved attendance</p>
                </div>
                <div className="chart-container">
                  <Bar data={attendanceData} options={barOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Recent Activity (Last 7 Days)</h3>
                  <p>Daily new events and users</p>
                </div>
                <div className="chart-container">
                  <Line data={recentActivityData} options={lineOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Department Statistics</h3>
                  <p>Students and events per department</p>
                </div>
                <div className="chart-container">
                  <Bar data={departmentData} options={departmentBarOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Academic Year Statistics</h3>
                  <p>Students and events by academic year</p>
                </div>
                <div className="chart-container">
                  <Bar data={yearData} options={yearBarOptions} />
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
            <Card className="shadow-sm border-0 mb-3">
              <Card.Body>
                <Form>
                  <Row className="align-items-end">
                    <Col md={6} className="mb-3">
                      <Form.Label>Select Department</Form.Label>
                      <Form.Select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
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
                   <Card className="shadow-sm border-0 h-100"><Card.Body>
                     <div className="text-muted">Students</div>
                     <div className="h3 mb-0">{departmentDetail?.studentCount ?? '—'}</div>
                   </Card.Body></Card>
                 </Col>
                 <Col md={6} className="mb-3">
                   <Card className="shadow-sm border-0 h-100"><Card.Body>
                     <div className="text-muted">Events</div>
                     <div className="h3 mb-0">{departmentDetail?.eventCount ?? '—'}</div>
                   </Card.Body></Card>
                 </Col>
               </Row>
             )}
          </>
        )}

        {activeTab === 'year' && (
          <>
            <Card className="shadow-sm border-0 mb-3">
              <Card.Body>
                <Form>
                  <Row className="align-items-end">
                    <Col md={6} className="mb-3">
                      <Form.Label>Select Academic Year</Form.Label>
                      <Form.Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
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
                   <Card className="shadow-sm border-0 h-100"><Card.Body>
                     <div className="text-muted">Students</div>
                     <div className="h3 mb-0">{yearDetail?.studentCount ?? '—'}</div>
                   </Card.Body></Card>
                 </Col>
                 <Col md={6} className="mb-3">
                   <Card className="shadow-sm border-0 h-100"><Card.Body>
                     <div className="text-muted">Events</div>
                     <div className="h3 mb-0">{yearDetail?.eventCount ?? '—'}</div>
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