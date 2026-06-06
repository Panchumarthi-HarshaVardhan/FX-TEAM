const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/founderx');
  const User = require('./models/User');
  const user = await User.findOne({ email: 'vu.241fa04e91@gmail.com' });
  
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  const payload = {
    name: 'Test Startup via HTTP',
    oneLinePitch: 'A test pitch',
    description: 'A test description',
    industry: 'Technology',
    stage: 'idea',
    website: '',
    logo: ''
  };

  try {
    const res = await fetch('http://localhost:3000/api/startups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
  process.exit(0);
}

test();
