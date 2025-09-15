#!/usr/bin/env node

/**
 * Test script to debug join event functionality
 * This script helps identify why the join event endpoint returns 400 errors
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
require('dotenv').config();

async function testJoinEvent() {
  try {
    console.log('🔍 Testing Join Event Functionality...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/communitylink');
    console.log('✅ Connected to database\n');
    
    // Get all events
    const events = await Event.find({}).sort({ date: 1 });
    console.log(`📅 Found ${events.length} events:\n`);
    
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   ID: ${event._id}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Visible to Students: ${event.isVisibleToStudents}`);
      console.log(`   Date: ${event.date}`);
      console.log(`   Start Time: ${event.startTime || 'Not set'}`);
      console.log(`   Requires Approval: ${event.requiresApproval}`);
      console.log(`   Max Participants: ${event.maxParticipants || 'Unlimited'}`);
      console.log(`   Departments: ${event.departments?.join(', ') || 'All'}`);
      console.log(`   Attendance Count: ${event.attendance?.length || 0}`);
      
      // Check if event has started
      const now = new Date();
      const eventStartDateTime = new Date(event.date);
      if (event.startTime) {
        const [hours, minutes] = event.startTime.split(':');
        eventStartDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      const hasStarted = eventStartDateTime <= now;
      const hasPassed = event.date < now;
      
      console.log(`   Has Started: ${hasStarted}`);
      console.log(`   Has Passed: ${hasPassed}`);
      console.log(`   Current Time: ${now.toISOString()}`);
      console.log(`   Event Start: ${eventStartDateTime.toISOString()}`);
      console.log('');
    });
    
    // Get sample users
    const users = await User.find({ role: 'Student' }).limit(5);
    console.log(`👥 Found ${users.length} students:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });
    
    // Test specific scenarios
    console.log('🧪 Testing Common Join Event Scenarios:\n');
    
    const activeEvents = events.filter(e => e.status === 'Active' && e.isVisibleToStudents);
    const futureEvents = activeEvents.filter(e => {
      const eventStartDateTime = new Date(e.date);
      if (e.startTime) {
        const [hours, minutes] = e.startTime.split(':');
        eventStartDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return eventStartDateTime > new Date();
    });
    
    console.log(`✅ Active events visible to students: ${activeEvents.length}`);
    console.log(`⏰ Future events (not started): ${futureEvents.length}`);
    
    if (futureEvents.length > 0 && users.length > 0) {
      const testEvent = futureEvents[0];
      const testUser = users[0];
      
      console.log(`\n🔬 Testing with Event: ${testEvent.title}`);
      console.log(`👤 Testing with User: ${testUser.email}`);
      
      // Check if user is already registered
      const existingAttendance = testEvent.attendance.find(
        a => a.userId.toString() === testUser._id.toString()
      );
      
      console.log(`📋 User already registered: ${!!existingAttendance}`);
      if (existingAttendance) {
        console.log(`   Status: ${existingAttendance.status}`);
        console.log(`   Registration Approved: ${existingAttendance.registrationApproved}`);
      }
      
      // Check capacity
      if (testEvent.maxParticipants > 0) {
        const approvedAttendees = testEvent.attendance.filter(
          a => a.registrationApproved === true
        ).length;
        console.log(`👥 Capacity: ${approvedAttendees}/${testEvent.maxParticipants}`);
        console.log(`🚫 Event full: ${approvedAttendees >= testEvent.maxParticipants}`);
      }
      
      // Check department access
      if (testUser.role !== 'Admin' && testUser.role !== 'Staff' && !testEvent.isForAllDepartments) {
        const hasAccess = testEvent.departments?.includes(testUser.department) || 
                         testEvent.department === testUser.department;
        console.log(`🏢 Department access: ${hasAccess}`);
        console.log(`   User department: ${testUser.department}`);
        console.log(`   Event departments: ${testEvent.departments?.join(', ') || testEvent.department}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

// Run the test
testJoinEvent();
