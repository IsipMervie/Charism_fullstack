const mongoose = require('mongoose');
const Event = require('../models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/communitylink', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateEventTimes() {
  try {
    console.log('Starting event time migration...');
    
    // Find all events that have the old 'time' field
    const events = await Event.find({ time: { $exists: true } });
    console.log(`Found ${events.length} events to migrate`);
    
    for (const event of events) {
      if (event.time) {
        // Set startTime to the old time value and endTime to a default
        event.startTime = event.time;
        event.endTime = '23:59'; // Default end time
        
        // Remove the old time field
        event.time = undefined;
        
        // Save the updated event
        await event.save();
        console.log(`Migrated event: ${event.title} (ID: ${event._id})`);
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateEventTimes();
