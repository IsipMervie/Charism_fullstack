const mongoose = require('mongoose');

// Load environment variables from .env file
require('dotenv').config();

// Get the appropriate MongoDB URI based on environment
const dbURI = process.env.MONGO_URI;
const nodeEnv = process.env.NODE_ENV || 'development';

// Optimized connection function for serverless
const connectDB = async () => {
  console.log('🔍 MongoDB Connection Debug:');
  console.log('NODE_ENV:', nodeEnv);
  console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

  if (!dbURI) {
    console.error('❌ No MongoDB URI found!');
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

  const maxRetries = 3; // Reduced retries for faster failure
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 Attempting to connect to MongoDB (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // Close any existing connections first
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      const conn = await mongoose.connect(dbURI, {
        // Optimized timeouts for serverless - balanced for production
        serverSelectionTimeoutMS: 5000, // Increased to 5 seconds
        socketTimeoutMS: 10000, // Increased to 10 seconds
        connectTimeoutMS: 5000, // Increased to 5 seconds
        
        // Serverless-optimized pooling
        maxPoolSize: 1,
        minPoolSize: 0,
        maxIdleTimeMS: 5000, // Reduced to 5 seconds
        
        // Performance optimizations
        bufferCommands: true,
        family: 4, // Force IPv4
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        
        // Disable expensive operations in production
        autoIndex: false,
        maxConnecting: 1,
        
        // Server API version
        serverApi: {
          version: '1',
          strict: false,
          deprecationErrors: false,
        },
        
        // Heartbeat optimization
        heartbeatFrequencyMS: 2000, // Reduced for faster detection
        
        // Additional timeout settings - removed maxTimeMS as it's not supported in connection options
        compressors: ['zlib'], // Enable compression
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
        console.log(`⏳ Retrying in 1 second... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced retry delay
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

// Lazy connection for better performance
let connection = null;
let lazyConnection = null;

// Optimized lazy connection - faster connection with better error handling
const getLazyConnection = async () => {
  try {
    if (!lazyConnection || mongoose.connection.readyState !== 1) {
      console.log('🔄 Initializing optimized lazy database connection...');
      lazyConnection = connectDB();
    }
    
    if (lazyConnection) {
      // Balanced timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 8000); // Increased to 8 seconds
      });
      
      await Promise.race([lazyConnection, timeoutPromise]);
    }
    
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('❌ Lazy connection failed:', error);
    return false;
  }
};

// Initialize database function for server startup
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    const conn = await connectDB();
    if (conn) {
      console.log('✅ Database connection established');
      return conn;
    } else {
      console.log('⚠️ Database connection failed, continuing without DB');
      return null;
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return null;
  }
};

// Export both mongoose and connection promise
module.exports = { 
  mongoose, 
  connection, 
  getConnectionStatus,
  getLazyConnection,
  initializeDatabase
};
