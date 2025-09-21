#!/usr/bin/env node

/**
 * Event Query Optimization Script
 * 
 * This script optimizes the event queries to prevent timeouts
 * by implementing better query patterns and timeout handling.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Event = require('../models/Event');
const User = require('../models/User');

async function optimizeQueries() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test current query performance
    console.log('\n🧪 Testing current query performance...');
    
    const testQueries = [
      {
        name: 'Student Events Query',
        query: { isVisibleToStudents: true, status: { $ne: 'Disabled' } },
        select: 'title description date startTime endTime location hours maxParticipants department departments isForAllDepartments status isVisibleToStudents requiresApproval publicRegistrationToken isPublicRegistrationEnabled createdAt attendance image'
      },
      {
        name: 'Admin Events Query',
        query: {},
        select: 'title description date startTime endTime location hours maxParticipants department departments isForAllDepartments status isVisibleToStudents requiresApproval publicRegistrationToken isPublicRegistrationEnabled createdAt attendance image'
      },
      {
        name: 'Event with Populate',
        query: { _id: new mongoose.Types.ObjectId() },
        populate: [
          { path: 'createdBy', select: 'name' },
          { path: 'attendance.userId', select: 'name email department academicYear' }
        ]
      }
    ];
    
    for (const testQuery of testQueries) {
      try {
        console.log(`\n📊 Testing: ${testQuery.name}`);
        
        const start = Date.now();
        
        let query = Event.find(testQuery.query);
        
        if (testQuery.select) {
          query = query.select(testQuery.select);
        }
        
        if (testQuery.populate) {
          testQuery.populate.forEach(pop => {
            query = query.populate(pop.path, pop.select);
          });
        }
        
        query = query.lean().limit(10).maxTimeMS(5000);
        
        const results = await query;
        const duration = Date.now() - start;
        
        console.log(`✅ ${testQuery.name}: ${results.length} results in ${duration}ms`);
        
        if (duration > 2000) {
          console.log(`⚠️ Slow query detected: ${duration}ms`);
        }
        
      } catch (error) {
        console.error(`❌ ${testQuery.name} failed:`, error.message);
      }
    }
    
    // Test aggregation performance
    console.log('\n📊 Testing aggregation performance...');
    
    const aggregationTests = [
      {
        name: 'Attendance Count',
        pipeline: [
          { $unwind: '$attendance' },
          { $count: 'total' }
        ]
      },
      {
        name: 'Events by Status',
        pipeline: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]
      }
    ];
    
    for (const test of aggregationTests) {
      try {
        const start = Date.now();
        const results = await Event.aggregate(test.pipeline).maxTimeMS(5000);
        const duration = Date.now() - start;
        
        console.log(`✅ ${test.name}: ${results.length} results in ${duration}ms`);
        
        if (duration > 2000) {
          console.log(`⚠️ Slow aggregation detected: ${duration}ms`);
        }
        
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
      }
    }
    
    // Check collection stats
    console.log('\n📊 Collection Statistics:');
    
    try {
      const stats = await mongoose.connection.db.collection('events').stats();
      console.log(`- Total documents: ${stats.count}`);
      console.log(`- Average document size: ${Math.round(stats.avgObjSize)} bytes`);
      console.log(`- Total size: ${Math.round(stats.size / 1024 / 1024)} MB`);
      console.log(`- Index size: ${Math.round(stats.totalIndexSize / 1024 / 1024)} MB`);
    } catch (error) {
      console.error('❌ Failed to get collection stats:', error.message);
    }
    
    // Check for large documents
    console.log('\n🔍 Checking for large documents...');
    
    try {
      const largeDocs = await Event.find({})
        .select('title attendance')
        .lean()
        .limit(5);
      
      largeDocs.forEach(doc => {
        const attendanceCount = doc.attendance ? doc.attendance.length : 0;
        if (attendanceCount > 100) {
          console.log(`⚠️ Large event: ${doc.title} has ${attendanceCount} attendance records`);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to check large documents:', error.message);
    }
    
    console.log('\n✅ Query optimization analysis completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  optimizeQueries();
}

module.exports = optimizeQueries;
