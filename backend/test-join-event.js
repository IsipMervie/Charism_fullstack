// Join Event Debug Test
const axios = require('axios');

async function testJoinEvent() {
  console.log('🧪 Testing Join Event Functionality...\n');
  
  const API_BASE_URL = 'https://charism-api-xtw9.onrender.com';
  
  try {
    // Test 1: Check if events endpoint works
    console.log('📋 Test 1: Fetching events...');
    const eventsResponse = await axios.get(`${API_BASE_URL}/api/events`);
    console.log('✅ Events fetched:', eventsResponse.data.events?.length || 0, 'events found');
    
    if (eventsResponse.data.events?.length > 0) {
      const firstEvent = eventsResponse.data.events[0];
      console.log('📅 First event:', {
        id: firstEvent._id,
        title: firstEvent.title,
        status: firstEvent.status
      });
      
      // Test 2: Try to join event (this will fail without auth, but we can see the error)
      console.log('\n📋 Test 2: Testing join event endpoint...');
      try {
        await axios.post(`${API_BASE_URL}/api/events/${firstEvent._id}/join`);
      } catch (error) {
        console.log('🔍 Join event error (expected without auth):', error.response?.data?.message || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJoinEvent();
