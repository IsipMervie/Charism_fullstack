import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Card, Row, Col } from 'react-bootstrap';

function TestPage() {
  const [userInfo, setUserInfo] = useState({});
  const [testResults, setTestResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    setUserInfo({
      user,
      role,
      token: token ? 'Present' : 'None',
      hasUserId: !!user._id,
      userRole: user.role
    });
  }, []);

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, { test, result, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testNavigation = (path) => {
    try {
      navigate(path);
      addTestResult(`Navigate to ${path}`, '✅ Success', 'Navigation executed');
    } catch (error) {
      addTestResult(`Navigate to ${path}`, '❌ Failed', error.message);
    }
  };

  const testLocalStorage = () => {
    try {
      const user = localStorage.getItem('user');
      const role = localStorage.getItem('role');
      const token = localStorage.getItem('token');
      
      addTestResult('LocalStorage Check', '✅ Success', `User: ${user ? 'Present' : 'None'}, Role: ${role || 'None'}, Token: ${token ? 'Present' : 'None'}`);
    } catch (error) {
      addTestResult('LocalStorage Check', '❌ Failed', error.message);
    }
  };

  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      setUserInfo({});
      addTestResult('Clear LocalStorage', '✅ Success', 'All data cleared');
    } catch (error) {
      addTestResult('Clear LocalStorage', '❌ Failed', error.message);
    }
  };

  return (
    <Container className="mt-5">
      <h1>🔧 Test Page - Debug Information</h1>
      
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>User Authentication Status</Card.Header>
            <Card.Body>
              <div><strong>User ID:</strong> {userInfo.hasUserId ? '✅ Present' : '❌ Missing'}</div>
              <div><strong>Role:</strong> {userInfo.role || 'None'}</div>
              <div><strong>User Role:</strong> {userInfo.userRole || 'None'}</div>
              <div><strong>Token:</strong> {userInfo.token}</div>
              <div><strong>User Object:</strong> <pre>{JSON.stringify(userInfo.user, null, 2)}</pre></div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>Test Actions</Card.Header>
            <Card.Body>
              <Button onClick={testLocalStorage} className="me-2 mb-2">Test LocalStorage</Button>
              <Button onClick={clearLocalStorage} variant="danger" className="me-2 mb-2">Clear Storage</Button>
              <hr />
              <h6>Test Navigation:</h6>
              <Button onClick={() => testNavigation('/events')} variant="outline-primary" size="sm" className="me-2 mb-2">Events</Button>
              <Button onClick={() => testNavigation('/admin/manage-events')} variant="outline-primary" size="sm" className="me-2 mb-2">Manage Events</Button>
              <Button onClick={() => testNavigation('/admin/registration-management')} variant="outline-primary" size="sm" className="me-2 mb-2">Manage Registration</Button>
              <Button onClick={() => testNavigation('/registration-approval')} variant="outline-primary" size="sm" className="me-2 mb-2">Registration Approval</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>Test Results</Card.Header>
            <Card.Body>
              {testResults.length === 0 ? (
                <p>No tests run yet. Click the test buttons above.</p>
              ) : (
                <div>
                  {testResults.map((result, index) => (
                    <div key={index} className="mb-2 p-2 border rounded">
                      <strong>{result.test}</strong> - {result.result}
                      {result.details && <div className="text-muted small">{result.details}</div>}
                      <div className="text-muted small">{result.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TestPage;
