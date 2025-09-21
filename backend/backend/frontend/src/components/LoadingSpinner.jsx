import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'primary', 
  text = 'Loading...', 
  fullScreen = false,
  overlay = false 
}) => {
  const sizeClass = `spinner-${size}`;
  const variantClass = `spinner-${variant}`;
  
  const spinnerContent = (
    <div className={`loading-spinner ${sizeClass} ${variantClass}`}>
      <div className="spinner-container">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <div className="spinner-text">{text}</div>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        {spinnerContent}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loading-overlay">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

// Inline spinner for small loading states
export const InlineSpinner = ({ size = 'small', variant = 'primary' }) => (
  <div className={`inline-spinner spinner-${size} spinner-${variant}`}>
    <div className="spinner-dot"></div>
    <div className="spinner-dot"></div>
    <div className="spinner-dot"></div>
  </div>
);

// Button loading state
export const ButtonSpinner = ({ size = 'small', variant = 'light' }) => (
  <div className={`button-spinner spinner-${size} spinner-${variant}`}>
    <div className="spinner-ring"></div>
  </div>
);

// Page loading with skeleton
export const PageLoader = ({ 
  showSkeleton = true, 
  skeletonLines = 5,
  text = 'Loading page...' 
}) => (
  <div className="page-loader">
    <LoadingSpinner size="large" variant="primary" text={text} />
    
    {showSkeleton && (
      <div className="skeleton-container">
        {Array.from({ length: skeletonLines }).map((_, index) => (
          <div 
            key={index} 
            className={`skeleton-line ${index === 0 ? 'skeleton-title' : 'skeleton-text'}`}
            style={{ 
              width: `${index === 0 ? '80%' : index === 1 ? '90%' : Math.random() * 40 + 60}%`,
              animationDelay: `${index * 0.1}s`
            }}
          ></div>
        ))}
      </div>
    )}
  </div>
);

// Table loading skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="table-skeleton">
    <div className="skeleton-header">
      {Array.from({ length: columns }).map((_, index) => (
        <div 
          key={index} 
          className="skeleton-header-cell"
          style={{ animationDelay: `${index * 0.1}s` }}
        ></div>
      ))}
    </div>
    <div className="skeleton-body">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="skeleton-cell"
              style={{ 
                animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`,
                width: `${Math.random() * 30 + 70}%`
              }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Card loading skeleton
export const CardSkeleton = ({ 
  showImage = true, 
  showTitle = true, 
  showText = true,
  lines = 3 
}) => (
  <div className="card-skeleton">
    {showImage && <div className="skeleton-image"></div>}
    <div className="skeleton-content">
      {showTitle && <div className="skeleton-title"></div>}
      {showText && (
        <div className="skeleton-text-lines">
          {Array.from({ length: lines }).map((_, index) => (
            <div 
              key={index} 
              className="skeleton-text-line"
              style={{ 
                width: `${Math.random() * 40 + 60}%`,
                animationDelay: `${index * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default LoadingSpinner;
