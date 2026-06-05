require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Delete all unverified test accounts (emails containing 'test' or 'example.com')
  const result = await User.deleteMany({
    isEmailVerified: false,
    $or: [
      { email: /test/i },
      { email: /@example\.com$/i }
    ]
  });
  console.log(`Deleted ${result.deletedCount} stale test accounts`);
  
  // Show remaining users
  const users = await User.find().sort({ createdAt: -1 }).limit(10).select('email isEmailVerified emailVerificationOtp createdAt');
  console.log('\nRemaining recent users:');
  users.forEach(u => {
    console.log(`  ${u.email} | verified: ${u.isEmailVerified} | otp: ${u.emailVerificationOtp || 'none'} | created: ${u.createdAt}`);
  });
  
  process.exit(0);
}

cleanup();
