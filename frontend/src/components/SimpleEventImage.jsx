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

  // Simple approach: try a few common patterns and fallback to default
  const getImageSrc = () => {
    // If we have a current image URL (from fallback), use it
    if (currentImageUrl) return currentImageUrl;
    
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
      return 'https://charism-api-xtw9.onrender.com/images/default-event.jpg';
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

    // Fallback to default - try multiple default image locations
    console.log('⚠️ No valid image pattern found, using default');
    const defaultImages = [
      'https://charism-api-xtw9.onrender.com/images/default-event.jpg',
      'https://charism-api-xtw9.onrender.com/uploads/default-event.jpg',
      'https://charism-api-xtw9.onrender.com/files/default-event.jpg',
      '/images/default-event.jpg',
      'https://via.placeholder.com/400x300/007bff/ffffff?text=Event+Image',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiNDQ0NDQ0MiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxODAiIHk9IjEzMCI+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjYgMTZMMzQgMjRMMjYgMzIiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjx0ZXh0IHg9IjIwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkV2ZW50IEltYWdlPC90ZXh0Pgo8L3N2Zz4K'
    ];
    return defaultImages[0];
  };

  const handleImageError = () => {
    console.error('❌ Image failed to load:', getImageSrc());
    
    // Try fallback images in sequence
    const fallbackImages = [
      'https://charism-api-xtw9.onrender.com/images/default-event.jpg',
      'https://charism-api-xtw9.onrender.com/uploads/default-event.jpg',
      'https://charism-api-xtw9.onrender.com/files/default-event.jpg',
      '/images/default-event.jpg',
      'https://via.placeholder.com/400x300/007bff/ffffff?text=Event+Image',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiNDQ0NDQ0MiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxODAiIHk9IjEzMCI+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjYgMTZMMzQgMjRMMjYgMzIiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjx0ZXh0IHg9IjIwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkV2ZW50IEltYWdlPC90ZXh0Pgo8L3N2Zz4K'
    ];
    
    // Try fallback images sequentially
    const tryNextFallback = (index = 0) => {
      if (index >= fallbackImages.length) {
        console.log('❌ All fallback images failed, using SVG placeholder');
        setCurrentImageUrl(fallbackImages[fallbackImages.length - 1]);
        setIsLoading(false);
        setImageError(true);
        return;
      }
      
      const fallbackUrl = fallbackImages[index];
      console.log(`🔄 Trying fallback image ${index + 1}/${fallbackImages.length}:`, fallbackUrl);
      
      const img = new Image();
      img.onload = () => {
        console.log('✅ Fallback image loaded successfully:', fallbackUrl);
        setCurrentImageUrl(fallbackUrl);
        setIsLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        console.log(`❌ Fallback image ${index + 1} failed, trying next...`);
        tryNextFallback(index + 1);
      };
      img.src = fallbackUrl;
    };
    
    tryNextFallback();
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
