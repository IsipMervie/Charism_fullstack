import React from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isApiError: false 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      isApiError: error.message && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('500') ||
        error.message.includes('503')
      )
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isApiError: false 
    });
    
    // Force a page refresh to retry
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isApiError: false 
    });
    
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <Container className="mt-5 text-center">
          <Alert variant="danger" className="border-0 shadow-sm">
            <Alert.Heading>
              {this.state.isApiError ? '🔄 Connection Issue' : '⚠️ Something went wrong'}
            </Alert.Heading>
            
            {this.state.isApiError ? (
              <>
                <p>
                  We're experiencing some connection issues. This might be due to:
                </p>
                <ul className="text-start">
                  <li>Database connection problems</li>
                  <li>Network connectivity issues</li>
                  <li>Server maintenance</li>
                </ul>
                <p>
                  Please try again in a few moments.
                </p>
              </>
            ) : (
              <p>
                An unexpected error occurred. Our team has been notified.
              </p>
            )}
            
            <hr />
            
            <div className="d-flex justify-content-center gap-2">
              <Button 
                variant="outline-danger" 
                onClick={this.handleRetry}
                className="px-4"
              >
                🔄 Try Again
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={this.handleGoHome}
                className="px-4"
              >
                🏠 Go Home
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3 text-start">
                <summary>Error Details (Development)</summary>
                <pre className="mt-2 p-3 bg-light rounded">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
