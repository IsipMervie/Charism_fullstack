const mongoose = require('mongoose');

// Environment variables are provided by Vercel, no need for dotenv

// Get the appropriate MongoDB URI based on environment
const dbURI = process.env.MONGO_URI;

if (!dbURI) {
  console.error('❌ No MongoDB URI found!');
  console.error('Please set MONGO_URI environment variable');
  console.error('Available env vars:', Object.keys(process.env));
  process.exit(1);
}

console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('Using database:', dbURI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Custom MongoDB');

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', conn.connection.name);
    console.log('🌐 Host:', conn.connection.host);
    console.log('🔌 Port:', conn.connection.port);
    
    return conn;
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    console.error('🔍 Connection details:', {
      uri: dbURI,
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

// Connect immediately
connectDB();

module.exports = mongoose;
