const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}, 'email username createdAt isEmailVerified');
    console.log(users);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
run();
