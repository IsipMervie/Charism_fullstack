// Test script to verify image URL generation
import { getEventImageUrl, debugImageConfig } from './imageUtils';

export const testImageUrls = () => {
  console.log('🧪 Testing Image URL Generation');
  
  // Test configuration
  const config = debugImageConfig();
  console.log('Configuration:', config);
  
  // Test cases
  const testCases = [
    {
      name: 'MongoDB Binary Data',
      imageData: {
        data: new Uint8Array([1, 2, 3, 4]),
        contentType: 'image/jpeg',
        filename: 'test.jpg'
      },
      eventId: '507f1f77bcf86cd799439011'
    },
    {
      name: 'Legacy URL Format',
      imageData: {
        url: '/uploads/events/test-image.jpg'
      },
      eventId: '507f1f77bcf86cd799439011'
    },
    {
      name: 'String Filename',
      imageData: 'test-image.jpg',
      eventId: '507f1f77bcf86cd799439011'
    },
    {
      name: 'No Image Data',
      imageData: null,
      eventId: '507f1f77bcf86cd799439011'
    }
  ];
  
  testCases.forEach(testCase => {
    const url = getEventImageUrl(testCase.imageData, testCase.eventId);
    console.log(`✅ ${testCase.name}:`, url);
  });
  
  return testCases.map(testCase => ({
    ...testCase,
    generatedUrl: getEventImageUrl(testCase.imageData, testCase.eventId)
  }));
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testImageUrls = testImageUrls;
}
