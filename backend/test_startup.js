const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/founderx');
  const User = require('./models/User');
  const Startup = require('./models/Startup');
  const user = await User.findOne({ email: 'vu.241fa04e91@gmail.com' });
  
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  try {
    const startupData = {
      name: 'Test Startup',
      oneLinePitch: 'A test pitch',
      description: 'A test description',
      industry: 'Technology',
      stage: 'idea',
      website: '',
      logo: '',
      founderId: user._id,
      contactEmail: user.email
    };
    const startup = new Startup(startupData);
    await startup.save();
    console.log('Success! Startup ID:', startup._id);
  } catch (err) {
    console.error('Validation error:', err.message);
  }
  process.exit(0);
}

test();
