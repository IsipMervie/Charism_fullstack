import React, { useState, useEffect } from 'react';

const SimpleEventImage = ({ event, className = '', alt = '', style = {} }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  // Reset state when event changes
  useEffect(() => {
    setCurrentImageUrl(null);
    setImageError(false);
    setIsLoading(true);
  }, [event]);

  // Default SVG fallback - no network requests needed
  const defaultSVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiNDQ0NDQ0MiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxODAiIHk9IjEzMCI+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjYgMTZMMzQgMjRMMjYgMzIiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjx0ZXh0IHg9IjIwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkV2ZW50IEltYWdlPC90ZXh0Pgo8L3N2Zz4K';

  // Simple approach: try to get image URL or use SVG fallback immediately
  const getImageSrc = () => {
    // If we have a current image URL (from fallback), use it
    if (currentImageUrl) return currentImageUrl;
    
    if (!event) return defaultSVG;
    
    const imageData = event.image;
    const eventId = event._id;
    
    console.log('🖼️ SimpleEventImage:', {
      eventId,
      imageData,
      eventTitle: event.title
    });

    // If no image data, use default SVG immediately
    if (!imageData) {
      console.log('⚠️ No image data, using default SVG immediately');
      return defaultSVG;
    }

    // Try to construct a valid image URL
    let imageUrl = null;

    // Try different patterns based on image data type
    if (typeof imageData === 'string' && imageData.length > 0) {
      // It's a filename
      const filename = imageData.startsWith('/') ? imageData.slice(1) : imageData;
      console.log('📁 Filename detected:', filename);
      imageUrl = `https://charism-api-xtw9.onrender.com/api/files/event-image/${eventId}`;
    } else if (imageData.url && typeof imageData.url === 'string') {
      // It has a URL field
      const url = imageData.url.startsWith('/') ? imageData.url.slice(1) : imageData.url;
      console.log('🔗 URL detected:', url);
      imageUrl = `https://charism-api-xtw9.onrender.com/api/files/event-image/${eventId}`;
    } else if (imageData.data && imageData.contentType && eventId) {
      // It's MongoDB binary data
      console.log('🗄️ MongoDB binary data detected for event:', eventId);
      imageUrl = `https://charism-api-xtw9.onrender.com/api/files/event-image/${eventId}`;
    }

    // If we have a valid image URL, return it, otherwise use default event image from backend
    if (imageUrl) {
      console.log('🖼️ Using image URL:', imageUrl);
      return imageUrl;
    } else {
      console.log('⚠️ No valid image pattern found, using default event image from backend');
      return 'https://charism-api-xtw9.onrender.com/api/files/event-image/default';
    }
  };

  const handleImageError = () => {
    console.error('❌ Image failed to load:', getImageSrc());
    
    // Try backend default image first, then SVG fallback
    console.log('🔄 Trying backend default image...');
    const backendDefaultUrl = 'https://charism-api-xtw9.onrender.com/api/files/event-image/default';
    
    const testImg = new Image();
    testImg.onload = () => {
      console.log('✅ Backend default image loaded successfully');
      setCurrentImageUrl(backendDefaultUrl);
      setIsLoading(false);
      setImageError(false);
    };
    testImg.onerror = () => {
      console.log('❌ Backend default image failed, using SVG fallback');
      setCurrentImageUrl(defaultSVG);
      setIsLoading(false);
      setImageError(true);
    };
    testImg.src = backendDefaultUrl;
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
