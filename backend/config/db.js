const mongoose = require('mongoose');

// Load environment variables from .env file
require('dotenv').config();

// Get the appropriate MongoDB URI based on environment
const dbURI = process.env.MONGO_URI;
const nodeEnv = process.env.NODE_ENV || 'development';

// Lazy connection function - only called when needed
const connectDB = async () => {
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
      return null;
    } else {
      console.error('❌ Development environment - continuing without DB connection');
      return null;
    }
  }

  // Check if URI looks valid
  if (!dbURI.includes('mongodb')) {
    console.error('❌ Invalid MongoDB URI format:', dbURI);
    if (nodeEnv === 'production') {
      console.error('🚨 Production environment - continuing without DB connection');
      return null;
    } else {
      console.error('❌ Development environment - continuing without DB connection');
      return null;
    }
  }

  console.log('✅ MongoDB URI format looks valid');
  console.log('Using database:', dbURI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Custom MongoDB');

  const maxRetries = 5; // Increased retries
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 Attempting to connect to MongoDB (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // Close any existing connections first
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      const conn = await mongoose.connect(dbURI, {
        serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
        socketTimeoutMS: 45000, // Increased to 45 seconds
        maxPoolSize: 1, // Reduced for serverless
        minPoolSize: 0, // Reduced for serverless
        bufferCommands: true, // Enable buffering for better reliability
        family: 4, // Force IPv4
        retryWrites: true,
        w: 'majority',
        // Serverless-specific options
        maxIdleTimeMS: 30000, // Increased for serverless
        // Additional options for better reliability
        autoIndex: false, // Disable auto-indexing in production
        maxConnecting: 1, // Limit concurrent connections
        // Connection pooling improvements
        serverApi: {
          version: '1',
          strict: false,
          deprecationErrors: false,
        },
        // Timeout improvements
        connectTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        // Retry logic
        retryReads: true,
        retryWrites: true,
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
          return null;
        } else {
          console.error('❌ Development environment - continuing without DB connection after all retries');
          return null;
        }
      } else {
        console.log(`⏳ Retrying in 3 seconds... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
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

// For Vercel serverless, don't connect immediately
let connection = null;
let lazyConnection = null;

// Lazy connection for Vercel - only connect when actually needed
const getLazyConnection = async () => {
  try {
    if (!lazyConnection || mongoose.connection.readyState !== 1) {
      console.log('🔄 Initializing lazy database connection...');
      lazyConnection = connectDB();
    }
    
    if (lazyConnection) {
      await lazyConnection;
    }
    
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('❌ Lazy connection failed:', error);
    return false;
  }
};

// Export both mongoose and connection promise
module.exports = { 
  mongoose, 
  connection, 
  getConnectionStatus,
  getLazyConnection 
};
