// Database indexes for performance optimization
const mongoose = require('mongoose');

const createIndexes = async () => {
  try {
    console.log('🔧 Creating database indexes for performance optimization...');
    
    // User model indexes
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ role: 1 });
    await mongoose.connection.db.collection('users').createIndex({ department: 1 });
    await mongoose.connection.db.collection('users').createIndex({ academicYear: 1 });
    await mongoose.connection.db.collection('users').createIndex({ isVerified: 1 });
    await mongoose.connection.db.collection('users').createIndex({ createdAt: 1 });
    
    // Event model indexes
    await mongoose.connection.db.collection('events').createIndex({ date: 1 });
    await mongoose.connection.db.collection('events').createIndex({ status: 1 });
    await mongoose.connection.db.collection('events').createIndex({ isVisibleToStudents: 1 });
    await mongoose.connection.db.collection('events').createIndex({ createdAt: 1 });
    await mongoose.connection.db.collection('events').createIndex({ 'attendance.userId': 1 });
    await mongoose.connection.db.collection('events').createIndex({ 'attendance.status': 1 });
    
    // Compound indexes for common queries
    await mongoose.connection.db.collection('users').createIndex({ role: 1, isVerified: 1 });
    await mongoose.connection.db.collection('users').createIndex({ role: 1, department: 1 });
    await mongoose.connection.db.collection('users').createIndex({ role: 1, academicYear: 1 });
    await mongoose.connection.db.collection('events').createIndex({ isVisibleToStudents: 1, status: 1 });
    await mongoose.connection.db.collection('events').createIndex({ 'attendance.userId': 1, 'attendance.status': 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
};

module.exports = { createIndexes };
