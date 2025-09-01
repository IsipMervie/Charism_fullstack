import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import './LoadingOptimizer.css';

const LoadingOptimizer = ({ 
  loading, 
  error, 
  children, 
  message = 'Loading...', 
  timeout = 10000,
  showProgress = true 
}) => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      setShowTimeoutMessage(false);
      setProgress(0);
      
      // Show timeout message after specified time
      const timeoutId = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, timeout);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
      };
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [loading, timeout]);

  if (error) {
    return (
      <div className="loading-error">
        <div className="error-icon">⚠️</div>
        <h4>Something went wrong</h4>
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Spinner animation="border" variant="primary" />
          <h4>{message}</h4>
          {showProgress && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
          )}
          {showTimeoutMessage && (
            <div className="timeout-message">
              <p>This is taking longer than expected...</p>
              <small>Please check your connection and try again if needed.</small>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default LoadingOptimizer;
