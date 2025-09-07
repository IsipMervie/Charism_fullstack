const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

async function checkEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const events = await Event.find({}).select('title status isVisibleToStudents createdAt');
    console.log('\n=== ALL EVENTS ===');
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Visible to Students: ${event.isVisibleToStudents}`);
      console.log(`   Created: ${event.createdAt}`);
      console.log('---');
    });
    
    console.log('\n=== DISABLED EVENTS ===');
    const disabledEvents = events.filter(e => e.status === 'Disabled' || !e.isVisibleToStudents);
    disabledEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Visible to Students: ${event.isVisibleToStudents}`);
    });
    
    console.log(`\nTotal events: ${events.length}`);
    console.log(`Disabled events: ${disabledEvents.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEvents();
