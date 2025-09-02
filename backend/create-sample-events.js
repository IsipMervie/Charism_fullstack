const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/charism', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSampleEvents() {
  try {
    console.log('🔍 Creating sample events...');
    
    // Find an admin user to be the creator
    let adminUser = await User.findOne({ role: 'Admin' });
    
    if (!adminUser) {
      console.log('👤 No admin user found. Creating one...');
      
      // Create an admin user
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@charism.com',
        password: 'admin123', // This will be hashed by the model
        role: 'Admin',
        department: 'Administration',
        isVerified: true,
        isApproved: true,
        approvalStatus: 'approved'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created:', adminUser.email);
    }
    
    const sampleEvents = [
      {
        title: 'Community Service Day',
        description: 'Join us for a day of community service and volunteer work.',
        date: new Date('2025-01-15'),
        startTime: '09:00',
        endTime: '17:00',
        location: 'Community Center',
        hours: 8,
        maxParticipants: 50,
        department: 'Community Service',
        status: 'Active',
        isVisibleToStudents: true,
        requiresApproval: true,
        publicRegistrationToken: 'evt_1756797173382_eh0lcceri', // The token from your link
        isPublicRegistrationEnabled: true,
        createdBy: adminUser._id
      },
      {
        title: 'Environmental Cleanup',
        description: 'Help clean up our local park and make it beautiful.',
        date: new Date('2025-01-20'),
        startTime: '10:00',
        endTime: '15:00',
        location: 'Central Park',
        hours: 5,
        maxParticipants: 30,
        department: 'Environmental',
        status: 'Active',
        isVisibleToStudents: true,
        requiresApproval: false,
        publicRegistrationToken: 'evt_1756823373311_zrt1qs27s', // Another token
        isPublicRegistrationEnabled: true,
        createdBy: adminUser._id
      },
      {
        title: 'Food Bank Volunteer',
        description: 'Help sort and distribute food to those in need.',
        date: new Date('2025-01-25'),
        startTime: '08:00',
        endTime: '12:00',
        location: 'Local Food Bank',
        hours: 4,
        maxParticipants: 20,
        department: 'Social Services',
        status: 'Active',
        isVisibleToStudents: true,
        requiresApproval: true,
        publicRegistrationToken: 'evt_1756824000000_sample123',
        isPublicRegistrationEnabled: true,
        createdBy: adminUser._id
      }
    ];
    
    // Create events
    for (const eventData of sampleEvents) {
      const event = new Event(eventData);
      await event.save();
      console.log(`✅ Created event: "${event.title}" with token: ${event.publicRegistrationToken}`);
    }
    
    console.log('🎉 Sample events created successfully!');
    
    // List all events
    const allEvents = await Event.find({}).select('title publicRegistrationToken isPublicRegistrationEnabled status');
    console.log('📋 All events:', allEvents);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

createSampleEvents();
