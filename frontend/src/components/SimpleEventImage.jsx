import React, { useState } from 'react';

const SimpleEventImage = ({ event, className = '', alt = '', style = {} }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simple approach: try a few common patterns and fallback to default
  const getImageSrc = () => {
    if (!event) return '/images/default-event.jpg';
    
    const imageData = event.image;
    const eventId = event._id;
    
    console.log('🖼️ SimpleEventImage:', {
      eventId,
      imageData,
      eventTitle: event.title
    });

    // If no image data, use default
    if (!imageData) {
      console.log('⚠️ No image data, using default');
      return '/images/default-event.jpg';
    }

    // Try different patterns based on image data type
    if (typeof imageData === 'string' && imageData.length > 0) {
      // It's a filename
      const filename = imageData.startsWith('/') ? imageData.slice(1) : imageData;
      console.log('📁 Filename detected:', filename);
      
      // Try different URL patterns with correct backend
      const patterns = [
        `https://charism-api-xtw9.onrender.com/uploads/${filename}`,
        `https://charism-api-xtw9.onrender.com/files/${filename}`,
        `https://charism-api-xtw9.onrender.com/api/uploads/${filename}`,
        `/uploads/${filename}`,
        `/images/${filename}`,
        filename
      ];
      
      return patterns[0]; // Return first pattern, error handler will try others
    }
    
    if (imageData.url && typeof imageData.url === 'string') {
      // It has a URL field
      const url = imageData.url.startsWith('/') ? imageData.url.slice(1) : imageData.url;
      console.log('🔗 URL detected:', url);
      
      const patterns = [
        `https://charism-api-xtw9.onrender.com/uploads/${url}`,
        `https://charism-api-xtw9.onrender.com/files/${url}`,
        `https://charism-api-xtw9.onrender.com/api/uploads/${url}`,
        `/uploads/${url}`,
        `/images/${url}`,
        url
      ];
      
      return patterns[0];
    }
    
    if (imageData.data && imageData.contentType && eventId) {
      // It's MongoDB binary data
      console.log('🗄️ MongoDB binary data detected for event:', eventId);
      
      const patterns = [
        `https://charism-api-xtw9.onrender.com/api/files/event-image/${eventId}`,
        `https://charism-api-xtw9.onrender.com/files/event-image/${eventId}`,
        `https://charism-api-xtw9.onrender.com/uploads/events/${eventId}`,
        `https://charism-api-xtw9.onrender.com/uploads/${eventId}`,
        `/uploads/events/${eventId}`,
        `/uploads/${eventId}`
      ];
      
      return patterns[0];
    }

    // Fallback to default
    console.log('⚠️ No valid image pattern found, using default');
    return '/images/default-event.jpg';
  };

  const handleImageError = () => {
    console.error('❌ Image failed to load:', getImageSrc());
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', getImageSrc());
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
        src={getImageSrc()}
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
      
      {imageError && (
        <div className="image-fallback-notice">
          <span>📷 Default Event Image</span>
        </div>
      )}
    </div>
  );
};

export default SimpleEventImage;
