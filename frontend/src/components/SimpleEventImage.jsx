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
      eventTitle: event.title,
      imageDataType: typeof imageData,
      hasData: imageData?.data ? 'YES' : 'NO',
      hasContentType: imageData?.contentType ? 'YES' : 'NO',
      hasFilename: imageData?.filename ? 'YES' : 'NO',
      dataLength: imageData?.data?.length || 0
    });

    // If no image data, use default SVG immediately
    if (!imageData) {
      console.log('⚠️ No image data, using default SVG immediately');
      return defaultSVG;
    }

    // Check if image data is valid for serving
    const hasValidImageData = imageData.data && 
                             imageData.data.length > 0 && 
                             imageData.contentType && 
                             imageData.contentType.startsWith('image/');

    if (hasValidImageData) {
      // It's valid MongoDB binary data - use the event image endpoint
      console.log('✅ Valid MongoDB binary data detected for event:', eventId);
      return `https://charism-api-xtw9.onrender.com/api/files/event-image/${eventId}`;
    } else {
      // Image data is invalid, missing, or corrupted - use SVG fallback immediately
      console.log('❌ Invalid image data detected, using SVG fallback immediately:', {
        hasData: !!imageData.data,
        dataLength: imageData.data?.length || 0,
        hasContentType: !!imageData.contentType,
        contentType: imageData.contentType,
        hasFilename: !!imageData.filename,
        filename: imageData.filename
      });
      
      return defaultSVG;
    }
  };

  const handleImageError = () => {
    console.error('❌ Image failed to load:', getImageSrc());
    
    // Use SVG fallback immediately for better performance
    console.log('🔄 Using SVG fallback immediately');
    setCurrentImageUrl(defaultSVG);
    setIsLoading(false);
    setImageError(true);
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
