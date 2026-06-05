require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function setOTP() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'nikhileswar1602@gmail.com' });
  if (user) {
    user.emailVerificationOtp = '123456';
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    console.log("OTP SET FOR nikhileswar1602@gmail.com: 123456");
  } else {
    console.log("USER NOT FOUND");
  }
  process.exit(0);
}

setOTP();
