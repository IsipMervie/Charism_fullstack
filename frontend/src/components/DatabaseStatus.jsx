import React, { useState, useEffect } from 'react';
import { Alert, Spinner, Button } from 'react-bootstrap';
import { FaDatabase, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { axiosInstance } from '../api/api';

const DatabaseStatus = () => {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  const checkDatabaseStatus = async () => {
    setStatus('checking');
    setError(null);
    
    try {
      const response = await axiosInstance.get('/db-status');
      const { database } = response.data;
      
      if (database.status === 'connected') {
        setStatus('connected');
      } else if (database.status === 'disconnected') {
        setStatus('disconnected');
      } else {
        setStatus('error');
        setError(database.error || 'Unknown database error');
      }
      
      setLastChecked(new Date());
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Failed to check database status');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <FaCheckCircle className="text-success" />;
      case 'disconnected':
        return <FaExclamationTriangle className="text-warning" />;
      case 'error':
        return <FaExclamationTriangle className="text-danger" />;
      default:
        return <Spinner animation="border" size="sm" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Database Connected';
      case 'disconnected':
        return 'Database Disconnected';
      case 'error':
        return 'Database Error';
      default:
        return 'Checking Database...';
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'connected':
        return 'All database operations are working normally.';
      case 'disconnected':
        return 'Database is currently unavailable. Some features may not work properly.';
      case 'error':
        return `Database connection error: ${error}. Please check your configuration.`;
      default:
        return 'Checking database connection status...';
    }
  };

  return (
    <Alert variant={getStatusVariant()} className="database-status-alert">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <FaDatabase className="me-2" />
          <div>
            <div className="d-flex align-items-center">
              {getStatusIcon()}
              <strong className="ms-2">{getStatusText()}</strong>
            </div>
            <div className="text-muted small mt-1">
              {getStatusMessage()}
            </div>
            {lastChecked && (
              <div className="text-muted small">
                Last checked: {lastChecked.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        <Button 
          size="sm" 
          variant="outline-secondary"
          onClick={checkDatabaseStatus}
          disabled={status === 'checking'}
        >
          {status === 'checking' ? 'Checking...' : 'Refresh'}
        </Button>
      </div>
    </Alert>
  );
};

export default DatabaseStatus;
