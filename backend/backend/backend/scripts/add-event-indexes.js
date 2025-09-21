#!/usr/bin/env node

/**
 * MongoDB Index Optimization Script for Events Collection
 * 
 * This script adds essential indexes to improve query performance
 * and prevent timeout issues in the events collection.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the Event model
const Event = require('../models/Event');

async function addEventIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get the events collection
    const eventsCollection = mongoose.connection.db.collection('events');
    
    console.log('📊 Current indexes:');
    const existingIndexes = await eventsCollection.indexes();
    console.log(existingIndexes.map(idx => idx.name));
    
    // Define essential indexes for performance
    const indexes = [
      // 1. Compound index for student queries (most common)
      {
        keys: { 
          isVisibleToStudents: 1, 
          status: 1, 
          createdAt: -1 
        },
        options: { 
          name: 'student_visibility_status_created',
          background: true 
        }
      },
      
      // 2. Index for admin queries
      {
        keys: { 
          createdAt: -1 
        },
        options: { 
          name: 'created_at_desc',
          background: true 
        }
      },
      
      // 3. Index for status queries
      {
        keys: { 
          status: 1 
        },
        options: { 
          name: 'status',
          background: true 
        }
      },
      
      // 4. Index for visibility queries
      {
        keys: { 
          isVisibleToStudents: 1 
        },
        options: { 
          name: 'isVisibleToStudents',
          background: true 
        }
      },
      
      // 5. Index for department queries
      {
        keys: { 
          department: 1 
        },
        options: { 
          name: 'department',
          background: true 
        }
      },
      
      // 6. Index for departments array queries
      {
        keys: { 
          departments: 1 
        },
        options: { 
          name: 'departments',
          background: true 
        }
      },
      
      // 7. Index for public registration queries
      {
        keys: { 
          publicRegistrationToken: 1 
        },
        options: { 
          name: 'publicRegistrationToken',
          background: true,
          sparse: true 
        }
      },
      
      // 8. Index for attendance queries
      {
        keys: { 
          'attendance.userId': 1 
        },
        options: { 
          name: 'attendance_userId',
          background: true 
        }
      },
      
      // 9. Index for attendance status queries
      {
        keys: { 
          'attendance.status': 1 
        },
        options: { 
          name: 'attendance_status',
          background: true 
        }
      },
      
      // 10. Compound index for attendance queries
      {
        keys: { 
          'attendance.userId': 1, 
          'attendance.status': 1 
        },
        options: { 
          name: 'attendance_userId_status',
          background: true 
        }
      }
    ];
    
    console.log('🚀 Creating indexes...');
    
    for (const index of indexes) {
      try {
        console.log(`Creating index: ${index.options.name}`);
        await eventsCollection.createIndex(index.keys, index.options);
        console.log(`✅ Created index: ${index.options.name}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`⚠️ Index ${index.options.name} already exists`);
        } else {
          console.error(`❌ Failed to create index ${index.options.name}:`, error.message);
        }
      }
    }
    
    // Verify indexes were created
    console.log('\n📊 Final indexes:');
    const finalIndexes = await eventsCollection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Test query performance
    console.log('\n🧪 Testing query performance...');
    
    const testQueries = [
      { isVisibleToStudents: true, status: { $ne: 'Disabled' } },
      { status: 'Active' },
      { department: 'Nursing' },
      { 'attendance.userId': new mongoose.Types.ObjectId() }
    ];
    
    for (const query of testQueries) {
      try {
        const start = Date.now();
        const count = await eventsCollection.countDocuments(query);
        const duration = Date.now() - start;
        console.log(`Query ${JSON.stringify(query)}: ${count} results in ${duration}ms`);
      } catch (error) {
        console.error(`Query test failed:`, error.message);
      }
    }
    
    console.log('\n✅ Index optimization completed successfully!');
    
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
  addEventIndexes();
}

module.exports = addEventIndexes;
