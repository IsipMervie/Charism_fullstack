const https = require('https');

function testImageEndpoint() {
  const eventId = '68ceb01caffe9e1bff64abe4';
  const url = `https://charism-api-xtw9.onrender.com/api/files/event-image/${eventId}`;
  
  console.log('🧪 Testing HTTP endpoint...');
  console.log(`🔗 URL: ${url}`);
  
  const req = https.get(url, (res) => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    console.log(`📊 Content-Type: ${res.headers['content-type']}`);
    console.log(`📊 Content-Length: ${res.headers['content-length']}`);
    
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS: Image endpoint is working!');
      console.log('✅ Images will now be visible in the frontend');
    } else {
      console.log(`❌ ERROR: Status ${res.statusCode}`);
    }
  });
  
  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });
  
  req.setTimeout(10000, () => {
    console.log('⏰ Request timeout');
    req.destroy();
  });
}

testImageEndpoint();
