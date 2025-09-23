import React, { useState, useEffect } from 'react';
import { getEventImageUrl } from '../utils/imageUtils';
import './EventImage.css';

const EventImage = ({ event, className = '', alt = '', style = {} }) => {
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate multiple possible image URLs
  const generateImageUrls = (imageData, eventId) => {
    const urls = [];
    
    if (!imageData && !eventId) {
      return ['/images/default-event.jpg'];
    }

    // Primary backend URL
    if (eventId) {
      urls.push(`https://charism-backend.vercel.app/api/files/event-image/${eventId}`);
      urls.push(`https://charism-backend.vercel.app/files/event-image/${eventId}`);
    }

    // Legacy upload paths
    if (imageData) {
      if (typeof imageData === 'string' && imageData.length > 0) {
        const cleanPath = imageData.startsWith('/') ? imageData.slice(1) : imageData;
        urls.push(`https://charism-backend.vercel.app/uploads/${cleanPath}`);
        urls.push(`https://charism-backend.vercel.app/api/uploads/${cleanPath}`);
        urls.push(`/uploads/${cleanPath}`);
      }
      
      if (imageData.url && typeof imageData.url === 'string') {
        const cleanPath = imageData.url.startsWith('/') ? imageData.url.slice(1) : imageData.url;
        urls.push(`https://charism-backend.vercel.app/uploads/${cleanPath}`);
        urls.push(`https://charism-backend.vercel.app/api/uploads/${cleanPath}`);
        urls.push(`/uploads/${cleanPath}`);
      }
    }

    // Fallback URLs
    if (eventId) {
      urls.push(`https://charism-backend.vercel.app/uploads/events/${eventId}`);
      urls.push(`https://charism-backend.vercel.app/uploads/${eventId}`);
    }

    // Always add default as last resort
    urls.push('/images/default-event.jpg');
    
    return [...new Set(urls)]; // Remove duplicates
  };

  useEffect(() => {
    if (!event) return;
    
    setIsLoading(true);
    setImageError(false);
    
    const imageData = event.image;
    const eventId = event._id;
    
    console.log('🖼️ EventImage component:', {
      eventId,
      imageData,
      eventTitle: event.title
    });
    
    const urls = generateImageUrls(imageData, eventId);
    console.log('🔄 Generated image URLs:', urls);
    
    // Try the first URL
    setCurrentImageUrl(urls[0]);
  }, [event]);

  const handleImageError = () => {
    console.error('❌ Image failed to load:', currentImageUrl);
    setImageError(true);
    setIsLoading(false);
    
    // Try fallback to default image
    setCurrentImageUrl('/images/default-event.jpg');
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', currentImageUrl);
    setIsLoading(false);
    setImageError(false);
  };

  if (!event) {
    return (
      <div className={`event-image-placeholder ${className}`} style={style}>
        <div>📷</div>
        <div>No Event</div>
      </div>
    );
  }

  return (
    <div className={`event-image-container ${className}`} style={style}>
      {isLoading && (
        <div className="image-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <img
        src={currentImageUrl}
        alt={alt || event.title || 'Event Image'}
        className={`event-image ${isLoading ? 'loading' : ''} ${imageError ? 'error' : ''}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.3s ease-in-out',
          ...style
        }}
      />
      
      {imageError && currentImageUrl === '/images/default-event.jpg' && (
        <div className="image-fallback-notice">
          <span>📷 Default Event Image</span>
        </div>
      )}
    </div>
  );
};

export default EventImage;
