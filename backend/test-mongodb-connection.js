// Test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGO_URI preview:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'Not set');

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI environment variable not set!');
  process.exit(1);
}

const testConnection = async () => {
  try {
    console.log('🔄 Attempting to connect...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database:', conn.connection.name);
    console.log('🌐 Host:', conn.connection.host);
    console.log('🔌 Port:', conn.connection.port);
    console.log('🔗 Connection state:', mongoose.connection.readyState);
    
    // Test a simple query
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.length);
    collections.forEach(col => console.log('  -', col.name));
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

testConnection();
