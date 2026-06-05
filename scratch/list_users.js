const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../backend/models/User');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/founderx', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB.');

    const users = await User.find({}, 'fullName email username role createdAt');
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Name: "${u.fullName}", Username: "${u.username}", Email: "${u.email}", Role: "${u.role}"`);
    });
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await mongoose.connection.close();
  }
}

listUsers();
