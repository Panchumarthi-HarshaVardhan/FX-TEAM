const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/founderx', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    
    // Find a user who has a passwordHash
    const user = await User.findOne({ passwordHash: { $exists: true, $ne: null } }).sort({ createdAt: -1 });
    if (!user) {
      console.log('No user found with passwordHash');
      process.exit(0);
    }
    console.log('Found user:', user.email);
    console.log('Password hash value:', user.passwordHash);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
