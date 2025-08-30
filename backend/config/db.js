const mongoose = require('mongoose');

// Environment variables are provided by Vercel, no need for dotenv

// Get the appropriate MongoDB URI based on environment
const dbURI = process.env.MONGO_URI;

console.log('🔍 MongoDB Connection Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGO_URI length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 0);
console.log('MONGO_URI preview:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'Not set');

if (!dbURI) {
  console.error('❌ No MongoDB URI found!');
  console.error('Please set MONGO_URI environment variable');
  console.error('Available env vars:', Object.keys(process.env));
  
  // In serverless, don't exit, just return null
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 Production environment - continuing without DB connection');
    return null;
  } else {
    process.exit(1);
  }
}

// Check if URI looks valid
if (!dbURI.includes('mongodb')) {
  console.error('❌ Invalid MongoDB URI format:', dbURI);
  if (process.env.NODE_ENV === 'production') {
    return null;
  } else {
    process.exit(1);
  }
}

console.log('✅ MongoDB URI format looks valid');
console.log('Using database:', dbURI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Custom MongoDB');

// Connect to MongoDB with better error handling for serverless
const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout for serverless
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Increased for better performance
      minPoolSize: 1,
      bufferCommands: true, // Enable buffering for serverless
      bufferMaxEntries: 100, // Enable buffer max entries
      maxIdleTimeMS: 30000,
      family: 4, // Force IPv4
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', conn.connection.name);
    console.log('🌐 Host:', conn.connection.host);
    console.log('🔌 Port:', conn.connection.port);
    console.log('🔗 Connection state:', mongoose.connection.readyState);
    
    return conn;
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    console.error('🔍 Connection details:', {
      uri: dbURI ? `${dbURI.substring(0, 30)}...` : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGO_URI,
      error: err.stack
    });
    
    // In serverless, don't exit process, just log error
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production environment - continuing without DB connection');
      return null;
    } else {
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

// Connect immediately
const connection = connectDB();

// Export both mongoose and connection promise
module.exports = { mongoose, connection };
