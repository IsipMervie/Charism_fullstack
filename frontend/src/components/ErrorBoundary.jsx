import React from 'react';
import { Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Send error to logging service (if available)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '1.1rem' }}>
              We encountered an unexpected error. This usually happens due to:
            </p>
            <ul style={{ textAlign: 'left', color: '#6c757d', marginBottom: '30px' }}>
              <li>Network connectivity issues</li>
              <li>Server temporarily unavailable</li>
              <li>Browser compatibility problems</li>
              <li>Data loading conflicts</li>
            </ul>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={this.handleReload}
                style={{ padding: '10px 20px', borderRadius: '25px' }}
              >
                🔄 Try Again
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={this.handleGoHome}
                style={{ padding: '10px 20px', borderRadius: '25px' }}
              >
                🏠 Go Home
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '30px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#6c757d' }}>
                  Technical Details (Development Only)
                </summary>
                <pre style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '5px', 
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  marginTop: '10px'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;