require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function getOTP() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find().sort({ createdAt: -1 }).limit(5);
  console.log("RECENT USERS AND OTPS:");
  users.forEach(u => {
    console.log(`Email: ${u.email} | Verified: ${u.isEmailVerified} | OTP: ${u.emailVerificationOtp || u.emailVerificationToken || 'None'}`);
  });
  process.exit(0);
}

getOTP();
