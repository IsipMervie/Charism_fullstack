import React from 'react';

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
    return { 
      hasError: true, 
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      errorInfo,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRefresh = () => {
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
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              color: '#dc3545'
            }}>
              ⚠️
            </div>
            
            <h1 style={{
              color: '#2c3e50',
              marginBottom: '20px',
              fontSize: '24px'
            }}>
              Oops! Something went wrong
            </h1>
            
            <p style={{
              color: '#6c757d',
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
            </p>

            {this.state.errorId && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '30px',
                border: '1px solid #dee2e6'
              }}>
                <p style={{
                  margin: '0',
                  fontSize: '14px',
                  color: '#6c757d'
                }}>
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
                <p style={{
                  margin: '5px 0 0 0',
                  fontSize: '12px',
                  color: '#999'
                }}>
                  Please include this ID when reporting the issue.
                </p>
              </div>
            )}

            <div style={{
              marginBottom: '30px',
              textAlign: 'left',
              backgroundColor: '#fff3cd',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <h3 style={{
                margin: '0 0 15px 0',
                color: '#856404',
                fontSize: '16px'
              }}>
                Need help? Try:
              </h3>
              <ul style={{
                margin: '0',
                paddingLeft: '20px',
                color: '#856404'
              }}>
                <li>Refreshing the page</li>
                <li>Clearing your browser cache</li>
                <li>Using a different browser</li>
                <li>Checking your internet connection</li>
              </ul>
            </div>

            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleRefresh}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🔄 Refresh Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🏠 Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '30px',
                textAlign: 'left',
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  🔍 Show Error Details (Development Only)
                </summary>
                <pre style={{
                  marginTop: '10px',
                  fontSize: '12px',
                  color: '#dc3545',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
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
