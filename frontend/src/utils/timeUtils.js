// Utility functions for time formatting

// Convert 24-hour time string to 12-hour format
export const formatTime12Hour = (timeString) => {
  if (!timeString) return 'TBD';
  
  try {
    // Parse the time string (HH:MM format)
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    let period = 'AM';
    let displayHours = hours;
    
    if (hours === 0) {
      displayHours = 12;
      period = 'AM';
    } else if (hours === 12) {
      displayHours = 12;
      period = 'PM';
    } else if (hours > 12) {
      displayHours = hours - 12;
      period = 'PM';
    }
    
    // Format minutes with leading zero if needed
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${formattedMinutes} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

// Convert 24-hour time string to 12-hour format for display
export const formatTimeRange12Hour = (startTime, endTime) => {
  if (!startTime || !endTime) return 'TBD';
  
  const formattedStart = formatTime12Hour(startTime);
  const formattedEnd = formatTime12Hour(endTime);
  
  return `${formattedStart} - ${formattedEnd}`;
};

// Format time for input fields (keep 24-hour format for backend)
export const formatTimeForInput = (timeString) => {
  if (!timeString) return '';
  
  // If it's already in 24-hour format, return as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // If it's in 12-hour format, convert to 24-hour
  try {
    const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let [_, hours, minutes, period] = match;
      hours = parseInt(hours);
      minutes = parseInt(minutes);
      
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Error converting time format:', error);
  }
  
  return timeString;
};
