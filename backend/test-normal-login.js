const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/founderx', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // create a test user
    const email = 'test_normal_login@example.com';
    const password = 'testpassword123';
    
    await User.deleteOne({ email });
    
    const user = new User({
      fullName: 'Test User',
      username: 'testnormallogin',
      email: email,
      passwordHash: password,
      role: 'founder',
      isEmailVerified: true
    });
    await user.save();
    
    // Now try to login
    const foundUser = await User.findOne({ email });
    const match = await foundUser.comparePassword(password);
    console.log('Login match:', match);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
