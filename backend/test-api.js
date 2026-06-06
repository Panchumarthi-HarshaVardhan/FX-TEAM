const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/founderx')
  .then(async () => {
    try {
      const meeting = await Meeting.findOne({ meetingCode: 'mdy-79y4-ock' });
      if (!meeting) {
        console.log('Meeting not found in DB!');
        process.exit(1);
      }
      
      const token = jwt.sign({ id: meeting.hostId }, process.env.JWT_SECRET, { expiresIn: '1d' });
      
      const axios = require('axios');
      const res = await axios.get(`http://localhost:3000/api/meetings/mdy-79y4-ock`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      });
      
      console.log('Response Status:', res.status);
      console.log('Response Body:', JSON.stringify(res.data, null, 2));
      process.exit(0);
    } catch(err) {
      console.error(err);
      process.exit(1);
    }
  });
