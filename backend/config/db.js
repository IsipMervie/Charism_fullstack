const mongoose = require('mongoose');

// Environment variables are provided by Vercel, no need for dotenv

// Get the appropriate MongoDB URI based on environment
const dbURI = process.env.MONGO_URI;
const nodeEnv = process.env.NODE_ENV || 'development';

console.log('🔍 MongoDB Connection Debug:');
console.log('NODE_ENV:', nodeEnv);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGO_URI length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 0);
console.log('MONGO_URI preview:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'Not set');

if (!dbURI) {
  console.error('❌ No MongoDB URI found!');
  console.error('Please set MONGO_URI environment variable');
  console.error('Available env vars:', Object.keys(process.env));
  
  // In serverless, don't exit, just return null
  if (nodeEnv === 'production') {
    console.error('🚨 Production environment - continuing without DB connection');
    return { mongoose, connection: null };
  } else {
    console.error('❌ Development environment - exiting due to missing MONGO_URI');
    process.exit(1);
  }
}

// Check if URI looks valid
if (!dbURI.includes('mongodb')) {
  console.error('❌ Invalid MongoDB URI format:', dbURI);
  if (nodeEnv === 'production') {
    console.error('🚨 Production environment - continuing without DB connection');
    return { mongoose, connection: null };
  } else {
    console.error('❌ Development environment - exiting due to invalid MONGO_URI');
    process.exit(1);
  }
}

console.log('✅ MongoDB URI format looks valid');
console.log('Using database:', dbURI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Custom MongoDB');

// Connect to MongoDB with better error handling for serverless
const connectDB = async () => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 Attempting to connect to MongoDB (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // Close any existing connections first
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      const conn = await mongoose.connect(dbURI, {
        serverSelectionTimeoutMS: 10000, // Reduced for serverless
        socketTimeoutMS: 20000, // Reduced for serverless
        maxPoolSize: 1, // Reduced for serverless
        minPoolSize: 0, // Reduced for serverless
        bufferCommands: false, // Disable buffering for serverless
        bufferMaxEntries: 0, // Disable buffer max entries
        maxIdleTimeMS: 10000, // Reduced for serverless
        family: 4, // Force IPv4
        retryWrites: true,
        w: 'majority',
        // Serverless-specific options
        keepAlive: true,
        keepAliveInitialDelay: 300000,
      });
      
      console.log('✅ MongoDB connected successfully');
      console.log('📊 Database:', conn.connection.name);
      console.log('🌐 Host:', conn.connection.host);
      console.log('🔌 Port:', conn.connection.port);
      console.log('🔗 Connection state:', mongoose.connection.readyState);
      
      return conn;
    } catch (err) {
      retryCount++;
      console.error(`❌ Error connecting to MongoDB (attempt ${retryCount}/${maxRetries}):`, err.message);
      
      if (retryCount >= maxRetries) {
        console.error('🔍 Final connection details:', {
          uri: dbURI ? `${dbURI.substring(0, 30)}...` : 'Not set',
          nodeEnv: process.env.NODE_ENV,
          hasMongoUri: !!process.env.MONGO_URI,
          error: err.stack
        });
        
        // In serverless, don't exit process, just log error
        if (nodeEnv === 'production') {
          console.error('🚨 Production environment - continuing without DB connection after all retries');
          return { mongoose, connection: null };
        } else {
          console.error('❌ Development environment - exiting due to MongoDB connection error');
          process.exit(1);
        }
      } else {
        console.log(`⏳ Retrying in 2 seconds... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
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

// Connection status checker for serverless
const getConnectionStatus = () => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return {
    readyState,
    status: states[readyState] || 'unknown',
    isConnected: readyState === 1
  };
};

// Connect immediately
const connection = connectDB();

// Export both mongoose and connection promise
module.exports = { mongoose, connection, getConnectionStatus };
