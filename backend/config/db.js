const mongoose = require('mongoose');
// Environment variables are provided by Vercel, no need for dotenv

// Get the appropriate MongoDB URI based on environment
const dbURI = process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI;

if (!dbURI) {
  console.error('❌ No MongoDB URI found!');
  console.error('Please set MONGO_URI_PRODUCTION or MONGO_URI environment variable');
  process.exit(1);
}

console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI_PRODUCTION:', process.env.MONGO_URI_PRODUCTION ? 'Set' : 'Not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('Using database:', dbURI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Custom MongoDB');

// Connect to MongoDB
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
  console.log('🔌 Port:', mongoose.connection.port);
})
.catch(err => {
  console.error('❌ Error connecting to MongoDB:', err.message);
  console.error('🔍 Connection details:', {
    uri: dbURI,
    nodeEnv: process.env.NODE_ENV,
    hasProductionUri: !!process.env.MONGO_URI_PRODUCTION,
    hasLocalUri: !!process.env.MONGO_URI
  });
  process.exit(1);
});

module.exports = mongoose;
