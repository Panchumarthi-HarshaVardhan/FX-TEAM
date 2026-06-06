const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/founderx')
  .then(async () => {
    const m = await Meeting.find({}).sort({createdAt:-1}).limit(1);
    console.log(JSON.stringify(m, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
