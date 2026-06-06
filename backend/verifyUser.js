const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/founderx').then(async () => {
  const User = require('./models/User');
  await User.updateOne(
    { email: 'vu.241fa04e91@gmail.com' },
    { 
      $set: { isEmailVerified: true, emailVerifiedAt: Date.now() },
      $unset: { emailVerificationOtp: 1, emailVerificationExpires: 1 }
    }
  );
  console.log('User verified!');
  process.exit(0);
}).catch(console.error);
