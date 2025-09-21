// frontend/src/components/NotFoundPage.jsx
// Modern 404 Not Found Page Component

import React from 'react';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToEvents = () => {
    navigate('/events');
  };

  return (
    <div className="not-found-page">
      <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <Row className="justify-content-center w-100">
          <Col lg={8} md={10} sm={12}>
            <Card className="text-center border-0 shadow-lg">
              <Card.Body className="p-5">
                {/* 404 Icon */}
                <div className="error-icon mb-4">
                  <div className="icon-circle">
                    <span className="icon-text">404</span>
                  </div>
                </div>

                {/* Error Message */}
                <h1 className="error-title mb-3">Page Not Found</h1>
                <p className="error-description mb-4">
                  Oops! The page you're looking for doesn't exist or has been moved to a different location.
                </p>

                {/* Helpful Suggestions */}
                <div className="suggestions mb-5">
                  <h5 className="suggestions-title mb-3">Here are some helpful links:</h5>
                  <div className="suggestions-grid">
                    <div className="suggestion-item" onClick={handleGoHome}>
                      <div className="suggestion-icon">🏠</div>
                      <span>Home</span>
                    </div>
                    <div className="suggestion-item" onClick={handleGoToEvents}>
                      <div className="suggestion-icon">📅</div>
                      <span>Events</span>
                    </div>
                    <div className="suggestion-item" onClick={() => navigate('/contact')}>
                      <div className="suggestion-icon">📧</div>
                      <span>Contact</span>
                    </div>
                    <div className="suggestion-item" onClick={() => navigate('/login')}>
                      <div className="suggestion-icon">🔐</div>
                      <span>Login</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <Button
                    variant="outline-primary"
                    size="lg"
                    onClick={handleGoBack}
                    className="me-3 mb-2"
                  >
                    ← Go Back
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGoHome}
                    className="mb-2"
                  >
                    🏠 Go Home
                  </Button>
                </div>

                {/* Additional Help */}
                <div className="additional-help mt-4">
                  <p className="text-muted mb-2">
                    If you believe this is an error, please contact support.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/contact')}
                    className="text-decoration-none"
                  >
                    Contact Support
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default NotFoundPage;
