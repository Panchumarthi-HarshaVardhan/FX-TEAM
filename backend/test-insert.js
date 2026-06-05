const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');

    const result = await User.create({
      fullName: 'Test User',
      name: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      passwordHash: '123456',
      role: 'founder',
      username: 'testuser' + Date.now()
    });
    console.log('Success:', result.email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
