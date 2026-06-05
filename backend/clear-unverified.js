const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // Delete unverified users to let user test again
    const result = await User.deleteMany({ isEmailVerified: false, email: { $in: ['nikhileswar1602@gmail.com', 'vu.241fa04e97@gmail.com', 'vu.241fa04e91@gmail.com'] } });
    console.log('Deleted unverified accounts:', result.deletedCount);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
run();
