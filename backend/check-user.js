require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: new RegExp('^1vu.241fa04489@gmail.com$', 'i') });
  if (user) {
    console.log(`Email in DB: ${user.email}`);
    console.log(`OTP in DB: ${user.emailVerificationOtp}`);
    console.log(`Expires: ${user.emailVerificationExpires}`);
    console.log(`Is Expired? ${user.emailVerificationExpires < Date.now()}`);
  } else {
    console.log("User not found for that email!");
  }
  process.exit(0);
}

checkUser();
