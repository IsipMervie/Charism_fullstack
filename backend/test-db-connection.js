// test-db-connection.js - Simple database connection test
const { getLazyConnection } = require('./config/db');

async function testConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  try {
    console.log('📋 Environment Check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
    console.log('- MONGO_URI length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 0);
    
    if (process.env.MONGO_URI) {
      console.log('- MONGO_URI preview:', process.env.MONGO_URI.substring(0, 50) + '...');
    }
    
    console.log('\n🔄 Attempting connection...');
    const startTime = Date.now();
    
    const isConnected = await getLazyConnection();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (isConnected) {
      console.log(`✅ Connection successful! (${duration}ms)`);
      console.log('🎉 Database is ready for operations');
    } else {
      console.log('❌ Connection failed');
      console.log('💡 Check your MONGO_URI and network access');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('🔍 Error details:', error);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 This looks like a DNS resolution issue');
      console.log('   Check if your MongoDB hostname is correct');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 This looks like a connection refused issue');
      console.log('   Check if MongoDB is running and accessible');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('💡 This looks like a timeout issue');
      console.log('   Check your network connection and MongoDB settings');
    }
  }
}

// Run the test
testConnection().then(() => {
  console.log('\n✨ Test complete!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test failed with unhandled error:', error);
  process.exit(1);
});
