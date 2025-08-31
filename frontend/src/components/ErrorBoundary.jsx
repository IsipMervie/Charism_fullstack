import React from 'react';
import { Alert, Button, Container, Row, Col } from 'react-bootstrap';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo, errorId);
    }
  }

  logErrorToService = (error, errorInfo, errorId) => {
    try {
      // Send error to external logging service
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous'
      };

      // You can replace this with your preferred error logging service
      fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      }).catch(console.error); // Don't let error logging fail
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorReport = `
Error Report (ID: ${errorId})

Error: ${error?.message}
Stack: ${error?.stack}

Component Stack:
${errorInfo?.componentStack}

URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `;

    // Copy to clipboard
    navigator.clipboard.writeText(errorReport).then(() => {
      alert('Error report copied to clipboard. Please send this to support.');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorReport;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error report copied to clipboard. Please send this to support.');
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;

      return (
        <Container className="error-boundary-container">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <div className="error-boundary-content">
                <div className="error-icon">⚠️</div>
                
                <h1 className="error-title">Oops! Something went wrong</h1>
                
                <p className="error-description">
                  We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
                </p>

                {errorId && (
                  <Alert variant="info" className="error-id-alert">
                    <strong>Error ID:</strong> {errorId}
                    <br />
                    <small>Please include this ID when reporting the issue.</small>
                  </Alert>
                )}

                {process.env.NODE_ENV === 'development' && (
                  <Alert variant="warning" className="error-details-alert">
                    <h6>Development Error Details:</h6>
                    <details>
                      <summary>Error Stack</summary>
                      <pre className="error-stack">{error?.stack}</pre>
                    </details>
                    <details>
                      <summary>Component Stack</summary>
                      <pre className="error-stack">{errorInfo?.componentStack}</pre>
                    </details>
                  </Alert>
                )}

                <div className="error-actions">
                  <Button 
                    variant="primary" 
                    onClick={this.handleReload}
                    className="error-action-btn"
                  >
                    🔄 Reload Page
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    onClick={this.handleGoHome}
                    className="error-action-btn"
                  >
                    🏠 Go Home
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    onClick={this.handleGoBack}
                    className="error-action-btn"
                  >
                    ⬅️ Go Back
                  </Button>
                  
                  <Button 
                    variant="outline-info" 
                    onClick={this.handleReportError}
                    className="error-action-btn"
                  >
                    📋 Report Error
                  </Button>
                </div>

                <div className="error-help">
                  <p>
                    <strong>Need help?</strong> Contact our support team or try:
                  </p>
                  <ul>
                    <li>Refreshing the page</li>
                    <li>Clearing your browser cache</li>
                    <li>Using a different browser</li>
                    <li>Checking your internet connection</li>
                  </ul>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
